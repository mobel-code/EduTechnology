'use strict';

// ════════════════════════════════════════════════════════════
//  ustoz.uz — Registration modal + Language switcher
//  Features:
//   - 3-language switcher (UZ / RU / EN) in navbar
//   - Full site translation on language switch
//   - Student multi-step form (3 steps)
//   - Tutor multi-step form (4 steps)
//   - localStorage persistence (data survives page reload)
//   - +998 Uzbek phone validation (strict)
//   - Email format validation
//   - All required fields enforced
//   - Responsive design (mobile / tablet / laptop / desktop)
// ════════════════════════════════════════════════════════════

(function () {

  // ──────────────────────────────────────────────────────────
  //  1. TRANSLATIONS
  // ──────────────────────────────────────────────────────────
  var T = {
    uz: {
      langCode: 'uz',
      nav: { home: "Bosh sahifa", findTutor: "O'qituvchi topish", subjects: "Fanlar", howItWorks: "Qanday ishlaydi", pricing: "Narxlar" },
      heroCta1: "O'qituvchi topish", heroCta2: "O'qituvchi bo'lish",
      headerBtn: "Bepul dars sinash",
      ctaBtn: "Bepul sinov darsini bron qilish",
      footerFind: "O'qituvchi topish", footerBecome: "O'qituvchi bo'lish",
      footerSubjects: "Barcha fanlar", footerTerms: "Foydalanish shartlari", footerPrivacy: "Maxfiylik siyosati",
      footerSubscribeBtn: "Obuna bo'lish", footerEmailPlaceholder: "Email manzilingiz",
      modal: {
        welcome: "Xush kelibsiz!",
        whoAreYou: "Siz kimsiz? Davom etish uchun rolni tanlang",
        student: "Men o'quvchiman", studentSub: "O'qituvchi topmoqchiman",
        tutor: "Men o'qituvchiman", tutorSub: "Dars bermoqchiman",
        back: "Orqaga", next: "Davom etish",
        s1title: "O'zingiz haqingizda", s1label: "1/3 — Asosiy ma'lumot",
        sName: "Ismingiz *", sNamePh: "Masalan: Alisher",
        sAge: "Yoshingiz *",
        sAgeOpts: ["— Tanlang —","12 yoshgacha","12–15 yosh","16–18 yosh","19–25 yosh","26–35 yosh","36 va undan katta"],
        sEmail: "Email *", sEmailPh: "misol@mail.com",
        sPhone: "Telefon (O'zbekiston) *",
        s2label: "2/3 — Fan va maqsad", s2title: "Nima o'rganmoqchisiz?",
        sSubjectLabel: "Fanni tanlang *",
        subjects: ["Ingliz tili","Rus tili","O'zbek tili","Matematika","Fizika","Kimyo","Dasturlash","Biologiya","Tarix","Boshqa"],
        sGoal: "Asosiy maqsadingiz *",
        sGoalOpts: ["— Tanlang —","Imtihonga tayyorgarlik (IELTS, SAT...)","Maktab dasturiga yordam","O'z xohishim uchun","Kareraga oid","Suhbat amaliyoti","Boshqa"],
        sLevel: "Hozirgi darajangiz",
        sLevelOpts: ["— Tanlang —","Boshlang'ich (noldan)","Elementar","O'rta","Yuqori"],
        s3label: "3/3 — Afzalliklar", s3title: "Qanday o'qituvchi yoqadi?",
        sStyleLabel: "O'qitish uslubi *",
        styles: ["Qattiq va talab qiluvchi","Do'stona va quvnoq","Sabr-toqatli va tinch","Faol va dadil","Ijodiy yondashuv","Amaliy topshiriqlar"],
        sStyleHint: "Bir nechtasini tanlash mumkin",
        sLangLabel: "Dars tili",
        sLangs: ["O'zbekcha","Ruscha","Inglizcha"],
        sSchedule: "Qulay vaqt", sScheduleOpts: ["— Tanlang —","Ertalab (8:00–12:00)","Kunduz (12:00–17:00)","Kechqurun (17:00–21:00)","Moslashuvchan jadval"],
        sBudget: "Dars narxi (so'mda)", sBudgetOpts: ["— Tanlang —","50 000 so'mgacha","50 000–100 000 so'm","100 000–200 000 so'm","200 000 so'mdan ko'p"],
        sSubmit: "O'qituvchi topish",
        t1label: "1/4 — Shaxsiy ma'lumot", t1title: "O'zingiz haqingizda",
        tName: "To'liq ismingiz *", tNamePh: "Masalan: Kamol Rashidov",
        tEmail: "Email *", tEmailPh: "misol@mail.com",
        tPhone: "Telefon (O'zbekiston) *",
        tCity: "Shahar", tCityOpts: ["— Tanlang —","Toshkent","Samarqand","Buxoro","Namangan","Andijon","Farg'ona","Boshqa"],
        t2label: "2/4 — Fan va tajriba", t2title: "Nima o'qitasiz?",
        tSubjectLabel: "Faningiz *",
        tExp: "O'qitish tajribasi *", tExpOpts: ["— Tanlang —","1 yildan kam","1–3 yil","3–5 yil","5–10 yil","10 yildan ko'p"],
        tEdu: "Ta'lim *", tEduOpts: ["— Tanlang —","Bakalavr","Magistr","Fan nomzodi/doktori","Professional sertifikat","Mustaqil ta'lim + amaliyot"],
        t3label: "3/4 — Yutuqlar", t3title: "Yutuqlaringiz",
        tBio: "O'zingiz haqingizda *", tBioPh: "Masalan: 7 yil matematika o'qitaman. O'quvchilarim olimpiadalarda g'olib bo'lishgan...",
        tBioHint: "Kamida 50 ta belgi",
        tAch: "Sertifikatlar va mukofotlar", tAchPh: "Masalan: IELTS 8.0, Cambridge CELTA...",
        tLangLabel: "Dars tillari *",
        t4label: "4/4 — Uslub va narx", t4title: "Uslub va shartlar",
        tStyleLabel: "O'qitish uslubingiz *", tStyleHint: "Bir nechtasini tanlash mumkin",
        tRate: "1 dars narxi (60 daqiqa) *", tRateOpts: ["— Tanlang —","50 000 so'mgacha","50 000–100 000 so'm","100 000–200 000 so'm","200 000 so'mdan ko'p"],
        tFormat: "Dars formati", tFormatOpts: ["— Tanlang —","Faqat onlayn","Faqat oflayn","Onlayn va oflayn"],
        tSubmit: "Anketani yuborish",
        successStudentTitle: "Ariza qabul qilindi!",
        successTutorTitle: "Anketa yuborildi!",
        successClose: "Yopish",
        errRequired: "Bu maydon to'ldirilishi shart",
        errEmail: "Noto'g'ri email manzil",
        errPhone: "O'zbekiston raqami kiriting: +998 XX XXX XX XX",
        errBioMin: "Kamida 50 ta belgi kiriting",
        errSelectChip: "Kamida bittasini tanlang",
      }
    },
    ru: {
      langCode: 'ru',
      nav: { home: "Главная", findTutor: "Найти репетитора", subjects: "Предметы", howItWorks: "Как это работает", pricing: "Цены" },
      heroCta1: "Найти репетитора", heroCta2: "Стать репетитором",
      headerBtn: "Попробовать бесплатно",
      ctaBtn: "Забронировать бесплатный урок",
      footerFind: "Найти репетитора", footerBecome: "Стать репетитором",
      footerSubjects: "Все предметы", footerTerms: "Условия использования", footerPrivacy: "Конфиденциальность",
      footerSubscribeBtn: "Подписаться", footerEmailPlaceholder: "Ваш email",
      modal: {
        welcome: "Добро пожаловать!",
        whoAreYou: "Кто вы? Выберите роль, чтобы продолжить",
        student: "Я ученик", studentSub: "Хочу найти учителя",
        tutor: "Я учитель", tutorSub: "Хочу преподавать",
        back: "Назад", next: "Продолжить",
        s1title: "Расскажите о себе", s1label: "1/3 — Основная информация",
        sName: "Ваше имя *", sNamePh: "Например: Алишер",
        sAge: "Ваш возраст *",
        sAgeOpts: ["— Выберите —","До 12 лет","12–15 лет","16–18 лет","19–25 лет","26–35 лет","36 и старше"],
        sEmail: "Email *", sEmailPh: "example@mail.com",
        sPhone: "Телефон (Узбекистан) *",
        s2label: "2/3 — Предмет и цели", s2title: "Что хотите изучать?",
        sSubjectLabel: "Выберите предмет *",
        subjects: ["Английский","Русский","Узбекский","Математика","Физика","Химия","Программирование","Биология","История","Другое"],
        sGoal: "Главная цель *",
        sGoalOpts: ["— Выберите —","Подготовка к экзамену (ЕГЭ, IELTS, SAT...)","Помощь со школьной программой","Для себя / хобби","Карьерное развитие","Разговорная практика","Другое"],
        sLevel: "Текущий уровень",
        sLevelOpts: ["— Выберите —","Начинающий (с нуля)","Элементарный","Средний","Продвинутый"],
        s3label: "3/3 — Предпочтения", s3title: "Какой учитель вам нравится?",
        sStyleLabel: "Стиль преподавания *",
        styles: ["Строгий и требовательный","Дружелюбный и весёлый","Терпеливый и спокойный","Энергичный и активный","Творческий подход","Практические задания"],
        sStyleHint: "Можно выбрать несколько",
        sLangLabel: "Язык урока",
        sLangs: ["Узбекский","Русский","Английский"],
        sSchedule: "Удобное время", sScheduleOpts: ["— Выберите —","Утром (8:00–12:00)","Днём (12:00–17:00)","Вечером (17:00–21:00)","Гибкий график"],
        sBudget: "Бюджет за урок", sBudgetOpts: ["— Выберите —","До 50 000 сум","50 000–100 000 сум","100 000–200 000 сум","Более 200 000 сум"],
        sSubmit: "Найти учителя",
        t1label: "1/4 — Личные данные", t1title: "Расскажите о себе",
        tName: "Полное имя *", tNamePh: "Например: Камол Рашидов",
        tEmail: "Email *", tEmailPh: "example@mail.com",
        tPhone: "Телефон (Узбекистан) *",
        tCity: "Город", tCityOpts: ["— Выберите —","Ташкент","Самарканд","Бухара","Наманган","Андижан","Фергана","Другой"],
        t2label: "2/4 — Предмет и опыт", t2title: "Чему вы обучаете?",
        tSubjectLabel: "Ваш предмет *",
        tExp: "Опыт преподавания *", tExpOpts: ["— Выберите —","Менее 1 года","1–3 года","3–5 лет","5–10 лет","Более 10 лет"],
        tEdu: "Образование *", tEduOpts: ["— Выберите —","Бакалавр","Магистр","Кандидат/Доктор наук","Профессиональный сертификат","Самообразование + практика"],
        t3label: "3/4 — Достижения", t3title: "Ваши достижения",
        tBio: "Расскажите о себе *", tBioPh: "Например: Преподаю математику 7 лет. Мои ученики побеждали на олимпиадах...",
        tBioHint: "Минимум 50 символов",
        tAch: "Сертификаты и награды", tAchPh: "Например: IELTS 8.0, Cambridge CELTA...",
        tLangLabel: "Языки преподавания *",
        t4label: "4/4 — Стиль и цена", t4title: "Стиль и условия",
        tStyleLabel: "Ваш стиль преподавания *", tStyleHint: "Можно выбрать несколько",
        tRate: "Цена за урок (60 мин) *", tRateOpts: ["— Выберите —","До 50 000 сум","50 000–100 000 сум","100 000–200 000 сум","Более 200 000 сум"],
        tFormat: "Формат занятий", tFormatOpts: ["— Выберите —","Только онлайн","Только офлайн","Онлайн и офлайн"],
        tSubmit: "Отправить анкету",
        successStudentTitle: "Заявка принята!",
        successTutorTitle: "Анкета отправлена!",
        successClose: "Закрыть",
        errRequired: "Это поле обязательно",
        errEmail: "Введите корректный email",
        errPhone: "Введите узбекский номер: +998 XX XXX XX XX",
        errBioMin: "Минимум 50 символов",
        errSelectChip: "Выберите хотя бы один вариант",
      }
    },
    en: {
      langCode: 'en',
      nav: { home: "Home", findTutor: "Find a Tutor", subjects: "Subjects", howItWorks: "How It Works", pricing: "Pricing" },
      heroCta1: "Find a Tutor", heroCta2: "Become a Tutor",
      headerBtn: "Try a Free Lesson",
      ctaBtn: "Book a Free Trial Lesson",
      footerFind: "Find a Tutor", footerBecome: "Become a Tutor",
      footerSubjects: "All Subjects", footerTerms: "Terms of Use", footerPrivacy: "Privacy Policy",
      footerSubscribeBtn: "Subscribe", footerEmailPlaceholder: "Your Email Address",
      modal: {
        welcome: "Welcome!",
        whoAreYou: "Who are you? Choose a role to continue",
        student: "I'm a student", studentSub: "Looking for a tutor",
        tutor: "I'm a tutor", tutorSub: "I want to teach",
        back: "Back", next: "Continue",
        s1title: "Tell us about yourself", s1label: "1/3 — Basic Information",
        sName: "Your name *", sNamePh: "e.g. Alisher",
        sAge: "Your age *",
        sAgeOpts: ["— Select —","Under 12","12–15","16–18","19–25","26–35","36 and above"],
        sEmail: "Email *", sEmailPh: "example@mail.com",
        sPhone: "Phone (Uzbekistan) *",
        s2label: "2/3 — Subject & Goals", s2title: "What do you want to learn?",
        sSubjectLabel: "Choose a subject *",
        subjects: ["English","Russian","Uzbek","Mathematics","Physics","Chemistry","Programming","Biology","History","Other"],
        sGoal: "Your main goal *",
        sGoalOpts: ["— Select —","Exam prep (IELTS, SAT...)","School curriculum help","Personal interest","Career development","Conversation practice","Other"],
        sLevel: "Current level",
        sLevelOpts: ["— Select —","Beginner (from scratch)","Elementary","Intermediate","Advanced"],
        s3label: "3/3 — Preferences", s3title: "What kind of teacher do you prefer?",
        sStyleLabel: "Teaching style *",
        styles: ["Strict and demanding","Friendly and fun","Patient and calm","Energetic and active","Creative approach","Practical exercises"],
        sStyleHint: "You can choose multiple",
        sLangLabel: "Lesson language",
        sLangs: ["Uzbek","Russian","English"],
        sSchedule: "Preferred time", sScheduleOpts: ["— Select —","Morning (8:00–12:00)","Afternoon (12:00–17:00)","Evening (17:00–21:00)","Flexible schedule"],
        sBudget: "Budget per lesson", sBudgetOpts: ["— Select —","Under 50,000 UZS","50,000–100,000 UZS","100,000–200,000 UZS","Over 200,000 UZS"],
        sSubmit: "Find a Tutor",
        t1label: "1/4 — Personal Details", t1title: "Tell us about yourself",
        tName: "Full name *", tNamePh: "e.g. Kamol Rashidov",
        tEmail: "Email *", tEmailPh: "example@mail.com",
        tPhone: "Phone (Uzbekistan) *",
        tCity: "City", tCityOpts: ["— Select —","Tashkent","Samarkand","Bukhara","Namangan","Andijan","Fergana","Other"],
        t2label: "2/4 — Subject & Experience", t2title: "What do you teach?",
        tSubjectLabel: "Your subject *",
        tExp: "Teaching experience *", tExpOpts: ["— Select —","Less than 1 year","1–3 years","3–5 years","5–10 years","10+ years"],
        tEdu: "Education *", tEduOpts: ["— Select —","Bachelor's degree","Master's degree","PhD / Doctorate","Professional certificate","Self-taught + practice"],
        t3label: "3/4 — Achievements", t3title: "Your achievements",
        tBio: "About yourself *", tBioPh: "e.g. I've been teaching maths for 7 years. My students have won olympiads...",
        tBioHint: "At least 50 characters",
        tAch: "Certificates & awards", tAchPh: "e.g. IELTS 8.0, Cambridge CELTA...",
        tLangLabel: "Teaching languages *",
        t4label: "4/4 — Style & Rate", t4title: "Teaching style & terms",
        tStyleLabel: "Your teaching style *", tStyleHint: "You can choose multiple",
        tRate: "Rate per lesson (60 min) *", tRateOpts: ["— Select —","Under 50,000 UZS","50,000–100,000 UZS","100,000–200,000 UZS","Over 200,000 UZS"],
        tFormat: "Lesson format", tFormatOpts: ["— Select —","Online only","In-person only","Online & in-person"],
        tSubmit: "Submit application",
        successStudentTitle: "Application received!",
        successTutorTitle: "Application submitted!",
        successClose: "Close",
        errRequired: "This field is required",
        errEmail: "Please enter a valid email address",
        errPhone: "Enter an Uzbekistan number: +998 XX XXX XX XX",
        errBioMin: "Please enter at least 50 characters",
        errSelectChip: "Please select at least one option",
      }
    }
  };

  // ──────────────────────────────────────────────────────────
  //  2. STATE & STORAGE
  // ──────────────────────────────────────────────────────────
  var STORAGE_LANG    = 'ustoz_lang';
  var STORAGE_STUDENT = 'ustoz_student_draft';
  var STORAGE_TUTOR   = 'ustoz_tutor_draft';

  function loadLang()    { return localStorage.getItem(STORAGE_LANG) || 'uz'; }
  function saveLang(c)   { localStorage.setItem(STORAGE_LANG, c); }
  function loadDraft(r)  { try { return JSON.parse(localStorage.getItem(r==='student'?STORAGE_STUDENT:STORAGE_TUTOR))||{}; } catch(e){ return {}; } }
  function saveDraft(r,d){ localStorage.setItem(r==='student'?STORAGE_STUDENT:STORAGE_TUTOR, JSON.stringify(d)); }

  var currentLang = loadLang();
  var currentRole = null;
  function m(){ return T[currentLang].modal; }

  // ──────────────────────────────────────────────────────────
  //  3. STYLES
  // ──────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ustoz-styles')) return;
    var css = [
      '.reg-overlay{position:fixed;inset:0;z-index:9999;background:rgba(8,14,36,.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;padding:16px}',
      '.reg-overlay.open{opacity:1;visibility:visible}',
      '.reg-modal{background:#fff;border-radius:24px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;overflow-x:hidden;position:relative;padding:48px 44px 40px;box-shadow:0 32px 80px rgba(8,14,36,.22);animation:regIn .3s cubic-bezier(.22,1,.36,1)}',
      '@keyframes regIn{from{transform:translateY(20px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}',
      '.reg-modal::-webkit-scrollbar{width:4px}.reg-modal::-webkit-scrollbar-thumb{background:#d0d7f0;border-radius:99px}',
      '.reg-close{position:absolute;top:18px;right:20px;width:34px;height:34px;border-radius:9px;background:#f2f4fb;border:none;display:flex;align-items:center;justify-content:center;color:#7a88a8;cursor:pointer;transition:background .2s,color .2s,transform .15s}',
      '.reg-close:hover{background:#e6e9f5;color:#2d3a5c;transform:rotate(90deg)}',
      '.reg-brand{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:24px}',
      '.reg-brand-icon{width:36px;height:36px}',
      '.reg-brand-name{font-size:20px;font-weight:800;color:#1a2340;letter-spacing:-.3px}',
      '.reg-title{font-size:22px;font-weight:800;color:#1a2340;text-align:center;margin:0 0 6px;line-height:1.25;letter-spacing:-.3px}',
      '.reg-subtitle{font-size:14px;color:#6b7b9e;text-align:center;margin:0 0 28px;line-height:1.5}',
      '.reg-step-label{font-size:11px;font-weight:700;letter-spacing:.08em;color:#4361d8;text-transform:uppercase;text-align:center;margin:0 0 20px}',
      '.reg-progress-wrap{display:flex;align-items:center;gap:10px;margin-bottom:24px}',
      '.reg-progress{flex:1;height:5px;background:#eaedf8;border-radius:99px;overflow:hidden}',
      '.reg-progress-bar{height:100%;background:linear-gradient(90deg,#4361d8,#6a85f0);border-radius:99px;transition:width .5s cubic-bezier(.22,1,.36,1)}',
      '.reg-progress-label{font-size:12px;font-weight:700;color:#4361d8;white-space:nowrap;min-width:32px}',
      '.reg-role-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
      '.reg-role-card{padding:24px 16px 20px;border:2px solid #e8ecf7;border-radius:18px;background:#f8f9fe;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;transition:all .2s;text-align:center;font-family:inherit}',
      '.reg-role-card:hover{border-color:#4361d8;background:#eef1fc;transform:translateY(-3px);box-shadow:0 12px 28px rgba(67,97,216,.12)}',
      '.role-card-icon{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center}',
      '.role-icon-student{background:linear-gradient(135deg,#667eea,#764ba2)}',
      '.role-icon-tutor{background:linear-gradient(135deg,#f093fb,#f5576c)}',
      '.role-card-icon svg{width:26px;height:26px;color:white}',
      '.reg-role-card strong{font-size:15px;font-weight:700;color:#1a2340}',
      '.reg-role-card small{font-size:12px;color:#8898b8}',
      '.reg-fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}',
      '.reg-field{display:flex;flex-direction:column;gap:5px}',
      '.reg-field.full{grid-column:1 / -1}',
      '.reg-field label{font-size:12.5px;font-weight:700;color:#3a4d70;display:flex;align-items:center;gap:6px}',
      '.hint-inline{font-size:11px;font-weight:500;color:#8898b8;margin-left:2px}',
      '.reg-field-hint{font-size:11px;color:#8898b8;margin-top:2px}',
      '.reg-input-wrap{position:relative;display:flex;align-items:center}',
      '.field-icon{position:absolute;left:12px;width:16px;height:16px;color:#a0aec8;pointer-events:none;flex-shrink:0}',
      '.reg-field input,.reg-field select,.reg-field textarea{width:100%;padding:11px 14px 11px 38px;border:1.5px solid #dde2f0;border-radius:12px;font-size:14px;color:#1a2340;background:#f8f9fe;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:inherit;appearance:none;-webkit-appearance:none;box-sizing:border-box}',
      '.reg-field select{background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%236b7b9e\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}',
      '.reg-field textarea{padding:11px 14px;resize:vertical;min-height:88px}',
      '.reg-field input:focus,.reg-field select:focus,.reg-field textarea:focus{border-color:#4361d8;box-shadow:0 0 0 4px rgba(67,97,216,.1);background:#fff}',
      '.reg-field input.err,.reg-field select.err,.reg-field textarea.err{border-color:#e53935;box-shadow:0 0 0 4px rgba(229,57,53,.08)}',
      '.reg-phone-wrap{display:flex;align-items:stretch;border:1.5px solid #dde2f0;border-radius:12px;overflow:hidden;background:#f8f9fe;transition:border-color .2s,box-shadow .2s}',
      '.reg-phone-wrap:focus-within{border-color:#4361d8;box-shadow:0 0 0 4px rgba(67,97,216,.1);background:#fff}',
      '.reg-phone-wrap.err{border-color:#e53935!important;box-shadow:0 0 0 4px rgba(229,57,53,.08)!important}',
      '.phone-prefix{padding:11px 12px 11px 14px;font-size:14px;font-weight:700;color:#4361d8;background:#eef1fc;border-right:1.5px solid #dde2f0;white-space:nowrap;display:flex;align-items:center;flex-shrink:0}',
      '.reg-phone-wrap input{border:none!important;box-shadow:none!important;background:transparent!important;padding:11px 14px!important;flex:1;border-radius:0!important}',
      '.reg-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}',
      '.chip{padding:8px 15px;border:1.5px solid #dde2f0;border-radius:99px;background:#f8f9fe;font-size:13px;font-weight:500;cursor:pointer;color:#3a4d70;transition:all .18s;white-space:nowrap;line-height:1;font-family:inherit}',
      '.chip:hover{border-color:#4361d8;color:#4361d8;background:#eef1fc}',
      '.chip.selected{border-color:#4361d8;background:#4361d8;color:#fff;box-shadow:0 4px 10px rgba(67,97,216,.2)}',
      '.chips-err-wrap{outline:2px solid #e53935;border-radius:10px;padding:4px}',
      '.reg-err{font-size:11.5px;color:#e53935;min-height:16px;margin-top:1px}',
      '.reg-nav{display:flex;justify-content:space-between;align-items:center;margin-top:28px;gap:12px}',
      '.reg-btn-back{background:none;border:none;color:#8898b8;font-size:14px;font-weight:600;cursor:pointer;padding:4px 2px;transition:color .2s;font-family:inherit}',
      '.reg-btn-back:hover{color:#4361d8}',
      '.reg-btn-next{padding:12px 30px;background:#4361d8;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;box-shadow:0 6px 20px rgba(67,97,216,.2)}',
      '.reg-btn-next:hover{background:#3352c8;transform:translateY(-1px);box-shadow:0 10px 28px rgba(67,97,216,.3)}',
      '.reg-btn-submit{width:100%;padding:14px;background:linear-gradient(135deg,#4361d8,#6a85f0);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;margin-top:8px;box-shadow:0 8px 24px rgba(67,97,216,.25)}',
      '.reg-btn-submit:hover{box-shadow:0 14px 36px rgba(67,97,216,.35);transform:translateY(-1px)}',
      '.reg-success-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;padding:16px 0 8px}',
      '.reg-success-ring{width:72px;height:72px;margin-bottom:20px;animation:popIn .5s cubic-bezier(.22,1,.36,1)}',
      '.reg-success-ring svg{width:100%;height:100%}',
      '@keyframes popIn{from{transform:scale(.4);opacity:0}60%{transform:scale(1.1)}to{transform:scale(1);opacity:1}}',
      '.lang-switcher{display:flex;align-items:center;gap:2px;background:#f2f4fb;border-radius:10px;padding:3px;border:1.5px solid #e4e8f5}',
      '.lang-btn{padding:5px 10px;border-radius:7px;border:none;background:transparent;font-size:12.5px;font-weight:700;color:#6b7b9e;cursor:pointer;transition:all .18s;font-family:inherit;line-height:1}',
      '.lang-btn:hover{color:#4361d8}',
      '.lang-btn.active{background:#fff;color:#4361d8;box-shadow:0 2px 8px rgba(67,97,216,.1)}',
      '.reg-step.hidden{display:none!important}',
      '@media(max-width:600px){.reg-modal{padding:36px 20px 28px;border-radius:20px}.reg-fields-grid{grid-template-columns:1fr}.reg-field.full{grid-column:1}.reg-title{font-size:19px}.reg-role-cards{gap:10px}.reg-role-card{padding:18px 10px 16px}.role-card-icon{width:44px;height:44px;border-radius:14px}.reg-btn-next{padding:12px 22px}}',
      '@media(max-width:380px){.reg-modal{padding:28px 14px 22px}.reg-role-cards{grid-template-columns:1fr}.chip{font-size:12px;padding:7px 11px}}',
      '@media(min-width:768px){.reg-modal{padding:52px 52px 44px}}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'ustoz-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ──────────────────────────────────────────────────────────
  //  4. MODAL HTML BUILDER
  // ──────────────────────────────────────────────────────────
  function opts(arr) {
    return arr.map(function(o, i) {
      return '<option value="' + (i===0?'':o.toLowerCase().replace(/[\s\/+&]/g,'-').replace(/[^a-z0-9\-]/g,'')) + '">' + o + '</option>';
    }).join('');
  }
  function chipList(arr) {
    return arr.map(function(s) {
      return '<button class="chip" type="button" data-value="' + s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '">' + s + '</button>';
    }).join('');
  }
  var personSVG = '<svg class="field-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var mailSVG   = '<svg class="field-icon" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" stroke-width="1.5"/></svg>';
  var calSVG    = '<svg class="field-icon" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 2v3M13 2v3M3 9h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function buildModal() {
    var mx = m();
    var langChips = mx.sLangs.map(function(s,i){
      var codes = ['uz','ru','en'];
      return '<button class="chip" type="button" data-value="'+codes[i]+'">'+s+'</button>';
    }).join('');

    return '<div id="reg-overlay" class="reg-overlay" aria-hidden="true">' +
    '<div class="reg-modal" role="dialog" aria-modal="true">' +

    // close
    '<button class="reg-close" id="reg-close-btn" type="button">' +
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1l16 16M17 1L1 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
    '</button>' +

    // STEP ROLE
    '<div class="reg-step" id="step-role">' +
    '<div class="reg-brand">' +
    '<svg class="reg-brand-icon" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="12" fill="#4361d8"/><path d="M8 28L20 10l12 18H8z" fill="white" opacity=".9"/><circle cx="20" cy="24" r="5" fill="white"/></svg>' +
    '<span class="reg-brand-name">ustoz.uz</span></div>' +
    '<h2 class="reg-title">' + mx.welcome + '</h2>' +
    '<p class="reg-subtitle">' + mx.whoAreYou + '</p>' +
    '<div class="reg-role-cards">' +
    '<button class="reg-role-card" id="btn-student" type="button">' +
    '<div class="role-card-icon role-icon-student"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422A12 12 0 0112 20.055a12 12 0 01-6.824-2.998A12 12 0 015.84 10.578L12 14z"/></svg></div>' +
    '<strong>' + mx.student + '</strong><small>' + mx.studentSub + '</small></button>' +
    '<button class="reg-role-card" id="btn-tutor" type="button">' +
    '<div class="role-card-icon role-icon-tutor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg></div>' +
    '<strong>' + mx.tutor + '</strong><small>' + mx.tutorSub + '</small></button>' +
    '</div></div>' +

    // STUDENT 1
    '<div class="reg-step hidden" id="step-student-1">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:33%"></div></div><span class="reg-progress-label">1/3</span></div>' +
    '<h2 class="reg-title">' + mx.s1title + '</h2><p class="reg-step-label">' + mx.s1label + '</p>' +
    '<div class="reg-fields-grid">' +
    '<div class="reg-field full"><label for="s-name">' + mx.sName + '</label><div class="reg-input-wrap">' + personSVG + '<input type="text" id="s-name" placeholder="' + mx.sNamePh + '" autocomplete="given-name"></div><span class="reg-err" id="err-s-name"></span></div>' +
    '<div class="reg-field"><label for="s-age">' + mx.sAge + '</label><div class="reg-input-wrap">' + calSVG + '<select id="s-age">' + opts(mx.sAgeOpts) + '</select></div><span class="reg-err" id="err-s-age"></span></div>' +
    '<div class="reg-field"><label for="s-email">' + mx.sEmail + '</label><div class="reg-input-wrap">' + mailSVG + '<input type="email" id="s-email" placeholder="' + mx.sEmailPh + '" autocomplete="email"></div><span class="reg-err" id="err-s-email"></span></div>' +
    '<div class="reg-field full"><label for="s-phone">' + mx.sPhone + '</label><div class="reg-input-wrap reg-phone-wrap"><span class="phone-prefix">+998</span><input type="tel" id="s-phone" placeholder="90 000 00 00" maxlength="12" inputmode="numeric"></div><span class="reg-err" id="err-s-phone"></span></div>' +
    '</div><div class="reg-nav"><button class="reg-btn-back" data-back="step-role" type="button">' + mx.back + '</button><button class="reg-btn-next" data-next="step-student-2" type="button">' + mx.next + '</button></div></div>' +

    // STUDENT 2
    '<div class="reg-step hidden" id="step-student-2">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:66%"></div></div><span class="reg-progress-label">2/3</span></div>' +
    '<h2 class="reg-title">' + mx.s2title + '</h2><p class="reg-step-label">' + mx.s2label + '</p>' +
    '<div class="reg-field"><label>' + mx.sSubjectLabel + '</label><div class="reg-chips" id="s-subject-chips">' + chipList(mx.subjects) + '</div><span class="reg-err" id="err-s-subject-chips"></span></div>' +
    '<div class="reg-fields-grid">' +
    '<div class="reg-field"><label for="s-goal">' + mx.sGoal + '</label><select id="s-goal">' + opts(mx.sGoalOpts) + '</select><span class="reg-err" id="err-s-goal"></span></div>' +
    '<div class="reg-field"><label for="s-level">' + mx.sLevel + '</label><select id="s-level">' + opts(mx.sLevelOpts) + '</select></div>' +
    '</div><div class="reg-nav"><button class="reg-btn-back" data-back="step-student-1" type="button">' + mx.back + '</button><button class="reg-btn-next" data-next="step-student-3" type="button">' + mx.next + '</button></div></div>' +

    // STUDENT 3
    '<div class="reg-step hidden" id="step-student-3">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:100%"></div></div><span class="reg-progress-label">3/3</span></div>' +
    '<h2 class="reg-title">' + mx.s3title + '</h2><p class="reg-step-label">' + mx.s3label + '</p>' +
    '<div class="reg-field"><label>' + mx.sStyleLabel + ' <span class="hint-inline">' + mx.sStyleHint + '</span></label><div class="reg-chips multi" id="s-style-chips">' + chipList(mx.styles) + '</div><span class="reg-err" id="err-s-style-chips"></span></div>' +
    '<div class="reg-field"><label>' + mx.sLangLabel + '</label><div class="reg-chips" id="s-lang-chips">' + langChips + '</div></div>' +
    '<div class="reg-fields-grid">' +
    '<div class="reg-field"><label for="s-schedule">' + mx.sSchedule + '</label><select id="s-schedule">' + opts(mx.sScheduleOpts) + '</select></div>' +
    '<div class="reg-field"><label for="s-budget">' + mx.sBudget + '</label><select id="s-budget">' + opts(mx.sBudgetOpts) + '</select></div>' +
    '</div><div class="reg-nav"><button class="reg-btn-back" data-back="step-student-2" type="button">' + mx.back + '</button><button class="reg-btn-submit" id="btn-student-submit" type="button">' + mx.sSubmit + '</button></div></div>' +

    // TUTOR 1
    '<div class="reg-step hidden" id="step-tutor-1">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:25%"></div></div><span class="reg-progress-label">1/4</span></div>' +
    '<h2 class="reg-title">' + mx.t1title + '</h2><p class="reg-step-label">' + mx.t1label + '</p>' +
    '<div class="reg-fields-grid">' +
    '<div class="reg-field full"><label for="t-name">' + mx.tName + '</label><div class="reg-input-wrap">' + personSVG + '<input type="text" id="t-name" placeholder="' + mx.tNamePh + '" autocomplete="name"></div><span class="reg-err" id="err-t-name"></span></div>' +
    '<div class="reg-field"><label for="t-email">' + mx.tEmail + '</label><div class="reg-input-wrap">' + mailSVG + '<input type="email" id="t-email" placeholder="' + mx.tEmailPh + '" autocomplete="email"></div><span class="reg-err" id="err-t-email"></span></div>' +
    '<div class="reg-field"><label for="t-phone">' + mx.tPhone + '</label><div class="reg-input-wrap reg-phone-wrap"><span class="phone-prefix">+998</span><input type="tel" id="t-phone" placeholder="90 000 00 00" maxlength="12" inputmode="numeric"></div><span class="reg-err" id="err-t-phone"></span></div>' +
    '<div class="reg-field full"><label for="t-city">' + mx.tCity + '</label><select id="t-city">' + opts(mx.tCityOpts) + '</select></div>' +
    '</div><div class="reg-nav"><button class="reg-btn-back" data-back="step-role" type="button">' + mx.back + '</button><button class="reg-btn-next" data-next="step-tutor-2" type="button">' + mx.next + '</button></div></div>' +

    // TUTOR 2
    '<div class="reg-step hidden" id="step-tutor-2">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:50%"></div></div><span class="reg-progress-label">2/4</span></div>' +
    '<h2 class="reg-title">' + mx.t2title + '</h2><p class="reg-step-label">' + mx.t2label + '</p>' +
    '<div class="reg-field"><label>' + mx.tSubjectLabel + '</label><div class="reg-chips" id="t-subject-chips">' + chipList(mx.subjects) + '</div><span class="reg-err" id="err-t-subject-chips"></span></div>' +
    '<div class="reg-fields-grid">' +
    '<div class="reg-field"><label for="t-experience">' + mx.tExp + '</label><select id="t-experience">' + opts(mx.tExpOpts) + '</select><span class="reg-err" id="err-t-experience"></span></div>' +
    '<div class="reg-field"><label for="t-education">' + mx.tEdu + '</label><select id="t-education">' + opts(mx.tEduOpts) + '</select><span class="reg-err" id="err-t-education"></span></div>' +
    '</div><div class="reg-nav"><button class="reg-btn-back" data-back="step-tutor-1" type="button">' + mx.back + '</button><button class="reg-btn-next" data-next="step-tutor-3" type="button">' + mx.next + '</button></div></div>' +

    // TUTOR 3
    '<div class="reg-step hidden" id="step-tutor-3">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:75%"></div></div><span class="reg-progress-label">3/4</span></div>' +
    '<h2 class="reg-title">' + mx.t3title + '</h2><p class="reg-step-label">' + mx.t3label + '</p>' +
    '<div class="reg-field"><label for="t-bio">' + mx.tBio + '</label><textarea id="t-bio" rows="4" placeholder="' + mx.tBioPh + '"></textarea><span class="reg-field-hint">' + mx.tBioHint + '</span><span class="reg-err" id="err-t-bio"></span></div>' +
    '<div class="reg-field"><label for="t-achievements">' + mx.tAch + '</label><textarea id="t-achievements" rows="2" placeholder="' + mx.tAchPh + '"></textarea></div>' +
    '<div class="reg-field"><label>' + mx.tLangLabel + '</label><div class="reg-chips multi" id="t-lang-chips">' + langChips + '</div><span class="reg-err" id="err-t-lang-chips"></span></div>' +
    '<div class="reg-nav"><button class="reg-btn-back" data-back="step-tutor-2" type="button">' + mx.back + '</button><button class="reg-btn-next" data-next="step-tutor-4" type="button">' + mx.next + '</button></div></div>' +

    // TUTOR 4
    '<div class="reg-step hidden" id="step-tutor-4">' +
    '<div class="reg-progress-wrap"><div class="reg-progress"><div class="reg-progress-bar" style="width:100%"></div></div><span class="reg-progress-label">4/4</span></div>' +
    '<h2 class="reg-title">' + mx.t4title + '</h2><p class="reg-step-label">' + mx.t4label + '</p>' +
    '<div class="reg-field"><label>' + mx.tStyleLabel + ' <span class="hint-inline">' + mx.tStyleHint + '</span></label><div class="reg-chips multi" id="t-style-chips">' + chipList(mx.styles) + '</div><span class="reg-err" id="err-t-style-chips"></span></div>' +
    '<div class="reg-fields-grid">' +
    '<div class="reg-field"><label for="t-rate">' + mx.tRate + '</label><select id="t-rate">' + opts(mx.tRateOpts) + '</select><span class="reg-err" id="err-t-rate"></span></div>' +
    '<div class="reg-field"><label for="t-format">' + mx.tFormat + '</label><select id="t-format">' + opts(mx.tFormatOpts) + '</select></div>' +
    '</div><div class="reg-nav"><button class="reg-btn-back" data-back="step-tutor-3" type="button">' + mx.back + '</button><button class="reg-btn-submit" id="btn-tutor-submit" type="button">' + mx.tSubmit + '</button></div></div>' +

    // SUCCESS
    '<div class="reg-step hidden" id="step-success">' +
    '<div class="reg-success-wrap">' +
    '<div class="reg-success-ring"><svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="#4361d8" stroke-width="2.5"/><path d="M16 30l10 10 18-18" stroke="#4361d8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '<h2 class="reg-title" id="success-title"></h2><p class="reg-subtitle" id="success-msg"></p>' +
    '<button class="reg-btn-submit" id="btn-success-close" type="button"></button>' +
    '</div></div>' +

    '</div></div>';
  }

  // ──────────────────────────────────────────────────────────
  //  5. LANGUAGE SWITCHER
  // ──────────────────────────────────────────────────────────
  function injectLangSwitcher() {
    var container = document.querySelector('.header .container');
    if (!container || document.getElementById('lang-switcher')) return;
    var div = document.createElement('div');
    div.id = 'lang-switcher';
    div.className = 'lang-switcher';
    div.innerHTML =
      '<button class="lang-btn' + (currentLang==='uz'?' active':'') + '" data-lang="uz" type="button">UZ</button>' +
      '<button class="lang-btn' + (currentLang==='ru'?' active':'') + '" data-lang="ru" type="button">RU</button>' +
      '<button class="lang-btn' + (currentLang==='en'?' active':'') + '" data-lang="en" type="button">EN</button>';
    var ref = container.querySelector('.btn.btn-primary') || container.querySelector('.nav-open-btn');
    if (ref) container.insertBefore(div, ref); else container.appendChild(div);
    div.addEventListener('click', function(e) {
      if (e.target.classList.contains('lang-btn')) setLanguage(e.target.dataset.lang);
    });
  }

  function setLanguage(lang) {
    currentLang = lang;
    saveLang(lang);
    document.querySelectorAll('#lang-switcher .lang-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.lang===lang); });
    translatePage(lang);
  }

  function translatePage(lang) {
    var tx = T[lang];
    var navLinks = document.querySelectorAll('.navbar-link');
    var keys = ['home','findTutor','subjects','howItWorks','pricing'];
    navLinks.forEach(function(el, i){ if (keys[i]) el.textContent = tx.nav[keys[i]]; });

    document.querySelectorAll('.btn-wrapper .btn-primary').forEach(function(el){ el.textContent = tx.heroCta1; });
    document.querySelectorAll('.btn-wrapper .btn-outline').forEach(function(el){ el.textContent = tx.heroCta2; });
    var hBtn = document.querySelector('.header .btn.btn-primary');
    if (hBtn) hBtn.textContent = tx.headerBtn;
    document.querySelectorAll('.cta .btn-primary').forEach(function(el){ el.textContent = tx.ctaBtn; });

    var map = {};
    ['find a tutor','найти репетитора',"o'qituvchi topish"].forEach(function(k){ map[k]=tx.footerFind; });
    ['become a tutor','стать репетитором',"o'qituvchi bo'lish"].forEach(function(k){ map[k]=tx.footerBecome; });
    ['all subjects','все предметы','barcha fanlar'].forEach(function(k){ map[k]=tx.footerSubjects; });
    ['terms of use','условия использования','foydalanish shartlari'].forEach(function(k){ map[k]=tx.footerTerms; });
    ['privacy policy','конфиденциальность','maxfiylik siyosati'].forEach(function(k){ map[k]=tx.footerPrivacy; });
    document.querySelectorAll('.footer-link').forEach(function(el){
      var key = el.textContent.trim().toLowerCase();
      if (map[key]) el.textContent = map[key];
    });
    var subBtn = document.querySelector('.footer .submit-btn');
    if (subBtn) subBtn.textContent = tx.footerSubscribeBtn;
    var subIn  = document.querySelector('.footer .input-field');
    if (subIn)  subIn.placeholder = tx.footerEmailPlaceholder;
    document.documentElement.lang = lang;
  }

  // ──────────────────────────────────────────────────────────
  //  6. MODAL OPEN / CLOSE
  // ──────────────────────────────────────────────────────────
  function initModal() {
    var old = document.getElementById('reg-overlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', buildModal());

    var overlay = document.getElementById('reg-overlay');
    overlay.addEventListener('click', function(e){ if (e.target===overlay) closeModal(); });
    document.getElementById('reg-close-btn').addEventListener('click', closeModal);

    document.getElementById('btn-student').addEventListener('click', function(){ selectRole('student'); });
    document.getElementById('btn-tutor').addEventListener('click', function(){ selectRole('tutor'); });

    document.querySelectorAll('.reg-btn-next').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (validateStep(btn.closest('.reg-step'))) showStep(btn.dataset.next);
      });
    });
    document.querySelectorAll('.reg-btn-back').forEach(function(btn){
      btn.addEventListener('click', function(){ showStep(btn.dataset.back); });
    });

    document.querySelectorAll('.reg-chips').forEach(function(group){
      var multi = group.classList.contains('multi');
      group.querySelectorAll('.chip').forEach(function(chip){
        chip.addEventListener('click', function(){
          if (multi) chip.classList.toggle('selected');
          else { group.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('selected'); }); chip.classList.add('selected'); }
        });
      });
    });

    document.getElementById('btn-student-submit').addEventListener('click', submitStudent);
    document.getElementById('btn-tutor-submit').addEventListener('click', submitTutor);
    document.getElementById('btn-success-close').addEventListener('click', closeModal);

    restoreDraft();
  }

  function openModal(role) {
    initModal();
    var overlay = document.getElementById('reg-overlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    showStep('step-role');
    if (role) setTimeout(function(){ selectRole(role); }, 50);
  }

  function closeModal() {
    var overlay = document.getElementById('reg-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function showStep(id) {
    document.querySelectorAll('.reg-step').forEach(function(s){ s.classList.add('hidden'); });
    var el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); }
  }

  function selectRole(role) {
    currentRole = role;
    showStep(role==='student'?'step-student-1':'step-tutor-1');
  }

  // ──────────────────────────────────────────────────────────
  //  7. VALIDATION
  // ──────────────────────────────────────────────────────────
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[0-9]{9}$/; // after +998

  function validateStep(stepEl) {
    var mx = m();
    var ok = true;

    stepEl.querySelectorAll('input, select, textarea').forEach(function(el){
      var id = el.id;
      var errEl = document.getElementById('err-' + id);
      if (!errEl) return;
      el.classList.remove('err');
      errEl.textContent = '';
      var val = el.value.trim();

      // Phone
      if (id==='s-phone'||id==='t-phone') {
        var digits = val.replace(/\s/g,'');
        var wrap = el.closest('.reg-phone-wrap');
        if (!digits) { errEl.textContent=mx.errRequired; ok=false; if(wrap)wrap.classList.add('err'); }
        else if (!PHONE_RE.test(digits)) { errEl.textContent=mx.errPhone; ok=false; if(wrap)wrap.classList.add('err'); }
        else if(wrap) wrap.classList.remove('err');
        return;
      }
      // Email
      if (el.type==='email') {
        if (!val) { errEl.textContent=mx.errRequired; el.classList.add('err'); ok=false; }
        else if (!EMAIL_RE.test(val)) { errEl.textContent=mx.errEmail; el.classList.add('err'); ok=false; }
        return;
      }
      // Bio min
      if (id==='t-bio') {
        if (!val) { errEl.textContent=mx.errRequired; el.classList.add('err'); ok=false; }
        else if (val.length<50) { errEl.textContent=mx.errBioMin; el.classList.add('err'); ok=false; }
        return;
      }
      // All other fields with an err span = required
      if (!val) { errEl.textContent=mx.errRequired; el.classList.add('err'); ok=false; }
    });

    // Required single-select chip groups
    stepEl.querySelectorAll('.reg-chips:not(.multi)').forEach(function(group){
      var errEl = document.getElementById('err-' + group.id);
      if (!errEl) return;
      errEl.textContent = '';
      if (!group.querySelector('.chip.selected')) { errEl.textContent=mx.errSelectChip; ok=false; }
    });

    // Required multi-select chip groups
    stepEl.querySelectorAll('.reg-chips.multi').forEach(function(group){
      var errEl = document.getElementById('err-' + group.id);
      if (!errEl) return;
      errEl.textContent = '';
      if (!group.querySelector('.chip.selected')) { errEl.textContent=mx.errSelectChip; ok=false; }
    });

    if (!ok) {
      var first = stepEl.querySelector('.err, .reg-err:not(:empty)');
      if (first) first.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    return ok;
  }

  // ──────────────────────────────────────────────────────────
  //  8. SUBMIT
  // ──────────────────────────────────────────────────────────
  function chips(id) {
    return [].slice.call(document.querySelectorAll('#'+id+' .chip.selected')).map(function(c){ return c.dataset.value; });
  }
  function val(id) { var el=document.getElementById(id); return el?el.value.trim():''; }

  function setSubmitLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) btn.dataset.prevText = btn.textContent, btn.textContent = '...';
    else if (btn.dataset.prevText) btn.textContent = btn.dataset.prevText;
  }

  function submitStudent() {
    if (!validateStep(document.getElementById('step-student-3'))) return;
    var mx = m();
    var name = val('s-name');
    var data = {
      role:'student', name:name, age:val('s-age'),
      email:val('s-email'),
      phone:'+998'+val('s-phone').replace(/\s/g,''),
      subjects:chips('s-subject-chips'), goal:val('s-goal'), level:val('s-level'),
      teacherStyles:chips('s-style-chips'), language:chips('s-lang-chips')[0]||'',
      schedule:val('s-schedule'), budget:val('s-budget'),
      lang:currentLang, submittedAt:new Date().toISOString()
    };
    saveDraft('student', data);
    var btn = document.getElementById('btn-student-submit');
    setSubmitLoading(btn, true);
    var done = function() {
      setSubmitLoading(btn, false);
      document.getElementById('success-title').textContent = mx.successStudentTitle;
    document.getElementById('success-msg').textContent = name + (currentLang==='uz'
      ? ', siz uchun eng yaxshi o\'qituvchini topamiz va 24 soat ichida bog\'lanamiz.'
      : currentLang==='ru'
      ? ', мы подберём для вас лучшего учителя и свяжемся в течение 24 часов.'
      : ', we\'ll find you the best tutor and be in touch within 24 hours.');
    document.getElementById('btn-success-close').textContent = mx.successClose;
    showStep('step-success');
    };
    if (window.UstozAPI) {
      window.UstozAPI.submitStudent(data).then(done).catch(function(err) {
        setSubmitLoading(btn, false);
        alert(err.message || 'Server xatosi. Qayta urinib ko\'ring.');
      });
      return;
    }
    console.log('[ustoz.uz] Student (offline):', data);
    done();
  }

  function submitTutor() {
    if (!validateStep(document.getElementById('step-tutor-4'))) return;
    var mx = m();
    var name = val('t-name');
    var data = {
      role:'tutor', name:name, email:val('t-email'),
      phone:'+998'+val('t-phone').replace(/\s/g,''),
      city:val('t-city'), subjects:chips('t-subject-chips'),
      experience:val('t-experience'), education:val('t-education'),
      bio:val('t-bio'), achievements:val('t-achievements'),
      languages:chips('t-lang-chips'), styles:chips('t-style-chips'),
      rate:val('t-rate'), format:val('t-format'),
      lang:currentLang, submittedAt:new Date().toISOString()
    };
    saveDraft('tutor', data);
    var btn = document.getElementById('btn-tutor-submit');
    setSubmitLoading(btn, true);
    var done = function() {
      setSubmitLoading(btn, false);
      document.getElementById('success-title').textContent = mx.successTutorTitle;
    document.getElementById('success-msg').textContent = name + (currentLang==='uz'
      ? ', anketangiz ko\'rib chiqish uchun qabul qilindi. 24 soat ichida bog\'lanamiz.'
      : currentLang==='ru'
      ? ', ваша анкета принята на проверку. Свяжемся в течение 24 часов.'
      : ', your profile is under review. We\'ll contact you within 24 hours.');
    document.getElementById('btn-success-close').textContent = mx.successClose;
    showStep('step-success');
    };
    if (window.UstozAPI) {
      window.UstozAPI.submitTutor(data).then(done).catch(function(err) {
        setSubmitLoading(btn, false);
        alert(err.message || 'Server xatosi. Qayta urinib ko\'ring.');
      });
      return;
    }
    console.log('[ustoz.uz] Tutor (offline):', data);
    done();
  }

  // ──────────────────────────────────────────────────────────
  //  9. RESTORE DRAFT FROM LOCALSTORAGE
  // ──────────────────────────────────────────────────────────
  function restoreDraft() {
    var sd = loadDraft('student');
    if (sd.name)  { var el=document.getElementById('s-name');  if(el)el.value=sd.name; }
    if (sd.email) { var el=document.getElementById('s-email'); if(el)el.value=sd.email; }
    if (sd.phone) { var el=document.getElementById('s-phone'); if(el)el.value=sd.phone.replace('+998',''); }
    if (sd.age)   { var el=document.getElementById('s-age');   if(el)el.value=sd.age; }

    var td = loadDraft('tutor');
    if (td.name)  { var el=document.getElementById('t-name');  if(el)el.value=td.name; }
    if (td.email) { var el=document.getElementById('t-email'); if(el)el.value=td.email; }
    if (td.phone) { var el=document.getElementById('t-phone'); if(el)el.value=td.phone.replace('+998',''); }
    if (td.bio)   { var el=document.getElementById('t-bio');   if(el)el.value=td.bio; }
  }

  // ──────────────────────────────────────────────────────────
  //  10. PHONE INPUT: digits only
  // ──────────────────────────────────────────────────────────
  document.addEventListener('input', function(e) {
    if (e.target && (e.target.id==='s-phone'||e.target.id==='t-phone')) {
      e.target.value = e.target.value.replace(/[^0-9 ]/g,'');
    }
  });

  // ──────────────────────────────────────────────────────────
  //  11. WIRE SITE BUTTONS
  // ──────────────────────────────────────────────────────────
  function wireButtons() {
    document.querySelectorAll('a[href="#"], button').forEach(function(el) {
      var txt = el.textContent.trim().toLowerCase();
      if (txt.includes('find a tutor')||txt.includes('найти репетитора')||txt.includes("o'qituvchi topish")||
          txt.includes('book a free')||txt.includes('try a free')||txt.includes('bepul sinov')||
          txt.includes('бесплатный')||txt.includes('бронировать')||txt.includes('попробовать')) {
        el.addEventListener('click', function(e){ e.preventDefault(); openModal('student'); });
      }
      if (txt.includes('become a tutor')||txt.includes('стать репетитором')||txt.includes("o'qituvchi bo'lish")) {
        el.addEventListener('click', function(e){ e.preventDefault(); openModal('tutor'); });
      }
    });
    document.querySelectorAll('.navbar-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        var txt = link.textContent.trim().toLowerCase();
        if (txt.includes('find')||txt.includes('tutor')||txt.includes('репетитор')||txt.includes('qituvchi')) {
          e.preventDefault(); openModal('student');
        }
      });
    });
  }

  
  // Escape key
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  // ──────────────────────────────────────────────────────────
  //  12. BOOT
  // ──────────────────────────────────────────────────────────
  function boot() {
    injectStyles();
    injectLangSwitcher();
    translatePage(currentLang);
    wireButtons();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.UstazReg = { open: openModal, close: closeModal, setLang: setLanguage };

})();