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
      const res = await pgPool.query(insertWithReturning, params);
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
    headline TEXT,
    bio TEXT NOT NULL,
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
    access_level TEXT NOT NULL CHECK(access_level IN ('FREE', 'SUBSCRIBER_ONLY'))
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
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
  );
`;

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
    name TEXT NOT NULL,
    avatar_url TEXT,
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
    headline TEXT,
    bio TEXT NOT NULL,
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
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
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
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
  );
`;

export async function initDatabase() {
  if (isPostgres) {
    await db.exec(POSTGRES_SCHEMA);
  } else {
    await db.exec(SQLITE_SCHEMA);
  }

  // Default platform settings
  const checkSetting = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_commission_percentage');
  if (!checkSetting) {
    await db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)').run(
      'platform_commission_percentage',
      '20',
      'Platform commission cut on subscription revenue (e.g. 20%)'
    );
  }

  const currentPlatformName = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('platform_name');
  if (!currentPlatformName) {
    await db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)').run(
      'platform_name',
      'Korsa',
      'Education platform name'
    );
  } else if (currentPlatformName.value === 'Learnly') {
    await db.prepare('UPDATE platform_settings SET value = ? WHERE key = ?').run('Korsa', 'platform_name');
  }

  const currentSiteName = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get('site_name');
  if (!currentSiteName) {
    await db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)').run(
      'site_name',
      'Korsa',
      'Public site brand name'
    );
  } else if (currentSiteName.value === 'Learnly') {
    await db.prepare('UPDATE platform_settings SET value = ? WHERE key = ?').run('Korsa', 'site_name');
  }
}
