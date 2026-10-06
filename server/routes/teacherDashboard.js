import express from 'express';
import { db } from '../db.js';
import { requireRole } from '../auth.js';

const router = express.Router();

// Helper: platform commission percentage
async function getPlatformCommissionRate(profile) {
  if (profile && profile.commission_rate !== undefined && profile.commission_rate !== null) {
    return Number(profile.commission_rate);
  }
  const row = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_commission_percentage');
  const percent = row ? parseFloat(row.value) : 10;
  return isNaN(percent) ? 0.10 : percent / 100;
}

// Helper: generate RFC-4180 CSV for teacher audience
export async function generateAudienceCsvData(teacherId) {
  // 1. Subscribers
  const subscribers = await db.prepare(`
    SELECT u.name, u.email, s.started_at as acquired_at, s.status, 'Subscriber' as relationship,
           (s.price_cents / 100.0) as estimated_val
    FROM subscriptions s
    JOIN users u ON s.student_id = u.id
    WHERE s.teacher_id = ?
  `).all(teacherId);

  // 2. Lead magnet downloaders
  const leadClaims = await db.prepare(`
    SELECT student_name as name, student_email as email, claimed_at as acquired_at, 'Active Lead' as status, 'Lead Magnet' as relationship, 0 as estimated_val
    FROM lead_magnet_claims
    WHERE teacher_id = ?
  `).all(teacherId);

  // 3. Service clients
  const serviceClients = await db.prepare(`
    SELECT student_name as name, student_email as email, created_at as acquired_at, status, 'Micro-Service' as relationship,
           (price_cents / 100.0) as estimated_val
    FROM service_bookings
    WHERE teacher_id = ?
  `).all(teacherId);

  // Merge and deduplicate by email
  const audienceMap = new Map();

  for (const item of [...subscribers, ...serviceClients, ...leadClaims]) {
    const key = (item.email || '').toLowerCase().trim();
    if (!key) continue;
    if (!audienceMap.has(key)) {
      audienceMap.set(key, {
        name: item.name || 'Anonymous Student',
        email: key,
        relationships: [item.relationship],
        status: item.status || 'Active',
        acquired_at: item.acquired_at || new Date().toISOString(),
        total_spend: Number(item.estimated_val || 0)
      });
    } else {
      const existing = audienceMap.get(key);
      if (!existing.relationships.includes(item.relationship)) {
        existing.relationships.push(item.relationship);
      }
      existing.total_spend += Number(item.estimated_val || 0);
    }
  }

  const rows = [
    ['Full Name', 'Email Address', 'Audience Type / Relationship', 'Lifecycle Status', 'Acquired Date', 'Estimated Value ($)']
  ];

  for (const a of audienceMap.values()) {
    rows.push([
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.relationships.join(' + ')}"`,
      `"${a.status}"`,
      `"${a.acquired_at ? new Date(a.acquired_at).toLocaleDateString() : ''}"`,
      `"${a.total_spend.toFixed(2)}"`
    ]);
  }

  return rows.map(r => r.join(',')).join('\r\n');
}

