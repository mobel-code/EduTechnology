'use strict';

/**
 * ustoz.uz — HTTP client for backend API
 * Run site via: npm start  →  http://localhost:3000
 */
(function (global) {
  var API_BASE = (global.USTOZ_API_BASE != null ? global.USTOZ_API_BASE : '').replace(/\/$/, '');

  function getToken() {
    try { return localStorage.getItem('ustoz_token'); } catch (e) { return null; }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem('ustoz_token', token);
      else localStorage.removeItem('ustoz_token');
    } catch (e) { /* ignore */ }
  }

  async function request(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    if (options.headers) Object.assign(headers, options.headers);

    var res = await fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body,
    });

    var data = {};
    try { data = await res.json(); } catch (e) { /* non-json */ }

    if (!res.ok) {
      var msg = data.error || (data.errors && data.errors[0] && data.errors[0].msg) || 'So\'rov bajarilmadi';
      var err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  global.UstozAPI = {
    base: API_BASE,
    getToken: getToken,
    setToken: setToken,

    getStats: function () { return request('/api/stats'); },
    getTutors: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return request('/api/tutors' + (q ? '?' + q : ''));
    },
    matchTutors: function (prefs) {
      return request('/api/tutors/match', { method: 'POST', body: JSON.stringify(prefs) });
    },
    getTutor: function (id) { return request('/api/tutors/' + id); },
    subscribe: function (email) {
      return request('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email: email }) });
    },
    submitStudent: function (data) {
      return request('/api/applications/student', { method: 'POST', body: JSON.stringify(data) });
    },
    submitTutor: function (data) {
      return request('/api/applications/tutor', { method: 'POST', body: JSON.stringify(data) });
    },
    register: function (data) {
      return request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
    },
    login: function (data) {
      return request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
    },
    createBooking: function (data) {
      return request('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
    },
  };

  /** Update hero stats from database */
  function loadStats() {
    if (!API_BASE && location.protocol === 'file:') return;
    global.UstozAPI.getStats().then(function (res) {
      var s = res.stats;
      if (!s) return;
      var card = document.querySelector('.stats-card');
      if (!card) return;
      var nums = card.querySelectorAll('.h1');
      if (nums[0]) nums[0].textContent = formatNum(s.tutors) + '+';
      if (nums[1]) nums[1].textContent = String(s.countries);
      if (nums[2]) nums[2].textContent = s.subjects + '+';
      if (nums[3]) nums[3].textContent = formatNum(s.lessons);
    }).catch(function () { /* offline */ });
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return String(n);
  }

  function wireNewsletter() {
    var form = document.querySelector('.footer-list form, form:has([name="email_address"])');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('[name="email_address"], input[type="email"]');
      if (!input || !input.value.trim()) return;
      var btn = form.querySelector('button[type="submit"], .submit-btn');
      var oldText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = '...'; }
      global.UstozAPI.subscribe(input.value.trim())
        .then(function () {
          input.value = '';
          if (btn) btn.textContent = '✓';
          setTimeout(function () { if (btn) { btn.textContent = oldText; btn.disabled = false; } }, 2000);
        })
        .catch(function (err) {
          alert(err.message);
          if (btn) { btn.textContent = oldText; btn.disabled = false; }
        });
    });
  }

  function boot() {
    loadStats();
    wireNewsletter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
