import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Helper to generate consistent student referral code
export function getStudentReferralCode(user) {
  if (!user) return '';
  const cleanName = (user.name || 'STU').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  return `KORSA-${cleanName}${user.id}`;
}

// POST /api/referrals/redeem - Register referral code & reward student & creator
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    let { referral_code, email } = req.body;
    let userId = req.user ? req.user.id : null;

    if (req.user && !email) {
      email = req.user.email;
    }

    if (!referral_code || !referral_code.trim()) {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    const code = referral_code.trim().toUpperCase();

    // Find student user if not authenticated
    if (!userId && email) {
      const user = await db.prepare('SELECT id, referred_by, referral_credits FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (user) {
        userId = user.id;
      }
    }

    // 1. Check if referral code belongs to a Creator
    const teacherProfile = await db.prepare(`
      SELECT tp.*, u.name as teacher_name, u.avatar_url
      FROM teacher_profiles tp
      JOIN users u ON tp.user_id = u.id
      WHERE UPPER(tp.referral_code) = ? OR UPPER(tp.handle) = ?
    `).get(code, code);

    if (teacherProfile) {
      if (userId) {
        // Check if user is trying to refer themselves
        if (userId === teacherProfile.user_id) {
          return res.status(400).json({ error: 'You cannot use your own referral code' });
        }

        // Update student record
        await db.prepare(`
          UPDATE users 
          SET referred_by = ?,
              referral_credits = referral_credits + 1
          WHERE id = ? AND (referred_by IS NULL OR referred_by = '')
        `).run(teacherProfile.referral_code, userId);

        const updatedStudent = await db.prepare('SELECT referral_credits FROM users WHERE id = ?').get(userId);

        return res.json({
          success: true,
          message: `🎉 Creator referral applied! You are connected to ${teacherProfile.teacher_name} and received 1 bonus credit.`,
          referrer_type: 'creator',
          creator: {
            name: teacherProfile.teacher_name,
            handle: teacherProfile.handle,
            avatar_url: teacherProfile.avatar_url
          },
          referral_credits: updatedStudent ? updatedStudent.referral_credits : 1
        });
      }

      return res.json({
        success: true,
        message: `Valid creator code for ${teacherProfile.teacher_name}! Complete your sign up to claim credits.`,
        referrer_type: 'creator',
        creator: {
          name: teacherProfile.teacher_name,
          handle: teacherProfile.handle
        }
      });
    }

    // 2. Check if referral code belongs to a Student/Peer
    // Match KORSA-XYZ123 pattern or search users
    const allUsers = await db.prepare('SELECT id, name, referral_credits FROM users').all();
    const referrerUser = allUsers.find(u => getStudentReferralCode(u) === code);

    if (referrerUser) {
      if (userId && userId === referrerUser.id) {
        return res.status(400).json({ error: 'You cannot use your own referral code' });
      }

      if (userId) {
        // Award student joiner
        await db.prepare(`
          UPDATE users 
          SET referred_by = ?,
              referral_credits = referral_credits + 1
          WHERE id = ? AND (referred_by IS NULL OR referred_by = '')
        `).run(code, userId);

        // Award referrer
        await db.prepare(`
          UPDATE users 
          SET referral_credits = referral_credits + 1
          WHERE id = ?
        `).run(referrerUser.id);

        const updatedStudent = await db.prepare('SELECT referral_credits FROM users WHERE id = ?').get(userId);

        return res.json({
          success: true,
          message: `🎉 Referral code from ${referrerUser.name} redeemed! Both you and ${referrerUser.name} earned 1 reward credit.`,
          referrer_type: 'student',
          referrer_name: referrerUser.name,
          referral_credits: updatedStudent ? updatedStudent.referral_credits : 1
        });
      }

      return res.json({
        success: true,
        message: `Valid referral code from ${referrerUser.name}! Sign up to claim your reward credit.`,
        referrer_type: 'student',
        referrer_name: referrerUser.name
      });
    }

    return res.status(404).json({ error: 'Invalid or unrecognized referral code' });
  } catch (error) {
    console.error('Redeem referral error:', error);
    res.status(500).json({ error: 'Failed to redeem referral code' });
  }
});

// GET /api/referrals/stats - Get referral stats for the authenticated student or creator
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await db.prepare('SELECT id, name, email, role, referred_by, referral_credits FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let code = '';
    let commissionRate = 0.10;
    let selfReferredCommission = 0.03;

    if (user.role === 'teacher') {
      const tp = await db.prepare('SELECT referral_code, handle, commission_rate FROM teacher_profiles WHERE user_id = ?').get(user.id);
      code = tp ? tp.referral_code : `TEACHER-${user.id}`;
      commissionRate = tp ? (tp.commission_rate || 0.10) : 0.10;
    } else {
      code = getStudentReferralCode(user);
    }

    // Count how many people have been referred by this user's code
    const referredCountRow = await db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE referred_by = ?
    `).get(code);

    const invitedCount = Number(referredCountRow?.count || 0);
    const credits = Number(user.referral_credits || 0);
    const milestoneTarget = 3;
    const isUnlocked = credits >= milestoneTarget || invitedCount >= milestoneTarget;

    res.json({
      referral_code: code,
      referral_credits: credits,
      referred_by: user.referred_by || null,
      invited_count: invitedCount,
      milestone_target: milestoneTarget,
      is_unlocked: isUnlocked,
      commission_rate: commissionRate,
      self_referred_commission: selfReferredCommission,
      progress_percent: Math.min(100, Math.round((Math.max(credits, invitedCount) / milestoneTarget) * 100))
    });
  } catch (error) {
    console.error('Fetch referral stats error:', error);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

export default router;
