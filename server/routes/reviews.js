import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = express.Router();

// Helper: Recompute teacher rating
async function updateTeacherRating(teacherId) {
  const stats = await db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count 
    FROM reviews 
    WHERE teacher_id = ? AND is_moderated = 0
  `).get(teacherId);

  const avgRating = stats?.avg_rating ? Math.round(Number(stats.avg_rating) * 10) / 10 : 5.0;
  const reviewCount = Number(stats?.count || 0);

  await db.prepare('UPDATE teacher_profiles SET rating = ?, review_count = ? WHERE user_id = ?').run(avgRating, reviewCount, teacherId);
  return { avgRating, reviewCount };
}

// Check review eligibility for logged-in student
router.get('/eligibility/:teacherId', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const teacherId = parseInt(req.params.teacherId);

    // Check if subscribed
    const sub = await db.prepare('SELECT id, status FROM subscriptions WHERE student_id = ? AND teacher_id = ?').get(studentId, teacherId);
    
    // Check existing review
    const existingReview = await db.prepare('SELECT * FROM reviews WHERE student_id = ? AND teacher_id = ?').get(studentId, teacherId);

    res.json({
      can_review: Boolean(sub),
      is_subscribed: sub?.status === 'active',
      existing_review: existingReview || null
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

// Post or update a review
router.post('/', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { teacher_id, rating, comment } = req.body;

    if (!teacher_id || !rating) {
      return res.status(400).json({ error: 'teacher_id and rating are required' });
    }

    if (studentId === parseInt(teacher_id)) {
      return res.status(400).json({ error: 'Teachers cannot review themselves' });
    }

    // Verify subscription eligibility (Requirement: subscribed students)
    const sub = await db.prepare('SELECT id FROM subscriptions WHERE student_id = ? AND teacher_id = ?').get(studentId, teacher_id);
    if (!sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only subscribed students can review this teacher' });
    }

    const numRating = parseInt(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
    }

    const existing = await db.prepare('SELECT id FROM reviews WHERE student_id = ? AND teacher_id = ?').get(studentId, teacher_id);
    const nowIso = new Date().toISOString();

    if (existing) {
      // Update existing review (prevent duplicates)
      await db.prepare(`
        UPDATE reviews 
        SET rating = ?, comment = ?, created_at = ? 
        WHERE id = ?
      `).run(numRating, comment || '', nowIso, existing.id);
    } else {
      // Insert new review
      await db.prepare(`
        INSERT INTO reviews (student_id, teacher_id, rating, comment, is_moderated)
        VALUES (?, ?, ?, ?, 0)
      `).run(studentId, teacher_id, numRating, comment || '');
    }

    const { avgRating, reviewCount } = await updateTeacherRating(teacher_id);

    res.json({
      success: true,
      message: existing ? 'Your review was updated successfully!' : 'Review posted with Verified Subscriber badge!',
      rating: avgRating,
      reviewCount
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ADMIN: Get all reviews for moderation
router.get('/admin', requireRole('admin'), async (req, res) => {
  try {
    const reviews = await db.prepare(`
      SELECT 
        r.id, r.student_id, r.teacher_id, r.rating, r.comment, r.is_moderated, r.created_at,
        s.name as student_name, s.email as student_email,
        t.name as teacher_name
      FROM reviews r
      JOIN users s ON r.student_id = s.id
      JOIN users t ON r.teacher_id = t.id
      ORDER BY r.created_at DESC
    `).all();

    res.json(reviews);
  } catch (error) {
    console.error('Admin reviews error:', error);
    res.status(500).json({ error: 'Failed to load reviews for moderation' });
  }
});

// ADMIN: Toggle review moderation (hide/show)
router.post('/admin/:id/toggle-moderation', requireRole('admin'), async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const review = await db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const newModeratedState = review.is_moderated === 1 ? 0 : 1;
    await db.prepare('UPDATE reviews SET is_moderated = ? WHERE id = ?').run(newModeratedState, reviewId);

    // Recalculate teacher rating
    await updateTeacherRating(review.teacher_id);

    res.json({
      success: true,
      is_moderated: Boolean(newModeratedState),
      message: newModeratedState === 1 ? 'Review hidden (moderated)' : 'Review approved & visible'
    });
  } catch (error) {
    console.error('Toggle moderation error:', error);
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

// ADMIN: Delete review
router.delete('/admin/:id', requireRole('admin'), async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const review = await db.prepare('SELECT teacher_id FROM reviews WHERE id = ?').get(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
    await updateTeacherRating(review.teacher_id);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
