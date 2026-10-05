import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, DB_PATH } from '../db.js';
import { requireRole } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Admin Overview
router.get('/overview', requireRole('admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).get().count;
    const totalTeachers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`).get().count;
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const totalLessons = db.prepare('SELECT COUNT(*) as count FROM lessons').get().count;

    const activeSubscriptions = db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`).get().count;

    // Financial totals from payments
    const finance = db.prepare(`
      SELECT 
        COALESCE(SUM(amount_cents), 0) as gross_cents,
        COALESCE(SUM(platform_commission_cents), 0) as platform_cents,
        COALESCE(SUM(teacher_earnings_cents), 0) as teacher_cents
      FROM payments
      WHERE status = 'completed'
    `).get();

    // Platform settings
    const settings = db.prepare('SELECT key, value, description FROM platform_settings').all();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    // Recent payments
    const recentPayments = db.prepare(`
      SELECT 
        p.id, p.amount_cents, p.platform_commission_cents, p.teacher_earnings_cents, p.created_at, p.simulated,
        s.name as student_name,
        t.name as teacher_name
      FROM payments p
      JOIN users s ON p.student_id = s.id
      JOIN users t ON p.teacher_id = t.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        total_users: totalUsers,
        total_students: totalStudents,
        total_teachers: totalTeachers,
        total_courses: totalCourses,
        total_lessons: totalLessons,
        active_subscriptions: activeSubscriptions,
        gross_revenue: (finance.gross_cents / 100).toFixed(2),
        platform_commission_revenue: (finance.platform_cents / 100).toFixed(2),
        teacher_payout_pool: (finance.teacher_cents / 100).toFixed(2)
      },
      settings: settingsMap,
      recent_payments: recentPayments.map(p => ({
        ...p,
        amount: (p.amount_cents / 100).toFixed(2),
        platform_cut: (p.platform_commission_cents / 100).toFixed(2),
        teacher_cut: (p.teacher_earnings_cents / 100).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
});

// List all users
router.get('/users', requireRole('admin'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, avatar_url, created_at 
      FROM users 
      ORDER BY id ASC
    `).all();

    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// Update platform commission
router.post('/settings/commission', requireRole('admin'), (req, res) => {
  try {
    const { commission_percentage } = req.body;
    const rate = parseFloat(commission_percentage);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Commission percentage must be between 0 and 100' });
    }

    db.prepare(`
      INSERT INTO platform_settings (key, value, description)
      VALUES ('platform_commission_percentage', ?, 'Platform commission percentage cut')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(rate.toString());

    res.json({ success: true, message: `Platform commission updated to ${rate}%` });
  } catch (error) {
    console.error('Update commission error:', error);
    res.status(500).json({ error: 'Failed to update commission' });
  }
});

// Approve or suspend teacher
router.post('/teachers/:id/toggle-approval', requireRole('admin'), (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const teacher = db.prepare('SELECT is_approved FROM teacher_profiles WHERE user_id = ?').get(teacherId);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const newStatus = teacher.is_approved === 1 ? 0 : 1;
    db.prepare('UPDATE teacher_profiles SET is_approved = ? WHERE user_id = ?').run(newStatus, teacherId);

    res.json({
      success: true,
      is_approved: Boolean(newStatus),
      message: newStatus === 1 ? 'Teacher approved' : 'Teacher suspended'
    });
  } catch (error) {
    console.error('Toggle teacher approval error:', error);
    res.status(500).json({ error: 'Failed to update teacher approval status' });
  }
});

// Export complete database as JSON snapshot
router.get('/export/json', requireRole('admin'), (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const users = db.prepare('SELECT id, email, role, name, avatar_url, created_at FROM users').all();
    const studentProfiles = db.prepare('SELECT * FROM student_profiles').all();
    const teacherProfiles = db.prepare('SELECT * FROM teacher_profiles').all();
    const subjects = db.prepare('SELECT * FROM subjects').all();
    const courses = db.prepare('SELECT * FROM courses').all();
    const sections = db.prepare('SELECT * FROM sections').all();
    const lessons = db.prepare('SELECT * FROM lessons').all();
    const resources = db.prepare('SELECT * FROM resources').all();
    const subscriptions = db.prepare('SELECT * FROM subscriptions').all();
    const payments = db.prepare('SELECT * FROM payments').all();
    const progress = db.prepare('SELECT * FROM progress').all();
    const reviews = db.prepare('SELECT * FROM reviews').all();
    const platformSettings = db.prepare('SELECT * FROM platform_settings').all();

    const snapshot = {
      export_timestamp: new Date().toISOString(),
      platform: 'Korsa',
      version: '1.0.0',
      tables: {
        users,
        student_profiles: studentProfiles,
        teacher_profiles: teacherProfiles,
        subjects,
        courses,
        sections,
        lessons,
        resources,
        subscriptions,
        payments,
        progress,
        reviews,
        platform_settings: platformSettings
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="korsa-snapshot-${timestamp}.json"`);
    res.send(JSON.stringify(snapshot, null, 2));
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to generate database export' });
  }
});

// Export raw SQLite database file
router.get('/export/sqlite', requireRole('admin'), (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.download(DB_PATH, `korsa-backup-${timestamp}.db`, (err) => {
      if (err) {
        console.error('Download db error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to download SQLite file' });
      }
    });
  } catch (error) {
    console.error('Export SQLite error:', error);
    res.status(500).json({ error: 'Failed to export SQLite database' });
  }
});

export default router;
