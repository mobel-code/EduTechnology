'use strict';

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { body, param, query, validationResult } = require('express-validator');

const { getDb, parseJson, rowToTutor, safeUser } = require('./db');
const translations = require('./translations');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'ustoz_dev_secret_change_in_production';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(morgan('dev'));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests.' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many auth attempts.' },
});

const ok = (res, data, code = 200) => res.status(code).json({ success: true, ...data });
const fail = (res, msg, code = 400) => res.status(code).json({ success: false, error: msg });

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 'Authorisation required.', 401);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    fail(res, 'Invalid or expired token.', 401);
  }
}

const SUBJECT_MAP = {
  'Ingliz tili': 'English', 'Английский': 'English', English: 'English',
  'Ispan tili': 'Spanish', 'Испанский': 'Spanish', Spanish: 'Spanish',
  'Nemis tili': 'German', 'Немецкий': 'German', German: 'German',
  Matematika: 'Mathematics', 'Математика': 'Mathematics',
  Fizika: 'Physics', Dasturlash: 'Programming',
};

const SCHEDULE_TO_TIME = {
  'Ertalab (8:00–12:00)': 'Утро', 'Утро': 'Утро', Morning: 'Утро',
  'Kunduz (12:00–17:00)': 'День', 'День': 'День', Day: 'День',
  'Kechqurun (17:00–21:00)': 'Вечер', 'Вечер': 'Вечер', Evening: 'Вечер',
  'Moslashuvchan jadval': null, 'Выходные': 'Выходные', Weekend: 'Выходные',
};

function budgetToMaxUsd(budget) {
  if (!budget) return 999;
  const b = String(budget).toLowerCase();
  if (b.includes('200 000') && b.includes('ko\'p')) return 999;
  if (b.includes('100 000') && b.includes('200 000')) return 40;
  if (b.includes('50 000') && b.includes('100 000')) return 25;
  if (b.includes('50 000') || b.includes('gacha')) return 15;
  if (b.includes('$40') || b.includes('40+')) return 999;
  if (b.includes('$20') && b.includes('$40')) return 40;
  if (b.includes('$10')) return 20;
  return 999;
}

// ─── Health ───
app.get('/health', (req, res) => {
  const db = getDb();
  const tutors = db.prepare('SELECT COUNT(*) AS c FROM tutors').get().c;
  ok(res, { status: 'ok', version: '1.0.0', database: 'sqlite', tutors, uptime: process.uptime() });
});

// ─── Translations ───
app.get('/api/lang', (req, res) => {
  ok(res, {
    languages: [
      { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
      { code: 'ru', label: 'Русский', flag: '🇷🇺' },
      { code: 'en', label: 'English', flag: '🇬🇧' },
    ],
  });
});

app.get('/api/lang/:code', param('code').isIn(['en', 'ru', 'uz']), (req, res) => {
  if (!validate(req, res)) return;
  const data = translations[req.params.code];
  if (!data) return fail(res, 'Language not found.', 404);
  ok(res, { lang: req.params.code, translations: data });
});

app.get('/api/lang/:code/:section', param('code').isIn(['en', 'ru', 'uz']), (req, res) => {
  if (!validate(req, res)) return;
  const data = translations[req.params.code]?.[req.params.section];
  if (!data) return fail(res, 'Section not found.', 404);
  ok(res, { lang: req.params.code, section: req.params.section, data });
});

// ─── Applications (registration forms) ───
app.post(
  '/api/applications/student',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
  ],
  (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const d = req.body;
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO student_applications (
        id, name, age, email, phone, subjects, goal, level, teacher_styles,
        lesson_language, schedule, budget, app_lang, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, d.name, d.age || null, d.email, d.phone || null,
      JSON.stringify(d.subjects || []), d.goal || null, d.level || null,
      JSON.stringify(d.teacherStyles || d.teacher_styles || []),
      d.language || d.lesson_language || null,
      d.schedule || null, d.budget || null, d.lang || 'uz', now,
    );

    ok(res, { message: 'Application received. We will contact you within 24 hours.', applicationId: id }, 201);
  },
);

