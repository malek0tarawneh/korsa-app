import express from 'express';
import { db } from '../db.js';
import { requireRole } from '../auth.js';

const router = express.Router();

// Helper: platform commission percentage
function getPlatformCommissionRate() {
  const row = db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_commission_percentage');
  const percent = row ? parseFloat(row.value) : 20;
  return isNaN(percent) ? 0.20 : percent / 100;
}

// Teacher Overview & Financial Simulation
router.get('/overview', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;

    // Teacher profile info
    const profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(teacherId);
    if (!profile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    // Active subscribers count
    const subCountRow = db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE teacher_id = ? AND status = 'active'`).get(teacherId);
    const activeSubscribers = subCountRow ? subCountRow.count : 0;

    // Monthly subscription price
    const monthlyPriceCents = profile.monthly_price_cents;
    const grossMonthlyRevenueCents = activeSubscribers * monthlyPriceCents;
    const commissionRate = getPlatformCommissionRate();
    const platformCommissionCents = Math.round(grossMonthlyRevenueCents * commissionRate);
    const estimatedTeacherEarningsCents = grossMonthlyRevenueCents - platformCommissionCents;

    // List of active subscribers
    const subscribers = db.prepare(`
      SELECT 
        s.id as subscription_id, s.started_at, s.renewal_at, s.status,
        u.id as student_id, u.name as student_name, u.avatar_url, u.email
      FROM subscriptions s
      JOIN users u ON s.student_id = u.id
      WHERE s.teacher_id = ? AND s.status = 'active'
      ORDER BY s.started_at DESC
      LIMIT 20
    `).all(teacherId);

    // Simulated payments ledger for this teacher
    const payments = db.prepare(`
      SELECT 
        p.id, p.amount_cents, p.platform_commission_cents, p.teacher_earnings_cents, p.created_at, p.status, p.simulated,
        u.name as student_name, u.email as student_email
      FROM payments p
      JOIN users u ON p.student_id = u.id
      WHERE p.teacher_id = ?
      ORDER BY p.created_at DESC
      LIMIT 25
    `).all(teacherId);

    // Teacher courses and engagement
    const courses = db.prepare(`
      SELECT 
        c.*, 
        s.name as subject_name,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(DISTINCT student_id) FROM progress WHERE course_id = c.id) as active_learners
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(teacherId);

    res.json({
      profile: {
        ...profile,
        subjects: JSON.parse(profile.subjects || '[]'),
        educational_levels: JSON.parse(profile.educational_levels || '[]')
      },
      stats: {
        active_subscribers: activeSubscribers,
        subscription_price: (monthlyPriceCents / 100).toFixed(2),
        gross_monthly_revenue: (grossMonthlyRevenueCents / 100).toFixed(2),
        platform_commission_percent: Math.round(commissionRate * 100),
        platform_commission_amount: (platformCommissionCents / 100).toFixed(2),
        estimated_teacher_earnings: (estimatedTeacherEarningsCents / 100).toFixed(2),
        total_courses: courses.length
      },
      subscribers,
      payments: payments.map(p => ({
        ...p,
        amount: (p.amount_cents / 100).toFixed(2),
        platform_commission: (p.platform_commission_cents / 100).toFixed(2),
        teacher_earnings: (p.teacher_earnings_cents / 100).toFixed(2)
      })),
      courses
    });
  } catch (error) {
    console.error('Teacher overview error:', error);
    res.status(500).json({ error: 'Failed to load teacher dashboard' });
  }
});

