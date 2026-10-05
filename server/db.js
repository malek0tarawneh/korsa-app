import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_PATH = path.resolve(__dirname, '../learnly.db');

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign key constraints for SQLite
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
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
      subjects TEXT NOT NULL, -- JSON array of subject names
      educational_levels TEXT NOT NULL, -- JSON array of grades/levels
      monthly_price_cents INTEGER NOT NULL DEFAULT 500, -- e.g. $5.00
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
  `);

  // Default platform settings
  const checkSetting = db.prepare('SELECT value FROM platform_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)');
  const updateSetting = db.prepare('UPDATE platform_settings SET value = ? WHERE key = ?');

  if (!checkSetting.get('platform_commission_percentage')) {
    insertSetting.run('platform_commission_percentage', '20', 'Platform commission cut on subscription revenue (e.g. 20%)');
  }
  const currentPlatformName = checkSetting.get('platform_name');
  if (!currentPlatformName) {
    insertSetting.run('platform_name', 'Korsa', 'Education platform name');
  } else if (currentPlatformName.value === 'Learnly') {
    updateSetting.run('Korsa', 'platform_name');
  }

  const currentSiteName = checkSetting.get('site_name');
  if (!currentSiteName) {
    insertSetting.run('site_name', 'Korsa', 'Public site brand name');
  } else if (currentSiteName.value === 'Learnly') {
    updateSetting.run('Korsa', 'site_name');
  }
}
