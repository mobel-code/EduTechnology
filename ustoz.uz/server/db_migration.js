'use strict';

/**
 * db_migration.js — Добавляет новые таблицы поверх существующей схемы.
 * Запустить один раз: node server/db_migration.js
 */

const { getDb } = require('./db');

const db = getDb();

console.log('🔄 Running dashboard schema migration...');

db.exec(`
  -- ── Профиль ученика ───────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS student_profiles (
    user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    interests      TEXT NOT NULL DEFAULT '[]',   -- JSON array: ["Путешествия","Технологии"]
    learning_style TEXT,                          -- "visual" | "auditory" | "kinesthetic" | "logical"
    level          TEXT,                          -- "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
    goal           TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ── Профиль учителя ────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS teacher_profiles (
    user_id                  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    subject                  TEXT NOT NULL DEFAULT '',
    bio                      TEXT,
    hourly_rate              REAL NOT NULL DEFAULT 10,
    subscription_status      INTEGER NOT NULL DEFAULT 0,  -- 1 = active
    subscription_next_billing TEXT,
    rating                   REAL NOT NULL DEFAULT 5.0,
    tags                     TEXT NOT NULL DEFAULT '[]',  -- JSON array of topic tags
    created_at               TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ── Уроки ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS lessons (
    id           TEXT PRIMARY KEY,
    student_id   TEXT NOT NULL REFERENCES users(id),
    teacher_id   TEXT NOT NULL REFERENCES users(id),
    scheduled_at TEXT NOT NULL,                   -- ISO-8601: "2026-05-23 15:00:00"
    duration_min INTEGER NOT NULL DEFAULT 60,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK(status IN ('pending','confirmed','completed','cancelled')),
    topic        TEXT,
    zoom_url     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ── Индексы ─────────────────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_lessons_student   ON lessons(student_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_teacher   ON lessons(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_scheduled ON lessons(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_teacher_sub       ON teacher_profiles(subscription_status);
  CREATE INDEX IF NOT EXISTS idx_student_style     ON student_profiles(learning_style);
`);

// ── Seed: create demo users + profiles if they don't exist ────────────────
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');

const now = new Date().toISOString();

function seedUser(name, email, role) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return existing.id;
  const id = uuid();
  const hash = bcrypt.hashSync('password123', 10);
  db.prepare('INSERT INTO users (id, name, email, password_hash, role, lang, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, name, email, hash, role, 'ru', now);
  console.log(`  ✓ Created ${role}: ${email}`);
  return id;
}

// Demo student
const studentId = seedUser('Алибек Батыров', 'alibek@demo.com', 'student');
const existing_sp = db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(studentId);
if (!existing_sp) {
  db.prepare('INSERT INTO student_profiles (user_id, interests, learning_style, level, goal, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(studentId, JSON.stringify(['Технологии', 'Путешествия', 'Бизнес']), 'visual', 'B1', 'IELTS 7.0', now, now);
}

// Demo teacher
const teacherId = seedUser('Малика Азимова', 'malika@demo.com', 'tutor');
const existing_tp = db.prepare('SELECT user_id FROM teacher_profiles WHERE user_id = ?').get(teacherId);
if (!existing_tp) {
  db.prepare('INSERT INTO teacher_profiles (user_id, subject, bio, hourly_rate, subscription_status, rating, tags, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(teacherId, 'Английский язык', 'Преподаватель английского с 5-летним опытом. Специализируюсь на IELTS и бизнес-английском.', 12, 1, 4.9,
        JSON.stringify(['IELTS', 'Бизнес', 'Путешествия', 'Технологии', 'Разговорный']), now, now);
}

// Demo lessons
function seedLesson(studentId, teacherId, daysOffset, status, topic) {
  const id = uuid();
  const d = new Date(); d.setDate(d.getDate() + daysOffset);
  const scheduledAt = d.toISOString().slice(0, 10) + ' 15:00:00';
  db.prepare('INSERT OR IGNORE INTO lessons (id, student_id, teacher_id, scheduled_at, status, topic, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, studentId, teacherId, scheduledAt, status, topic, now);
}

seedLesson(studentId, teacherId,  0, 'confirmed', 'Past Perfect Continuous');
seedLesson(studentId, teacherId,  2, 'pending',   'IELTS Writing Task 2');
seedLesson(studentId, teacherId, -3, 'completed', 'Present Perfect vs Past Simple');
seedLesson(studentId, teacherId, -7, 'completed', 'Business Vocabulary');

console.log('✅ Migration complete!');
console.log('\n📋 Demo credentials:');
console.log('  Student → alibek@demo.com  / password123');
console.log('  Teacher → malika@demo.com  / password123');
