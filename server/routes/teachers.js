import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// GET all teachers with search and filters
router.get('/', async (req, res) => {
  try {
    const { subject, grade, search } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.avatar_url,
        tp.handle, tp.tier, tp.headline, tp.bio, tp.custom_bio, tp.referral_code, tp.subjects, tp.educational_levels,
        tp.monthly_price_cents, tp.rating, tp.review_count, tp.subscriber_count,
        tp.cliq_alias, tp.bank_name, tp.wallet_phone, tp.currency,
        (SELECT COUNT(*) FROM courses WHERE teacher_id = u.id AND is_published = 1) as course_count,
        (SELECT COUNT(*) FROM lead_magnets WHERE teacher_id = u.id) as lead_magnet_count,
        (SELECT COUNT(*) FROM lessons WHERE teacher_id = u.id AND (is_free_preview = 1 OR access_level = 'FREE') AND is_published = 1) as free_sample_count,
        (SELECT COUNT(*) FROM services WHERE teacher_id = u.id AND is_active = 1) as service_count
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'teacher' AND tp.is_approved = 1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR tp.headline LIKE ? OR tp.bio LIKE ? OR tp.handle LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (subject && subject !== 'all') {
      query += ` AND tp.subjects LIKE ?`;
      params.push(`%${subject}%`);
    }

    if (grade && grade !== 'all') {
      query += ` AND tp.educational_levels LIKE ?`;
      params.push(`%${grade}%`);
    }

    query += ` ORDER BY tp.subscriber_count DESC, tp.rating DESC`;

    const teachers = await db.prepare(query).all(...params);

    const formattedTeachers = teachers.map(t => ({
      ...t,
      tier: t.tier || 'community_tutor',
      course_count: Number(t.course_count || 0),
      lead_magnet_count: Number(t.lead_magnet_count || 0),
      free_sample_count: Number(t.free_sample_count || 0),
      service_count: Number(t.service_count || 0),
      subjects: JSON.parse(t.subjects || '[]'),
      educational_levels: JSON.parse(t.educational_levels || '[]'),
      monthly_price: (t.monthly_price_cents / 100).toFixed(2),
      monthly_price_jod: (t.monthly_price_cents / 100).toFixed(0),
      currency: t.currency || 'JOD',
      cliq_alias: t.cliq_alias || 'REEDMATH',
      bank_name: t.bank_name || 'Arab Bank (البنك العربي)',
      wallet_phone: t.wallet_phone || '0795551234'
    }));

    res.json(formattedTeachers);
  } catch (error) {
    console.error('Fetch teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// GET single teacher profile with curriculum and access control
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const currentUserId = req.user ? req.user.id : null;
    const currentUserRole = req.user ? req.user.role : null;

    const teacher = await db.prepare(`
      SELECT 
        u.id, u.name, u.avatar_url,
        tp.handle, tp.tier, tp.headline, tp.bio, tp.subjects, tp.educational_levels,
        tp.monthly_price_cents, tp.rating, tp.review_count, tp.subscriber_count,
        tp.cliq_alias, tp.bank_name, tp.wallet_phone, tp.currency,
        tp.is_approved, u.created_at
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.id = ? AND u.role = 'teacher'
    `).get(teacherId);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if current user is actively subscribed
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

    // Fetch courses
    let coursesQuery = `
      SELECT c.*, s.name as subject_name 
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.teacher_id = ?
    `;
    // Only author or admin can see unpublished courses
    if (currentUserId !== teacherId && currentUserRole !== 'admin') {
      coursesQuery += ` AND c.is_published = 1`;
    }
    coursesQuery += ` ORDER BY c.id ASC`;

    const courses = await db.prepare(coursesQuery).all(teacherId);

    // Populate sections and lessons for each course
    for (const course of courses) {
      const sections = await db.prepare('SELECT * FROM sections WHERE course_id = ? ORDER BY order_index ASC').all(course.id);

      for (const section of sections) {
        let lessonsQuery = `SELECT * FROM lessons WHERE section_id = ?`;
        if (currentUserId !== teacherId && currentUserRole !== 'admin') {
          lessonsQuery += ` AND is_published = 1 AND access_level != 'DRAFT'`;
        }
        lessonsQuery += ` ORDER BY order_index ASC`;

        const lessons = await db.prepare(lessonsQuery).all(section.id);

        // BACKEND ENFORCEMENT: Redact content if locked
        section.lessons = [];
        for (const lesson of lessons) {
          const isFree = lesson.access_level === 'FREE';
          const canAccess = isFree || isSubscribed;

          // Fetch resources
          let resources = [];
          if (canAccess) {
            resources = await db.prepare('SELECT * FROM resources WHERE lesson_id = ?').all(lesson.id);
          } else {
            // Count resources without giving download URLs
            const countRow = await db.prepare('SELECT COUNT(*) as count FROM resources WHERE lesson_id = ?').get(lesson.id);
            resources = [{ count: Number(countRow?.count || 0), is_locked: true }];
          }

          // Check if current user has completed this lesson
          let isCompleted = false;
          if (currentUserId) {
            const prog = await db.prepare('SELECT completed FROM progress WHERE student_id = ? AND lesson_id = ?').get(currentUserId, lesson.id);
            isCompleted = prog ? Boolean(prog.completed) : false;
          }

          section.lessons.push({
            id: lesson.id,
            section_id: lesson.section_id,
            course_id: lesson.course_id,
            title: lesson.title,
            description: lesson.description,
            duration_minutes: lesson.duration_minutes,
            access_level: lesson.access_level,
            is_locked: !canAccess,
            // SECURITY: Never send video_url to client if user is unauthorized
            video_url: canAccess ? lesson.video_url : null,
            resources: canAccess ? resources : [],
            is_completed: isCompleted,
            order_index: lesson.order_index
          });
        }
      }

      course.sections = sections;
    }

    // Fetch teacher reviews
    const reviews = await db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as student_name, u.avatar_url as student_avatar
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.teacher_id = ? AND r.is_moderated = 0
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(teacherId);

    res.json({
      teacher: {
        ...teacher,
        subjects: JSON.parse(teacher.subjects || '[]'),
        educational_levels: JSON.parse(teacher.educational_levels || '[]'),
        monthly_price: (teacher.monthly_price_cents / 100).toFixed(2),
        monthly_price_jod: (teacher.monthly_price_cents / 100).toFixed(0),
        currency: teacher.currency || 'JOD',
        cliq_alias: teacher.cliq_alias || 'REEDMATH',
        bank_name: teacher.bank_name || 'Arab Bank (البنك العربي)',
        wallet_phone: teacher.wallet_phone || '0795551234'
      },
      isSubscribed,
      subscriptionDetails,
      courses,
      reviews
    });
  } catch (error) {
    console.error('Fetch teacher details error:', error);
    res.status(500).json({ error: 'Failed to load teacher profile' });
  }
});

export default router;
