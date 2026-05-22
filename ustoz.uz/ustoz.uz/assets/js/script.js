'use strict';

// ════════════════════════════════════════════════════════════
//  ustoz.uz — script.js
//  Содержит:
//   1. Оригинальный UI (navbar, header, slider, accordion)
//   2. База данных репетиторов (localStorage)
//   3. Каталог с фильтрами и карточками
//   4. Дашборд учителя (быстрая регистрация)
//   5. Хуки в registration.js через UstozAPI override
// ════════════════════════════════════════════════════════════


// ────────────────────────────────────────────────────────────
//  УТИЛИТА: навешивание событий на несколько элементов
// ────────────────────────────────────────────────────────────
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
};


// ────────────────────────────────────────────────────────────
//  NAVBAR — открытие/закрытие мобильного меню
// ────────────────────────────────────────────────────────────
const navbar    = document.querySelector('[data-navbar]');
const navTogglers = document.querySelectorAll('[data-nav-toggler]');
const navOverlay  = document.querySelector('[data-overlay]');

const toggleNavbar = function () {
  navbar.classList.toggle('active');
  navOverlay.classList.toggle('active');
  document.body.classList.toggle('nav-active');
};

addEventOnElements(navTogglers, 'click', toggleNavbar);


// ────────────────────────────────────────────────────────────
//  HEADER — залипание при скролле
// ────────────────────────────────────────────────────────────
const header = document.querySelector('[data-header]');

window.addEventListener('scroll', function () {
  header.classList.toggle('active', window.scrollY > 100);
});


// ────────────────────────────────────────────────────────────
//  SLIDER — переключение слайдов
// ────────────────────────────────────────────────────────────
const sliders = document.querySelectorAll('[data-slider]');

const initSlider = function (currentSlider) {
  const sliderContainer = currentSlider.querySelector('[data-slider-container]');
  const sliderPrevBtn   = currentSlider.querySelector('[data-slider-prev]');
  const sliderNextBtn   = currentSlider.querySelector('[data-slider-next]');
  let currentSlidePos   = 0;

  const moveSliderItem = function () {
    sliderContainer.style.transform =
      `translateX(-${sliderContainer.children[currentSlidePos].offsetLeft}px)`;
  };

  sliderNextBtn.addEventListener('click', function () {
    currentSlidePos = currentSlidePos >= sliderContainer.childElementCount - 1
      ? 0 : currentSlidePos + 1;
    moveSliderItem();
  });

  sliderPrevBtn.addEventListener('click', function () {
    currentSlidePos = currentSlidePos <= 0
      ? sliderContainer.childElementCount - 1 : currentSlidePos - 1;
    moveSliderItem();
  });

  if (sliderContainer.childElementCount <= 1) {
    sliderNextBtn.style.display = 'none';
    sliderPrevBtn.style.display = 'none';
  }
};

for (let i = 0, len = sliders.length; i < len; i++) { initSlider(sliders[i]); }


// ────────────────────────────────────────────────────────────
//  ACCORDION — раскрытие/скрытие пунктов
// ────────────────────────────────────────────────────────────
const accordions = document.querySelectorAll('[data-accordion]');
let lastActiveAccordion = accordions[0];

const initAccordion = function (currentAccordion) {
  const accordionBtn = currentAccordion.querySelector('[data-accordion-btn]');

  accordionBtn.addEventListener('click', function () {
    if (lastActiveAccordion && lastActiveAccordion !== currentAccordion) {
      lastActiveAccordion.classList.remove('expanded');
    }
    currentAccordion.classList.toggle('expanded');
    lastActiveAccordion = currentAccordion;
  });
};

for (let i = 0, len = accordions.length; i < len; i++) { initAccordion(accordions[i]); }


// ════════════════════════════════════════════════════════════
//  БАЗА ДАННЫХ РЕПЕТИТОРОВ (localStorage)
// ════════════════════════════════════════════════════════════
const TUTORS_STORAGE_KEY = 'ustoz_tutors_db_v1';

/**
 * Начальный массив репетиторов (seed-данные).
 * priceRange: 1=до50к, 2=50–100к, 3=100–200к, 4=>200к
 */
