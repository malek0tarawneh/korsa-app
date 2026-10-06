import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// POST /api/services/:id/book - Book a micro-service (1-on-1 review, Q&A, mentorship)
router.post('/:id/book', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    let { student_name, student_email, booking_notes } = req.body;

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
      SELECT s.*, u.name as teacher_name, u.email as teacher_email, tp.handle as teacher_handle
      FROM services s
      JOIN users u ON s.teacher_id = u.id
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE s.id = ? AND s.is_active = 1
    `).get(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found or is currently inactive' });
    }

    // Insert booking
    const insertBooking = db.prepare(`
      INSERT INTO service_bookings (service_id, teacher_id, student_id, student_name, student_email, booking_notes, price_cents, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `);

    const result = await insertBooking.run(
      serviceId,
      service.teacher_id,
      studentId,
      student_name.trim(),
      student_email.toLowerCase().trim(),
      booking_notes || 'Quick review session request',
      service.price_cents
    );

    res.status(201).json({
      success: true,
      message: `Booking confirmed with ${service.teacher_name}! You will receive a direct invitation at ${student_email}.`,
      booking: {
        id: result.lastInsertRowid,
        service_id: service.id,
        service_title: service.title,
        service_type: service.service_type,
        teacher_name: service.teacher_name,
        teacher_handle: service.teacher_handle,
        price: (service.price_cents / 100).toFixed(2),
        price_cents: service.price_cents,
        duration_minutes: service.duration_minutes,
        student_email: student_email.toLowerCase().trim()
      }
    });
  } catch (error) {
    console.error('Book service error:', error);
    res.status(500).json({ error: 'Failed to book session' });
  }
});

// GET /api/services/my-bookings - Get student's booked micro-services
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookings = await db.prepare(`
      SELECT 
        sb.id, sb.price_cents, sb.status, sb.booking_notes, sb.created_at,
        s.title as service_title, s.duration_minutes, s.service_type,
        u.name as teacher_name, u.avatar_url as teacher_avatar, tp.handle as teacher_handle
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      JOIN users u ON sb.teacher_id = u.id
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE sb.student_id = ? OR LOWER(sb.student_email) = LOWER(?)
      ORDER BY sb.created_at DESC
    `).all(req.user.id, req.user.email);

    res.json(bookings.map(b => ({
      ...b,
      price: (b.price_cents / 100).toFixed(2)
    })));
  } catch (error) {
    console.error('Fetch my bookings error:', error);
    res.status(500).json({ error: 'Failed to load micro-service bookings' });
  }
});

export default router;
