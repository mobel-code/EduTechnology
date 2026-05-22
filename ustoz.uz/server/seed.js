'use strict';

const { v4: uuid } = require('uuid');
const { getDb } = require('./db');

const TUTORS = [
  { name: 'Анна Петрова', subject: 'English', language_taught: 'Английский', flag: '🇷🇺', langs: ['uz','ru','en'], rating: 4.9, price_usd: 28, review_count: 127, goals: ['Для работы','Сдача экзаменов'], time_slots: ['Утро','День'], photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', bio: 'IELTS va Business English mutaxassisi.' },
  { name: 'James Wilson', subject: 'English', language_taught: 'Английский', flag: '🇺🇸', langs: ['en'], rating: 5.0, price_usd: 35, review_count: 89, goals: ['Для работы','Для путешествий'], time_slots: ['Вечер','Выходные'], photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', bio: 'Native speaker, corporate English.' },
  { name: 'Мария Козлова', subject: 'Spanish', language_taught: 'Испанский', flag: '🇪🇸', langs: ['uz','ru'], rating: 4.8, price_usd: 18, review_count: 64, goals: ['Для путешествий','Для себя'], time_slots: ['Утро','Выходные'], photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', bio: 'Sayohat uchun ispan tili.' },
  { name: 'Carlos Mendez', subject: 'Spanish', language_taught: 'Испанский', flag: '🇲🇽', langs: ['en','ru'], rating: 4.9, price_usd: 32, review_count: 112, goals: ['Для работы','Сдача экзаменов'], time_slots: ['День','Вечер'], photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', bio: 'DELE imtihoniga tayyorgarlik.' },
  { name: 'Hans Becker', subject: 'German', language_taught: 'Немецкий', flag: '🇩🇪', langs: ['de','en'], rating: 4.9, price_usd: 42, review_count: 76, goals: ['Для работы','Сдача экзаменов'], time_slots: ['Вечер','Выходные'], photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', bio: 'Goethe-Zertifikat, IT nemis tili.' },
  { name: 'Sophie Martin', subject: 'German', language_taught: 'Немецкий', flag: '🇫🇷', langs: ['ru','en'], rating: 4.7, price_usd: 24, review_count: 53, goals: ['Сдача экзаменов','Для себя'], time_slots: ['День','Вечер'], photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', bio: 'A1–B2 strukturali darslar.' },
  { name: 'Aisha Karimova', subject: 'English', language_taught: 'Ingliz tili', flag: '🇺🇿', langs: ['uz','ru','en'], rating: 4.9, price_usd: 15, review_count: 98, goals: ['Сдача экзаменов','Для работы'], time_slots: ['Утро','День'], photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', bio: 'IELTS 8+ o\'quvchilar.' },
  { name: 'Bobur Yusupov', subject: 'Programming', language_taught: 'Dasturlash', flag: '🇺🇿', langs: ['uz','ru'], rating: 4.7, price_usd: 12, review_count: 45, goals: ['Для работы','Для себя'], time_slots: ['Вечер','Выходные'], photo: 'https://images.unsplash.com/photo-1519085360755-af0119f7cbe7?w=400&h=400&fit=crop', bio: 'Python, JavaScript, algoritmlar.' },
  { name: 'Ivan Petrov', subject: 'Mathematics', language_taught: 'Matematika', flag: '🇷🇺', langs: ['ru','uz'], rating: 4.8, price_usd: 20, review_count: 156, goals: ['Сдача экзаменов','Для работы'], time_slots: ['День','Вечер'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', bio: 'Olimpiada va DTM tayyorgarligi.' },
  { name: 'Timur Nazarov', subject: 'Physics', language_taught: 'Fizika', flag: '🇺🇿', langs: ['uz','ru'], rating: 4.6, price_usd: 14, review_count: 38, goals: ['Сдача экзаменов'], time_slots: ['Утро','День'], photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', bio: 'Universitet professori.' },
  { name: 'Elena Rossi', subject: 'Spanish', language_taught: 'Испанский', flag: '🇮🇹', langs: ['ru','en'], rating: 4.6, price_usd: 15, review_count: 38, goals: ['Для себя','Для путешествий'], time_slots: ['Утро','День'], available_today: 0, photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', bio: 'Boshlang\'ich daraja.' },
  { name: 'David Chen', subject: 'Programming', language_taught: 'Dasturlash', flag: '🇬🇧', langs: ['en'], rating: 5.0, price_usd: 45, review_count: 201, goals: ['Для работы','Сдача экзаменов'], time_slots: ['День','Вечер'], photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', bio: 'Senior engineer, algorithms.' },
];

function seedIfEmpty() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) AS c FROM tutors').get().c;
  if (count > 0) return false;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO tutors (
      id, name, subject, language_taught, langs, rating, price_usd, bio, flag, photo,
      goals, time_slots, available_today, verified, review_count, created_at
    ) VALUES (
      @id, @name, @subject, @language_taught, @langs, @rating, @price_usd, @bio, @flag, @photo,
      @goals, @time_slots, @available_today, 1, @review_count, @created_at
    )
  `);

  const tx = db.transaction((rows) => {
    rows.forEach((t) => {
      insert.run({
        id: uuid(),
        name: t.name,
        subject: t.subject,
        language_taught: t.language_taught,
        langs: JSON.stringify(t.langs),
        rating: t.rating,
        price_usd: t.price_usd,
        bio: t.bio,
        flag: t.flag,
        photo: t.photo,
        goals: JSON.stringify(t.goals),
        time_slots: JSON.stringify(t.time_slots),
        available_today: t.available_today ?? 1,
        review_count: t.review_count,
        created_at: now,
      });
    });
  });

  tx(TUTORS);
  console.log(`[seed] Inserted ${TUTORS.length} tutors into database.`);
  return true;
}

if (require.main === module) {
  seedIfEmpty();
}

module.exports = { seedIfEmpty, TUTORS };