// Teacher Overview & Financial Simulation
router.get('/overview', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Teacher profile info
    const profile = await db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(teacherId);
    if (!profile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    // Active subscribers count
    const subCountRow = await db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE teacher_id = ? AND status = 'active'`).get(teacherId);
    const activeSubscribers = Number(subCountRow?.count || 0);

    // Monthly subscription price
    const monthlyPriceCents = profile.monthly_price_cents;
    const grossMonthlyRevenueCents = activeSubscribers * monthlyPriceCents;
    const standardCommissionRate = await getPlatformCommissionRate(profile);
    const selfReferredCommissionRate = 0.03; // 3% for self-referred students
    const platformCommissionCents = Math.round(grossMonthlyRevenueCents * standardCommissionRate);
    const estimatedTeacherEarningsCents = grossMonthlyRevenueCents - platformCommissionCents;

    // List of active subscribers
    const subscribers = await db.prepare(`
      SELECT 
        s.id as subscription_id, s.started_at, s.renewal_at, s.status,
        u.id as student_id, u.name as student_name, u.avatar_url, u.email
      FROM subscriptions s
      JOIN users u ON s.student_id = u.id
      WHERE s.teacher_id = ? AND s.status = 'active'
      ORDER BY s.started_at DESC
      LIMIT 20
    `).all(teacherId);

    // Simulated payments ledger for this teacher
    const payments = await db.prepare(`
      SELECT 
        p.id, p.amount_cents, p.platform_commission_cents, p.teacher_earnings_cents, p.created_at, p.status, p.simulated,
        u.name as student_name, u.email as student_email
      FROM payments p
      JOIN users u ON p.student_id = u.id
      WHERE p.teacher_id = ?
      ORDER BY p.created_at DESC
      LIMIT 25
    `).all(teacherId);

    // Teacher courses and engagement
    const courses = await db.prepare(`
      SELECT 
        c.*, 
        s.name as subject_name,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(DISTINCT student_id) FROM progress WHERE course_id = c.id) as active_learners
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(teacherId);

    // Lead Magnets
    const leadMagnets = await db.prepare(`
      SELECT * FROM lead_magnets WHERE teacher_id = ? ORDER BY downloads_count DESC, id DESC
    `).all(teacherId);

    // Micro-Services
    const services = await db.prepare(`
      SELECT * FROM services WHERE teacher_id = ? ORDER BY price_cents ASC
    `).all(teacherId);

    // Service Bookings
    const serviceBookings = await db.prepare(`
      SELECT sb.*, s.title as service_title, s.duration_minutes, s.service_type
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      WHERE sb.teacher_id = ?
      ORDER BY sb.created_at DESC
      LIMIT 20
    `).all(teacherId);

    // Audience counts
    const leadCountRow = await db.prepare('SELECT COUNT(*) as count FROM lead_magnet_claims WHERE teacher_id = ?').get(teacherId);
    const totalLeads = Number(leadCountRow?.count || 0);

    let parsedExternalLinks = {};
    try {
      parsedExternalLinks = JSON.parse(profile.external_links || '{}');
    } catch {
      parsedExternalLinks = {};
    }

    res.json({
      profile: {
        ...profile,
        subjects: JSON.parse(profile.subjects || '[]'),
        educational_levels: JSON.parse(profile.educational_levels || '[]'),
        external_links: parsedExternalLinks,
        commission_rate: 0.00,
        cliq_alias: profile.cliq_alias || 'REEDMATH',
        bank_name: profile.bank_name || 'Arab Bank (البنك العربي)',
        wallet_phone: profile.wallet_phone || '0795551234',
        currency: profile.currency || 'JOD'
      },
      stats: {
        active_subscribers: activeSubscribers,
        subscription_price: (monthlyPriceCents / 100).toFixed(2),
        subscription_price_jod: (monthlyPriceCents / 100).toFixed(0),
        gross_monthly_revenue: (grossMonthlyRevenueCents / 100).toFixed(2),
        gross_monthly_revenue_jod: (grossMonthlyRevenueCents / 100).toFixed(0),
        platform_commission_percent: 0,
        platform_commission_amount: '0.00',
        estimated_teacher_earnings: (grossMonthlyRevenueCents / 100).toFixed(2),
        estimated_teacher_earnings_jod: (grossMonthlyRevenueCents / 100).toFixed(0),
        self_referred_commission_percent: 0,
        self_referred_take_rate: 100,
        total_courses: courses.length,
        total_lead_magnets: leadMagnets.length,
        total_downloads: leadMagnets.reduce((acc, lm) => acc + Number(lm.downloads_count || 0), 0),
        total_services: services.length,
        total_bookings: serviceBookings.length,
        total_leads: totalLeads
      },
      subscribers,
      payments: payments.map(p => ({
        ...p,
        amount: (p.amount_cents / 100).toFixed(2),
        amount_jod: (p.amount_cents / 100).toFixed(0),
        platform_commission: '0.00',
        teacher_earnings: (p.amount_cents / 100).toFixed(2),
        teacher_earnings_jod: (p.amount_cents / 100).toFixed(0)
      })),
      courses: courses.map(c => ({
        ...c,
        total_lessons: Number(c.total_lessons || 0),
        active_learners: Number(c.active_learners || 0)
      })),
      lead_magnets: leadMagnets,
      services: services.map(s => ({
        ...s,
        price_dollars: (s.price_cents / 100).toFixed(2),
        price_jod: (s.price_cents / 100).toFixed(0)
      })),
      service_bookings: serviceBookings.map(sb => ({
        ...sb,
        price_dollars: (sb.price_cents / 100).toFixed(2),
        price_jod: (sb.price_cents / 100).toFixed(0),
        payment_status: sb.payment_status || 'pending_confirmation',
        cliq_reference: sb.cliq_reference || '',
        student_phone: sb.student_phone || '',
        payment_method: sb.payment_method || 'CLIQ'
      }))
    });
  } catch (error) {
    console.error('Teacher overview error:', error);
    res.status(500).json({ error: 'Failed to load teacher dashboard' });
  }
});

