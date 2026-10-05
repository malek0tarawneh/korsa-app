import express from 'express';
import { db } from '../db.js';
import { hashPassword, comparePassword, generateToken, requireAuth } from '../auth.js';

const router = express.Router();

// Register new user (Student or Teacher)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, headline, bio, subjects, educational_levels, monthly_price_cents } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or teacher' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const normalizedEmail = email.toLowerCase().trim();
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, role, name, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    const userResult = insertUser.run(normalizedEmail, passwordHash, role, name, avatarUrl);
    const userId = userResult.lastInsertRowid;

    if (role === 'student') {
      const insertStudent = db.prepare('INSERT INTO student_profiles (user_id, educational_level, bio) VALUES (?, ?, ?)');
      insertStudent.run(userId, educational_levels || 'High School', bio || '');
    } else if (role === 'teacher') {
      const insertTeacher = db.prepare(`
        INSERT INTO teacher_profiles 
        (user_id, headline, bio, subjects, educational_levels, monthly_price_cents, is_approved, rating, review_count, subscriber_count)
        VALUES (?, ?, ?, ?, ?, ?, 1, 5.0, 0, 0)
      `);
      insertTeacher.run(
        userId,
        headline || 'Educator',
        bio || 'Experienced teacher providing high quality education.',
        JSON.stringify(subjects || ['General']),
        JSON.stringify(educational_levels || ['Grade 10', 'Grade 11', 'Grade 12']),
        monthly_price_cents ? parseInt(monthly_price_cents) : 500
      );
    }

    const newUser = { id: userId, email: normalizedEmail, role, name, avatar_url: avatarUrl };
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

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
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
      avatar_url: user.avatar_url
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
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, role, name, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    let activeSubscriptions = [];

    if (user.role === 'teacher') {
      profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        profile.subjects = JSON.parse(profile.subjects || '[]');
        profile.educational_levels = JSON.parse(profile.educational_levels || '[]');
      }
    } else if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
      
      // Get all active teacher subscriptions for this student
      const subs = db.prepare(`
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