// Update Teacher Subscription Price & Profile
router.post('/settings', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const { headline, bio, monthly_price_cents } = req.body;

    if (monthly_price_cents && parseInt(monthly_price_cents) < 100) {
      return res.status(400).json({ error: 'Price must be at least $1.00' });
    }

    db.prepare(`
      UPDATE teacher_profiles 
      SET headline = COALESCE(?, headline),
          bio = COALESCE(?, bio),
          monthly_price_cents = COALESCE(?, monthly_price_cents)
      WHERE user_id = ?
    `).run(headline, bio, monthly_price_cents ? parseInt(monthly_price_cents) : null, teacherId);

    res.json({ success: true, message: 'Teacher profile updated successfully' });
  } catch (error) {
    console.error('Update teacher settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get full course with sections and lessons for editing
router.get('/courses/:id/full', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);

    const course = db.prepare(`
      SELECT c.*, s.name as subject_name 
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = ? AND c.teacher_id = ?
    `).get(courseId, teacherId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const sections = db.prepare('SELECT * FROM sections WHERE course_id = ? ORDER BY order_index ASC').all(courseId);

    for (const section of sections) {
      section.lessons = db.prepare('SELECT * FROM lessons WHERE section_id = ? ORDER BY order_index ASC').all(section.id);
    }

    res.json({
      course,
      sections
    });
  } catch (error) {
    console.error('Get full course error:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// Create new course
router.post('/courses', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title, description, subject_name, educational_level, thumbnail_url } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    // Find or get subject
    let subject = db.prepare('SELECT id FROM subjects WHERE name = ?').get(subject_name || 'Mathematics');
    if (!subject) {
      subject = db.prepare('SELECT id FROM subjects LIMIT 1').get();
    }

    const insertCourse = db.prepare(`
      INSERT INTO courses (teacher_id, subject_id, title, description, educational_level, thumbnail_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insertCourse.run(
      teacherId,
      subject.id,
      title,
      description || '',
      educational_level || 'Grade 12',
      thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
    );

    const courseId = result.lastInsertRowid;

    // Create a default first section
    db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)').run(courseId, 'Section 1: Introduction & Fundamentals', 1);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course_id: courseId
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/courses/:id', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);
    const { title, description, educational_level, subject_name, thumbnail_url, is_published } = req.body;

    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(courseId, teacherId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    let subjectId = null;
    if (subject_name) {
      const subj = db.prepare('SELECT id FROM subjects WHERE name = ?').get(subject_name);
      if (subj) subjectId = subj.id;
    }

    db.prepare(`
      UPDATE courses
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          educational_level = COALESCE(?, educational_level),
          subject_id = COALESCE(?, subject_id),
          thumbnail_url = COALESCE(?, thumbnail_url),
          is_published = COALESCE(?, is_published)
      WHERE id = ? AND teacher_id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      educational_level || null,
      subjectId,
      thumbnail_url || null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      courseId,
      teacherId
    );

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/courses/:id', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);

    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(courseId, teacherId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    db.prepare('DELETE FROM courses WHERE id = ? AND teacher_id = ?').run(courseId, teacherId);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Add section to course
router.post('/courses/:id/sections', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Section title is required' });
    }

    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(courseId, teacherId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Next order index
    const maxOrder = db.prepare('SELECT MAX(order_index) as max_order FROM sections WHERE course_id = ?').get(courseId);
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    const result = db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)').run(courseId, title, nextOrder);

    res.status(201).json({
      success: true,
      message: 'Section added successfully',
      section_id: result.lastInsertRowid,
      title,
      order_index: nextOrder
    });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
});

// Update section
router.put('/sections/:id', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const sectionId = parseInt(req.params.id);
    const { title, order_index } = req.body;

    const section = db.prepare(`
      SELECT s.id 
      FROM sections s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = ? AND c.teacher_id = ?
    `).get(sectionId, teacherId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    db.prepare(`
      UPDATE sections
      SET title = COALESCE(?, title),
          order_index = COALESCE(?, order_index)
      WHERE id = ?
    `).run(title || null, order_index !== undefined ? parseInt(order_index) : null, sectionId);

    res.json({ success: true, message: 'Section updated successfully' });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete section
router.delete('/sections/:id', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const sectionId = parseInt(req.params.id);

    const section = db.prepare(`
      SELECT s.id 
      FROM sections s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = ? AND c.teacher_id = ?
    `).get(sectionId, teacherId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    db.prepare('DELETE FROM sections WHERE id = ?').run(sectionId);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// Add lesson to course
router.post('/lessons', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const { course_id, section_id, title, description, video_url, duration_minutes, access_level } = req.body;

    if (!course_id || !title || !access_level) {
      return res.status(400).json({ error: 'course_id, title, and access_level are required' });
    }

    // Verify course belongs to this teacher
    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(course_id, teacherId);
    if (!course) {
      return res.status(403).json({ error: 'You do not own this course' });
    }

    // Verify or find section
    let targetSectionId = section_id;
    if (!targetSectionId) {
      const section = db.prepare('SELECT id FROM sections WHERE course_id = ? ORDER BY order_index ASC LIMIT 1').get(course_id);
      targetSectionId = section ? section.id : db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, 1)').run(course_id, 'General Section').lastInsertRowid;
    }

    // Next order index
    const maxOrder = db.prepare('SELECT MAX(order_index) as max_order FROM lessons WHERE section_id = ?').get(targetSectionId);
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    const insertLesson = db.prepare(`
      INSERT INTO lessons (section_id, course_id, teacher_id, title, description, video_url, duration_minutes, access_level, order_index, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insertLesson.run(
      targetSectionId,
      course_id,
      teacherId,
      title,
      description || '',
      video_url || '',
      duration_minutes ? parseInt(duration_minutes) : 15,
      access_level,
      nextOrder
    );

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson
router.put('/lessons/:id', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const lessonId = parseInt(req.params.id);
    const { title, description, video_url, duration_minutes, access_level, order_index, is_published } = req.body;

    const lesson = db.prepare('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?').get(lessonId, teacherId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or access denied' });
    }

    db.prepare(`
      UPDATE lessons
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          video_url = COALESCE(?, video_url),
          duration_minutes = COALESCE(?, duration_minutes),
          access_level = COALESCE(?, access_level),
          order_index = COALESCE(?, order_index),
          is_published = COALESCE(?, is_published)
      WHERE id = ? AND teacher_id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      video_url !== undefined ? video_url : null,
      duration_minutes !== undefined ? parseInt(duration_minutes) : null,
      access_level || null,
      order_index !== undefined ? parseInt(order_index) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      lessonId,
      teacherId
    );

    res.json({ success: true, message: 'Lesson updated successfully' });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete lesson
router.delete('/lessons/:id', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const lessonId = parseInt(req.params.id);

    const lesson = db.prepare('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?').get(lessonId, teacherId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or access denied' });
    }

    db.prepare('DELETE FROM lessons WHERE id = ? AND teacher_id = ?').run(lessonId, teacherId);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Reorder sections or lessons
router.post('/reorder', requireRole('teacher'), (req, res) => {
  try {
    const teacherId = req.user.id;
    const { type, items } = req.body; // items: [{ id, order_index }]

    if (!Array.isArray(items) || !['sections', 'lessons'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reorder payload' });
    }

    if (type === 'sections') {
      const updateSection = db.prepare(`
        UPDATE sections 
        SET order_index = ? 
        WHERE id = ? AND course_id IN (SELECT id FROM courses WHERE teacher_id = ?)
      `);
      for (const item of items) {
        updateSection.run(item.order_index, item.id, teacherId);
      }
    } else if (type === 'lessons') {
      const updateLesson = db.prepare(`
        UPDATE lessons 
        SET order_index = ? 
        WHERE id = ? AND teacher_id = ?
      `);
      for (const item of items) {
        updateLesson.run(item.order_index, item.id, teacherId);
      }
    }

    res.json({ success: true, message: `${type} reordered successfully` });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

export default router;