const DEFAULT_TUTORS = [
  {
    id: 1,
    name: "Malika Yusupova",
    subject: "Ingliz tili",
    price: "100 000–200 000 so'm",
    priceRange: 3,
    rating: 4.9,
    reviews: 127,
    experience: "5–10 yil",
    description: "IELTS 8.0 va Cambridge CELTA sertifikatiga egaman. 8 yil davomida 300+ talabani muvaffaqiyatli tayyorladim. IELTS, TOEFL, SAT English imtihonlari — mening asosiy ixtisosim.",
    avatar: "./assets/images/MalikaDEV.jpg",
    city: "Toshkent",
    format: "Onlayn va oflayn"
  },
  {
    id: 2,
    name: "Jasur Karimov",
    subject: "Matematika",
    price: "50 000–100 000 so'm",
    priceRange: 2,
    rating: 4.8,
    reviews: 89,
    experience: "3–5 yil",
    description: "Toshkent Davlat Texnika Universiteti bitiruvchisi. Algebra, geometriya va oliy matematika bo'yicha dars beraman. DTM va olimpiadalarga tayyorgarlik — mening kuchim.",
    avatar: null,
    city: "Toshkent",
    format: "Onlayn va oflayn"
  },
  {
    id: 3,
    name: "Nilufar Rashidova",
    subject: "Dasturlash",
    price: "100 000–200 000 so'm",
    priceRange: 3,
    rating: 4.7,
    reviews: 54,
    experience: "3–5 yil",
    description: "Frontend (HTML/CSS, React, Vue) va Python dasturlashni o'rgataman. GitHub portfolio yaratishda yordam beraman. Noldan professional darajaga chiqishingiz mumkin.",
    avatar: null,
    city: "Toshkent",
    format: "Faqat onlayn"
  },
  {
    id: 4,
    name: "Bobur Toshmatov",
    subject: "Fizika",
    price: "50 000–100 000 so'm",
    priceRange: 2,
    rating: 4.6,
    reviews: 42,
    experience: "5–10 yil",
    description: "Samarqand Davlat Universiteti fizika kafedrasi dotsenti. SAT va DTM fizika bo'limlariga maxsus tayyorgarlik beraman. Murakkab mavzularni oddiy va tushunarli misollar bilan tushuntiraman.",
    avatar: null,
    city: "Samarqand",
    format: "Onlayn va oflayn"
  }
];

/** Загрузить репетиторов из localStorage (или вернуть seed-данные) */
function loadTutors() {
  try {
    const raw = localStorage.getItem(TUTORS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore parse errors */ }
  // Первый запуск: сохраняем начальные данные
  saveTutors(DEFAULT_TUTORS);
  return DEFAULT_TUTORS.slice();
}

/** Сохранить массив репетиторов в localStorage */
function saveTutors(tutors) {
  try {
    localStorage.setItem(TUTORS_STORAGE_KEY, JSON.stringify(tutors));
  } catch (e) { /* ignore quota errors */ }
}

/**
 * Добавить нового репетитора в базу данных.
 * Принимает объект data из формы (registration.js или dashboard-формы).
 */
function addTutorToDb(data) {
  const tutors = loadTutors();

  // Маппинг текстовых меток цен в числовой priceRange
  const priceRangeMap = {
    "50 000 so'mgacha":       1,
    "50 000–100 000 so'm":    2,
    "100 000–200 000 so'm":   3,
    "200 000 so'mdan ko'p":   4,
  };

  const newTutor = {
    id: Date.now(),
    name:        data.name        || 'Nomsiz',
    subject:     Array.isArray(data.subjects) ? data.subjects[0] : (data.subjects || 'Boshqa'),
    price:       data.rate        || "Kelishiladi",
    priceRange:  priceRangeMap[data.rate] || 0,
    rating:      5.0,
    reviews:     0,
    experience:  data.experience  || '—',
    description: data.bio         || '',
    avatar:      null,
    city:        data.city        || 'Toshkent',
    format:      data.format      || 'Faqat onlayn',
    addedAt:     new Date().toISOString()
  };

  tutors.push(newTutor);
  saveTutors(tutors);

  // Обновить каталог на странице (если он уже отрисован)
  refreshCatalog();

  return newTutor;
}


// ════════════════════════════════════════════════════════════
//  КАТАЛОГ РЕПЕТИТОРОВ — секция с фильтрами и карточками
// ════════════════════════════════════════════════════════════

/** Построить HTML звёздочек по рейтингу */
function buildStars(rating) {
  const full = Math.floor(rating);
  const half = (rating - full) >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++)                       html += '<ion-icon name="star"></ion-icon>';
  if (half)                                             html += '<ion-icon name="star-half-outline"></ion-icon>';
  for (let i = full + (half ? 1 : 0); i < 5; i++)      html += '<ion-icon name="star-outline"></ion-icon>';
  return `<span class="ustoz-stars">${html}</span>`;
}

