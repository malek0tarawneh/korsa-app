import express from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = express.Router();

// Helper to generate a clean, readable prepaid access code
function generateRandomCode(prefix = 'KORSA') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let chunk1 = '';
  let chunk2 = '';
  for (let i = 0; i < 4; i++) {
    chunk1 += chars[Math.floor(Math.random() * chars.length)];
    chunk2 += chars[Math.floor(Math.random() * chars.length)];
  }
  const cleanPrefix = (prefix || 'KORSA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'KORSA';
  return `${cleanPrefix}-${chunk1}-${chunk2}`;
}

// ==========================================
// 1. POST /api/codes/generate
// Teacher generates single or batch prepaid access codes
// ==========================================
router.post('/generate', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    let { count = 1, price_jod = 10, batch_name = '' } = req.body;

    const numCount = Math.min(Math.max(parseInt(count) || 1, 1), 100);
    const numPrice = Math.max(parseInt(price_jod) || 10, 1);
    const cleanBatch = (batch_name || '').trim() || `Batch ${new Date().toLocaleDateString()}`;

    // Get teacher's handle for clean code prefix
    const profile = await db.prepare('SELECT handle FROM teacher_profiles WHERE user_id = ?').get(teacherId);
    const prefix = profile?.handle || 'KORSA';

    const generated = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < numCount; i++) {
      let code = generateRandomCode(prefix);
      let attempts = 0;
      // Guarantee uniqueness
      while (attempts < 10) {
        const existing = await db.prepare('SELECT id FROM access_codes WHERE code = ?').get(code);
        if (!existing) break;
        code = generateRandomCode(prefix);
        attempts++;
      }

      const insertRes = await db.prepare(`
        INSERT INTO access_codes (teacher_id, code, batch_name, price_jod, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(teacherId, code, cleanBatch, numPrice, nowIso);

      generated.push({
        id: insertRes.lastInsertRowid,
        code,
        batch_name: cleanBatch,
        price_jod: numPrice,
        status: 'active',
        created_at: nowIso
      });
    }

    res.json({
      success: true,
      message: `Successfully generated ${generated.length} prepaid access codes for "${cleanBatch}".`,
      count: generated.length,
      batch_name: cleanBatch,
      codes: generated
    });
  } catch (error) {
    console.error('Generate access codes error:', error);
    res.status(500).json({ error: 'Failed to generate access codes' });
  }
});

// ==========================================
// 2. GET /api/codes/teacher
// Teacher views their generated codes with redemption details
// ==========================================
router.get('/teacher', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;

    const codes = await db.prepare(`
      SELECT 
        ac.id, ac.teacher_id, ac.code, ac.batch_name, ac.price_jod, ac.status, 
        ac.redeemed_at, ac.created_at,
        u.name as student_name, u.email as student_email
      FROM access_codes ac
      LEFT JOIN users u ON ac.redeemed_by = u.id
      WHERE ac.teacher_id = ?
      ORDER BY ac.created_at DESC, ac.id DESC
    `).all(teacherId);

    const totalCount = codes.length;
    const activeCount = codes.filter(c => c.status === 'active').length;
    const redeemedCount = codes.filter(c => c.status === 'redeemed').length;
    const totalValueJod = codes.reduce((acc, c) => acc + (c.price_jod || 10), 0);

    // Group batches
    const batchesMap = {};
    for (const c of codes) {
      const b = c.batch_name || 'General';
      if (!batchesMap[b]) batchesMap[b] = { name: b, count: 0, active: 0, redeemed: 0 };
      batchesMap[b].count++;
      if (c.status === 'active') batchesMap[b].active++;
      if (c.status === 'redeemed') batchesMap[b].redeemed++;
    }

    res.json({
      stats: {
        total_count: totalCount,
        active_count: activeCount,
        redeemed_count: redeemedCount,
        total_value_jod: totalValueJod
      },
      batches: Object.values(batchesMap),
      codes
    });
  } catch (error) {
    console.error('Fetch teacher access codes error:', error);
    res.status(500).json({ error: 'Failed to fetch access codes' });
  }
});

// ==========================================
// 3. GET /api/codes/teacher/export-csv
// Export teacher's codes to printable/bookshop CSV
// ==========================================
router.get('/teacher/export-csv', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const codes = await db.prepare(`
      SELECT 
        ac.code, ac.batch_name, ac.price_jod, ac.status, 
        ac.created_at, ac.redeemed_at,
        u.name as student_name, u.email as student_email
      FROM access_codes ac
      LEFT JOIN users u ON ac.redeemed_by = u.id
      WHERE ac.teacher_id = ?
      ORDER BY ac.created_at DESC
    `).all(teacherId);

    const headers = ['Code', 'Batch Name', 'Price (JOD)', 'Status', 'Redeemed By Student', 'Student Email', 'Redeemed Date', 'Created Date'];
    const rows = codes.map(c => [
      `"${c.code}"`,
      `"${(c.batch_name || '').replace(/"/g, '""')}"`,
      c.price_jod || 10,
      `"${c.status}"`,
      `"${(c.student_name || '').replace(/"/g, '""')}"`,
      `"${(c.student_email || '').replace(/"/g, '""')}"`,
      `"${c.redeemed_at || ''}"`,
      `"${c.created_at || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="korsa_access_codes_${teacherId}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export access codes CSV error:', error);
    res.status(500).json({ error: 'Failed to export codes CSV' });
  }
});

// ==========================================
// 4. POST /api/codes/redeem
// Student redeems prepaid code -> activates 30-day enrollment
// ==========================================
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Please enter an access code / يرجى إدخال كود الاشتراك' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Query code and teacher info
    const accessCode = await db.prepare(`
      SELECT 
        ac.*, 
        u.name as teacher_name, 
        tp.handle as teacher_handle, 
        tp.monthly_price_cents
      FROM access_codes ac
      JOIN users u ON ac.teacher_id = u.id
      JOIN teacher_profiles tp ON ac.teacher_id = tp.user_id
      WHERE UPPER(ac.code) = ?
    `).get(cleanCode);

    if (!accessCode) {
      return res.status(404).json({ 
        error: 'Invalid access code. Please check the spelling and try again. / كود غير صحيح، يرجى التأكد من الرمز المدخل والمحاولة مجدداً.' 
      });
    }

    if (accessCode.status === 'redeemed') {
      return res.status(400).json({ 
        error: 'This code has already been redeemed. / تم استخدام وتفعيل هذا الكود مسبقاً.' 
      });
    }

    if (accessCode.status !== 'active') {
      return res.status(400).json({ 
        error: 'This code is inactive or revoked. / هذا الكود غير مفعل حالياً.' 
      });
    }

    if (accessCode.teacher_id === studentId) {
      return res.status(400).json({ 
        error: 'You cannot redeem your own access code. / لا يمكنك استخدام كودك الخاص.' 
      });
    }

    const teacherId = accessCode.teacher_id;
    const priceCents = (accessCode.price_jod || 10) * 100;
    const nowIso = new Date().toISOString();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Check existing subscription
    const existingSub = await db.prepare(`
      SELECT * FROM subscriptions 
      WHERE student_id = ? AND teacher_id = ?
    `).get(studentId, teacherId);

    let renewalDate;
    if (existingSub && existingSub.status === 'active' && existingSub.renewal_at && new Date(existingSub.renewal_at) > new Date()) {
      // Extend current active subscription by 30 days
      renewalDate = new Date(new Date(existingSub.renewal_at).getTime() + thirtyDaysMs);
    } else {
      // 30 days from right now
      renewalDate = new Date(Date.now() + thirtyDaysMs);
    }
    const renewalIso = renewalDate.toISOString();

    let subscriptionId;
    if (existingSub) {
      await db.prepare(`
        UPDATE subscriptions 
        SET status = 'active', price_cents = ?, renewal_at = ?, cancelled_at = NULL 
        WHERE id = ?
      `).run(priceCents, renewalIso, existingSub.id);
      subscriptionId = existingSub.id;
    } else {
      const insResult = await db.prepare(`
        INSERT INTO subscriptions (student_id, teacher_id, price_cents, status, started_at, renewal_at)
        VALUES (?, ?, ?, 'active', ?, ?)
      `).run(studentId, teacherId, priceCents, nowIso, renewalIso);
      subscriptionId = insResult.lastInsertRowid;
    }

    // Mark access code as redeemed
    await db.prepare(`
      UPDATE access_codes
      SET status = 'redeemed', redeemed_by = ?, redeemed_at = ?
      WHERE id = ?
    `).run(studentId, nowIso, accessCode.id);

    // Record payment receipt (100% to teacher with prepaid vouchers, 0 platform cut)
    await db.prepare(`
      INSERT INTO payments 
      (subscription_id, student_id, teacher_id, amount_cents, platform_commission_cents, teacher_earnings_cents, status, simulated)
      VALUES (?, ?, ?, ?, 0, ?, 'completed', 0)
    `).run(subscriptionId, studentId, teacherId, priceCents, priceCents);

    // Update teacher's subscriber count
    const countRow = await db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE teacher_id = ? AND status = 'active'
    `).get(teacherId);
    const activeSubCount = Number(countRow?.count || 0);
    await db.prepare('UPDATE teacher_profiles SET subscriber_count = ? WHERE user_id = ?').run(activeSubCount, teacherId);

    res.json({
      success: true,
      message: `Prepaid code activated! You now have 30 days of full access to ${accessCode.teacher_name}'s classes and subscriber posts.`,
      teacher_name: accessCode.teacher_name,
      teacher_handle: accessCode.teacher_handle,
      teacher_id: teacherId,
      expires_at: renewalIso,
      subscription: {
        id: subscriptionId,
        renewal_at: renewalIso,
        status: 'active'
      },
      batch_name: accessCode.batch_name
    });
  } catch (error) {
    console.error('Redeem access code error:', error);
    res.status(500).json({ error: 'Failed to redeem access code' });
  }
});

export default router;
