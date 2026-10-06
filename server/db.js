import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_PATH = path.resolve(__dirname, '../learnly.db');

export const isPostgres = Boolean(process.env.DATABASE_URL);

let sqliteDb = null;
let pgPool = null;

if (isPostgres) {
  const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
  console.log('📦 Using PostgreSQL database connection (DATABASE_URL configured)');
} else {
  const { DatabaseSync } = await import('node:sqlite');
  sqliteDb = new DatabaseSync(DB_PATH);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  console.log(`📁 Using local SQLite database at: ${DB_PATH}`);
}

function flattenArgs(args) {
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

// Convert SQLite '?' placeholders to PostgreSQL '$1, $2, ...' and replace LIKE with ILIKE for case-insensitive search
export function convertSqlForPostgres(sql) {
  let paramIndex = 1;
  let inString = false;
  let stringChar = '';
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (inString) {
      result += char;
      if (char === stringChar) {
        if (sql[i + 1] === stringChar) {
          result += sql[i + 1];
          i++;
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
        result += char;
      } else if (char === '?') {
        result += `$${paramIndex++}`;
      } else {
        result += char;
      }
    }
  }

  // Use ILIKE in PostgreSQL for case-insensitive matching like SQLite's default
  result = result.replace(/\bLIKE\b/g, 'ILIKE');

  return result;
}

function createPostgresStatement(sql) {
  const pgSql = convertSqlForPostgres(sql);

  // If this is an INSERT statement without RETURNING, append RETURNING id
  const isInsert = /^\s*INSERT\s+INTO\b/i.test(pgSql);
  const hasReturning = /\bRETURNING\b/i.test(pgSql);
  const insertWithReturning = isInsert && !hasReturning ? `${pgSql} RETURNING id` : pgSql;

  return {
    all: async (...args) => {
      const params = flattenArgs(args);
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    },
    get: async (...args) => {
      const params = flattenArgs(args);
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    },
    run: async (...args) => {
      const params = flattenArgs(args);
      let res;
      try {
        res = await pgPool.query(insertWithReturning, params);
      } catch (err) {
        // Fallback: If appending RETURNING id failed because column "id" does not exist (code 42703), retry without RETURNING id
        if ((err.code === '42703' || (err.message && err.message.includes('column "id" does not exist'))) && insertWithReturning !== pgSql) {
          res = await pgPool.query(pgSql, params);
        } else {
          throw err;
        }
      }
      const lastInsertRowid = res.rows && res.rows[0] && res.rows[0].id !== undefined
        ? Number(res.rows[0].id)
        : null;
      return {
        lastInsertRowid,
        changes: res.rowCount || 0
      };
    }
  };
}

function createSqliteStatement(sql) {
  const stmt = sqliteDb.prepare(sql);
  return {
    all: async (...args) => {
      const params = flattenArgs(args);
      return stmt.all(...params);
    },
    get: async (...args) => {
      const params = flattenArgs(args);
      return stmt.get(...params);
    },
    run: async (...args) => {
      const params = flattenArgs(args);
      const res = stmt.run(...params);
      return {
        lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : null,
        changes: res.changes || 0
      };
    }
  };
}

export const db = {
  isPostgres,
  prepare(sql) {
    if (isPostgres) {
      return createPostgresStatement(sql);
    }
    return createSqliteStatement(sql);
  },
  async all(sql, ...params) {
    return this.prepare(sql).all(...params);
  },
  async get(sql, ...params) {
    return this.prepare(sql).get(...params);
  },
  async run(sql, ...params) {
    return this.prepare(sql).run(...params);
  },
  async exec(sql) {
    if (isPostgres) {
      await pgPool.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  }
};

const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
    name TEXT NOT NULL,
    avatar_url TEXT,
    referred_by TEXT,
    referral_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    educational_level TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS teacher_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE,
    tier TEXT DEFAULT 'community_tutor' CHECK(tier IN ('community_tutor', 'expert_creator')),
    headline TEXT,
    bio TEXT NOT NULL,
    custom_bio TEXT,
    external_links TEXT DEFAULT '{}',
    referral_code TEXT UNIQUE,
    commission_rate DOUBLE PRECISION DEFAULT 0.10,
    subjects TEXT NOT NULL,
    educational_levels TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL DEFAULT 500,
    is_approved INTEGER NOT NULL DEFAULT 1,
    rating DOUBLE PRECISION DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    title TEXT NOT NULL,
    description TEXT,
    educational_level TEXT NOT NULL,
    thumbnail_url TEXT,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 15,
    access_level TEXT NOT NULL CHECK(access_level IN ('FREE', 'SUBSCRIBER_ONLY', 'DRAFT')),
    is_free_preview INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'PDF',
    access_level TEXT NOT NULL CHECK(access_level IN ('FREE', 'SUBSCRIBER_ONLY')),
    is_free_preview INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lead_magnets (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lead_magnet_claims (
    id SERIAL PRIMARY KEY,
    lead_magnet_id INTEGER NOT NULL REFERENCES lead_magnets(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_email TEXT NOT NULL,
    student_name TEXT,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    service_type TEXT NOT NULL CHECK(service_type IN ('quick_review', 'qa_session', 'mentorship')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_bookings (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    booking_notes TEXT,
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'expired')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    renewal_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(student_id, teacher_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    student_id INTEGER NOT NULL REFERENCES users(id),
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    amount_cents INTEGER NOT NULL,
    platform_commission_cents INTEGER NOT NULL,
    teacher_earnings_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    simulated INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed INTEGER NOT NULL DEFAULT 0,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    is_moderated INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, teacher_id)
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_sections_course_id ON sections(course_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_section_id ON lessons(section_id);
  CREATE INDEX IF NOT EXISTS idx_lead_magnets_teacher_id ON lead_magnets(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_lead_magnet_claims_teacher_id ON lead_magnet_claims(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_services_teacher_id ON services(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_service_bookings_teacher_id ON service_bookings(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id ON subscriptions(student_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_teacher_id ON subscriptions(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
  CREATE INDEX IF NOT EXISTS idx_payments_teacher_id ON payments(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON reviews(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
`;

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
    name TEXT NOT NULL,
    avatar_url TEXT,
    referred_by TEXT,
    referral_credits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    educational_level TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS teacher_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    handle TEXT UNIQUE,
    tier TEXT DEFAULT 'community_tutor' CHECK(tier IN ('community_tutor', 'expert_creator')),
    headline TEXT,
    bio TEXT NOT NULL,
    custom_bio TEXT,
    external_links TEXT DEFAULT '{}',
    referral_code TEXT UNIQUE,
    commission_rate REAL DEFAULT 0.10,
    subjects TEXT NOT NULL,
    educational_levels TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL DEFAULT 500,
    is_approved INTEGER NOT NULL DEFAULT 1,
    rating REAL DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    educational_level TEXT NOT NULL,
    thumbnail_url TEXT,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 15,
    access_level TEXT NOT NULL CHECK(access_level IN ('FREE', 'SUBSCRIBER_ONLY', 'DRAFT')),
    is_free_preview INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'PDF',
    access_level TEXT NOT NULL CHECK(access_level IN ('FREE', 'SUBSCRIBER_ONLY')),
    is_free_preview INTEGER DEFAULT 0,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lead_magnets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lead_magnet_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_magnet_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER,
    student_email TEXT NOT NULL,
    student_name TEXT,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_magnet_id) REFERENCES lead_magnets(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    service_type TEXT NOT NULL CHECK(service_type IN ('quick_review', 'qa_session', 'mentorship')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    booking_notes TEXT,
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'expired')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    renewal_at DATETIME,
    cancelled_at DATETIME,
    UNIQUE(student_id, teacher_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    platform_commission_cents INTEGER NOT NULL,
    teacher_earnings_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    simulated INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, lesson_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    is_moderated INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, teacher_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_sections_course_id ON sections(course_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_section_id ON lessons(section_id);
  CREATE INDEX IF NOT EXISTS idx_lead_magnets_teacher_id ON lead_magnets(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_lead_magnet_claims_teacher_id ON lead_magnet_claims(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_services_teacher_id ON services(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_service_bookings_teacher_id ON service_bookings(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id ON subscriptions(student_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_teacher_id ON subscriptions(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
  CREATE INDEX IF NOT EXISTS idx_payments_teacher_id ON payments(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON reviews(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
`;

export async function populateCreatorFlywheelDefaults() {
  try {
    const teachers = await db.prepare(`
      SELECT tp.id, tp.user_id, u.name, u.email, tp.handle, tp.tier, tp.referral_code
      FROM teacher_profiles tp
      JOIN users u ON tp.user_id = u.id
    `).all();

    for (const t of teachers) {
      let handle = t.handle;
      let referralCode = t.referral_code;
      let tier = t.tier || 'community_tutor';

      if (!handle) {
        // Derive clean handle from teacher name
        const lowerName = t.name.toLowerCase().replace(/^(dr\.|prof\.|mr\.|ms\.|mrs\.)\s*/i, '').trim();
        const baseSlug = lowerName.split(' ')[0].replace(/[^a-z0-9]/g, '') || `teacher${t.user_id}`;
        handle = baseSlug;

        const existing = await db.prepare('SELECT id FROM teacher_profiles WHERE handle = ? AND user_id != ?').get(handle, t.user_id);
        if (existing) {
          handle = `${baseSlug}${t.user_id}`;
        }
      }

      if (!referralCode) {
        referralCode = `${handle.toUpperCase()}2026`;
      }

      if (['jordan', 'elena', 'tariq'].includes(handle)) {
        tier = 'expert_creator';
      } else {
        tier = 'community_tutor';
      }

      const externalLinks = JSON.stringify({
        linkedin: `https://linkedin.com/in/${handle}`,
        youtube: `https://youtube.com/@${handle}`,
        twitter: `https://x.com/${handle}`,
        github: handle === 'tariq' ? `https://github.com/${handle}` : null
      });

      const customBio = `Welcome to my learning hub! I publish weekly high-yield lessons, comprehensive study guides, and direct 1-on-1 micro-tutoring sessions for motivated students.`;

      await db.prepare(`
        UPDATE teacher_profiles
        SET handle = COALESCE(handle, ?),
            referral_code = COALESCE(referral_code, ?),
            tier = ?,
            custom_bio = COALESCE(custom_bio, ?),
            external_links = COALESCE(external_links, ?),
            commission_rate = COALESCE(commission_rate, 0.10)
        WHERE user_id = ?
      `).run(handle, referralCode, tier, customBio, externalLinks, t.user_id);

      // Seed default lead magnets if none exist
      const lmCount = await db.prepare('SELECT COUNT(*) as count FROM lead_magnets WHERE teacher_id = ?').get(t.user_id);
      if (Number(lmCount?.count || 0) === 0) {
        const lastName = t.name.split(' ').pop();
        const leadMagnetsList = [
          {
            title: `${lastName}’s Ultimate Exam Revision Roadmap & Formula Sheet`,
            description: 'Comprehensive high-yield cheat sheet covering top recurring exam pitfalls, key theorems, and step-by-step problem-solving shortcuts.',
            file_url: 'https://example.com/assets/cheat-sheet-roadmap.pdf',
            downloads_count: 248 + (t.user_id * 15)
          },
          {
            title: 'Top 50 High-Yield Exam Questions with Fully Worked Solutions',
            description: 'Curated collection of challenging exam problems analyzed line-by-line so you can master exam timing and score maximization.',
            file_url: 'https://example.com/assets/top-50-exam-solutions.pdf',
            downloads_count: 142 + (t.user_id * 8)
          }
        ];

        for (const lm of leadMagnetsList) {
          await db.prepare(`
            INSERT INTO lead_magnets (teacher_id, title, description, file_url, downloads_count)
            VALUES (?, ?, ?, ?, ?)
          `).run(t.user_id, lm.title, lm.description, lm.file_url, lm.downloads_count);
        }
      }

      // Seed default micro-services if none exist
      const sCount = await db.prepare('SELECT COUNT(*) as count FROM services WHERE teacher_id = ?').get(t.user_id);
      if (Number(sCount?.count || 0) === 0) {
        const defaultServices = [
          {
            title: '15-Minute Homework & Concept Checkup',
            price_cents: 1000,
            duration_minutes: 15,
            service_type: 'quick_review'
          },
          {
            title: '30-Minute Live 1-on-1 Q&A / Exam Drill',
            price_cents: 2000,
            duration_minutes: 30,
            service_type: 'qa_session'
          },
          {
            title: '60-Minute Comprehensive Mentorship & Strategy',
            price_cents: 4500,
            duration_minutes: 60,
            service_type: 'mentorship'
          }
        ];

        for (const s of defaultServices) {
          await db.prepare(`
            INSERT INTO services (teacher_id, title, price_cents, duration_minutes, service_type, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
          `).run(t.user_id, s.title, s.price_cents, s.duration_minutes, s.service_type);
        }
      }
    }
  } catch (err) {
    console.warn('Notice while populating creator defaults:', err.message);
  }
}

export async function initDatabase() {
  if (isPostgres) {
    // Backward-compatibility: Ensure existing PostgreSQL tables have the new columns before executing full schema/indexes
    try {
      await db.exec(`
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0;
          END IF;
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teacher_profiles') THEN
            ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS handle TEXT;
            ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'community_tutor';
            ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS custom_bio TEXT;
            ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS external_links TEXT DEFAULT '{}';
            ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
            ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS commission_rate DOUBLE PRECISION DEFAULT 0.10;
          END IF;
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons') THEN
            ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free_preview INTEGER DEFAULT 0;
          END IF;
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resources') THEN
            ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_free_preview INTEGER DEFAULT 0;
          END IF;
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'platform_settings') THEN
            ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS id SERIAL;
          END IF;
        END $$;
      `);
    } catch (err) {
      console.warn('PostgreSQL creator schema pre-migration notice:', err.message);
    }

    await db.exec(POSTGRES_SCHEMA);

    try {
      await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_profiles_handle ON teacher_profiles(handle);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_profiles_referral_code ON teacher_profiles(referral_code);
      `);
    } catch (err) {
      console.warn('PostgreSQL unique index notice:', err.message);
    }
  } else {
    // Backward-compatibility for SQLite: Ensure existing SQLite tables have the new columns BEFORE running full schema/indexes
    try {
      const addCol = (table, col, colDef) => {
        try {
          const tableExists = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
          if (tableExists) {
            const cols = sqliteDb.prepare(`PRAGMA table_info(${table})`).all();
            if (!cols.some(c => c.name === col)) {
              sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${colDef};`);
            }
          }
        } catch (err) {
          console.warn(`SQLite column migration notice for ${table}.${col}:`, err.message);
        }
      };

      addCol('platform_settings', 'id', 'INTEGER');
      addCol('users', 'referred_by', 'TEXT');
      addCol('users', 'referral_credits', 'INTEGER DEFAULT 0');
      addCol('teacher_profiles', 'handle', 'TEXT');
      addCol('teacher_profiles', 'tier', "TEXT DEFAULT 'community_tutor'");
      addCol('teacher_profiles', 'custom_bio', 'TEXT');
      addCol('teacher_profiles', 'external_links', "TEXT DEFAULT '{}'");
      addCol('teacher_profiles', 'referral_code', 'TEXT');
      addCol('teacher_profiles', 'commission_rate', 'REAL DEFAULT 0.10');
      addCol('lessons', 'is_free_preview', 'INTEGER DEFAULT 0');
      addCol('resources', 'is_free_preview', 'INTEGER DEFAULT 0');
    } catch (err) {
      console.warn('SQLite pre-migration notice:', err.message);
    }

    await db.exec(SQLITE_SCHEMA);

    try {
      sqliteDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_profiles_handle ON teacher_profiles(handle);');
      sqliteDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_profiles_referral_code ON teacher_profiles(referral_code);');
    } catch (e) {
      // Ignore if index already exists
    }

    try {
      sqliteDb.exec(`
        UPDATE platform_settings SET id = (SELECT COUNT(*) FROM platform_settings p2 WHERE p2.rowid <= platform_settings.rowid) WHERE id IS NULL;
        CREATE TRIGGER IF NOT EXISTS trg_platform_settings_id
        AFTER INSERT ON platform_settings
        WHEN new.id IS NULL
        BEGIN
          UPDATE platform_settings SET id = (SELECT COALESCE(MAX(id), 0) + 1 FROM platform_settings) WHERE rowid = new.rowid;
        END;
      `);
    } catch (err) {
      console.warn('SQLite trigger notice:', err.message);
    }
  }

  // Ensure lessons that are marked 'FREE' also have is_free_preview = 1
  try {
    await db.exec("UPDATE lessons SET is_free_preview = 1 WHERE access_level = 'FREE' AND (is_free_preview IS NULL OR is_free_preview = 0)");
    await db.exec("UPDATE resources SET is_free_preview = 1 WHERE access_level = 'FREE' AND (is_free_preview IS NULL OR is_free_preview = 0)");
  } catch (err) {
    console.warn('Sync free preview notice:', err.message);
  }

  // Populate creator flywheel defaults (handles, tiers, lead magnets, services)
  await populateCreatorFlywheelDefaults();

  // Default platform settings
  const checkSetting = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_commission_percentage');
  if (!checkSetting) {
    await db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?) ON CONFLICT (key) DO NOTHING').run(
      'platform_commission_percentage',
      '20',
      'Platform commission cut on subscription revenue (e.g. 20%)'
    );
  }

  const currentPlatformName = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_name');
  if (!currentPlatformName) {
    await db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?) ON CONFLICT (key) DO NOTHING').run(
      'platform_name',
      'Korsa',
      'Education platform name'
    );
  } else if (currentPlatformName.value === 'Learnly') {
    await db.prepare('UPDATE platform_settings SET value = ? WHERE key = ?').run('Korsa', 'platform_name');
  }

  const currentSiteName = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('site_name');
  if (!currentSiteName) {
    await db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?) ON CONFLICT (key) DO NOTHING').run(
      'site_name',
      'Korsa',
      'Public site brand name'
    );
  } else if (currentSiteName.value === 'Learnly') {
    await db.prepare('UPDATE platform_settings SET value = ? WHERE key = ?').run('Korsa', 'site_name');
  }
}