/** Построить HTML одной карточки репетитора */
function buildTutorCard(tutor) {
  const avatarHtml = tutor.avatar
    ? `<img src="${tutor.avatar}" alt="${tutor.name}" class="img-cover" loading="lazy">`
    : `<div class="ustoz-avatar-placeholder"><ion-icon name="person-circle-outline"></ion-icon></div>`;

  return `
    <div class="ustoz-tutor-card" data-tutor-id="${tutor.id}">
      <div class="ustoz-card-top">
        <figure class="ustoz-avatar">${avatarHtml}</figure>
        <div class="ustoz-card-meta">
          <h3 class="ustoz-tutor-name">${tutor.name}</h3>
          <p class="ustoz-tutor-subject">
            <ion-icon name="book-outline"></ion-icon>
            ${tutor.subject}
          </p>
          <div class="ustoz-rating">
            ${buildStars(tutor.rating)}
            <b>${tutor.rating.toFixed(1)}</b>
            <span class="ustoz-reviews">(${tutor.reviews} ta sharh)</span>
          </div>
        </div>
      </div>

      <p class="ustoz-tutor-desc">${tutor.description}</p>

      <div class="ustoz-card-footer">
        <span class="ustoz-price">
          <ion-icon name="cash-outline"></ion-icon>
          ${tutor.price}
        </span>
        <span class="ustoz-city">
          <ion-icon name="location-outline"></ion-icon>
          ${tutor.city}
        </span>
        <button
          class="btn btn-primary ustoz-book-btn"
          onclick="window.UstazReg && window.UstazReg.open('student')"
          type="button">
          Dars bron qilish
        </button>
      </div>
    </div>
  `;
}

/** Построить <option>-список предметов из массива репетиторов */
function buildSubjectOptions(tutors) {
  const subjects = [...new Set(tutors.map(t => t.subject))].sort();
  const options = ['<option value="all">Barcha fanlar</option>']
    .concat(subjects.map(s => `<option value="${s}">${s}</option>`));
  return options.join('');
}

/** Вставить секцию каталога в DOM (только один раз) */
function injectCatalogSection() {
  if (document.getElementById('ustoz-catalog')) return;

  const tutors     = loadTutors();
  const subjectOpts = buildSubjectOptions(tutors);
  const cardsHtml  = tutors.map(buildTutorCard).join('');

  const sectionHtml = `
    <section class="section ustoz-catalog" id="ustoz-catalog" aria-labelledby="catalog-label">
      <div class="container">

        <p class="section-subtitle" id="catalog-label">O'qituvchilar katalogi</p>
        <h2 class="h2 section-title">Siz uchun eng mos o'qituvchini toping</h2>

        <!-- ФИЛЬТРЫ -->
        <div class="ustoz-filters" id="ustoz-filters">

          <div class="ustoz-filter-group">
            <label class="ustoz-filter-label" for="filter-subject">Fan</label>
            <select class="ustoz-filter-select" id="filter-subject">
              ${subjectOpts}
            </select>
          </div>

          <div class="ustoz-filter-group">
            <label class="ustoz-filter-label" for="filter-price">Narx (so'mda)</label>
            <select class="ustoz-filter-select" id="filter-price">
              <option value="0">Barcha narxlar</option>
              <option value="1">50 000 so'mgacha</option>
              <option value="2">50 000–100 000</option>
              <option value="3">100 000–200 000</option>
              <option value="4">200 000 dan ko'p</option>
            </select>
          </div>

          <div class="ustoz-filter-group">
            <label class="ustoz-filter-label" for="filter-name">Ism bo'yicha qidirish</label>
            <input
              class="ustoz-filter-input"
              type="text"
              id="filter-name"
              placeholder="Masalan: Malika">
          </div>

          <div class="ustoz-filter-btns">
            <button class="btn btn-primary"  id="btn-do-filter" type="button">
              <ion-icon name="search-outline"></ion-icon>
              Qidirish
            </button>
            <button class="btn btn-outline" id="btn-reset-filter" type="button">
              <ion-icon name="refresh-outline"></ion-icon>
              Tozalash
            </button>
          </div>

        </div><!-- /ustoz-filters -->

        <!-- ИНФО-СТРОКА -->
        <p class="ustoz-results-info" id="ustoz-results-info" aria-live="polite"></p>

        <!-- СЕТКА КАРТОЧЕК -->
        <div class="ustoz-grid" id="ustoz-grid">
          ${cardsHtml}
        </div>

        <!-- ПУСТОЕ СОСТОЯНИЕ -->
        <div class="ustoz-empty hidden" id="ustoz-empty">
          <ion-icon name="search-outline"></ion-icon>
          <p>Hech qanday o'qituvchi topilmadi.<br>Filtrllarni o'zgartiring yoki tozalang.</p>
        </div>

      </div>
    </section>
  `;

  // Вставляем перед секцией CTA (призыв к действию)
  const ctaSection = document.querySelector('.cta');
  if (ctaSection) {
    ctaSection.insertAdjacentHTML('beforebegin', sectionHtml);
  } else {
    document.querySelector('main article').insertAdjacentHTML('beforeend', sectionHtml);
  }

  // Кнопка «Qidirish»
  document.getElementById('btn-do-filter').addEventListener('click', applyFilters);

  // Кнопка «Tozalash»
  document.getElementById('btn-reset-filter').addEventListener('click', resetFilters);

  // Enter в поле имени
  document.getElementById('filter-name').addEventListener('keyup', function (e) {
    if (e.key === 'Enter') applyFilters();
  });
}

