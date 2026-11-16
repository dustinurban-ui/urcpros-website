// Urban Recruiting & Consulting — site behavior
(function () {
  // ---- Settings you may want to change ----
  var CALENDLY_URL = 'https://calendly.com/surban26';
  // Route to Hire login address. Leave '' to send "Client login" to the contact page.
  var PORTAL_URL = '';

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Client portal link
  if (PORTAL_URL) {
    document.querySelectorAll('[data-portal-link]').forEach(function (a) { a.href = PORTAL_URL; });
  }

  // Vacancy cost calculator
  var roles = document.getElementById('calc-roles');
  if (roles) {
    var days = document.getElementById('calc-days');
    var daily = document.getElementById('calc-daily');
    var total = document.getElementById('calc-total');
    var weekly = document.getElementById('calc-weekly');
    var n = function (el) { return Math.max(0, Number(el.value) || 0); };
    var fmt = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };
    var update = function () {
      total.textContent = fmt(n(roles) * n(days) * n(daily));
      weekly.textContent = fmt(n(roles) * 7 * n(daily));
    };
    [roles, days, daily].forEach(function (el) { el.addEventListener('input', update); });
    update();
  }

  // Calendly booking: embed the calendar, with a booking button as a fallback.
  function showCalendar(data) {
    var parent = document.getElementById('calendly-embed');
    var q = '?hide_gdpr_banner=1&name=' + encodeURIComponent(data.name || '') + '&email=' + encodeURIComponent(data.email || '');
    var bookUrl = CALENDLY_URL + q;
    var fallback = function () {
      parent.className = '';
      parent.innerHTML = '';
      var a = document.createElement('a');
      a.className = 'btn btn-pink';
      a.href = bookUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Choose a time for your call';
      parent.appendChild(a);
    };
    var init = function () {
      try {
        window.Calendly.initInlineWidget({
          url: CALENDLY_URL + '?hide_gdpr_banner=1',
          parentElement: parent,
          prefill: { name: data.name, email: data.email }
        });
      } catch (e) { fallback(); }
    };
    if (window.Calendly) { init(); return; }
    // Load Calendly's script if it isn't there yet (slow network or blocked earlier).
    if (!document.querySelector('script[src*="assets.calendly.com"]')) {
      var s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      document.head.appendChild(s);
    }
    var tries = 0;
    var wait = setInterval(function () {
      if (window.Calendly) { clearInterval(wait); init(); }
      else if (++tries > 80) { clearInterval(wait); fallback(); }   // ~12 seconds
    }, 150);
  }

  // Lead form -> /api/contact, then show Calendly
  var form = document.getElementById('lead-form');
  if (form) {
    var errorBox = document.getElementById('form-error');
    var submit = document.getElementById('lead-submit');
    var showError = function (msg) { errorBox.textContent = msg; errorBox.hidden = false; };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.hidden = true;
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        showError('Please fill in your name, company, a valid work email, your role and company size.');
        if (bad) bad.focus();
        return;
      }
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) {
        if (k === 'needs') { (data.needs = data.needs || []).push(v); } else { data[k] = v; }
      });
      submit.disabled = true;
      submit.textContent = 'Sending…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw new Error(body.error || 'Something went wrong.');
        });
      }).then(function () {
        form.hidden = true;
        var booking = document.getElementById('booking');
        booking.hidden = false;
        document.getElementById('booking-heading').focus();
        booking.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showCalendar(data);
        if (window.va) { window.va('event', { name: 'Lead submitted' }); }
      }).catch(function (err) {
        showError(err.message + ' Please try again, or call (303) 651-2275.');
        submit.disabled = false;
        submit.textContent = 'Request my strategy call';
      });
    });
  }

  // Checklist lead magnet -> /api/contact, then reveal the checklist
  var clForm = document.getElementById('checklist-form');
  if (clForm) {
    var clError = document.getElementById('checklist-error');
    var clSubmit = document.getElementById('checklist-submit');
    var checklist = document.getElementById('checklist');
    var reveal = function () {
      clForm.hidden = true;
      document.getElementById('checklist-thanks').hidden = false;
      checklist.hidden = false;
      try { localStorage.setItem('urc_checklist', '1'); } catch (e) {}
    };
    // Returning visitors who already signed up go straight to the checklist
    try { if (localStorage.getItem('urc_checklist') === '1') { reveal(); } } catch (e) {}

    clForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clError.hidden = true;
      if (!clForm.checkValidity()) {
        var bad = clForm.querySelector(':invalid');
        clError.textContent = 'Please fill in your name, company and a valid work email.';
        clError.hidden = false;
        if (bad) bad.focus();
        return;
      }
      var data = { source: 'checklist' };
      new FormData(clForm).forEach(function (v, k) { data[k] = v; });
      var params = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (params.get(k)) data[k] = params.get(k); });
      clSubmit.disabled = true;
      clSubmit.textContent = 'Sending…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw new Error(body.error || 'Something went wrong.');
        });
      }).then(function () {
        reveal();
        document.getElementById('checklist-thanks-heading').focus();
        if (window.va) { window.va('event', { name: 'Checklist lead', data: { source: data.utm_source || 'direct' } }); }
      }).catch(function (err) {
        clError.textContent = err.message + ' Please try again, or email connect@urcpros.com.';
        clError.hidden = false;
        clSubmit.disabled = false;
        clSubmit.textContent = 'Send me the checklist';
      });
    });

    var printBtn = document.getElementById('print-checklist');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
  }
})();
