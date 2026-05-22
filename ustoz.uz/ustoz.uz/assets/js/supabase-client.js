/**
 * supabase-client.js — Интеграция с Supabase
 * Подключить: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 */

// ── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';   // замените
const SUPABASE_KEY  = 'YOUR_ANON_KEY';                       // замените

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);


// ═══════════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════════

/** Регистрация + создание профиля */
async function register({ name, email, password, role, phone }) {
  // 1. Supabase Auth
  const { data: authData, error: authErr } = await db.auth.signUp({ email, password });
  if (authErr) throw authErr;

  const userId = authData.user.id;

  // 2. Запись в users
  await db.from('users').insert({ id: userId, name, email, role: role || 'student', phone });

  // 3. Пустой профиль по роли
  if (role === 'tutor') {
    await db.from('teacher_profiles').insert({ user_id: userId });
  } else {
    await db.from('student_profiles').insert({ user_id: userId });
  }

  return authData;
}

/** Вход */
async function login(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Выход */
async function logout() {
  await db.auth.signOut();
  window.location.href = '/index.html';
}

/** Текущий пользователь */
async function getCurrentUser() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db.from('users').select('*').eq('id', user.id).single();
  return profile;
}


// ═══════════════════════════════════════════════════════════════════════════
//  STUDENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

async function getStudentDashboard() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Профиль
  const { data: profile } = await db.from('student_profiles').select('*').eq('user_id', user.id).single();

  // Ближайший урок
  const { data: nextLesson } = await db
    .from('lessons')
    .select(`*, users!teacher_id(name), teacher_profiles!teacher_id(subject, rating, hourly_rate)`)
    .eq('student_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Мои учителя
  const { data: lessonRows } = await db
    .from('lessons')
    .select('teacher_id, users!teacher_id(id, name), teacher_profiles!teacher_id(subject, hourly_rate, rating)')
    .eq('student_id', user.id);

  const teacherMap = {};
  for (const row of (lessonRows || [])) {
    const tid = row.teacher_id;
    if (!teacherMap[tid]) {
      teacherMap[tid] = { ...row['users!teacher_id'], ...row['teacher_profiles!teacher_id'], lessonsCount: 0 };
    }
    teacherMap[tid].lessonsCount++;
  }
  const teachers = Object.values(teacherMap);

  // Предстоящие уроки
  const { data: upcoming } = await db
    .from('lessons')
    .select(`*, users!teacher_id(name), teacher_profiles!teacher_id(subject)`)
    .eq('student_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())
    .lte('scheduled_at', new Date(Date.now() + 7 * 86400000).toISOString())
    .order('scheduled_at', { ascending: true });

  // История
  const { data: history } = await db
    .from('lessons')
    .select(`*, users!teacher_id(name), teacher_profiles!teacher_id(subject)`)
    .eq('student_id', user.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(20);

  return { profile, nextLesson, teachers, upcoming: upcoming || [], history: history || [] };
}


// ═══════════════════════════════════════════════════════════════════════════
//  TEACHER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

async function getTeacherDashboard() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Профиль
  const { data: profile } = await db.from('teacher_profiles').select('*').eq('user_id', user.id).single();

  // Следующий урок
  const { data: nextLesson } = await db
    .from('lessons')
    .select(`*, users!student_id(name), student_profiles!student_id(interests, learning_style)`)
    .eq('teacher_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Статистика за месяц
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const { data: monthLessons } = await db
    .from('lessons')
    .select('student_id')
    .eq('teacher_id', user.id)
    .eq('status', 'completed')
    .gte('scheduled_at', monthStart.toISOString());

  const hoursMonth    = (monthLessons || []).length;
  const studentsMonth = new Set((monthLessons || []).map(l => l.student_id)).size;
  const earningsMonth = hoursMonth * (profile?.hourly_rate ?? 0);

  // Активные ученики
  const { data: lessonRows } = await db
    .from('lessons')
    .select(`
      student_id,
      users!student_id(id, name, email),
      student_profiles!student_id(interests, learning_style),
      status, scheduled_at
    `)
    .eq('teacher_id', user.id)
    .order('scheduled_at', { ascending: false });

  const studentMap = {};
  for (const row of (lessonRows || [])) {
    const sid = row.student_id;
    if (!studentMap[sid]) {
      studentMap[sid] = {
        ...row['users!student_id'],
        ...row['student_profiles!student_id'],
        lessonsCount: 0, nextLesson: null,
      };
    }
    studentMap[sid].lessonsCount++;
    if (row.status === 'confirmed' && !studentMap[sid].nextLesson) {
      studentMap[sid].nextLesson = row.scheduled_at;
    }
  }

  return {
    profile,
    subscription: { active: profile?.subscription_status ?? false, price: 2 },
    stats: { hoursMonth, studentsMonth, earningsMonth, rating: profile?.rating ?? 5.0 },
    nextLesson,
    students: Object.values(studentMap),
  };
}


// ═══════════════════════════════════════════════════════════════════════════
//  QUIZ / MATCHING
// ═══════════════════════════════════════════════════════════════════════════

/** Сохраняет результат теста и возвращает ТОП-3 учителей */
async function submitQuiz({ interests, subject, learningStyle, budget }) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Сохранить профиль ученика
  await db.from('student_profiles').upsert({
    user_id: user.id,
    interests: interests,
    learning_style: learningStyle ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // 2. Вызвать matching-функцию PostgreSQL
  const { data: matches, error } = await db.rpc('match_teachers_for_student', {
    p_interests: interests,
    p_subject:   subject   ?? null,
    p_max_rate:  budget    ?? 9999,
  });

  if (error) {
    // Fallback: простой запрос если функция недоступна
    const { data: fallback } = await db
      .from('teacher_profiles')
      .select('*, users!user_id(id, name)')
      .eq('subscription_status', true)
      .order('rating', { ascending: false })
      .limit(3);

    return (fallback || []).map(t => ({
      id: t['users!user_id']?.id,
      name: t['users!user_id']?.name,
      subject: t.subject,
      hourlyRate: t.hourly_rate,
      rating: t.rating,
      bio: t.bio,
      matchScore: t.rating * 1.5,
      matchReasons: ['Рекомендован платформой'],
    }));
  }

  return (matches || []).slice(0, 3).map(m => ({
    id: m.teacher_id,
    name: m.teacher_name,
    subject: m.subject,
    hourlyRate: m.hourly_rate,
    rating: m.rating,
    bio: m.bio,
    matchScore: m.match_score,
    matchReasons: m.match_reasons || [],
  }));
}


// ═══════════════════════════════════════════════════════════════════════════
//  LESSONS
// ═══════════════════════════════════════════════════════════════════════════

async function bookLesson({ teacherId, scheduledAt, topic }) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await db.from('lessons').insert({
    student_id:   user.id,
    teacher_id:   teacherId,
    scheduled_at: scheduledAt,
    topic:        topic ?? null,
    status:       'pending',
  }).select().single();

  if (error) throw error;
  return data;
}

async function updateLessonStatus(lessonId, status) {
  const { data, error } = await db
    .from('lessons')
    .update({ status })
    .eq('id', lessonId)
    .select()
    .single();
  if (error) throw error;
  return data;
}


// ── EXPORT (если используете модули) ────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = { db, register, login, logout, getCurrentUser,
    getStudentDashboard, getTeacherDashboard, submitQuiz, bookLesson, updateLessonStatus };
}