/** Применить фильтры и перерендерить карточки */
function applyFilters() {
  const subject = document.getElementById('filter-subject').value;
  const price   = parseInt(document.getElementById('filter-price').value, 10);
  const name    = document.getElementById('filter-name').value.trim().toLowerCase();

  const all      = loadTutors();
  const filtered = all.filter(function (t) {
    if (subject !== 'all' && t.subject !== subject)                              return false;
    if (price !== 0 && t.priceRange !== price)                                   return false;
    if (name && !t.name.toLowerCase().includes(name) &&
                !t.subject.toLowerCase().includes(name))                         return false;
    return true;
  });

  renderTutorCards(filtered, /* showInfo */ true);
}

/** Сбросить фильтры и показать всех репетиторов */
function resetFilters() {
  document.getElementById('filter-subject').value = 'all';
  document.getElementById('filter-price').value   = '0';
  document.getElementById('filter-name').value    = '';
  renderTutorCards(loadTutors(), false);
}

/** Отрисовать переданный массив репетиторов в сетке */
function renderTutorCards(tutors, showInfo) {
  const grid  = document.getElementById('ustoz-grid');
  const empty = document.getElementById('ustoz-empty');
  const info  = document.getElementById('ustoz-results-info');
  if (!grid) return;

  if (tutors.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    if (info) info.textContent = '';
  } else {
    grid.innerHTML = tutors.map(buildTutorCard).join('');
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    if (info) info.textContent = showInfo ? `${tutors.length} ta o'qituvchi topildi` : '';
  }
}

/**
 * Обновить каталог (вызывается после добавления нового репетитора).
 * Регенерирует select предметов и перерисовывает карточки.
 */
function refreshCatalog() {
  const subjectSelect = document.getElementById('filter-subject');
  if (subjectSelect) {
    const savedValue = subjectSelect.value;
    subjectSelect.innerHTML = buildSubjectOptions(loadTutors());
    // Попытаться восстановить выбранное значение
    for (let i = 0; i < subjectSelect.options.length; i++) {
      if (subjectSelect.options[i].value === savedValue) {
        subjectSelect.value = savedValue;
        break;
      }
    }
  }
  renderTutorCards(loadTutors(), false);
}

