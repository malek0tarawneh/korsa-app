import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// Helper: Get configurable platform commission percentage
function getPlatformCommissionRate() {
  const row = db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_commission_percentage');
  const percent = row ? parseFloat(row.value) : 20;
  return isNaN(percent) ? 0.20 : percent / 100;
}

// SIMULATE PAYMENT & SUBSCRIBE
router.post('/simulate', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const { teacher_id } = req.body;

    if (!teacher_id) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    if (studentId === parseInt(teacher_id)) {
      return res.status(400).json({ error: 'You cannot subscribe to yourself' });
    }

    // Verify teacher exists and get price
    const teacherProfile = db.prepare(`
      SELECT tp.monthly_price_cents, u.name as teacher_name 
      FROM teacher_profiles tp 
      JOIN users u ON tp.user_id = u.id 
      WHERE tp.user_id = ?
    `).get(teacher_id);

    if (!teacherProfile) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const priceCents = teacherProfile.monthly_price_cents;
    const commissionRate = getPlatformCommissionRate();
    const platformCommissionCents = Math.round(priceCents * commissionRate);
    const teacherEarningsCents = priceCents - platformCommissionCents;

    // Check if subscription already exists
    const existing = db.prepare('SELECT * FROM subscriptions WHERE student_id = ? AND teacher_id = ?').get(studentId, teacher_id);

    let subscriptionId;
    const now = new Date();
    const renewal = new Date();
    renewal.setMonth(renewal.getMonth() + 1);

    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({ error: 'You are already actively subscribed to this teacher' });
      }

      // Reactivate cancelled or expired subscription
      db.prepare(`
        UPDATE subscriptions 
        SET status = 'active', price_cents = ?, started_at = datetime('now'), renewal_at = datetime('now', '+30 days'), cancelled_at = NULL 
        WHERE id = ?
      `).run(priceCents, existing.id);
      subscriptionId = existing.id;
    } else {
      // Create new subscription
      const insertSub = db.prepare(`
        INSERT INTO subscriptions (student_id, teacher_id, price_cents, status, started_at, renewal_at)
        VALUES (?, ?, ?, 'active', datetime('now'), datetime('now', '+30 days'))
      `);
      const subResult = insertSub.run(studentId, teacher_id, priceCents);
      subscriptionId = subResult.lastInsertRowid;
    }

    // Record Simulated Payment Transaction
    const insertPayment = db.prepare(`
      INSERT INTO payments 
      (subscription_id, student_id, teacher_id, amount_cents, platform_commission_cents, teacher_earnings_cents, status, simulated)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', 1)
    `);
    insertPayment.run(subscriptionId, studentId, teacher_id, priceCents, platformCommissionCents, teacherEarningsCents);

    // Update teacher's subscriber count
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE teacher_id = ? AND status = 'active'`).get(teacher_id);
    db.prepare('UPDATE teacher_profiles SET subscriber_count = ? WHERE user_id = ?').run(countRow.count, teacher_id);

    res.json({
      success: true,
      message: `Simulated subscription confirmed! You now have full access to ${teacherProfile.teacher_name}'s subscriber content.`,
      subscription: {
        id: subscriptionId,
        teacher_id,
        teacher_name: teacherProfile.teacher_name,
        price: (priceCents / 100).toFixed(2),
        platform_commission: (platformCommissionCents / 100).toFixed(2),
        teacher_earnings: (teacherEarningsCents / 100).toFixed(2),
        simulated: true,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Subscription simulation error:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

// GET Student active & past subscriptions
router.get('/my', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;

    const subscriptions = db.prepare(`
      SELECT 
        s.id, s.teacher_id, s.price_cents, s.status, s.started_at, s.renewal_at, s.cancelled_at,
        u.name as teacher_name, u.avatar_url as teacher_avatar,
        tp.headline as teacher_headline, tp.subjects as teacher_subjects
      FROM subscriptions s
      JOIN users u ON s.teacher_id = u.id
      JOIN teacher_profiles tp ON s.teacher_id = tp.user_id
      WHERE s.student_id = ?
      ORDER BY s.started_at DESC
    `).all(studentId);

    const formatted = subscriptions.map(s => ({
      ...s,
      price: (s.price_cents / 100).toFixed(2),
      teacher_subjects: JSON.parse(s.teacher_subjects || '[]')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to load subscriptions' });
  }
});

// CANCEL SUBSCRIPTION
router.post('/cancel/:id', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const subscriptionId = parseInt(req.params.id);

    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND student_id = ?').get(subscriptionId, studentId);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (sub.status !== 'active') {
      return res.status(400).json({ error: 'Subscription is not currently active' });
    }

    db.prepare(`
      UPDATE subscriptions 
      SET status = 'cancelled', cancelled_at = datetime('now')
      WHERE id = ?
    `).run(subscriptionId);

    // Update teacher subscriber count
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE teacher_id = ? AND status = 'active'`).get(sub.teacher_id);
    db.prepare('UPDATE teacher_profiles SET subscriber_count = ? WHERE user_id = ?').run(countRow.count, sub.teacher_id);

    res.json({
      success: true,
      message: 'Subscription successfully cancelled. Access will remain until the end of your billing cycle.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// REACTIVATE SUBSCRIPTION
router.post('/reactivate/:id', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;
    const subscriptionId = parseInt(req.params.id);

    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND student_id = ?').get(subscriptionId, studentId);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (sub.status === 'active') {
      return res.status(400).json({ error: 'Subscription is already active' });
    }

    db.prepare(`
      UPDATE subscriptions 
      SET status = 'active', renewal_at = datetime('now', '+30 days'), cancelled_at = NULL 
      WHERE id = ?
    `).run(subscriptionId);

    // Record new simulated renewal payment
    const commissionRate = getPlatformCommissionRate();
    const platformCommissionCents = Math.round(sub.price_cents * commissionRate);
    const teacherEarningsCents = sub.price_cents - platformCommissionCents;

    db.prepare(`
      INSERT INTO payments 
      (subscription_id, student_id, teacher_id, amount_cents, platform_commission_cents, teacher_earnings_cents, status, simulated)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', 1)
    `).run(subscriptionId, studentId, sub.teacher_id, sub.price_cents, platformCommissionCents, teacherEarningsCents);

    // Update teacher subscriber count
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE teacher_id = ? AND status = 'active'`).get(sub.teacher_id);
    db.prepare('UPDATE teacher_profiles SET subscriber_count = ? WHERE user_id = ?').run(countRow.count, sub.teacher_id);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully!'
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// GET Student simulated invoices & payment history
router.get('/my/ledger', requireAuth, (req, res) => {
  try {
    const studentId = req.user.id;

    const payments = db.prepare(`
      SELECT 
        p.id, p.subscription_id, p.amount_cents, p.status, p.simulated, p.created_at,
        u.name as teacher_name, u.avatar_url as teacher_avatar
      FROM payments p
      JOIN users u ON p.teacher_id = u.id
      WHERE p.student_id = ?
      ORDER BY p.created_at DESC
    `).all(studentId);

    res.json(payments.map(p => ({
      ...p,
      amount: (p.amount_cents / 100).toFixed(2)
    })));
  } catch (error) {
    console.error('Get student ledger error:', error);
    res.status(500).json({ error: 'Failed to load simulated payment ledger' });
  }
});

export default router;
