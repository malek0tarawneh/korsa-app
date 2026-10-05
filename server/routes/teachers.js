import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// GET all teachers with search and filters
router.get('/', (req, res) => {
  try {
    const { subject, grade, search } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.avatar_url,
        tp.headline, tp.bio, tp.subjects, tp.educational_levels,
        tp.monthly_price_cents, tp.rating, tp.review_count, tp.subscriber_count,
        (SELECT COUNT(*) FROM courses WHERE teacher_id = u.id AND is_published = 1) as course_count
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'teacher' AND tp.is_approved = 1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR tp.headline LIKE ? OR tp.bio LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
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

    const teachers = db.prepare(query).all(...params);

    const formattedTeachers = teachers.map(t => ({
      ...t,
      subjects: JSON.parse(t.subjects || '[]'),
      educational_levels: JSON.parse(t.educational_levels || '[]'),
      monthly_price: (t.monthly_price_cents / 100).toFixed(2)
    }));

    res.json(formattedTeachers);
  } catch (error) {
    console.error('Fetch teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// GET single teacher profile with curriculum and access control
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const currentUserId = req.user ? req.user.id : null;
    const currentUserRole = req.user ? req.user.role : null;

    const teacher = db.prepare(`
      SELECT 
        u.id, u.name, u.avatar_url,
        tp.headline, tp.bio, tp.subjects, tp.educational_levels,
        tp.monthly_price_cents, tp.rating, tp.review_count, tp.subscriber_count,
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
        const sub = db.prepare(`
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

    const courses = db.prepare(coursesQuery).all(teacherId);

    // Populate sections and lessons for each course
    for (const course of courses) {
      const sections = db.prepare('SELECT * FROM sections WHERE course_id = ? ORDER BY order_index ASC').all(course.id);

      for (const section of sections) {
        let lessonsQuery = `SELECT * FROM lessons WHERE section_id = ?`;
        if (currentUserId !== teacherId && currentUserRole !== 'admin') {
          lessonsQuery += ` AND is_published = 1 AND access_level != 'DRAFT'`;
        }
        lessonsQuery += ` ORDER BY order_index ASC`;

        const lessons = db.prepare(lessonsQuery).all(section.id);

        // BACKEND ENFORCEMENT: Redact content if locked
        section.lessons = lessons.map(lesson => {
          const isFree = lesson.access_level === 'FREE';
          const canAccess = isFree || isSubscribed;

          // Fetch resources
          let resources = [];
          if (canAccess) {
            resources = db.prepare('SELECT * FROM resources WHERE lesson_id = ?').all(lesson.id);
          } else {
            // Count resources without giving download URLs
            const count = db.prepare('SELECT COUNT(*) as count FROM resources WHERE lesson_id = ?').all(lesson.id);
            resources = [{ count: count[0]?.count || 0, is_locked: true }];
          }

          // Check if current user has completed this lesson
          let isCompleted = false;
          if (currentUserId) {
            const prog = db.prepare('SELECT completed FROM progress WHERE student_id = ? AND lesson_id = ?').get(currentUserId, lesson.id);
            isCompleted = prog ? Boolean(prog.completed) : false;
          }

          return {
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
          };
        });
      }

      course.sections = sections;
    }

    // Fetch teacher reviews
    const reviews = db.prepare(`
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
        monthly_price: (teacher.monthly_price_cents / 100).toFixed(2)
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
