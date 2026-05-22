'use strict';

/**
 * dashboard.js — Routes for Student & Teacher dashboards
 * Добавить в app.js: const dashboardRoutes = require('./routes/dashboard');
 *                    app.use('/api', dashboardRoutes);
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const { getDb, parseJson, rowToTutor } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'ustoz_dev_secret_change_in_production';

// ─── Helpers ───────────────────────────────────────────────────────────────
const ok   = (res, data, code = 200) => res.status(code).json({ success: true,  ...data });
const fail = (res, msg,  code = 400) => res.status(code).json({ success: false, error: msg });

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 'Authorisation required.', 401);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    fail(res, 'Invalid or expired token.', 401);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/student/dashboard
// Возвращает: профиль, ближайший урок, список учителей ученика
// ──────────────────────────────────────────────────────────────────────────
router.get('/student/dashboard', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  // 1. Профиль ученика
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return fail(res, 'User not found.', 404);
  if (user.role !== 'student') return fail(res, 'Access denied: student only.', 403);

  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);

  // 2. Баланс уроков (уроки куплены, но не проведены)
  const balance = db.prepare(
    "SELECT COUNT(*) AS c FROM lessons WHERE student_id = ? AND status IN ('pending','confirmed')"
  ).get(userId)?.c ?? 0;

  // 3. Ближайший урок
  const nextLesson = db.prepare(`
    SELECT l.*, t.name AS teacher_name, t.photo AS teacher_photo,
           t.subject, t.language_taught, t.rating AS teacher_rating
    FROM lessons l
    JOIN teacher_profiles tp ON tp.user_id = l.teacher_id
    JOIN users t ON t.id = l.teacher_id
    WHERE l.student_id = ?
      AND l.status IN ('pending','confirmed')
      AND l.scheduled_at >= datetime('now')
    ORDER BY l.scheduled_at ASC
    LIMIT 1
  `).get(userId);

  // 4. Список учителей, с которыми занимается ученик
  const teachers = db.prepare(`
    SELECT DISTINCT u.id, u.name, tp.subject, tp.hourly_rate, tp.rating, tp.bio,
           tp.subscription_status,
           COUNT(l.id) AS lessons_count
    FROM lessons l
    JOIN users u ON u.id = l.teacher_id
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
    WHERE l.student_id = ?
    GROUP BY u.id
    ORDER BY lessons_count DESC
  `).all(userId);

  // 5. Предстоящие уроки (следующие 7 дней)
  const upcoming = db.prepare(`
    SELECT l.*, u.name AS teacher_name, tp.subject
    FROM lessons l
    JOIN users u ON u.id = l.teacher_id
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
    WHERE l.student_id = ?
      AND l.status IN ('pending','confirmed')
      AND l.scheduled_at BETWEEN datetime('now') AND datetime('now', '+7 days')
    ORDER BY l.scheduled_at ASC
  `).all(userId);

  // 6. История уроков (последние 20)
  const history = db.prepare(`
    SELECT l.*, u.name AS teacher_name, tp.subject
    FROM lessons l
    JOIN users u ON u.id = l.teacher_id
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
    WHERE l.student_id = ? AND l.status = 'completed'
    ORDER BY l.scheduled_at DESC
    LIMIT 20
  `).all(userId);

  ok(res, {
    student: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      interests: parseJson(profile?.interests),
      learningStyle: profile?.learning_style ?? null,
      createdAt: user.created_at,
    },
    balance,
    nextLesson: nextLesson ? formatLesson(nextLesson) : null,
    teachers: teachers.map(t => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      hourlyRate: t.hourly_rate,
      rating: t.rating,
      bio: t.bio,
      lessonsCount: t.lessons_count,
    })),
    upcoming: upcoming.map(formatLesson),
    history:  history.map(formatLesson),
  });
});


// ──────────────────────────────────────────────────────────────────────────
// GET /api/teacher/dashboard
// Возвращает: профиль, подписка, статистика, список учеников
// ──────────────────────────────────────────────────────────────────────────
router.get('/teacher/dashboard', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return fail(res, 'User not found.', 404);
  if (user.role !== 'tutor') return fail(res, 'Access denied: teacher only.', 403);

  const profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(userId);

  // Следующий урок
  const nextLesson = db.prepare(`
    SELECT l.*, u.name AS student_name, sp.interests AS student_interests,
           sp.learning_style
    FROM lessons l
    JOIN users u ON u.id = l.student_id
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE l.teacher_id = ?
      AND l.status IN ('pending','confirmed')
      AND l.scheduled_at >= datetime('now')
    ORDER BY l.scheduled_at ASC
    LIMIT 1
  `).get(userId);

  // Статистика за текущий месяц
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`;

  const monthStats = db.prepare(`
    SELECT
      COUNT(*) AS total_lessons,
      COUNT(DISTINCT student_id) AS unique_students
    FROM lessons
    WHERE teacher_id = ? AND status = 'completed'
      AND scheduled_at >= ?
  `).get(userId, monthStart);

  const earnings = db.prepare(`
    SELECT COALESCE(SUM(tp.hourly_rate), 0) AS total
    FROM lessons l
    JOIN teacher_profiles tp ON tp.user_id = l.teacher_id
    WHERE l.teacher_id = ? AND l.status = 'completed'
      AND l.scheduled_at >= ?
  `).get(userId, monthStart);

  const allTimeStudents = db.prepare(
    "SELECT COUNT(DISTINCT student_id) AS c FROM lessons WHERE teacher_id = ?"
  ).get(userId)?.c ?? 0;

  // Активные ученики
  const students = db.prepare(`
    SELECT DISTINCT u.id, u.name, u.email,
           sp.interests, sp.learning_style,
           COUNT(l.id) AS lessons_count,
           MAX(l.scheduled_at) AS last_lesson,
           MIN(CASE WHEN l.status IN ('pending','confirmed') AND l.scheduled_at >= datetime('now')
               THEN l.scheduled_at END) AS next_lesson
    FROM lessons l
    JOIN users u ON u.id = l.student_id
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE l.teacher_id = ?
    GROUP BY u.id
    ORDER BY lessons_count DESC
  `).all(userId);

  // Расписание на сегодня
  const todayStart = new Date().toISOString().slice(0, 10) + ' 00:00:00';
  const todayEnd   = new Date().toISOString().slice(0, 10) + ' 23:59:59';
  const todayLessons = db.prepare(`
    SELECT l.*, u.name AS student_name
    FROM lessons l
    JOIN users u ON u.id = l.student_id
    WHERE l.teacher_id = ?
      AND l.scheduled_at BETWEEN ? AND ?
    ORDER BY l.scheduled_at ASC
  `).all(userId, todayStart, todayEnd);

  ok(res, {
    teacher: {
      id: user.id,
      name: user.name,
      email: user.email,
      subject: profile?.subject ?? null,
      bio: profile?.bio ?? null,
      hourlyRate: profile?.hourly_rate ?? null,
      rating: profile?.rating ?? null,
    },
    subscription: {
      active: !!profile?.subscription_status,
      price: 2,
      nextBilling: profile?.subscription_next_billing ?? null,
    },
    stats: {
      studentsTotal: allTimeStudents,
      studentsThisMonth: monthStats.unique_students,
      hoursThisMonth: monthStats.total_lessons,   // 1 урок = 1 час
      earningsThisMonth: Math.round(earnings.total),
      rating: profile?.rating ?? 5.0,
    },
    nextLesson: nextLesson ? {
      id: nextLesson.id,
      studentName: nextLesson.student_name,
      studentInterests: parseJson(nextLesson.student_interests),
      learningStyle: nextLesson.learning_style,
      scheduledAt: nextLesson.scheduled_at,
      status: nextLesson.status,
      topic: nextLesson.topic ?? null,
    } : null,
    todayLessons: todayLessons.map(l => ({
      id: l.id,
      studentName: l.student_name,
      scheduledAt: l.scheduled_at,
      status: l.status,
      topic: l.topic ?? null,
    })),
    students: students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      interests: parseJson(s.interests),
      learningStyle: s.learning_style,
      lessonsCount: s.lessons_count,
      lastLesson: s.last_lesson,
      nextLesson: s.next_lesson,
    })),
  });
});


// ──────────────────────────────────────────────────────────────────────────
// POST /api/auth/register  (расширенная версия)
// Создаёт users + профиль в зависимости от роли
// ──────────────────────────────────────────────────────────────────────────
router.post(
  '/auth/register/profile',
  authMiddleware,
  [
    body('role').isIn(['student', 'tutor']),
    body('interests').optional().isArray(),
    body('learningStyle').optional().isString(),
    body('subject').optional().isString(),
    body('bio').optional().isString(),
    body('hourlyRate').optional().isNumeric(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const db = getDb();
    const userId = req.user.id;
    const { role, interests, learningStyle, subject, bio, hourlyRate } = req.body;
    const now = new Date().toISOString();

    if (role === 'student') {
      const exists = db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(userId);
      if (exists) {
        db.prepare(`UPDATE student_profiles SET interests = ?, learning_style = ? WHERE user_id = ?`)
          .run(JSON.stringify(interests || []), learningStyle || null, userId);
      } else {
        db.prepare(`INSERT INTO student_profiles (user_id, interests, learning_style, created_at) VALUES (?,?,?,?)`)
          .run(userId, JSON.stringify(interests || []), learningStyle || null, now);
      }
    } else {
      const exists = db.prepare('SELECT user_id FROM teacher_profiles WHERE user_id = ?').get(userId);
      if (exists) {
        db.prepare(`UPDATE teacher_profiles SET subject = ?, bio = ?, hourly_rate = ? WHERE user_id = ?`)
          .run(subject || null, bio || null, hourlyRate || 10, userId);
      } else {
        db.prepare(`INSERT INTO teacher_profiles (user_id, subject, bio, hourly_rate, subscription_status, rating, created_at) VALUES (?,?,?,?,0,5.0,?)`)
          .run(userId, subject || null, bio || null, hourlyRate || 10, now);
      }
    }

    ok(res, { message: 'Profile saved.', role });
  }
);


// ──────────────────────────────────────────────────────────────────────────
// POST /api/quiz/submit
// Принимает интересы ученика → возвращает ТОП-3 учителей
// ──────────────────────────────────────────────────────────────────────────
router.post(
  '/quiz/submit',
  authMiddleware,
  [
    body('interests').isArray({ min: 1 }),
    body('subject').optional().isString(),
    body('learningStyle').optional().isString(),
    body('budget').optional().isNumeric(),
    body('schedule').optional().isString(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const db = getDb();
    const userId = req.user.id;
    const { interests, subject, learningStyle, budget, schedule } = req.body;
    const now = new Date().toISOString();

    // Сохраняем результат теста
    const existing = db.prepare('SELECT user_id FROM student_profiles WHERE user_id = ?').get(userId);
    if (existing) {
      db.prepare('UPDATE student_profiles SET interests = ?, learning_style = ? WHERE user_id = ?')
        .run(JSON.stringify(interests), learningStyle || null, userId);
    } else {
      db.prepare('INSERT INTO student_profiles (user_id, interests, learning_style, created_at) VALUES (?,?,?,?)')
        .run(userId, JSON.stringify(interests), learningStyle || null, now);
    }

    // ── MATCHING ALGORITHM ─────────────────────────────────────────────
    // Получаем всех активных учителей с их профилями
    const teachers = db.prepare(`
      SELECT u.id, u.name,
             tp.subject, tp.bio, tp.hourly_rate, tp.rating, tp.subscription_status,
             tp.tags
      FROM teacher_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE tp.subscription_status = 1
        ${subject ? 'AND tp.subject = ?' : ''}
        ${budget  ? 'AND tp.hourly_rate <= ?' : ''}
      ORDER BY tp.rating DESC
    `).all(...(subject ? [subject] : []), ...(budget ? [budget] : []));

    // Скоринг по совпадению интересов и тегов
    const scored = teachers.map(t => {
      const teacherTags = parseJson(t.tags, []).map(s => s.toLowerCase());
      const studentInterests = interests.map(s => s.toLowerCase());

      // Подсчёт совпадений
      let score = 0;
      for (const interest of studentInterests) {
        for (const tag of teacherTags) {
          if (tag.includes(interest) || interest.includes(tag)) score += 2;
        }
        // Совпадение предмета даёт бонус
        if (t.subject?.toLowerCase().includes(interest)) score += 3;
      }
      score += (t.rating ?? 0) * 1.5;       // рейтинг как бонус
      return { ...t, matchScore: score };
    });

    // Сортируем по score и берём топ-3
    const top3 = scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        bio: t.bio,
        hourlyRate: t.hourly_rate,
        rating: t.rating,
        matchScore: t.matchScore,
        matchReasons: buildMatchReasons(t, interests),
      }));

    // Если учителей недостаточно — добираем из tutors таблицы (legacy)
    if (top3.length < 3) {
      const legacyTutors = rowToTutor
        ? db.prepare(`
            SELECT * FROM tutors
            WHERE verified = 1
            ${subject ? "AND (subject = ? OR language_taught = ?)" : ''}
            ORDER BY rating DESC
            LIMIT ?
          `).all(
            ...(subject ? [subject, subject] : []),
            3 - top3.length
          ).map(r => {
            const t = require('../db').rowToTutor(r);
            return { ...t, matchScore: t.rating * 1.5, matchReasons: [`Высокий рейтинг: ${t.rating}`] };
          })
        : [];
      top3.push(...legacyTutors);
    }

    ok(res, {
      message: 'Quiz submitted. Here are your top matches!',
      interests,
      learningStyle: learningStyle ?? null,
      topMatches: top3,
    });
  }
);

// Генерация причин совпадения
function buildMatchReasons(teacher, interests) {
  const reasons = [];
  const tags = parseJson(teacher.tags, []).map(s => s.toLowerCase());
  for (const interest of interests) {
    for (const tag of tags) {
      if (tag.includes(interest.toLowerCase())) {
        reasons.push(`Общий интерес: ${interest}`);
        break;
      }
    }
  }
  if (teacher.rating >= 4.8) reasons.push(`Высокий рейтинг: ${teacher.rating} ⭐`);
  if (!reasons.length) reasons.push('Рекомендован платформой');
  return [...new Set(reasons)].slice(0, 3);
}

// Форматтер урока
function formatLesson(l) {
  return {
    id: l.id,
    teacherName: l.teacher_name ?? l.student_name ?? null,
    subject: l.subject ?? null,
    scheduledAt: l.scheduled_at,
    status: l.status,
    topic: l.topic ?? null,
  };
}

module.exports = router;
