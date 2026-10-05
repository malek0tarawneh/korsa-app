import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// Get student learning progress and "continue learning"
router.get('/my', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;

    // Get courses that student has progress in or is subscribed to
    const courses = db.prepare(`
      SELECT DISTINCT 
        c.id as course_id, c.teacher_id, c.title as course_title, c.thumbnail_url, c.educational_level,
        u.name as teacher_name, u.avatar_url as teacher_avatar,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id AND is_published = 1 AND access_level != 'DRAFT') as total_lessons,
        (SELECT COUNT(*) FROM progress WHERE student_id = ? AND course_id = c.id AND completed = 1) as completed_lessons,
        (SELECT l.title FROM progress p JOIN lessons l ON p.lesson_id = l.id WHERE p.student_id = ? AND p.course_id = c.id ORDER BY p.last_watched_at DESC LIMIT 1) as last_lesson_title,
        (SELECT p.lesson_id FROM progress p WHERE p.student_id = ? AND p.course_id = c.id ORDER BY p.last_watched_at DESC LIMIT 1) as last_lesson_id
      FROM progress pr
      JOIN courses c ON pr.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE pr.student_id = ?
    `).all(studentId, studentId, studentId, studentId);

    const formatted = courses.map(c => {
      const percentage = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
      return {
        ...c,
        percentage
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get detailed progress for a specific course
router.get('/course/:courseId', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const courseId = parseInt(req.params.courseId);

    const lessonProgress = db.prepare(`
      SELECT lesson_id, completed, last_watched_at 
      FROM progress 
      WHERE student_id = ? AND course_id = ?
    `).all(studentId, courseId);

    const progressMap = {};
    lessonProgress.forEach(p => {
      progressMap[p.lesson_id] = { completed: Boolean(p.completed), last_watched_at: p.last_watched_at };
    });

    res.json(progressMap);
  } catch (error) {
    console.error('Course progress error:', error);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});

// Toggle lesson completed status
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const { lesson_id, course_id, completed } = req.body;

    if (!lesson_id || !course_id) {
      return res.status(400).json({ error: 'lesson_id and course_id are required' });
    }

    const isCompleted = completed ? 1 : 0;

    const existing = db.prepare('SELECT id FROM progress WHERE student_id = ? AND lesson_id = ?').get(studentId, lesson_id);

    if (existing) {
      db.prepare(`
        UPDATE progress 
        SET completed = ?, last_watched_at = datetime('now') 
        WHERE id = ?
      `).run(isCompleted, existing.id);
    } else {
      db.prepare(`
        INSERT INTO progress (student_id, course_id, lesson_id, completed, last_watched_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(studentId, course_id, lesson_id, isCompleted);
    }

    res.json({ success: true, completed: Boolean(isCompleted) });
  } catch (error) {
    console.error('Toggle progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
