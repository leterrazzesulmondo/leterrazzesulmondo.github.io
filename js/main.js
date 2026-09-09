/* ============================================================
   Le Terrazze sul Mondo - B&B a Gravina in Puglia
   Comportamenti: navbar, menu mobile, parallax, reveal,
   lightbox galleria, form richiesta disponibilita.
   ============================================================ */

(function () {
  'use strict';

  var nav        = document.getElementById('nav');
  var burger     = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');
  var heroBg     = document.getElementById('hero-bg');
  var links      = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections   = links.map(function (l) { return document.querySelector(l.getAttribute('href')); });
  var reduced    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navbar: trasparente sulla hero, opaca allo scroll ---------- */
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    nav.classList.toggle('is-scrolled', y > 70);

    /* Parallax leggero sulla hero (solo finché è visibile) */
    if (heroBg && !reduced && y < window.innerHeight * 1.2) {
      heroBg.style.transform = 'translate3d(0,' + (y * 0.32) + 'px,0)';
    }

    /* Link attivo in base alla sezione visibile */
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s && s.offsetTop - 140 <= y) current = links[i];
    }
    links.forEach(function (l) { l.classList.toggle('is-active', l === current); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Menu hamburger ---------- */
  function toggleMenu(force) {
    var open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    document.body.classList.toggle('no-scroll', open);
  }

  burger.addEventListener('click', function () { toggleMenu(); });
  mobileMenu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') toggleMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') toggleMenu(false);
  });

  /* ---------- Scroll fluido (con fallback per browser senza scroll-behavior) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      if (mobileMenu.classList.contains('is-open')) toggleMenu(false);

      var offset = nav.classList.contains('is-scrolled') ? 68 : 78;
      var top = target.getBoundingClientRect().top + window.pageYOffset - (target.id === 'hero' ? 0 : offset - 1);

      window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Reveal allo scroll (Intersection Observer) ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Lightbox galleria ---------- */
  var gallery  = document.getElementById('gallery');
  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lb-img');
  var figures  = Array.prototype.slice.call(gallery.querySelectorAll('img'));
  var index    = 0;

  function openLightbox(i) {
    index = (i + figures.length) % figures.length;
    lbImg.src = figures[index].src;
    lbImg.alt = figures[index].alt;
    lightbox.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  gallery.addEventListener('click', function (e) {
    var fig = e.target.closest('figure');
    if (!fig) return;
    openLightbox(figures.indexOf(fig.querySelector('img')));
  });

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', function (e) { e.stopPropagation(); openLightbox(index - 1); });
  document.getElementById('lb-next').addEventListener('click', function (e) { e.stopPropagation(); openLightbox(index + 1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  openLightbox(index - 1);
    if (e.key === 'ArrowRight') openLightbox(index + 1);
  });

  /* ---------- Form (demo: nessun invio reale) ---------- */
  var form = document.getElementById('booking-form');
  var ok   = document.getElementById('form-ok');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nome  = form.nome.value.trim();
    var email = form.email.value.trim();

    if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      (nome ? form.email : form.nome).focus();
      return;
    }
    ok.classList.add('is-visible');
    form.reset();
    setTimeout(function () { ok.classList.remove('is-visible'); }, 6000);
  });

  /* ---------- Date minime coerenti ---------- */
  var oggi = new Date().toISOString().split('T')[0];
  form.arrivo.min = oggi;
  form.partenza.min = oggi;
  form.arrivo.addEventListener('change', function () {
    form.partenza.min = form.arrivo.value || oggi;
    if (form.partenza.value && form.partenza.value < form.arrivo.value) form.partenza.value = '';
  });

  /* ---------- Anno nel footer ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
