'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'ustoz.db');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      role          TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','tutor','admin')),
      lang          TEXT NOT NULL DEFAULT 'uz',
      phone         TEXT,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_applications (
      id              TEXT PRIMARY KEY,
      user_id         TEXT REFERENCES users(id),
      name            TEXT NOT NULL,
      age             TEXT,
      email           TEXT NOT NULL,
      phone           TEXT,
      subjects        TEXT,
      goal            TEXT,
      level           TEXT,
      teacher_styles  TEXT,
      lesson_language TEXT,
      schedule        TEXT,
      budget          TEXT,
      app_lang        TEXT DEFAULT 'uz',
      status          TEXT NOT NULL DEFAULT 'pending',
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tutor_applications (
      id            TEXT PRIMARY KEY,
      user_id       TEXT REFERENCES users(id),
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      phone         TEXT,
      city          TEXT,
      subjects      TEXT,
      experience    TEXT,
      education     TEXT,
      bio           TEXT,
      achievements  TEXT,
      languages     TEXT,
      styles        TEXT,
      rate          TEXT,
      format        TEXT,
      app_lang      TEXT DEFAULT 'uz',
      status        TEXT NOT NULL DEFAULT 'pending',
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tutors (
      id              TEXT PRIMARY KEY,
      user_id         TEXT REFERENCES users(id),
      name            TEXT NOT NULL,
      subject         TEXT NOT NULL,
      language_taught TEXT,
      langs           TEXT NOT NULL,
      rating          REAL NOT NULL DEFAULT 5,
      price_usd       REAL NOT NULL,
      bio             TEXT,
      flag            TEXT,
      photo           TEXT,
      goals           TEXT,
      time_slots      TEXT,
      available_today INTEGER NOT NULL DEFAULT 1,
      verified        INTEGER NOT NULL DEFAULT 1,
      review_count    INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id          TEXT PRIMARY KEY,
      student_id  TEXT NOT NULL REFERENCES users(id),
      tutor_id    TEXT NOT NULL REFERENCES tutors(id),
      slot_date   TEXT NOT NULL,
      slot_time   TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','completed')),
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id          TEXT PRIMARY KEY,
      student_id  TEXT NOT NULL REFERENCES users(id),
      tutor_id    TEXT NOT NULL REFERENCES tutors(id),
      rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment     TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      UNIQUE(student_id, tutor_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      subject     TEXT NOT NULL,
      body        TEXT NOT NULL,
      read_flag   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_stats (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      tutors      INTEGER NOT NULL DEFAULT 500,
      countries   INTEGER NOT NULL DEFAULT 50,
      subjects    INTEGER NOT NULL DEFAULT 50,
      lessons     INTEGER NOT NULL DEFAULT 10000
    );

    INSERT OR IGNORE INTO platform_stats (id, tutors, countries, subjects, lessons)
    VALUES (1, 500, 50, 50, 10000);

    CREATE INDEX IF NOT EXISTS idx_tutors_subject ON tutors(subject);
    CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings(tutor_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON reviews(tutor_id);

    -- ── Dashboard tables ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      interests      TEXT NOT NULL DEFAULT '[]',
      learning_style TEXT,
      level          TEXT,
      goal           TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teacher_profiles (
      user_id                  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      subject                  TEXT NOT NULL DEFAULT '',
      bio                      TEXT,
      hourly_rate              REAL NOT NULL DEFAULT 10,
      subscription_status      INTEGER NOT NULL DEFAULT 0,
      subscription_next_billing TEXT,
      rating                   REAL NOT NULL DEFAULT 5.0,
      tags                     TEXT NOT NULL DEFAULT '[]',
      created_at               TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id           TEXT PRIMARY KEY,
      student_id   TEXT NOT NULL REFERENCES users(id),
      teacher_id   TEXT NOT NULL REFERENCES users(id),
      scheduled_at TEXT NOT NULL,
      duration_min INTEGER NOT NULL DEFAULT 60,
      status       TEXT NOT NULL DEFAULT 'pending'
                   CHECK(status IN ('pending','confirmed','completed','cancelled')),
      topic        TEXT,
      zoom_url     TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_lessons_student   ON lessons(student_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_teacher   ON lessons(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_scheduled ON lessons(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_teacher_sub       ON teacher_profiles(subscription_status);
  `);
}

function parseJson(val, fallback = []) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function rowToTutor(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    language: row.language_taught,
    lang: parseJson(row.langs),
    rating: row.rating,
    price: row.price_usd,
    priceUsd: row.price_usd,
    bio: row.bio,
    flag: row.flag,
    photo: row.photo,
    goals: parseJson(row.goals),
    times: parseJson(row.time_slots),
    availableToday: !!row.available_today,
    reviews: row.review_count,
    verified: !!row.verified,
  };
}

function safeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    lang: row.lang,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

module.exports = { getDb, parseJson, rowToTutor, safeUser, DB_PATH };