/** Применить фильтры из данных студента (вызывается из хука) */
function applyStudentFilters(studentData) {
  const subjects  = studentData.subjects || [];
  const budgetMap = {
    "50 000 so'mgacha":       1,
    "50 000–100 000 so'm":    2,
    "100 000–200 000 so'm":   3,
    "200 000 so'mdan ko'p":   4
  };
  const maxPrice = budgetMap[studentData.budget] || 0;

  const all      = loadTutors();
  const filtered = all.filter(function (t) {
    // Фильтр по предмету (мягкое совпадение)
    if (subjects.length > 0) {
      const match = subjects.some(function (s) {
        return t.subject.toLowerCase().includes(s.toLowerCase()) ||
               s.toLowerCase().includes(t.subject.toLowerCase());
      });
      if (!match) return false;
    }
    // Фильтр по цене (не превышает бюджет)
    if (maxPrice !== 0 && t.priceRange > maxPrice) return false;
    return true;
  });

  // Обновляем select предметов, если возможно
  const subjectSelect = document.getElementById('filter-subject');
  if (subjectSelect && subjects.length > 0) {
    for (let i = 0; i < subjectSelect.options.length; i++) {
      if (subjectSelect.options[i].value === subjects[0]) {
        subjectSelect.value = subjects[0];
        break;
      }
    }
  }

  // Показываем подходящих или всех, если никто не подошёл
  renderTutorCards(filtered.length > 0 ? filtered : all, filtered.length > 0);

  // Плавная прокрутка к каталогу (после закрытия модала)
  setTimeout(function () {
    const catalog = document.getElementById('ustoz-catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 600);
}


// ════════════════════════════════════════════════════════════
//  ДАШБОРД УЧИТЕЛЯ — быстрая регистрация
// ════════════════════════════════════════════════════════════

const PRICE_LABELS = {
  '1': "50 000 so'mgacha",
  '2': "50 000–100 000 so'm",
  '3': "100 000–200 000 so'm",
  '4': "200 000 so'mdan ko'p"
};

/** Вставить секцию дашборда в DOM (только один раз) */
function injectDashboardSection() {
  if (document.getElementById('ustoz-dashboard')) return;

  const dashboardHtml = `
    <section class="section ustoz-dashboard" id="ustoz-dashboard" aria-labelledby="dashboard-label">
      <div class="container">

        <p class="section-subtitle" id="dashboard-label">O'qituvchilar uchun</p>
        <h2 class="h2 section-title">O'qituvchi sifatida ro'yxatdan o'ting</h2>
        <p class="ustoz-dashboard-intro">
          Platformaga qo'shiling va minglab o'quvchilar bilan bog'laning. Quyidagi formani to'ldiring yoki to'liq anketani jo'nating.
        </p>

        <div class="ustoz-dashboard-grid">

          <!-- ФОРМА БЫСТРОЙ РЕГИСТРАЦИИ -->
          <div class="ustoz-form-wrap">
            <h3 class="h4">Tezkor qo'shish</h3>
            <p class="ustoz-form-hint">Asosiy ma'lumotlarni kiriting — profilingiz darhol katalogda paydo bo'ladi.</p>

            <form id="ustoz-tutor-form" novalidate>

              <div class="ustoz-field">
                <label for="d-name">To'liq ismingiz *</label>
                <input type="text" id="d-name" placeholder="Masalan: Kamol Rashidov" autocomplete="name">
                <span class="ustoz-err" id="d-err-name"></span>
              </div>

              <div class="ustoz-field">
                <label for="d-subject">Faningiz *</label>
                <select id="d-subject">
                  <option value="">— Tanlang —</option>
                  <option>Ingliz tili</option>
                  <option>Rus tili</option>
                  <option>O'zbek tili</option>
                  <option>Matematika</option>
                  <option>Fizika</option>
                  <option>Kimyo</option>
                  <option>Dasturlash</option>
                  <option>Biologiya</option>
                  <option>Tarix</option>
                  <option>Boshqa</option>
                </select>
                <span class="ustoz-err" id="d-err-subject"></span>
              </div>

              <div class="ustoz-fields-row">
                <div class="ustoz-field">
                  <label for="d-price">1 dars narxi *</label>
                  <select id="d-price">
                    <option value="">— Tanlang —</option>
                    <option value="1">50 000 so'mgacha</option>
                    <option value="2">50 000–100 000 so'm</option>
                    <option value="3">100 000–200 000 so'm</option>
                    <option value="4">200 000 so'mdan ko'p</option>
                  </select>
                  <span class="ustoz-err" id="d-err-price"></span>
                </div>
                <div class="ustoz-field">
                  <label for="d-experience">O'qitish tajribasi</label>
                  <select id="d-experience">
                    <option value="">— Tanlang —</option>
                    <option>1 yildan kam</option>
                    <option>1–3 yil</option>
                    <option>3–5 yil</option>
                    <option>5–10 yil</option>
                    <option>10 yildan ko'p</option>
                  </select>
                </div>
              </div>

              <div class="ustoz-field">
                <label for="d-description">O'zingiz haqingizda *</label>
                <textarea
                  id="d-description"
                  rows="4"
                  placeholder="Tajribangiz, sertifikatlaringiz, o'quvchilaringizning yutuqlari haqida...">
                </textarea>
                <span class="ustoz-err" id="d-err-description"></span>
              </div>

              <div class="ustoz-form-footer">
                <button type="submit" class="btn btn-primary" id="btn-dashboard-submit">
                  <ion-icon name="person-add-outline"></ion-icon>
                  Katalogga qo'shish
                </button>
              </div>

            </form>

            <!-- Сообщение об успехе -->
            <div class="ustoz-success hidden" id="ustoz-success">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <div>
                <b>Muvaffaqiyatli qo'shildi!</b>
                <p id="ustoz-success-msg"></p>
              </div>
            </div>

          </div><!-- /ustoz-form-wrap -->

          <!-- ПРАВАЯ ПАНЕЛЬ: полная анкета -->
          <div class="ustoz-cta-panel">
            <div class="ustoz-cta-card">
              <ion-icon name="rocket-outline" class="ustoz-cta-icon"></ion-icon>
              <h3 class="h4">To'liq anketa</h3>
              <p>Batafsil profil yarating: sertifikatlar, dars uslubi, jadval va boshqa ma'lumotlar. Ko'proq o'quvchilarni jalb qiling.</p>
              <button
                class="btn ustoz-cta-full-btn"
                onclick="window.UstazReg && window.UstazReg.open('tutor')"
                type="button">
                To'liq anketani to'ldirish →
              </button>
              <ul class="ustoz-benefits">
                <li><ion-icon name="checkmark-circle"></ion-icon> Ko'proq o'quvchilar jalb qiling</li>
                <li><ion-icon name="checkmark-circle"></ion-icon> Yuqori reyting va ko'rinish</li>
                <li><ion-icon name="checkmark-circle"></ion-icon> Moslashuvchan jadval</li>
                <li><ion-icon name="checkmark-circle"></ion-icon> Shaxsiy profil sahifasi</li>
              </ul>
            </div>
          </div><!-- /ustoz-cta-panel -->

        </div><!-- /ustoz-dashboard-grid -->
      </div>
    </section>
  `;

  // Вставляем перед футером
  const footer = document.querySelector('.footer');
  if (footer) {
    footer.insertAdjacentHTML('beforebegin', dashboardHtml);
  } else {
    document.querySelector('main article').insertAdjacentHTML('beforeend', dashboardHtml);
  }

  // Навешиваем submit на форму
  document.getElementById('ustoz-tutor-form').addEventListener('submit', function (e) {
    e.preventDefault();
    submitDashboardTutor();
  });
}

/** Валидация и отправка формы дашборда */
function submitDashboardTutor() {
  // Очищаем предыдущие ошибки
  ['d-err-name', 'd-err-subject', 'd-err-price', 'd-err-description'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  var nameEl = document.getElementById('d-name');
  var subjectEl = document.getElementById('d-subject');
  var priceEl = document.getElementById('d-price');
  var descEl = document.getElementById('d-description');
  var expEl = document.getElementById('d-experience');
  var valid = true;

  if (!nameEl.value.trim()) {
    document.getElementById('d-err-name').textContent = 'Ism kiritish shart';
    nameEl.focus();
    valid = false;
  }
  if (!subjectEl.value) {
    document.getElementById('d-err-subject').textContent = 'Fan tanlash shart';
    valid = false;
  }
  if (!priceEl.value) {
    document.getElementById('d-err-price').textContent = 'Narx tanlash shart';
    valid = false;
  }
  if (!descEl.value.trim()) {
    document.getElementById('d-err-description').textContent = 'Tavsif kiritish shart';
    valid = false;
  }
  if (!valid) return;

  // Анимация кнопки
  var submitBtn = document.getElementById('btn-dashboard-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  // Добавляем нового репетитора в базу
  var newTutor = addTutorToDb({
    name:       nameEl.value.trim(),
    subjects:   [subjectEl.value],
    rate:       PRICE_LABELS[priceEl.value],
    bio:        descEl.value.trim(),
    experience: expEl.value || '—',
    city:       'Toshkent',
    format:     'Faqat onlayn'
  });

  // Сбрасываем форму
  document.getElementById('ustoz-tutor-form').reset();
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<ion-icon name="person-add-outline"></ion-icon> Katalogga qo\'shish';

  // Показываем успех
  var successEl  = document.getElementById('ustoz-success');
  var successMsg = document.getElementById('ustoz-success-msg');
  successMsg.textContent = newTutor.name + " endi katalogda ko'rinadi!";
  successEl.classList.remove('hidden');

  // Прокрутка к каталогу через секунду
  setTimeout(function () {
    var catalog = document.getElementById('ustoz-catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 900);

  // Скрываем уведомление через 5 секунд
  setTimeout(function () {
    successEl.classList.add('hidden');
  }, 5000);
}


// ════════════════════════════════════════════════════════════
//  ПЕРЕХВАТ registration.js через window.UstozAPI
//
//  К этому моменту api.js уже выполнен и window.UstozAPI
//  установлен. Мы сохраняем оригинальный объект и
//  переопределяем нужные методы.
// ════════════════════════════════════════════════════════════
function setupApiHooks() {
  var orig = window.UstozAPI || {};

  window.UstozAPI = Object.assign({}, orig, {

    /**
     * Вызывается registration.js при отправке анкеты УЧИТЕЛЯ.
     * Сохраняем данные в localStorage и возвращаем успех.
     */
    submitTutor: function (data) {
      addTutorToDb(data);
      return Promise.resolve({ ok: true });
    },

    /**
     * Вызывается registration.js при отправке анкеты УЧЕНИКА.
     * Фильтруем репетиторов по предпочтениям и показываем результаты.
     */
    submitStudent: function (data) {
      applyStudentFilters(data);
      return Promise.resolve({ ok: true });
    },

    /**
     * Подписка на рассылку — логируем в консоль (оффлайн-режим).
     */
    subscribe: function (email) {
      if (orig.base && orig.base.length > 0) {
        return orig.subscribe ? orig.subscribe(email) : Promise.resolve({ ok: true });
      }
      console.log('[ustoz.uz] Newsletter subscribe (offline):', email);
      return Promise.resolve({ ok: true });
    },

    /**
     * Статистика — пробуем бэкенд, фолбэк на данные из localStorage.
     */
    getStats: function () {
      if (orig.getStats && orig.base && orig.base.length > 0) return orig.getStats();
      var tutors = loadTutors();
      return Promise.resolve({
        stats: { tutors: tutors.length, countries: 1, subjects: 50, lessons: 10000 }
      });
    }
  });
}


// ════════════════════════════════════════════════════════════
//  CSS СТИЛИ для новых секций
//  (инжектируются динамически, чтобы не трогать style.css)
// ════════════════════════════════════════════════════════════
function injectStyles() {
  if (document.getElementById('ustoz-extra-styles')) return;

  var style = document.createElement('style');
  style.id = 'ustoz-extra-styles';
  style.textContent = `

    /* ── УТИЛИТЫ ─────────────────────────────────────────── */
    .hidden { display: none !important; }

    /* ── ФИЛЬТРЫ КАТАЛОГА ────────────────────────────────── */
    .ustoz-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
      background: var(--white);
      padding: 28px 24px;
      border-radius: var(--radius-10);
      box-shadow: var(--shadow-2);
      margin-block-end: 36px;
    }
    .ustoz-filter-group {
      display: flex;
      flex-direction: column;
      gap: 7px;
      flex: 1;
      min-width: 160px;
    }
    .ustoz-filter-label {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--charcoal);
    }
    .ustoz-filter-select,
    .ustoz-filter-input {
      height: 46px;
      padding: 0 14px;
      border: 2px solid var(--cadet-blue-crayola_a20);
      border-radius: var(--radius-8);
      font-family: var(--ff-manrope);
      font-size: 1.4rem;
      color: var(--charcoal);
      background: var(--cultured);
      transition: border-color .2s;
    }
    .ustoz-filter-select:focus,
    .ustoz-filter-input:focus {
      outline: none;
      border-color: var(--violet-blue-crayola);
      background: var(--white);
    }
    .ustoz-filter-btns {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .ustoz-results-info {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--violet-blue-crayola);
      min-height: 22px;
      margin-block-end: 10px;
    }

    /* ── СЕТКА КАРТОЧЕК ──────────────────────────────────── */
    .ustoz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 24px;
    }
    .ustoz-tutor-card {
      background: var(--white);
      border-radius: var(--radius-10);
      padding: 24px;
      box-shadow: var(--shadow-1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 2px solid transparent;
      transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    }
    .ustoz-tutor-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-2);
      border-color: var(--violet-blue-crayola);
    }
    .ustoz-card-top {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .ustoz-avatar {
      width: 68px;
      height: 68px;
      border-radius: var(--radius-circle);
      overflow: hidden;
      flex-shrink: 0;
      background: var(--violet-blue-crayola);
    }
    .ustoz-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ustoz-avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-size: 3.2rem;
    }
    .ustoz-card-meta { flex: 1; min-width: 0; }
    .ustoz-tutor-name {
      font-size: var(--fs-7);
      font-weight: 700;
      color: var(--charcoal);
      margin-block-end: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ustoz-tutor-subject {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--violet-blue-crayola);
      margin-block-end: 6px;
    }
    .ustoz-rating {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 1.3rem;
    }
    .ustoz-stars {
      display: flex;
      gap: 2px;
      color: hsl(38, 92%, 50%);
      font-size: 1.4rem;
    }
    .ustoz-reviews { color: var(--cadet-blue-crayola); }
    .ustoz-tutor-desc {
      font-size: 1.4rem;
      color: var(--black-coral);
      line-height: 1.7;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .ustoz-card-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--cadet-blue-crayola_a20);
    }
    .ustoz-price,
    .ustoz-city {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1.3rem;
    }
    .ustoz-price { font-weight: 700; color: var(--charcoal); flex: 1; }
    .ustoz-city  { color: var(--black-coral); }
    .ustoz-book-btn {
      padding: 8px 18px !important;
      font-size: 1.3rem !important;
      margin-left: auto;
    }

    /* ПУСТОЕ СОСТОЯНИЕ */
    .ustoz-empty {
      text-align: center;
      padding: 70px 20px;
      color: var(--cadet-blue-crayola);
    }
    .ustoz-empty ion-icon { font-size: 5.6rem; display: block; margin: 0 auto 16px; }
    .ustoz-empty p { font-size: 1.6rem; line-height: 1.6; }

    /* ── ДАШБОРД ─────────────────────────────────────────── */
    .ustoz-dashboard {
      background: var(--cultured);
    }
    .ustoz-dashboard-intro {
      font-size: 1.6rem;
      color: var(--black-coral);
      margin-block-end: 40px;
      max-width: 600px;
    }
    .ustoz-dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 40px;
      align-items: start;
    }

    /* ФОРМА */
    .ustoz-form-wrap {
      background: var(--white);
      border-radius: var(--radius-10);
      padding: 36px;
      box-shadow: var(--shadow-2);
    }
    .ustoz-form-wrap .h4 { margin-block-end: 8px; color: var(--charcoal); }
    .ustoz-form-hint {
      font-size: 1.4rem;
      color: var(--black-coral);
      margin-block-end: 28px;
    }
    .ustoz-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-block-end: 20px;
    }
    .ustoz-field label {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--charcoal);
    }
    .ustoz-field input,
    .ustoz-field select,
    .ustoz-field textarea {
      padding: 12px 16px;
      border: 2px solid var(--cadet-blue-crayola_a20);
      border-radius: var(--radius-8);
      font-family: var(--ff-manrope);
      font-size: 1.4rem;
      color: var(--charcoal);
      background: var(--cultured);
      transition: border-color .2s, background .2s;
    }
    .ustoz-field input:focus,
    .ustoz-field select:focus,
    .ustoz-field textarea:focus {
      outline: none;
      border-color: var(--violet-blue-crayola);
      background: var(--white);
    }
    .ustoz-field textarea { resize: vertical; }
    .ustoz-err {
      font-size: 1.2rem;
      color: hsl(0, 75%, 55%);
      min-height: 16px;
    }
    .ustoz-fields-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .ustoz-form-footer { margin-top: 8px; }
    .ustoz-form-footer .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* СООБЩЕНИЕ ОБ УСПЕХЕ */
    .ustoz-success {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-top: 20px;
      padding: 18px 20px;
      background: hsl(142, 76%, 95%);
      border: 1.5px solid hsl(142, 60%, 75%);
      border-radius: var(--radius-8);
      color: hsl(142, 60%, 25%);
      font-size: 1.4rem;
    }
    .ustoz-success ion-icon { font-size: 2.8rem; flex-shrink: 0; margin-top: 2px; }
    .ustoz-success b { display: block; font-weight: 700; margin-block-end: 4px; }

    /* ПРАВАЯ ПАНЕЛЬ */
    .ustoz-cta-panel { position: sticky; top: 90px; }
    .ustoz-cta-card {
      background: linear-gradient(135deg, var(--charcoal) 0%, var(--raisin-black) 100%);
      color: var(--white);
      border-radius: var(--radius-10);
      padding: 36px 28px;
      text-align: center;
    }
    .ustoz-cta-icon {
      font-size: 5.6rem;
      display: block;
      margin: 0 auto 20px;
      color: var(--violet-blue-crayola);
    }
    .ustoz-cta-card .h4 {
      color: var(--white);
      margin-block-end: 12px;
      font-size: var(--fs-5);
    }
    .ustoz-cta-card p {
      color: var(--white_a70);
      font-size: 1.5rem;
      line-height: 1.7;
      margin-block-end: 28px;
    }
    .ustoz-cta-full-btn {
      width: 100%;
      justify-content: center;
      background: var(--violet-blue-crayola);
      color: var(--white);
      border: none;
      margin-block-end: 28px;
    }
    .ustoz-cta-full-btn:hover { opacity: .88; }
    .ustoz-benefits {
      list-style: none;
      padding: 0;
      text-align: left;
    }
    .ustoz-benefits li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      font-size: 1.4rem;
      color: var(--white_a70);
      border-top: 1px solid var(--white_a8);
    }
    .ustoz-benefits li:first-child { border-top: none; }
    .ustoz-benefits ion-icon {
      color: var(--violet-blue-crayola);
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    /* ── АДАПТИВ ──────────────────────────────────────────── */
    @media (max-width: 900px) {
      .ustoz-dashboard-grid { grid-template-columns: 1fr; }
      .ustoz-cta-panel { position: static; }
    }
    @media (max-width: 600px) {
      .ustoz-filters { gap: 12px; padding: 20px 16px; }
      .ustoz-filter-group { min-width: 100%; }
      .ustoz-filter-btns  { width: 100%; }
      .ustoz-filter-btns .btn { flex: 1; justify-content: center; }
      .ustoz-form-wrap { padding: 24px 20px; }
      .ustoz-fields-row { grid-template-columns: 1fr; }
    }
  `;

  document.head.appendChild(style);
}


// ════════════════════════════════════════════════════════════
//  ПРИВЯЗКА NAVBAR — «O'qituvchi topish» прокручивает к каталогу
// ════════════════════════════════════════════════════════════
function wireNavToScrollCatalog() {
  document.querySelectorAll('.navbar-link').forEach(function (link) {
    var txt = link.textContent.trim().toLowerCase();
    // Определяем ссылку "найти репетитора" на всех трёх языках
    if (txt.includes('topish') || txt.includes('найти') || txt.includes('find a tutor')) {
      link.addEventListener('click', function (e) {
        var catalog = document.getElementById('ustoz-catalog');
        if (catalog) {
          e.preventDefault();
          catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  });
}


// ════════════════════════════════════════════════════════════
//  ЗАГРУЗКА
// ════════════════════════════════════════════════════════════
function boot() {
  // 1. Стили для новых секций
  injectStyles();

  // 2. Перехват UstozAPI (api.js уже выполнен к этому моменту,
  //    т.к. скрипты в <body> выполняются синхронно по порядку)
  setupApiHooks();

  // 3. Вставка секций в DOM
  injectCatalogSection();
  injectDashboardSection();

  // 4. Прокрутка navbar → каталог
  wireNavToScrollCatalog();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}