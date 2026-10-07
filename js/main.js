/* ============================================================
   Le Terrazze sul Mondo - B&B a Gravina in Puglia
   Comportamenti: navbar, menu mobile, parallax, reveal,
   lightbox galleria, form richiesta disponibilita.
   ============================================================ */

(function () {
  'use strict';

  var nav         = document.getElementById('nav');
  var burger      = document.getElementById('burger');
  var mobileMenu  = document.getElementById('mobile-menu');
  var hero        = document.getElementById('hero');
  var heroBg      = document.getElementById('hero-bg');
  var heroVideo   = document.getElementById('hero-video');
  var heroVeil    = document.getElementById('hero-veil');
  var heroScrim   = document.getElementById('hero-scrim');
  var heroPin     = document.getElementById('hero-pin');
  var heroContent = document.getElementById('hero-content');
  var heroScroll  = document.getElementById('hero-scroll');
  var links       = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections    = links.map(function (l) { return document.querySelector(l.getAttribute('href')); });
  var reduced     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero: l'illustrazione resta larga quanto la riga "Bed & Breakfast..." ---------- */
  var heroMotif   = document.querySelector('.hero__motif');
  var heroEyebrow = document.querySelector('.hero__eyebrow');
  function syncMotifWidth() {
    if (heroMotif && heroEyebrow && heroEyebrow.offsetWidth) {
      heroMotif.style.width = heroEyebrow.offsetWidth + 'px';
    }
  }
  syncMotifWidth();
  window.addEventListener('resize', syncMotifWidth);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(syncMotifWidth); }

  /* ---------- Hero: video drone al posto della foto (mobile in avanti, desktop al contrario) ---------- */
  var heroVideoReady = false;
  var mobileHeroQuery = window.matchMedia('(max-width:760px)');

  function desiredHeroVideo() {
    return mobileHeroQuery.matches
      ? { src: 'img/hero-mobile.mp4', poster: 'img/hero-mobile-poster.jpg' }
      : { src: 'img/hero-desktop.mp4', poster: 'img/hero-desktop-poster.jpg' };
  }

  function ensureHeroVideo() {
    if (!heroVideo || reduced) return;
    var want = desiredHeroVideo();
    if (heroVideo.getAttribute('data-loaded') === want.src) return;
    heroVideo.setAttribute('data-loaded', want.src);
    heroVideoReady = false;
    heroVideo.poster = want.poster;
    heroVideo.addEventListener('loadedmetadata', function () {
      heroVideoReady = true;
      /* Molti browser ignorano currentTime finché il video non e' stato
         "avviato" una volta: lo si avvia muto e si mette subito in pausa. */
      var p = heroVideo.play();
      if (p && p.then) p.then(function () { heroVideo.pause(); }).catch(function () {});
    }, { once: true });
    heroVideo.src = want.src;
    heroVideo.load();
  }
  ensureHeroVideo();
  if (mobileHeroQuery.addEventListener) {
    mobileHeroQuery.addEventListener('change', ensureHeroVideo);
  } else if (mobileHeroQuery.addListener) {
    mobileHeroQuery.addListener(ensureHeroVideo);
  }

  /* ---------- Navbar: trasparente sulla hero, opaca allo scroll ---------- */
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    nav.classList.toggle('is-scrolled', y > 70);

    /* Hero "pinnata": i testi scorrono e svaniscono, la foto esce dalla
       foschia e mette a fuoco il punto esatto, poi la sezione si sblocca. */
    if (hero && !reduced) {
      var scrollRange = Math.max(hero.offsetHeight - window.innerHeight, 1);
      /* La messa a fuoco si completa al 70% dello scroll pinnato: il restante
         30% e' una sosta a fuoco, prima che la sezione si sblocchi. */
      var focus = Math.min(Math.max((y / scrollRange) / 0.7, 0), 1);
      var textT = Math.min(focus / 0.5, 1);

      var heroFilter = 'blur(' + (3 * (1 - focus)).toFixed(2) + 'px) saturate(' + (0.95 + 0.05 * focus).toFixed(3) + ')';
      heroBg.style.filter = heroFilter;
      if (heroVideo) {
        heroVideo.style.filter = heroFilter;
        if (heroVideoReady && heroVideo.duration) {
          var t = focus * heroVideo.duration;
          if (Math.abs(heroVideo.currentTime - t) > 0.03) {
            try { heroVideo.currentTime = t; } catch (err) { /* seek non pronto, ignora */ }
          }
        }
      }
      if (heroVeil) heroVeil.style.opacity = (0.28 * (1 - focus)).toFixed(3);
      if (heroScrim) heroScrim.style.opacity = (1 - 0.8 * focus).toFixed(3);
      if (heroPin) heroPin.classList.toggle('is-visible', focus > 0.6);
      if (heroContent) {
        heroContent.style.opacity = (1 - textT).toFixed(3);
        heroContent.style.transform = 'translateY(' + (-60 * textT).toFixed(1) + 'px)';
      }
      if (heroScroll && y > 0) {
        heroScroll.style.animation = 'none';
        heroScroll.style.opacity = Math.max(1 - focus / 0.12, 0).toFixed(3);
      }
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

  /* ---------- Carosello foto camere ---------- */
  document.querySelectorAll('.room__carousel').forEach(function (carousel) {
    var imgs = Array.prototype.slice.call(carousel.querySelectorAll('.room__carousel-track img'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.room__carousel-dots button'));
    if (imgs.length < 2) return;

    var current  = 0;
    var interval = parseInt(carousel.getAttribute('data-interval'), 10) || 4500;
    var timer    = null;

    function show(i) {
      current = (i + imgs.length) % imgs.length;
      imgs.forEach(function (img, n) { img.classList.toggle('is-active', n === current); });
      dots.forEach(function (dot, n) { dot.classList.toggle('is-active', n === current); });
    }

    function start() {
      if (reduced) return;
      stop();
      timer = setInterval(function () { show(current + 1); }, interval);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach(function (dot, n) {
      dot.addEventListener('click', function (e) { e.stopPropagation(); show(n); start(); });
    });

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);

    start();
  });

  /* ---------- Lightbox (galleria + camere) ---------- */
  var gallery      = document.getElementById('gallery');
  var lightbox     = document.getElementById('lightbox');
  var lbImg        = document.getElementById('lb-img');
  var figures      = Array.prototype.slice.call(gallery.querySelectorAll('img'));
  var lightboxList = figures;
  var index        = 0;

  function openLightbox(list, i) {
    lightboxList = list;
    index = (i + list.length) % list.length;
    lbImg.src = list[index].src;
    lbImg.alt = list[index].alt;
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
    openLightbox(figures, figures.indexOf(fig.querySelector('img')));
  });

  document.querySelectorAll('.room__media').forEach(function (media) {
    var roomImgs = Array.prototype.slice.call(media.querySelectorAll('img'));
    if (!roomImgs.length) return;
    media.addEventListener('click', function () {
      var active = roomImgs.findIndex(function (img) { return img.classList.contains('is-active'); });
      openLightbox(roomImgs, active > -1 ? active : 0);
    });
  });

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', function (e) { e.stopPropagation(); openLightbox(lightboxList, index - 1); });
  document.getElementById('lb-next').addEventListener('click', function (e) { e.stopPropagation(); openLightbox(lightboxList, index + 1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  openLightbox(lightboxList, index - 1);
    if (e.key === 'ArrowRight') openLightbox(lightboxList, index + 1);
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