// Update Teacher Profile & Settings
router.post('/settings', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { 
      headline, 
      bio, 
      custom_bio, 
      monthly_price_cents, 
      handle, 
      tier, 
      referral_code, 
      external_links,
      cliq_alias,
      bank_name,
      wallet_phone,
      currency
    } = req.body;

    if (monthly_price_cents && parseInt(monthly_price_cents) < 100) {
      return res.status(400).json({ error: 'Price must be at least 1 JOD' });
    }

    // Handle uniqueness validation if handle provided
    let cleanHandle = null;
    if (handle) {
      cleanHandle = handle.replace(/^@/, '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanHandle.length < 2) {
        return res.status(400).json({ error: 'Handle must be at least 2 characters long' });
      }
      const existing = await db.prepare('SELECT user_id FROM teacher_profiles WHERE LOWER(handle) = ? AND user_id != ?').get(cleanHandle, teacherId);
      if (existing) {
        return res.status(400).json({ error: `Handle @${cleanHandle} is already taken by another creator` });
      }
    }

    // Referral code uniqueness validation if provided
    let cleanRefCode = null;
    if (referral_code) {
      cleanRefCode = referral_code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const existingRef = await db.prepare('SELECT user_id FROM teacher_profiles WHERE UPPER(referral_code) = ? AND user_id != ?').get(cleanRefCode, teacherId);
      if (existingRef) {
        return res.status(400).json({ error: `Referral code ${cleanRefCode} is already in use` });
      }
    }

    const linksString = external_links ? (typeof external_links === 'string' ? external_links : JSON.stringify(external_links)) : null;

    await db.prepare(`
      UPDATE teacher_profiles 
      SET headline = COALESCE(?, headline),
          bio = COALESCE(?, bio),
          custom_bio = COALESCE(?, custom_bio),
          monthly_price_cents = COALESCE(?, monthly_price_cents),
          handle = COALESCE(?, handle),
          tier = COALESCE(?, tier),
          referral_code = COALESCE(?, referral_code),
          external_links = COALESCE(?, external_links),
          cliq_alias = COALESCE(?, cliq_alias),
          bank_name = COALESCE(?, bank_name),
          wallet_phone = COALESCE(?, wallet_phone),
          currency = COALESCE(?, currency, 'JOD')
      WHERE user_id = ?
    `).run(
      headline !== undefined ? headline : null,
      bio !== undefined ? bio : null,
      custom_bio !== undefined ? custom_bio : null,
      monthly_price_cents ? parseInt(monthly_price_cents) : null,
      cleanHandle,
      tier || null,
      cleanRefCode,
      linksString,
      cliq_alias !== undefined ? cliq_alias.trim() : null,
      bank_name !== undefined ? bank_name.trim() : null,
      wallet_phone !== undefined ? wallet_phone.trim() : null,
      currency || 'JOD',
      teacherId
    );

    res.json({ success: true, message: 'Teacher profile, CLIQ payment details & settings saved successfully' });
  } catch (error) {
    console.error('Update teacher settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Confirm student payment via CLIQ / Zain Cash
router.put('/service-bookings/:id/confirm-payment', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const bookingId = parseInt(req.params.id);

    const booking = await db.prepare('SELECT id FROM service_bookings WHERE id = ? AND teacher_id = ?').get(bookingId, teacherId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }

    await db.prepare(`
      UPDATE service_bookings
      SET status = 'confirmed', payment_status = 'confirmed'
      WHERE id = ? AND teacher_id = ?
    `).run(bookingId, teacherId);

    res.json({ success: true, message: 'Payment confirmed! Session is now confirmed.' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Update booking status or notes
router.put('/service-bookings/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const bookingId = parseInt(req.params.id);
    const { status, payment_status } = req.body;

    const booking = await db.prepare('SELECT id FROM service_bookings WHERE id = ? AND teacher_id = ?').get(bookingId, teacherId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }

    await db.prepare(`
      UPDATE service_bookings
      SET status = COALESCE(?, status),
          payment_status = COALESCE(?, payment_status)
      WHERE id = ? AND teacher_id = ?
    `).run(status || null, payment_status || null, bookingId, teacherId);

    res.json({ success: true, message: 'Booking updated' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// --- LEAD MAGNET ROUTES ---

// GET /api/teacher-dashboard/lead-magnets
router.get('/lead-magnets', requireRole('teacher'), async (req, res) => {
  try {
    const list = await db.prepare(`
      SELECT * FROM lead_magnets WHERE teacher_id = ? ORDER BY downloads_count DESC, id DESC
    `).all(req.user.id);
    res.json(list);
  } catch (error) {
    console.error('Fetch lead magnets error:', error);
    res.status(500).json({ error: 'Failed to fetch lead magnets' });
  }
});

// POST /api/teacher-dashboard/lead-magnets
router.post('/lead-magnets', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title, description, file_url } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Lead magnet title is required' });
    }

    const url = (file_url || '').trim() || 'https://example.com/assets/free-guide.pdf';

    const result = await db.prepare(`
      INSERT INTO lead_magnets (teacher_id, title, description, file_url, downloads_count)
      VALUES (?, ?, ?, ?, 0)
    `).run(teacherId, title.trim(), description || '', url);

    res.status(201).json({
      success: true,
      message: 'Lead magnet created successfully',
      lead_magnet: {
        id: result.lastInsertRowid,
        teacher_id: teacherId,
        title: title.trim(),
        description: description || '',
        file_url: url,
        downloads_count: 0
      }
    });
  } catch (error) {
    console.error('Create lead magnet error:', error);
    res.status(500).json({ error: 'Failed to create lead magnet' });
  }
});

// PUT /api/teacher-dashboard/lead-magnets/:id
router.put('/lead-magnets/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const id = parseInt(req.params.id);
    const { title, description, file_url } = req.body;

    const existing = await db.prepare('SELECT id FROM lead_magnets WHERE id = ? AND teacher_id = ?').get(id, teacherId);
    if (!existing) {
      return res.status(404).json({ error: 'Lead magnet not found or access denied' });
    }

    await db.prepare(`
      UPDATE lead_magnets
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          file_url = COALESCE(?, file_url)
      WHERE id = ? AND teacher_id = ?
    `).run(title ? title.trim() : null, description !== undefined ? description : null, file_url ? file_url.trim() : null, id, teacherId);

    res.json({ success: true, message: 'Lead magnet updated successfully' });
  } catch (error) {
    console.error('Update lead magnet error:', error);
    res.status(500).json({ error: 'Failed to update lead magnet' });
  }
});

// DELETE /api/teacher-dashboard/lead-magnets/:id
router.delete('/lead-magnets/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const id = parseInt(req.params.id);

    const existing = await db.prepare('SELECT id FROM lead_magnets WHERE id = ? AND teacher_id = ?').get(id, teacherId);
    if (!existing) {
      return res.status(404).json({ error: 'Lead magnet not found or access denied' });
    }

    await db.prepare('DELETE FROM lead_magnets WHERE id = ? AND teacher_id = ?').run(id, teacherId);
    res.json({ success: true, message: 'Lead magnet deleted successfully' });
  } catch (error) {
    console.error('Delete lead magnet error:', error);
    res.status(500).json({ error: 'Failed to delete lead magnet' });
  }
});