app.post(
  '/api/applications/tutor',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('bio').trim().isLength({ min: 50 }),
  ],
  (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const d = req.body;
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tutor_applications (
        id, name, email, phone, city, subjects, experience, education, bio,
        achievements, languages, styles, rate, format, app_lang, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, d.name, d.email, d.phone || null, d.city || null,
      JSON.stringify(d.subjects || []), d.experience || null, d.education || null,
      d.bio, d.achievements || null,
      JSON.stringify(d.languages || []), JSON.stringify(d.styles || []),
      d.rate || null, d.format || null, d.lang || 'uz', now,
    );

    ok(res, { message: 'Tutor application submitted for review.', applicationId: id }, 201);
  },
);

// ─── Contact & newsletter ───
app.post(
  '/api/contact',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('subject').trim().notEmpty(),
    body('message').trim().isLength({ min: 10 }),
  ],
  (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO messages (id, name, email, subject, body, created_at) VALUES (?,?,?,?,?,?)')
      .run(id, req.body.name, req.body.email, req.body.subject, req.body.message, now);
    ok(res, { message: 'Message received.' }, 201);
  },
);

app.post('/api/newsletter/subscribe', body('email').isEmail().normalizeEmail(), (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { email } = req.body;
  const existing = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
  const now = new Date().toISOString();
  if (existing) {
    db.prepare('UPDATE subscribers SET active = 1 WHERE email = ?').run(email);
    return ok(res, { message: 'Subscription reactivated.' });
  }
  db.prepare('INSERT INTO subscribers (id, email, active, created_at) VALUES (?,?,1,?)').run(uuid(), email, now);
  ok(res, { message: 'Subscribed successfully.' }, 201);
});

app.post('/api/newsletter/unsubscribe', body('email').isEmail().normalizeEmail(), (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const r = db.prepare('UPDATE subscribers SET active = 0 WHERE email = ?').run(req.body.email);
  if (!r.changes) return fail(res, 'Email not found.', 404);
  ok(res, { message: 'Unsubscribed.' });
});

// ─── Tutors ───
function queryTutors(filters = {}) {
  const db = getDb();
  let sql = 'SELECT * FROM tutors WHERE verified = 1';
  const params = {};

  if (filters.subject) {
    sql += ' AND (subject = @subject OR language_taught = @subject)';
    params.subject = filters.subject;
  }
  if (filters.lang) {
    sql += ' AND langs LIKE @langLike';
    params.langLike = `%${filters.lang}%`;
  }
  if (filters.maxPrice != null) {
    sql += ' AND price_usd <= @maxPrice';
    params.maxPrice = filters.maxPrice;
  }
  if (filters.minRating) {
    sql += ' AND rating >= @minRating';
    params.minRating = filters.minRating;
  }

  let rows = db.prepare(sql).all(params);

  if (filters.goal) {
    rows = rows.filter((r) => parseJson(r.goals).some((g) => g.includes(filters.goal) || filters.goal.includes(g)));
  }
  if (filters.time) {
    rows = rows.filter((r) => parseJson(r.time_slots).includes(filters.time));
  }
  if (filters.language) {
    rows = rows.filter((r) =>
      r.language_taught === filters.language
      || r.subject === SUBJECT_MAP[filters.language]
      || (filters.language && r.language_taught && r.language_taught.includes(filters.language)),
    );
  }

  const sort = filters.sort;
  if (sort === 'price_asc') rows.sort((a, b) => a.price_usd - b.price_usd);
  else if (sort === 'price_desc') rows.sort((a, b) => b.price_usd - a.price_usd);
  else if (sort === 'rating_desc') rows.sort((a, b) => b.rating - a.rating);
  else rows.sort((a, b) => b.review_count * b.rating - a.review_count * a.rating);

  return rows.map(rowToTutor);
}

