import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// POST /api/services/:id/book - Book a 1-on-1 session or review with CLIQ / Zain Cash
router.post('/:id/book', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    let { 
      student_name, 
      student_email, 
      student_phone, 
      cliq_reference, 
      payment_method, 
      booking_notes 
    } = req.body;

    let studentId = req.user ? req.user.id : null;
    if (req.user) {
      student_email = student_email || req.user.email;
      student_name = student_name || req.user.name;
    }

    if (!student_email || !student_email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required to book a session' });
    }

    if (!student_name) {
      student_name = student_email.split('@')[0];
    }

    const service = await db.prepare(`
      SELECT s.*, u.name as teacher_name, u.email as teacher_email, u.avatar_url as teacher_avatar,
             tp.handle as teacher_handle, tp.cliq_alias, tp.bank_name, tp.wallet_phone, tp.currency
      FROM services s
      JOIN users u ON s.teacher_id = u.id
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE s.id = ? AND s.is_active = 1
    `).get(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found or is currently inactive' });
    }

    const pMethod = (payment_method || 'CLIQ').toUpperCase();
    const cliqRef = cliq_reference ? cliq_reference.trim() : '';

    // Insert booking in pending confirmation state
    const insertBooking = db.prepare(`
      INSERT INTO service_bookings 
      (service_id, teacher_id, student_id, student_name, student_email, student_phone, cliq_reference, payment_method, payment_status, booking_notes, price_cents, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', ?, ?, 'pending')
    `);

    const result = await insertBooking.run(
      serviceId,
      service.teacher_id,
      studentId,
      student_name.trim(),
      student_email.toLowerCase().trim(),
      student_phone ? student_phone.trim() : null,
      cliqRef,
      pMethod,
      booking_notes || '1-on-1 session request',
      service.price_cents
    );

    const priceJod = (service.price_cents / 100).toFixed(0);

    res.status(201).json({
      success: true,
      message: `Session booked! Transfer ${priceJod} JOD via CLIQ to alias "${service.cliq_alias || 'Teacher'}" or Zain Cash ${service.wallet_phone || ''}. The teacher will confirm once received.`,
      booking: {
        id: result.lastInsertRowid,
        service_id: service.id,
        service_title: service.title,
        service_type: service.service_type,
        teacher_name: service.teacher_name,
        teacher_handle: service.teacher_handle,
        teacher_avatar: service.teacher_avatar,
        price: (service.price_cents / 100).toFixed(2),
        price_jod: priceJod,
        price_cents: service.price_cents,
        duration_minutes: service.duration_minutes,
        student_name: student_name.trim(),
        student_email: student_email.toLowerCase().trim(),
        student_phone: student_phone ? student_phone.trim() : '',
        cliq_reference: cliqRef,
        payment_method: pMethod,
        payment_status: 'pending_confirmation',
        status: 'pending'
      },
      teacher_payment: {
        cliq_alias: service.cliq_alias || 'REEDMATH',
        bank_name: service.bank_name || 'Arab Bank (البنك العربي)',
        wallet_phone: service.wallet_phone || '0795551234',
        currency: 'JOD'
      }
    });
  } catch (error) {
    console.error('Book service error:', error);
    res.status(500).json({ error: 'Failed to book session' });
  }
});

// GET /api/services/my-bookings - Get student's booked 1-on-1 sessions
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookings = await db.prepare(`
      SELECT 
        sb.id, sb.price_cents, sb.status, sb.payment_status, sb.cliq_reference, sb.student_phone,
        sb.payment_method, sb.booking_notes, sb.created_at,
        s.title as service_title, s.duration_minutes, s.service_type,
        u.name as teacher_name, u.avatar_url as teacher_avatar, tp.handle as teacher_handle,
        tp.cliq_alias, tp.bank_name, tp.wallet_phone, tp.currency
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      JOIN users u ON sb.teacher_id = u.id
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE sb.student_id = ? OR LOWER(sb.student_email) = LOWER(?)
      ORDER BY sb.created_at DESC
    `).all(req.user.id, req.user.email);

    res.json(bookings.map(b => ({
      ...b,
      price: (b.price_cents / 100).toFixed(2),
      price_jod: (b.price_cents / 100).toFixed(0)
    })));
  } catch (error) {
    console.error('Fetch my bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

export default router;
