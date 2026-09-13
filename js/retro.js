(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Footer year ---------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Nav active state ------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function setActiveNav(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* Stat bars fill when scrolled into view -------------------------------- */
  var stats = document.querySelector('.stats');
  if (stats) {
    if ('IntersectionObserver' in window) {
      var statObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            stats.classList.add('is-in');
            obs.disconnect();
          }
        });
      }, { threshold: 0.3 });
      statObserver.observe(stats);
    } else {
      stats.classList.add('is-in');
    }
  }

  /* Carousels -------------------------------------------------------------- */
  var AUTOPLAY_MS = 3500;

  function carouselGo(c, n) {
    var slides = c.querySelectorAll('.carousel__slide');
    var dots = c.querySelectorAll('.carousel__dot');
    if (!slides.length) return;
    c._idx = ((n % slides.length) + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === c._idx); });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === c._idx);
      d.setAttribute('aria-current', i === c._idx ? 'true' : 'false');
    });
  }

  function carouselStop(c) {
    if (c._timer) { clearInterval(c._timer); c._timer = null; }
  }

  function carouselStart(c) {
    carouselStop(c);
    if (reduceMotion) return;
    var count = c.querySelectorAll('.carousel__slide').length;
    if (count < 2) return;
    c._timer = setInterval(function () { carouselGo(c, c._idx + 1); }, AUTOPLAY_MS);
  }

  function carouselInit(c) {
    var slides = c.querySelectorAll('.carousel__slide');
    var dotsWrap = c.querySelector('.carousel__dots');
    c._idx = 0;

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel__dot';
        b.setAttribute('aria-label', 'Screenshot ' + (i + 1) + ' of ' + slides.length);
        b.addEventListener('click', function () { carouselGo(c, i); carouselStart(c); });
        dotsWrap.appendChild(b);
      });
    }

    var prev = c.querySelector('[data-prev]');
    var next = c.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { carouselGo(c, c._idx - 1); carouselStart(c); });
    if (next) next.addEventListener('click', function () { carouselGo(c, c._idx + 1); carouselStart(c); });

    c.addEventListener('mouseenter', function () { carouselStop(c); });
    c.addEventListener('mouseleave', function () { if (!c.closest('.level').hidden) carouselStart(c); });

    carouselGo(c, 0);
  }

  var carousels = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]'));
  carousels.forEach(carouselInit);

  /* Project select ---------------------------------------------------------- */
  var tilesWrap = document.querySelector('.tiles');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile[data-project]'));
  var levels = Array.prototype.slice.call(document.querySelectorAll('.level'));
  var selected = 0;

  function selectTile(i, focus) {
    if (!tiles.length) return;
    selected = ((i % tiles.length) + tiles.length) % tiles.length;
    tiles.forEach(function (t, k) {
      t.classList.toggle('is-selected', k === selected);
      t.tabIndex = k === selected ? 0 : -1;
    });
    if (focus) tiles[selected].focus();
  }

  function closeLevels() {
    levels.forEach(function (l) {
      l.hidden = true;
      var c = l.querySelector('[data-carousel]');
      if (c) carouselStop(c);
    });
    tiles.forEach(function (t) {
      t.classList.remove('is-open');
      t.setAttribute('aria-expanded', 'false');
    });
  }

  function openTile(i) {
    var tile = tiles[i];
    if (!tile) return;
    var level = document.getElementById(tile.getAttribute('aria-controls'));
    if (!level) return;
    var wasOpen = !level.hidden;
    closeLevels();
    if (wasOpen) return;

    level.hidden = false;
    tile.classList.add('is-open');
    tile.setAttribute('aria-expanded', 'true');

    var c = level.querySelector('[data-carousel]');
    if (c) { carouselGo(c, 0); carouselStart(c); }

    level.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  tiles.forEach(function (tile, i) {
    tile.addEventListener('click', function () { selectTile(i, false); openTile(i); });
    tile.addEventListener('focus', function () { selectTile(i, false); });
  });

  if (tilesWrap && tiles.length) {
    selectTile(0, false);
    tilesWrap.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault(); selectTile(selected + 1, true); break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault(); selectTile(selected - 1, true); break;
        case 'a':
        case 'A':
          e.preventDefault(); openTile(selected); break;
        case 'Escape':
          closeLevels(); break;
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-close-level]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeLevels();
      if (tilesWrap) tilesWrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      if (tiles[selected]) tiles[selected].focus();
    });
  });
})();
