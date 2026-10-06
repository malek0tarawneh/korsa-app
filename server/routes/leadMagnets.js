import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// POST /api/lead-magnets/:id/claim - Claim/unlock free guide & follow teacher
router.post('/:id/claim', authenticateToken, async (req, res) => {
  try {
    const leadMagnetId = parseInt(req.params.id);
    let { email, name } = req.body;

    let studentId = req.user ? req.user.id : null;
    if (req.user) {
      email = email || req.user.email;
      name = name || req.user.name;
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required to download this free resource' });
    }

    const leadMagnet = await db.prepare(`
      SELECT lm.*, u.name as teacher_name, u.avatar_url as teacher_avatar, tp.handle as teacher_handle
      FROM lead_magnets lm
      JOIN users u ON lm.teacher_id = u.id
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE lm.id = ?
    `).get(leadMagnetId);

    if (!leadMagnet) {
      return res.status(404).json({ error: 'Lead magnet not found' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const studentName = (name || normalizedEmail.split('@')[0]).trim();

    // Check if user account exists with this email if unauthenticated
    if (!studentId) {
      const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
      if (existingUser) {
        studentId = existingUser.id;
      }
    }

    // Insert claim record
    await db.prepare(`
      INSERT INTO lead_magnet_claims (lead_magnet_id, teacher_id, student_id, student_email, student_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(leadMagnetId, leadMagnet.teacher_id, studentId, normalizedEmail, studentName);

    // Increment downloads count
    await db.prepare(`
      UPDATE lead_magnets
      SET downloads_count = downloads_count + 1
      WHERE id = ?
    `).run(leadMagnetId);

    res.json({
      success: true,
      message: `🎉 Free resource unlocked! You are now subscribed to updates from ${leadMagnet.teacher_name}.`,
      file_url: leadMagnet.file_url,
      lead_magnet: {
        id: leadMagnet.id,
        title: leadMagnet.title,
        description: leadMagnet.description,
        file_url: leadMagnet.file_url,
        downloads_count: leadMagnet.downloads_count + 1,
        teacher_name: leadMagnet.teacher_name,
        teacher_handle: leadMagnet.teacher_handle
      }
    });
  } catch (error) {
    console.error('Claim lead magnet error:', error);
    res.status(500).json({ error: 'Failed to claim resource' });
  }
});

// GET /api/lead-magnets/my-claimed - Get resources claimed by currently logged-in student
router.get('/my-claimed', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const claims = await db.prepare(`
      SELECT 
        lmc.id as claim_id, lmc.claimed_at,
        lm.id as lead_magnet_id, lm.title, lm.description, lm.file_url,
        u.id as teacher_id, u.name as teacher_name, u.avatar_url as teacher_avatar,
        tp.handle as teacher_handle
      FROM lead_magnet_claims lmc
      JOIN lead_magnets lm ON lmc.lead_magnet_id = lm.id
      JOIN users u ON lm.teacher_id = u.id
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE lmc.student_id = ? OR LOWER(lmc.student_email) = LOWER(?)
      ORDER BY lmc.claimed_at DESC
    `).all(req.user.id, req.user.email);

    res.json(claims);
  } catch (error) {
    console.error('Fetch my claimed error:', error);
    res.status(500).json({ error: 'Failed to fetch claimed resources' });
  }
});

export default router;