// --- MICRO-SERVICES ROUTES ---

// GET /api/teacher-dashboard/services
router.get('/services', requireRole('teacher'), async (req, res) => {
  try {
    const list = await db.prepare(`
      SELECT * FROM services WHERE teacher_id = ? ORDER BY id ASC
    `).all(req.user.id);
    res.json(list.map(s => ({
      ...s,
      price_dollars: (s.price_cents / 100).toFixed(2)
    })));
  } catch (error) {
    console.error('Fetch services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/teacher-dashboard/services
router.post('/services', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title, price_cents, duration_minutes, service_type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Service title is required' });
    }

    const price = price_cents ? parseInt(price_cents) : 1500;
    const duration = duration_minutes ? parseInt(duration_minutes) : 30;
    const type = ['quick_review', 'qa_session', 'mentorship'].includes(service_type) ? service_type : 'quick_review';

    const result = await db.prepare(`
      INSERT INTO services (teacher_id, title, price_cents, duration_minutes, service_type, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(teacherId, title.trim(), price, duration, type);

    res.status(201).json({
      success: true,
      message: 'Micro-service created successfully',
      service: {
        id: result.lastInsertRowid,
        teacher_id: teacherId,
        title: title.trim(),
        price_cents: price,
        price_dollars: (price / 100).toFixed(2),
        duration_minutes: duration,
        service_type: type,
        is_active: 1
      }
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/teacher-dashboard/services/:id
router.put('/services/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const id = parseInt(req.params.id);
    const { title, price_cents, duration_minutes, service_type, is_active } = req.body;

    const existing = await db.prepare('SELECT id FROM services WHERE id = ? AND teacher_id = ?').get(id, teacherId);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found or access denied' });
    }

    await db.prepare(`
      UPDATE services
      SET title = COALESCE(?, title),
          price_cents = COALESCE(?, price_cents),
          duration_minutes = COALESCE(?, duration_minutes),
          service_type = COALESCE(?, service_type),
          is_active = COALESCE(?, is_active)
      WHERE id = ? AND teacher_id = ?
    `).run(
      title ? title.trim() : null,
      price_cents !== undefined ? parseInt(price_cents) : null,
      duration_minutes !== undefined ? parseInt(duration_minutes) : null,
      service_type || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id,
      teacherId
    );

    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/teacher-dashboard/services/:id
router.delete('/services/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const id = parseInt(req.params.id);

    const existing = await db.prepare('SELECT id FROM services WHERE id = ? AND teacher_id = ?').get(id, teacherId);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found or access denied' });
    }

    await db.prepare('DELETE FROM services WHERE id = ? AND teacher_id = ?').run(id, teacherId);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// --- AUDIENCE & CSV EXPORT ROUTES ---

// GET /api/teacher-dashboard/audience
router.get('/audience', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;

    // 1. Subscribers
    const subscribers = await db.prepare(`
      SELECT u.id as student_id, u.name, u.email, u.avatar_url, s.started_at, s.status, 'Subscriber' as audience_type,
             (s.price_cents / 100.0) as estimated_val
      FROM subscriptions s
      JOIN users u ON s.student_id = u.id
      WHERE s.teacher_id = ?
      ORDER BY s.started_at DESC
    `).all(teacherId);

    // 2. Leads (claimed lead magnets)
    const leads = await db.prepare(`
      SELECT lmc.id, lmc.student_name as name, lmc.student_email as email, lmc.claimed_at as started_at, 'Active Lead' as status, 'Lead Magnet' as audience_type,
             0 as estimated_val, lm.title as resource_title
      FROM lead_magnet_claims lmc
      JOIN lead_magnets lm ON lmc.lead_magnet_id = lm.id
      WHERE lmc.teacher_id = ?
      ORDER BY lmc.claimed_at DESC
    `).all(teacherId);

    // 3. Service Clients
    const clients = await db.prepare(`
      SELECT sb.id, sb.student_name as name, sb.student_email as email, sb.created_at as started_at, sb.status, 'Micro-Service' as audience_type,
             (sb.price_cents / 100.0) as estimated_val, s.title as service_title
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      WHERE sb.teacher_id = ?
      ORDER BY sb.created_at DESC
    `).all(teacherId);

    res.json({
      subscribers,
      leads,
      clients,
      totals: {
        total_subscribers: subscribers.length,
        total_leads: leads.length,
        total_clients: clients.length,
        total_unique: new Set([...subscribers.map(s => s.email), ...leads.map(l => l.email), ...clients.map(c => c.email)]).size
      }
    });
  } catch (error) {
    console.error('Fetch audience error:', error);
    res.status(500).json({ error: 'Failed to load audience' });
  }
});

// GET /api/teacher-dashboard/audience/export-csv
router.get('/audience/export-csv', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const csvContent = await generateAudienceCsvData(teacherId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="korsa_creator_audience_${teacherId}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Audience export CSV error:', error);
    res.status(500).json({ error: 'Failed to export audience CSV' });
  }
});

// --- COURSE, SECTION, LESSON MANAGEMENT (EXISTING ROUTES PRESERVED) ---

// Get full course with sections and lessons for editing
router.get('/courses/:id/full', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);

    const course = await db.prepare(`
      SELECT c.*, s.name as subject_name 
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = ? AND c.teacher_id = ?
    `).get(courseId, teacherId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const sections = await db.prepare('SELECT * FROM sections WHERE course_id = ? ORDER BY order_index ASC').all(courseId);

    for (const section of sections) {
      section.lessons = await db.prepare('SELECT * FROM lessons WHERE section_id = ? ORDER BY order_index ASC').all(section.id);
    }

    res.json({
      course,
      sections
    });
  } catch (error) {
    console.error('Get full course error:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// Create new course
router.post('/courses', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title, description, subject_name, educational_level, thumbnail_url } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    let subject = await db.prepare('SELECT id FROM subjects WHERE name = ?').get(subject_name || 'Mathematics');
    if (!subject) {
      subject = await db.prepare('SELECT id FROM subjects LIMIT 1').get();
    }

    const insertCourse = db.prepare(`
      INSERT INTO courses (teacher_id, subject_id, title, description, educational_level, thumbnail_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = await insertCourse.run(
      teacherId,
      subject.id,
      title,
      description || '',
      educational_level || 'Grade 12',
      thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
    );

    const courseId = result.lastInsertRowid;
    await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, 1)').run(courseId, 'Section 1: Introduction & Fundamentals');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course_id: courseId
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/courses/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);
    const { title, description, educational_level, subject_name, thumbnail_url, is_published } = req.body;

    const course = await db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(courseId, teacherId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    let subjectId = null;
    if (subject_name) {
      const subj = await db.prepare('SELECT id FROM subjects WHERE name = ?').get(subject_name);
      if (subj) subjectId = subj.id;
    }

    await db.prepare(`
      UPDATE courses
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          educational_level = COALESCE(?, educational_level),
          subject_id = COALESCE(?, subject_id),
          thumbnail_url = COALESCE(?, thumbnail_url),
          is_published = COALESCE(?, is_published)
      WHERE id = ? AND teacher_id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      educational_level || null,
      subjectId,
      thumbnail_url || null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      courseId,
      teacherId
    );

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/courses/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);

    const course = await db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(courseId, teacherId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    await db.prepare('DELETE FROM courses WHERE id = ? AND teacher_id = ?').run(courseId, teacherId);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Add section
router.post('/courses/:id/sections', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Section title is required' });
    }

    const course = await db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(courseId, teacherId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const maxOrder = await db.prepare('SELECT MAX(order_index) as max_order FROM sections WHERE course_id = ?').get(courseId);
    const nextOrder = (Number(maxOrder?.max_order || 0)) + 1;

    const result = await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)').run(courseId, title, nextOrder);

    res.status(201).json({
      success: true,
      message: 'Section added successfully',
      section_id: result.lastInsertRowid,
      title,
      order_index: nextOrder
    });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
});

// Update section
router.put('/sections/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const sectionId = parseInt(req.params.id);
    const { title, order_index } = req.body;

    const section = await db.prepare(`
      SELECT s.id 
      FROM sections s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = ? AND c.teacher_id = ?
    `).get(sectionId, teacherId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    await db.prepare(`
      UPDATE sections
      SET title = COALESCE(?, title),
          order_index = COALESCE(?, order_index)
      WHERE id = ?
    `).run(title || null, order_index !== undefined ? parseInt(order_index) : null, sectionId);

    res.json({ success: true, message: 'Section updated successfully' });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete section
router.delete('/sections/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const sectionId = parseInt(req.params.id);

    const section = await db.prepare(`
      SELECT s.id 
      FROM sections s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = ? AND c.teacher_id = ?
    `).get(sectionId, teacherId);

    if (!section) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }

    await db.prepare('DELETE FROM sections WHERE id = ?').run(sectionId);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// Add lesson to course
router.post('/lessons', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { course_id, section_id, title, description, video_url, duration_minutes, access_level, is_free_preview } = req.body;

    if (!course_id || !title || !access_level) {
      return res.status(400).json({ error: 'course_id, title, and access_level are required' });
    }

    const course = await db.prepare('SELECT id FROM courses WHERE id = ? AND teacher_id = ?').get(course_id, teacherId);
    if (!course) {
      return res.status(403).json({ error: 'You do not own this course' });
    }

    let targetSectionId = section_id;
    if (!targetSectionId) {
      const section = await db.prepare('SELECT id FROM sections WHERE course_id = ? ORDER BY order_index ASC LIMIT 1').get(course_id);
      if (section) {
        targetSectionId = section.id;
      } else {
        const defaultSec = await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, 1)').run(course_id, 'General Section');
        targetSectionId = defaultSec.lastInsertRowid;
      }
    }

    const maxOrder = await db.prepare('SELECT MAX(order_index) as max_order FROM lessons WHERE section_id = ?').get(targetSectionId);
    const nextOrder = (Number(maxOrder?.max_order || 0)) + 1;
    const isFree = access_level === 'FREE' || Boolean(is_free_preview) ? 1 : 0;

    const insertLesson = db.prepare(`
      INSERT INTO lessons (section_id, course_id, teacher_id, title, description, video_url, duration_minutes, access_level, is_free_preview, order_index, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = await insertLesson.run(
      targetSectionId,
      course_id,
      teacherId,
      title,
      description || '',
      video_url || '',
      duration_minutes ? parseInt(duration_minutes) : 15,
      access_level,
      isFree,
      nextOrder
    );

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson
router.put('/lessons/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const lessonId = parseInt(req.params.id);
    const { title, description, video_url, duration_minutes, access_level, is_free_preview, order_index, is_published } = req.body;

    const lesson = await db.prepare('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?').get(lessonId, teacherId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or access denied' });
    }

    const freePreviewFlag = is_free_preview !== undefined ? (is_free_preview ? 1 : 0) : (access_level === 'FREE' ? 1 : null);

    await db.prepare(`
      UPDATE lessons
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          video_url = COALESCE(?, video_url),
          duration_minutes = COALESCE(?, duration_minutes),
          access_level = COALESCE(?, access_level),
          is_free_preview = COALESCE(?, is_free_preview),
          order_index = COALESCE(?, order_index),
          is_published = COALESCE(?, is_published)
      WHERE id = ? AND teacher_id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      video_url !== undefined ? video_url : null,
      duration_minutes !== undefined ? parseInt(duration_minutes) : null,
      access_level || null,
      freePreviewFlag,
      order_index !== undefined ? parseInt(order_index) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      lessonId,
      teacherId
    );

    res.json({ success: true, message: 'Lesson updated successfully' });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete lesson
router.delete('/lessons/:id', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const lessonId = parseInt(req.params.id);

    const lesson = await db.prepare('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?').get(lessonId, teacherId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or access denied' });
    }

    await db.prepare('DELETE FROM lessons WHERE id = ? AND teacher_id = ?').run(lessonId, teacherId);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Reorder sections or lessons
router.post('/reorder', requireRole('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { type, items } = req.body;

    if (!Array.isArray(items) || !['sections', 'lessons'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reorder payload' });
    }

    if (type === 'sections') {
      const updateSection = db.prepare(`
        UPDATE sections 
        SET order_index = ? 
        WHERE id = ? AND course_id IN (SELECT id FROM courses WHERE teacher_id = ?)
      `);
      for (const item of items) {
        await updateSection.run(item.order_index, item.id, teacherId);
      }
    } else if (type === 'lessons') {
      const updateLesson = db.prepare(`
        UPDATE lessons 
        SET order_index = ? 
        WHERE id = ? AND teacher_id = ?
      `);
      for (const item of items) {
        await updateLesson.run(item.order_index, item.id, teacherId);
      }
    }

    res.json({ success: true, message: `${type} reordered successfully` });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

export default router;
