import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// GET /api/creators/:handle - Public Creator Profile API
router.get('/:handle', authenticateToken, async (req, res) => {
  try {
    const rawHandle = req.params.handle.replace(/^@/, '').trim().toLowerCase();
    const currentUserId = req.user ? req.user.id : null;
    const currentUserRole = req.user ? req.user.role : null;

    // Search teacher by vanity handle or fallback to user id if numeric
    let teacher = await db.prepare(`
      SELECT 
        u.id, u.name, u.avatar_url, u.email, u.created_at,
        tp.handle, tp.tier, tp.headline, tp.bio, tp.custom_bio,
        tp.external_links, tp.referral_code, tp.commission_rate,
        tp.subjects, tp.educational_levels, tp.monthly_price_cents,
        tp.cliq_alias, tp.bank_name, tp.wallet_phone, tp.currency,
        tp.rating, tp.review_count, tp.subscriber_count, tp.is_approved
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE LOWER(tp.handle) = LOWER(?) AND u.role = 'teacher'
    `).get(rawHandle);

    if (!teacher && !isNaN(Number(rawHandle))) {
      teacher = await db.prepare(`
        SELECT 
          u.id, u.name, u.avatar_url, u.email, u.created_at,
          tp.handle, tp.tier, tp.headline, tp.bio, tp.custom_bio,
          tp.external_links, tp.referral_code, tp.commission_rate,
          tp.subjects, tp.educational_levels, tp.monthly_price_cents,
          tp.cliq_alias, tp.bank_name, tp.wallet_phone, tp.currency,
          tp.rating, tp.review_count, tp.subscriber_count, tp.is_approved
        FROM users u
        JOIN teacher_profiles tp ON u.id = tp.user_id
        WHERE u.id = ? AND u.role = 'teacher'
      `).get(Number(rawHandle));
    }

    if (!teacher) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const teacherId = teacher.id;

    // Check if the requesting user is subscribed
    let isSubscribed = false;
    let subscriptionDetails = null;
    if (currentUserId) {
      if (currentUserId === teacherId || currentUserRole === 'admin') {
        isSubscribed = true;
      } else {
        const sub = await db.prepare(`
          SELECT * FROM subscriptions 
          WHERE student_id = ? AND teacher_id = ? AND status = 'active'
        `).get(currentUserId, teacherId);
        if (sub) {
          isSubscribed = true;
          subscriptionDetails = sub;
        }
      }
    }

    // 1. Free Lead Magnets
    const leadMagnets = await db.prepare(`
      SELECT id, teacher_id, title, description, file_url, downloads_count, created_at
      FROM lead_magnets
      WHERE teacher_id = ?
      ORDER BY downloads_count DESC, id DESC
    `).all(teacherId);

    // 2. Micro-Services for direct 1-on-1 bookings
    const services = await db.prepare(`
      SELECT id, teacher_id, title, price_cents, duration_minutes, service_type, is_active, created_at
      FROM services
      WHERE teacher_id = ? AND is_active = 1
      ORDER BY price_cents ASC
    `).all(teacherId);

    // 3. Courses and previewable lessons
    const courses = await db.prepare(`
      SELECT c.*, s.name as subject_name
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.teacher_id = ? AND c.is_published = 1
      ORDER BY c.id ASC
    `).all(teacherId);

    for (const course of courses) {
      const sections = await db.prepare(`
        SELECT * FROM sections WHERE course_id = ? ORDER BY order_index ASC
      `).all(course.id);

      for (const section of sections) {
        const lessons = await db.prepare(`
          SELECT * FROM lessons 
          WHERE section_id = ? AND is_published = 1 AND access_level != 'DRAFT'
          ORDER BY order_index ASC
        `).all(section.id);

        section.lessons = [];
        for (const lesson of lessons) {
          const isFree = lesson.access_level === 'FREE' || Boolean(lesson.is_free_preview);
          const canAccess = isFree || isSubscribed;

          let resources = [];
          if (canAccess) {
            resources = await db.prepare('SELECT * FROM resources WHERE lesson_id = ?').all(lesson.id);
          } else {
            const countRow = await db.prepare('SELECT COUNT(*) as count FROM resources WHERE lesson_id = ?').get(lesson.id);
            resources = [{ count: Number(countRow?.count || 0), is_locked: true }];
          }

          section.lessons.push({
            id: lesson.id,
            section_id: lesson.section_id,
            course_id: lesson.course_id,
            title: lesson.title,
            description: lesson.description,
            duration_minutes: lesson.duration_minutes,
            access_level: lesson.access_level,
            is_free_preview: Boolean(lesson.is_free_preview || lesson.access_level === 'FREE'),
            is_locked: !canAccess,
            video_url: canAccess ? lesson.video_url : null,
            resources: canAccess ? resources : []
          });
        }
      }
      course.sections = sections;
    }

    // 4. Student Reviews
    const reviews = await db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as student_name, u.avatar_url as student_avatar
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.teacher_id = ? AND r.is_moderated = 0
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(teacherId);

    // 5. Calculate public totals
    const totalLessons = courses.reduce((acc, c) => acc + c.sections.reduce((sAcc, s) => sAcc + s.lessons.length, 0), 0);
    const freePreviewCount = courses.reduce((acc, c) => acc + c.sections.reduce((sAcc, s) => sAcc + s.lessons.filter(l => l.is_free_preview).length, 0), 0);
    const totalDownloads = leadMagnets.reduce((acc, lm) => acc + Number(lm.downloads_count || 0), 0);

    let parsedExternalLinks = {};
    try {
      parsedExternalLinks = JSON.parse(teacher.external_links || '{}');
    } catch {
      parsedExternalLinks = {};
    }

    res.json({
      creator: {
        id: teacher.id,
        name: teacher.name,
        avatar_url: teacher.avatar_url,
        handle: teacher.handle,
        tier: teacher.tier || 'community_tutor',
        headline: teacher.headline,
        bio: teacher.bio,
        custom_bio: teacher.custom_bio,
        external_links: parsedExternalLinks,
        referral_code: teacher.referral_code,
        commission_rate: 0.00,
        cliq_alias: teacher.cliq_alias || 'REEDMATH',
        bank_name: teacher.bank_name || 'Arab Bank (البنك العربي)',
        wallet_phone: teacher.wallet_phone || '0795551234',
        currency: teacher.currency || 'JOD',
        subjects: JSON.parse(teacher.subjects || '[]'),
        educational_levels: JSON.parse(teacher.educational_levels || '[]'),
        monthly_price_cents: teacher.monthly_price_cents,
        monthly_price: (teacher.monthly_price_cents / 100).toFixed(2),
        monthly_price_jod: (teacher.monthly_price_cents / 100).toFixed(0),
        rating: teacher.rating,
        review_count: teacher.review_count,
        subscriber_count: teacher.subscriber_count,
        joined_at: teacher.created_at
      },
      stats: {
        course_count: courses.length,
        total_lessons: totalLessons,
        free_preview_count: freePreviewCount,
        lead_magnets_count: leadMagnets.length,
        total_downloads: totalDownloads,
        services_count: services.length,
        subscriber_count: teacher.subscriber_count,
        rating: teacher.rating,
        review_count: teacher.review_count
      },
      isSubscribed,
      subscriptionDetails,
      lead_magnets: leadMagnets,
      services: services.map(s => ({
        ...s,
        price_dollars: (s.price_cents / 100).toFixed(2),
        price_jod: (s.price_cents / 100).toFixed(0)
      })),
      courses,
      reviews
    });
  } catch (error) {
    console.error('Fetch public creator profile error:', error);
    res.status(500).json({ error: 'Failed to load creator profile' });
  }
});

export default router;
