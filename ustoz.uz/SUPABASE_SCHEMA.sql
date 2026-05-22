-- ═══════════════════════════════════════════════════════════════════════════
--  USTOZ.UZ — Supabase PostgreSQL Schema
--  Запустить в Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- для поиска по тегам


-- ─── 1. USERS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','tutor','admin')),
  lang          TEXT NOT NULL DEFAULT 'uz' CHECK(lang IN ('uz','ru','en')),
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);


-- ─── 2. STUDENT PROFILES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  interests      JSONB NOT NULL DEFAULT '[]',       -- ["Путешествия","Технологии"]
  learning_style TEXT CHECK(learning_style IN ('visual','auditory','kinesthetic','logical')),
  level          TEXT CHECK(level IN ('A1','A2','B1','B2','C1','C2')),
  goal           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска по интересам (GIN для JSONB)
CREATE INDEX IF NOT EXISTS idx_student_interests ON student_profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_student_style     ON student_profiles(learning_style);


-- ─── 3. TEACHER PROFILES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id                   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  subject                   TEXT NOT NULL DEFAULT '',
  bio                       TEXT,
  hourly_rate               NUMERIC(8,2) NOT NULL DEFAULT 10,
  subscription_status       BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_next_billing DATE,
  rating                    NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  tags                      JSONB NOT NULL DEFAULT '[]',  -- ["IELTS","Бизнес","Путешествия"]
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_sub     ON teacher_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_teacher_subject ON teacher_profiles(subject);
CREATE INDEX IF NOT EXISTS idx_teacher_rating  ON teacher_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_tags    ON teacher_profiles USING GIN(tags);


-- ─── 4. LESSONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES users(id),
  teacher_id    UUID NOT NULL REFERENCES users(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_min  INTEGER NOT NULL DEFAULT 60,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('pending','confirmed','completed','cancelled')),
  topic         TEXT,
  zoom_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_student   ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher   ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled ON lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lessons_status    ON lessons(status);


-- ─── 5. Авто-обновление updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_profile_updated
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_teacher_profile_updated
  BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
--  MATCHING FUNCTION — Подбор учителей по интересам
--  Вызов: SELECT * FROM match_teachers_for_student(
--           '["Технологии","Путешествия"]'::jsonb, 'Английский', 20.00
--         ) LIMIT 3;
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_teachers_for_student(
  p_interests   JSONB,
  p_subject     TEXT    DEFAULT NULL,
  p_max_rate    NUMERIC DEFAULT 9999
)
RETURNS TABLE (
  teacher_id    UUID,
  teacher_name  TEXT,
  subject       TEXT,
  hourly_rate   NUMERIC,
  rating        NUMERIC,
  bio           TEXT,
  match_score   NUMERIC,
  match_reasons JSONB
)
LANGUAGE plpgsql AS $$
DECLARE
  interest_text TEXT;
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      u.id                                                    AS tid,
      u.name                                                  AS tname,
      tp.subject                                              AS tsubject,
      tp.hourly_rate                                          AS trate,
      tp.rating                                               AS trating,
      tp.bio                                                  AS tbio,
      tp.tags,

      -- ── SCORING ────────────────────────────────────────────────────────
      -- Пересечение JSONB массивов: совпадающие элементы дают 2 очка каждый
      (
        SELECT COALESCE(SUM(2), 0)
        FROM jsonb_array_elements_text(p_interests) AS pi
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(tp.tags) AS tt
          WHERE LOWER(tt) LIKE '%' || LOWER(pi) || '%'
             OR LOWER(pi) LIKE '%' || LOWER(tt) || '%'
        )
      )
      -- Бонус за совпадение предмета (+3)
      + CASE WHEN p_subject IS NOT NULL
               AND LOWER(tp.subject) = LOWER(p_subject) THEN 3 ELSE 0 END
      -- Бонус за рейтинг (max +7.5 для рейтинга 5.0)
      + tp.rating * 1.5                                       AS score

    FROM teacher_profiles tp
    JOIN users u ON u.id = tp.user_id
    WHERE tp.subscription_status = TRUE
      AND tp.hourly_rate <= p_max_rate
      AND (p_subject IS NULL OR LOWER(tp.subject) = LOWER(p_subject))
  )
  SELECT
    tid,
    tname,
    tsubject,
    trate,
    trating,
    tbio,
    score::NUMERIC AS match_score,

    -- Причины совпадения (JSON-массив строк)
    (
      SELECT jsonb_agg(reason)
      FROM (
        -- общие интересы
        SELECT 'Общий интерес: ' || pi AS reason
        FROM jsonb_array_elements_text(p_interests) AS pi
        WHERE EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(tags) AS tt
          WHERE LOWER(tt) LIKE '%' || LOWER(pi) || '%'
        )
        LIMIT 2
        UNION ALL
        -- высокий рейтинг
        SELECT 'Высокий рейтинг: ' || trating::TEXT || ' ⭐'
        WHERE trating >= 4.8
        LIMIT 1
      ) sub
    ) AS match_reasons

  FROM scored
  ORDER BY score DESC;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) — Supabase Auth
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons           ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои данные
CREATE POLICY "Users: own row" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "StudentProfile: own" ON student_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "TeacherProfile: own"  ON teacher_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Профили учителей видны всем авторизованным (для поиска)
CREATE POLICY "TeacherProfile: read all" ON teacher_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Уроки: ученик видит свои, учитель видит свои
CREATE POLICY "Lessons: student sees own" ON lessons
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Lessons: teacher sees own" ON lessons
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Lessons: student creates" ON lessons
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Lessons: update by participants" ON lessons
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = teacher_id);


-- ═══════════════════════════════════════════════════════════════════════════
--  DEMO SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Вставить вручную через Supabase Auth или API; здесь только профили:

INSERT INTO teacher_profiles (user_id, subject, bio, hourly_rate, subscription_status, rating, tags)
VALUES
  -- Замените UUID на реальные ID из auth.users после регистрации
  ('00000000-0000-0000-0000-000000000001',
   'Английский язык',
   'Преподаватель IELTS и бизнес-английского. 5 лет опыта.',
   12, TRUE, 4.9,
   '["IELTS","Бизнес","Путешествия","Технологии","Разговорный"]'),

  ('00000000-0000-0000-0000-000000000002',
   'Математика',
   'Репетитор по математике и физике. Готовлю к ЕГЭ и олимпиадам.',
   10, TRUE, 4.8,
   '["Алгебра","Геометрия","Физика","Программирование","Наука"]'),

  ('00000000-0000-0000-0000-000000000003',
   'Программирование',
   'Full-stack разработчик, преподаю Python и JavaScript с нуля.',
   15, TRUE, 4.7,
   '["Python","JavaScript","Технологии","Стартапы","ИИ"]')
ON CONFLICT DO NOTHING;