app.get('/api/tutors', (req, res) => {
  const { subject, lang, minPrice, maxPrice, minRating, sort, language, goal, time } = req.query;
  const tutors = queryTutors({
    subject: subject || (language && SUBJECT_MAP[language]),
    lang,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    sort,
    language,
    goal,
    time,
  }).filter((t) => (minPrice ? t.price >= Number(minPrice) : true));
  ok(res, { count: tutors.length, tutors });
});

app.post('/api/tutors/match', (req, res) => {
  const { language, goal, budget, time, budgetMax } = req.body || {};
  const maxUsd = budgetMax || budgetToMaxUsd(budget);
  const timeSlot = SCHEDULE_TO_TIME[time] || time;
  const subject = SUBJECT_MAP[language] || language;

  const tutors = queryTutors({
    language: language || undefined,
    subject,
    goal,
    time: timeSlot,
    maxPrice: maxUsd,
  });

  ok(res, { count: tutors.length, tutors, criteria: { language, goal, budget, time: timeSlot, maxUsd } });
});

app.get('/api/tutors/:id', param('id').isUUID(), (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const row = db.prepare('SELECT * FROM tutors WHERE id = ?').get(req.params.id);
  if (!row) return fail(res, 'Tutor not found.', 404);
  const reviews = db.prepare('SELECT * FROM reviews WHERE tutor_id = ? ORDER BY created_at DESC').all(req.params.id);
  ok(res, {
    tutor: rowToTutor(row),
    reviews: reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at,
    })),
  });
});

app.get('/api/subjects', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT subject FROM tutors ORDER BY subject').all();
  ok(res, { subjects: rows.map((r) => r.subject) });
});

// ─── Stats ───
app.get('/api/stats', (req, res) => {
  const db = getDb();
  const base = db.prepare('SELECT * FROM platform_stats WHERE id = 1').get();
  const tutorsCount = db.prepare('SELECT COUNT(*) AS c FROM tutors').get().c;
  const students = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'student'").get().c;
  const lessons = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'completed'").get().c;
  ok(res, {
    stats: {
      tutors: base.tutors + tutorsCount,
      countries: base.countries,
      subjects: base.subjects,
      lessons: base.lessons + lessons,
      students,
    },
  });
});

// ─── Auth ───
app.post(
  '/api/auth/register',
  authLimiter,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['student', 'tutor']),
    body('lang').optional().isIn(['en', 'ru', 'uz']),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const { name, email, password, role = 'student', lang = 'uz', phone } = req.body;
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      return fail(res, 'Email already registered.');
    }
    const id = uuid();
    const hash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (id, name, email, password_hash, role, lang, phone, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, name, email, hash, role, lang, phone || null, now);
    const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });
    ok(res, { message: 'Account created.', token, user: { id, name, email, role, lang, phone, createdAt: now } }, 201);
  },
);

app.post(
  '/api/auth/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);
    if (!user?.password_hash || !(await bcrypt.compare(req.body.password, user.password_hash))) {
      return fail(res, 'Invalid email or password.', 401);
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    ok(res, { message: 'Login successful.', token, user: safeUser(user) });
  },
);

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return fail(res, 'User not found.', 404);
  ok(res, { user: safeUser(user) });
});

app.patch('/api/auth/me/lang', authMiddleware, body('lang').isIn(['en', 'ru', 'uz']), (req, res) => {
  if (!validate(req, res)) return;
  getDb().prepare('UPDATE users SET lang = ? WHERE id = ?').run(req.body.lang, req.user.id);
  ok(res, { message: 'Language updated.', lang: req.body.lang });
});

