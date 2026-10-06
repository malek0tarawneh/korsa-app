import express from 'express';
import { db } from '../db.js';
import { hashPassword, comparePassword, generateToken, requireAuth } from '../auth.js';

const router = express.Router();

// Helper to generate consistent student referral code
function getStudentReferralCode(user) {
  if (!user) return '';
  const cleanName = (user.name || 'STU').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  return `KORSA-${cleanName}${user.id}`;
}

// Register new user (Student or Teacher)
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      headline, 
      bio, 
      subjects, 
      educational_levels, 
      monthly_price_cents,
      referred_by,
      handle,
      tier
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or teacher' });
    }

    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const normalizedEmail = email.toLowerCase().trim();
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    const cleanReferredBy = referred_by ? referred_by.trim().toUpperCase() : null;
    const initialCredits = cleanReferredBy ? 1 : 0;

    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, role, name, avatar_url, referred_by, referral_credits)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const userResult = await insertUser.run(normalizedEmail, passwordHash, role, name, avatarUrl, cleanReferredBy, initialCredits);
    const userId = userResult.lastInsertRowid;

    // Reward the peer referrer if it was a student referral
    if (cleanReferredBy) {
      try {
        const allUsers = await db.prepare('SELECT id, name FROM users WHERE id != ?').all(userId);
        const peerReferrer = allUsers.find(u => getStudentReferralCode(u) === cleanReferredBy);
        if (peerReferrer) {
          await db.prepare('UPDATE users SET referral_credits = referral_credits + 1 WHERE id = ?').run(peerReferrer.id);
        }
      } catch (err) {
        console.warn('Referral reward notice:', err.message);
      }
    }

    if (role === 'student') {
      const insertStudent = db.prepare('INSERT INTO student_profiles (user_id, educational_level, bio) VALUES (?, ?, ?)');
      await insertStudent.run(userId, educational_levels || 'High School', bio || '');
    } else if (role === 'teacher') {
      const baseHandle = handle ? handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || `teacher${userId}`;
      const uniqueHandle = `${baseHandle}${Math.floor(100 + Math.random() * 900)}`;
      const teacherReferralCode = `${uniqueHandle.toUpperCase()}2026`;

      const insertTeacher = db.prepare(`
        INSERT INTO teacher_profiles 
        (user_id, handle, tier, headline, bio, custom_bio, external_links, referral_code, commission_rate, subjects, educational_levels, monthly_price_cents, is_approved, rating, review_count, subscriber_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.10, ?, ?, ?, 1, 5.0, 0, 0)
      `);
      await insertTeacher.run(
        userId,
        uniqueHandle,
        tier || 'community_tutor',
        headline || 'Educator & Mentor',
        bio || 'Experienced teacher providing high quality education.',
        'Welcome to my learning hub! Access my free study roadmaps or book 1-on-1 tutoring sessions.',
        JSON.stringify({}),
        teacherReferralCode,
        JSON.stringify(subjects || ['General']),
        JSON.stringify(educational_levels || ['Grade 10', 'Grade 11', 'Grade 12']),
        monthly_price_cents ? parseInt(monthly_price_cents) : 500
      );
    }

    const newUser = { 
      id: userId, 
      email: normalizedEmail, 
      role, 
      name, 
      avatar_url: avatarUrl,
      referred_by: cleanReferredBy,
      referral_credits: initialCredits,
      referral_code: getStudentReferralCode({ id: userId, name })
    };
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar_url: user.avatar_url,
      referred_by: user.referred_by || null,
      referral_credits: Number(user.referral_credits || 0),
      referral_code: getStudentReferralCode(user)
    };

    const token = generateToken(safeUser);

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile and active subscriptions
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.prepare(`
      SELECT id, email, role, name, avatar_url, referred_by, referral_credits, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.referral_credits = Number(user.referral_credits || 0);
    user.referral_code = getStudentReferralCode(user);

    let profile = null;
    let activeSubscriptions = [];

    if (user.role === 'teacher') {
      profile = await db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        profile.subjects = JSON.parse(profile.subjects || '[]');
        profile.educational_levels = JSON.parse(profile.educational_levels || '[]');
        try {
          profile.external_links = JSON.parse(profile.external_links || '{}');
        } catch {
          profile.external_links = {};
        }
        user.referral_code = profile.referral_code || user.referral_code;
        user.handle = profile.handle;
      }
    } else if (user.role === 'student') {
      profile = await db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
      
      const subs = await db.prepare(`
        SELECT teacher_id FROM subscriptions 
        WHERE student_id = ? AND status = 'active'
      `).all(user.id);
      activeSubscriptions = subs.map(s => s.teacher_id);
    }

    res.json({
      user,
      profile,
      activeSubscriptions
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