// ─── Bookings ───
app.post(
  '/api/bookings',
  authMiddleware,
  [
    body('tutorId').isUUID(),
    body('date').optional().isISO8601(),
    body('slotDate').optional(),
    body('slotTime').notEmpty(),
  ],
  (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const { tutorId, date, slotDate, slotTime } = req.body;
    if (!db.prepare('SELECT id FROM tutors WHERE id = ?').get(tutorId)) {
      return fail(res, 'Tutor not found.', 404);
    }
    const id = uuid();
    const now = new Date().toISOString();
    const lessonDate = slotDate || (date ? date.slice(0, 10) : now.slice(0, 10));
    db.prepare(`
      INSERT INTO bookings (id, student_id, tutor_id, slot_date, slot_time, status, created_at)
      VALUES (?,?,?,?,?,'pending',?)
    `).run(id, req.user.id, tutorId, lessonDate, slotTime, now);
    ok(res, { message: 'Lesson booked.', booking: { id, tutorId, slotDate: lessonDate, slotTime, status: 'pending' } }, 201);
  },
);

app.get('/api/bookings', authMiddleware, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT b.*, t.name AS tutor_name, t.photo AS tutor_photo, t.subject
    FROM bookings b
    JOIN tutors t ON t.id = b.tutor_id
    WHERE b.student_id = ? OR b.tutor_id = ?
    ORDER BY b.slot_date ASC, b.slot_time ASC
  `).all(req.user.id, req.user.id);
  ok(res, { bookings: rows });
});

app.patch('/api/bookings/:id/cancel', authMiddleware, param('id').isUUID(), (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!b) return fail(res, 'Booking not found.', 404);
  if (b.student_id !== req.user.id) return fail(res, 'Not authorised.', 403);
  if (b.status === 'cancelled') return fail(res, 'Already cancelled.');
  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  ok(res, { message: 'Booking cancelled.' });
});

// ─── Reviews ───
app.post(
  '/api/reviews',
  authMiddleware,
  [
    body('tutorId').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().isLength({ min: 10 }),
  ],
  (req, res) => {
    if (!validate(req, res)) return;
    const db = getDb();
    const { tutorId, rating, comment } = req.body;
    if (!db.prepare('SELECT id FROM tutors WHERE id = ?').get(tutorId)) {
      return fail(res, 'Tutor not found.', 404);
    }
    const id = uuid();
    const now = new Date().toISOString();
    try {
      db.prepare('INSERT INTO reviews (id, student_id, tutor_id, rating, comment, created_at) VALUES (?,?,?,?,?,?)')
        .run(id, req.user.id, tutorId, rating, comment, now);
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) return fail(res, 'Already reviewed this tutor.');
      throw e;
    }
    const avg = db.prepare('SELECT AVG(rating) AS a, COUNT(*) AS c FROM reviews WHERE tutor_id = ?').get(tutorId);
    db.prepare('UPDATE tutors SET rating = ?, review_count = ? WHERE id = ?')
      .run(Math.round(avg.a * 10) / 10, avg.c, tutorId);
    ok(res, { message: 'Review submitted.', review: { id, rating, comment } }, 201);
  },
);

app.get('/api/reviews', (req, res) => {
  const db = getDb();
  const { tutorId } = req.query;
  const rows = tutorId
    ? db.prepare('SELECT * FROM reviews WHERE tutor_id = ?').all(tutorId)
    : db.prepare('SELECT * FROM reviews').all();
  ok(res, { count: rows.length, reviews: rows });
});

// ─── Dashboard & Quiz routes ───
app.use('/api', dashboardRoutes);

// ─── Static site ───
const siteRoot = path.join(__dirname, '..', 'ustoz.uz');
app.use(express.static(siteRoot));
app.get('/', (req, res) => res.sendFile(path.join(siteRoot, 'index.html')));

app.use((req, res) => {
  if (req.path.startsWith('/api')) return fail(res, `Route ${req.method} ${req.path} not found.`, 404);
  res.sendFile(path.join(siteRoot, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  fail(res, 'Internal server error.', 500);
});

module.exports = app;
