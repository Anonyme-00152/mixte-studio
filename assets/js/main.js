/* ==========================================================================
   MIXTE® — Interactions
   Préloader « feux de départ », smooth scroll (Lenis), animations au scroll
   (GSAP + ScrollTrigger), curseur, menu, circuit, témoignages, formulaire.
   Le site reste entièrement lisible si GSAP/Lenis ne se chargent pas.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var lenis = null;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function store(key, val) {
    try {
      if (val === undefined) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ------------------------------------------------------------------
     Découpage du texte
     ------------------------------------------------------------------ */
  function splitChars() {
    var i = 0;
    $$('[data-split]').forEach(function (el) {
      var text = el.textContent;
      el.textContent = '';
      Array.from(text).forEach(function (ch) {
        if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        s.style.setProperty('--i', i++);
        el.appendChild(s);
      });
    });
  }

  function splitWords(root) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('chip')) {
          walk(child);
        }
      });
    })(root);
    return $$('.w, .chip', root);
  }

  /* ------------------------------------------------------------------
     Préloader — feux de départ F1
     ------------------------------------------------------------------ */
  function runLoader() {
    return new Promise(function (resolve) {
      var loader = $('[data-loader]');
      if (!loader) return resolve();

      var lights = $$('.light', loader);
      var count = $('[data-loader-count]', loader);
      var bar = $('[data-loader-bar]', loader);
      var status = $('[data-loader-status]', loader);
      var shown = 0, target = 0;

      (function counter() {
        shown += (target - shown) * 0.16;
        if (Math.abs(target - shown) < 0.5) shown = target;
        count.textContent = Math.round(shown);
        if (!loader.classList.contains('is-done')) requestAnimationFrame(counter);
      })();

      function finish() {
        loader.classList.add('is-done');
        setTimeout(function () { loader.classList.add('is-hidden'); }, 1300);
        resolve();
      }

      var quick = reduceMotion || store('mixte-visited');
      store('mixte-visited', '1');

      var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

      if (quick) {
        Promise.race([fontsReady, wait(700)]).then(function () {
          target = 100; bar.style.transform = 'scaleX(1)';
          lights.forEach(function (l) { l.classList.add('is-on'); });
          setTimeout(function () {
            lights.forEach(function (l) { l.classList.remove('is-on'); });
            loader.classList.add('is-go');
            status.textContent = 'Feu vert';
            setTimeout(finish, 250);
          }, 350);
        });
        return;
      }

      var step = 0;
      function tick() {
        if (step < lights.length) {
          lights[step].classList.add('is-on');
          step++;
          target = Math.round((step / lights.length) * 100);
          bar.style.transform = 'scaleX(' + step / lights.length + ')';
          setTimeout(tick, 320);
        } else {
          setTimeout(function () {
            lights.forEach(function (l) { l.classList.remove('is-on'); });
            loader.classList.add('is-go');
            status.textContent = 'Feu vert — c’est parti';
            setTimeout(finish, 480);
          }, 450 + Math.random() * 300);
        }
      }
      Promise.race([fontsReady, wait(1200)]).then(function () { setTimeout(tick, 250); });
    });
  }

  /* ------------------------------------------------------------------
     Smooth scroll
     ------------------------------------------------------------------ */
  function initLenis() {
    if (reduceMotion || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    }
    lenis.stop();
  }

  function scrollToTarget(target, opts) {
    opts = opts || {};
    if (lenis) {
      lenis.scrollTo(target, {
        offset: 0,
        duration: opts.immediate ? 0 : 1.6,
        immediate: !!opts.immediate,
        easing: function (t) { return 1 - Math.pow(1 - t, 4); }
      });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: opts.immediate ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
    }
  }

  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id === '#') { e.preventDefault(); return; }
      var target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      var wasOpen = closeMenu();
      setTimeout(function () { scrollToTarget(target); }, wasOpen ? 450 : 0);
    });
  }

  /* ------------------------------------------------------------------
     Horloge Paris + année
     ------------------------------------------------------------------ */
  function initClock() {
    var els = $$('[data-clock]');
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
    } catch (e) {
      fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    function update() {
      var t = fmt.format(new Date());
      els.forEach(function (el) { el.textContent = t; });
    }
    update();
    setInterval(update, 1000);
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------
     Navigation : thème selon la section, masquage au scroll, lien actif
     ------------------------------------------------------------------ */
  var nav = $('[data-nav]');
  var themed = $$('main section[data-theme], footer[data-theme]');
  var navLinks = $$('.nav__link');

  function sectionAt(y) {
    var found = null;
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) found = themed[i];
    }
    return found;
  }

  function initNav() {
    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      var sec = sectionAt(nav.offsetHeight / 2);
      nav.dataset.theme = sec ? sec.dataset.theme : 'dark';

      if (!nav.classList.contains('menu-open')) {
        var delta = y - lastY;
        if (y > window.innerHeight * 0.7 && delta > 4) nav.classList.add('is-hidden');
        else if (delta < -4 || y < 80) nav.classList.remove('is-hidden');
      }
      lastY = y;

      var mid = sectionAt(window.innerHeight * 0.45);
      var id = mid ? mid.id : '';
      navLinks.forEach(function (l) { l.classList.toggle('is-current', l.getAttribute('href') === '#' + id); });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ------------------------------------------------------------------
     Menu plein écran
     ------------------------------------------------------------------ */
  var menu = $('[data-menu]');
  var toggle = $('[data-menu-toggle]');
  var menuLabel = $('[data-menu-label]');
  var inertTargets = [$('main'), $('footer')];

  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    menuLabel.textContent = 'Fermer';
    nav.classList.add('menu-open');
    nav.classList.remove('is-hidden');
    body.classList.add('is-locked');
    inertTargets.forEach(function (el) { if (el) el.inert = true; });
    if (lenis) lenis.stop();
    setTimeout(function () { var f = $('[data-menu-link]', menu); if (f) f.focus({ preventScroll: true }); }, 500);
  }

  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    menuLabel.textContent = 'Menu';
    nav.classList.remove('menu-open');
    body.classList.remove('is-locked');
    inertTargets.forEach(function (el) { if (el) el.inert = false; });
    if (lenis) lenis.start();
    return true;
  }

  function initMenu() {
    if (!menu || !toggle) return;
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
      else openMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
    });

    var card = $('[data-menu-card]');
    var num = $('[data-menu-num]');
    var text = $('[data-menu-text]');
    var previews = [
      { bg: 'var(--lime)', fg: 'var(--black)', text: 'Projets sélectionnés — 2019/2026' },
      { bg: 'var(--cream)', fg: 'var(--black)', text: 'Six expertises, une seule équipe' },
      { bg: 'var(--violet)', fg: '#fff', text: 'Cinq virages jusqu’au drapeau à damier' },
      { bg: 'var(--plum)', fg: 'var(--lav-2)', text: '37 prix & mentions internationales' },
      { bg: 'var(--lav)', fg: 'var(--plum)', text: 'Notes du paddock — idées & coulisses' },
      { bg: 'var(--coral)', fg: 'var(--black)', text: 'Prêt pour le départ ? Écrivez-nous.' }
    ];
    $$('[data-menu-link]', menu).forEach(function (a) {
      function show() {
        var i = +a.dataset.preview;
        var p = previews[i];
        card.style.setProperty('--card-bg', p.bg);
        card.style.setProperty('--card-fg', p.fg);
        num.textContent = String(i + 1).padStart(2, '0');
        text.textContent = p.text;
      }
      a.addEventListener('pointerenter', show);
      a.addEventListener('focus', show);
    });
  }

  /* ------------------------------------------------------------------
     Curseur personnalisé + boutons magnétiques
     ------------------------------------------------------------------ */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    var c = $('.cursor');
    if (!c) return;
    doc.classList.add('has-cursor');
    var dot = $('.cursor__dot', c);
    var ring = $('.cursor__ring', c);
    var label = $('[data-cursor-label]', c);
    var mx = -100, my = -100, rx = -100, ry = -100;
    var dirty = true;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY; dirty = true;
      c.classList.remove('is-hidden');
    }, { passive: true });
    window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.add('is-hidden'); });
    window.addEventListener('blur', function () { c.classList.add('is-hidden'); });
    window.addEventListener('pointerdown', function () { c.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { c.classList.remove('is-down'); });

    document.addEventListener('pointerover', function (e) {
      var withLabel = e.target.closest('[data-cursor]');
      if (withLabel) {
        label.textContent = withLabel.dataset.cursor;
        c.classList.add('is-label');
        c.classList.remove('is-link');
        return;
      }
      c.classList.remove('is-label');
      var field = e.target.closest('input, textarea');
      c.classList.toggle('is-hidden', !!field);
      var interactive = e.target.closest('a, button, label, [role="tab"], summary');
      c.classList.toggle('is-link', !!interactive);
    });

    (function loop() {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (dirty) {
        dirty = false;
        var el = document.elementFromPoint(mx, my);
        var th = 'dark';
        if (el && !(menu && menu.classList.contains('is-open'))) {
          var holder = el.closest('[data-cursor-theme], [data-theme]');
          if (holder) th = holder.dataset.cursorTheme || holder.dataset.theme;
        }
        c.classList.toggle('on-light', th === 'light' || th === 'lime');
      }
      requestAnimationFrame(loop);
    })();
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic').forEach(function (el) {
      var strength = el.classList.contains('end-cta') ? 0.12 : 0.32;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * strength).toFixed(1) + 'px,' + (y * strength).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------
     Expertises — accordéon
     ------------------------------------------------------------------ */
  var refreshTimer;
  function refreshSoon(delay) {
    if (!hasGSAP) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, delay || 900);
  }

  function initAccordion() {
    var items = $$('.svc__item');
    function set(item, open) {
      item.classList.toggle('is-open', open);
      $('.svc__row', item).setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    items.forEach(function (item) {
      $('.svc__row', item).addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        items.forEach(function (o) { if (o !== item) set(o, false); });
        set(item, open);
        refreshSoon();
      });
    });
    if (items[0]) set(items[0], true);
  }

  /* ------------------------------------------------------------------
     Témoignages
     ------------------------------------------------------------------ */
  function initQuotes() {
    var root = $('[data-quotes]');
    if (!root) return;
    var quotes = $$('.quote', root);
    var bars = $$('[data-quote-bars] button', root);
    var DUR = 7000;
    var idx = 0, timer = null, startedAt = 0, remaining = DUR, paused = false;
    root.style.setProperty('--dur', DUR + 'ms');

    function schedule(ms) {
      clearTimeout(timer);
      if (reduceMotion) return;
      startedAt = Date.now();
      remaining = ms;
      timer = setTimeout(function () { show(idx + 1); }, ms);
    }

    function show(i) {
      idx = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, k) { q.classList.toggle('is-active', k === idx); });
      bars.forEach(function (b, k) {
        b.classList.remove('is-active');
        b.classList.toggle('is-done', k < idx);
      });
      void root.offsetWidth; // relance l'animation de la barre
      bars[idx].classList.add('is-active');
      if (!paused) schedule(DUR);
    }

    bars.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    $('[data-quote-prev]', root).addEventListener('click', function () { show(idx - 1); });
    $('[data-quote-next]', root).addEventListener('click', function () { show(idx + 1); });

    root.addEventListener('pointerenter', function () {
      paused = true;
      clearTimeout(timer);
      remaining -= Date.now() - startedAt;
      root.classList.add('is-paused');
    });
    root.addEventListener('pointerleave', function () {
      paused = false;
      root.classList.remove('is-paused');
      schedule(Math.max(400, remaining));
    });

    show(0);
  }

  /* ------------------------------------------------------------------
     Distinctions — onglets
     ------------------------------------------------------------------ */
  function initTabs() {
    var tabs = $$('[data-tabs] [role="tab"]');
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
        if (on) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });
      if (focus) tabs[i].focus();
      refreshSoon(300);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
  }

  /* ------------------------------------------------------------------
     Formulaires
     ------------------------------------------------------------------ */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function initForms() {
    var form = $('[data-form]');
    if (form) {
      form.setAttribute('data-cursor-theme', 'dark');
      $$('input, textarea', form).forEach(function (inp) {
        inp.addEventListener('input', function () {
          var f = inp.closest('.field');
          if (f) f.classList.remove('is-invalid');
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstInvalid = null;
        $$('.field', form).forEach(function (f) {
          var inp = $('input, textarea', f);
          if (!inp.required) return;
          var v = inp.value.trim();
          var ok = inp.type === 'email' ? EMAIL.test(v) : v.length >= (inp.tagName === 'TEXTAREA' ? 10 : 2);
          f.classList.toggle('is-invalid', !ok);
          if (!ok && !firstInvalid) firstInvalid = inp;
        });
        if (firstInvalid) { firstInvalid.focus(); return; }

        // Pas de serveur ici : brancher l'envoi réel (Formspree, API, CRM…) à cet endroit.
        var btn = $('[type="submit"]', form);
        btn.disabled = true;
        setTimeout(function () {
          form.classList.add('is-sent');
          btn.disabled = false;
          var reset = $('[data-form-reset]', form);
          if (reset) reset.focus({ preventScroll: true });
        }, 650);
      });
      var resetBtn = $('[data-form-reset]', form);
      if (resetBtn) resetBtn.addEventListener('click', function () {
        form.reset();
        form.classList.remove('is-sent');
      });
    }

    var news = $('[data-news]');
    if (news) {
      var msg = $('[data-news-msg]');
      news.addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = $('input', news);
        if (!EMAIL.test(inp.value.trim())) { msg.textContent = 'Adresse e-mail invalide'; inp.focus(); return; }
        msg.textContent = 'Merci ! Rendez-vous dans votre boîte ♥‿♥';
        news.reset();
      });
    }

    var end = $('.end-cta');
    if (end) end.setAttribute('data-cursor-theme', 'light');
  }

  /* ------------------------------------------------------------------
     Défilement infini (clients) — accéléré par la vitesse de scroll
     ------------------------------------------------------------------ */
  function initMarquees() {
    $$('[data-marquee]').forEach(function (m) {
      var inner = $('.marquee__inner', m);
      var track = document.createElement('div');
      track.className = 'marquee__track';
      inner.parentNode.insertBefore(track, inner);
      track.appendChild(inner);

      var unit = 0;
      function build() {
        $$('.marquee__inner', track).slice(1).forEach(function (n) { n.remove(); });
        unit = inner.offsetWidth || 1;
        var copies = Math.ceil((window.innerWidth * 2) / unit) + 1;
        for (var i = 0; i < copies; i++) {
          var clone = inner.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        }
      }
      build();

      var speed = parseFloat(m.dataset.speed || '0.5');
      var x = 0, visible = false, last = performance.now(), dir = 1, boost = 0;

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }).observe(m);
      } else { visible = true; }

      function loop(now) {
        if (!visible) return;
        var dt = Math.min(64, now - last) / 16.667;
        last = now;
        if (lenis) {
          var v = lenis.velocity || 0;
          if (Math.abs(v) > 0.1) dir = v > 0 ? 1 : -1;
          boost += (Math.min(Math.abs(v) * 0.25, 8) - boost) * 0.1;
        }
        if (!reduceMotion) x -= speed * dir * (1 + boost) * dt;
        if (x <= -unit) x += unit;
        if (x > 0) x -= unit;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        requestAnimationFrame(loop);
      }
      if (!('IntersectionObserver' in window)) requestAnimationFrame(loop);

      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    });
  }

  /* ------------------------------------------------------------------
     Circuit — process
     ------------------------------------------------------------------ */
  var circuit = null;

  function initCircuit() {
    var path = $('[data-circuit]');
    if (!path) return;
    var svgNS = 'http://www.w3.org/2000/svg';
    var len = path.getTotalLength();
    var car = $('[data-car]');
    var turnsG = $('[data-turns]');
    var steps = $$('[data-steps] .step');
    var lap = $('[data-lap]');
    var sector = $('[data-sector]');
    var hud = $('[data-hud-pct]');
    var names = ['Qualifs', 'Stratégie', 'Design', 'Dév', 'Arrivée'];
    var fracs = [0.1, 0.3, 0.5, 0.7, 0.9];
    var turns = [];

    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;

    fracs.forEach(function (f, i) {
      var p = path.getPointAtLength(len * f);
      var p2 = path.getPointAtLength(Math.min(len, len * f + 2));
      var dx = p2.x - p.x, dy = p2.y - p.y;
      var m = Math.hypot(dx, dy) || 1;
      var nx = dy / m, ny = -dx / m; // normale extérieure (circuit horaire)

      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'turn');
      g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('r', '15');
      var t = document.createElementNS(svgNS, 'text');
      t.textContent = 'T' + (i + 1);
      g.appendChild(c); g.appendChild(t);

      var lbl = document.createElementNS(svgNS, 'text');
      lbl.setAttribute('class', 'turn-label');
      var lx = p.x + nx * 46, ly = p.y + ny * 46;
      lbl.setAttribute('x', lx.toFixed(1));
      lbl.setAttribute('y', (ly + 4).toFixed(1));
      lbl.setAttribute('text-anchor', nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle');
      lbl.textContent = names[i];

      turnsG.appendChild(lbl);
      turnsG.appendChild(g);
      turns.push(g);
    });

    var current = -1;
    function set(p) {
      p = Math.max(0, Math.min(1, p));
      path.style.strokeDashoffset = (len * (1 - p)).toFixed(2);
      var pt = path.getPointAtLength(len * p);
      car.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      var s = Math.min(steps.length - 1, Math.floor(p * steps.length + 0.0001));
      if (s !== current) {
        current = s;
        steps.forEach(function (el, k) { el.classList.toggle('is-active', k === s); });
        lap.textContent = s + 1;
      }
      turns.forEach(function (g, k) { g.classList.toggle('is-passed', p >= fracs[k]); });
      sector.textContent = 'Secteur ' + Math.min(3, Math.floor(p * 3) + 1);
      hud.textContent = Math.round(p * 100) + '%';
    }

    circuit = { set: set };
    set(hasGSAP && !reduceMotion ? 0 : 1);
    if (!hasGSAP || reduceMotion) {
      steps.forEach(function (el) { el.classList.add('is-active'); });
    }
  }

  /* ------------------------------------------------------------------
     Animations au scroll (GSAP)
     ------------------------------------------------------------------ */
  function initScrollAnimations() {
    if (!hasGSAP || reduceMotion) {
      $$('[data-count]').forEach(function (el) {
        var dec = parseInt(el.dataset.decimals || '0', 10);
        var v = parseFloat(el.dataset.count);
        el.textContent = dec ? v.toFixed(dec).replace('.', ',') : String(v);
      });
      return;
    }

    var mm = gsap.matchMedia();

    /* --- Hero : rideau + parallaxe --- */
    var hero = $('.hero');
    if (hero) {
      var shade = document.createElement('div');
      shade.setAttribute('aria-hidden', 'true');
      shade.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:5';
      hero.appendChild(shade);

      // L'épinglage démarre quand le BAS du hero atteint le bas de l'écran : sur les
      // écrans peu hauts (mobile à l'horizontale), tout le hero est visible avant le rideau.
      ScrollTrigger.create({ trigger: hero, start: 'bottom bottom', end: 'bottom top', pin: true, pinSpacing: false });
      var heroTl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'bottom bottom', end: 'bottom top', scrub: true } });
      heroTl
        .to('.hero__bg', { scale: 1.12, yPercent: 6, ease: 'none' }, 0)
        .to('.hero__title', { yPercent: -18, ease: 'none' }, 0)
        .to(shade, { opacity: 0.65, ease: 'none' }, 0)
        .to('.hero__bottom', { yPercent: -60, opacity: 0, ease: 'none' }, 0);
      $$('[data-parallax]').forEach(function (line) {
        heroTl.to(line, { xPercent: parseFloat(line.dataset.parallax) * 100, ease: 'none' }, 0);
      });
    }

    /* Les sections épinglées sont créées d'abord (dans l'ordre de la page) :
       les déclencheurs suivants tiennent ainsi compte de leur hauteur. */

    /* --- Travaux : défilement horizontal épinglé (desktop) --- */
    if ($('[data-work-track]')) mm.add('(min-width: 901px) and (min-height: 600px)', function () {
      var section = $('.work');
      var track = $('[data-work-track]');
      var bar = $('[data-work-progress]');
      var cards = $$('.card', track);
      var skewTo = gsap.quickTo(cards, 'skewX', { duration: 0.6, ease: 'power3' });
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }

      gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + dist(); },
          pin: true,
          scrub: 0.9,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
            skewTo(gsap.utils.clamp(-4, 4, self.getVelocity() / -400));
          },
          onScrubComplete: function () { skewTo(0); }
        }
      });
    });

    /* --- Process : le circuit se dessine --- */
    if (circuit) {
      var proxy = { p: 0 };
      mm.add('(min-width: 1181px) and (min-height: 640px)', function () {
        proxy.p = 0;
        gsap.to(proxy, {
          p: 1, ease: 'none',
          onUpdate: function () { circuit.set(proxy.p); },
          scrollTrigger: { trigger: '.process', start: 'top top', end: '+=260%', pin: true, scrub: 0.8 }
        });
      });
      mm.add('(max-width: 1180px), (max-height: 639px)', function () {
        proxy.p = 0;
        gsap.to(proxy, {
          p: 1, ease: 'none',
          onUpdate: function () { circuit.set(proxy.p); },
          scrollTrigger: { trigger: '.process', start: 'top 65%', end: 'bottom 75%', scrub: 0.8 }
        });
      });
    }

    /* --- Manifeste : les mots s'allument --- */
    var mText = $('[data-words]');
    if (mText) {
      var words = splitWords(mText);
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, ease: 'none', stagger: 0.06,
        scrollTrigger: { trigger: mText, start: 'top 78%', end: 'bottom 55%', scrub: 0.6 }
      });
    }

    /* --- Apparitions génériques --- */
    gsap.set('[data-reveal]', { opacity: 0, y: 46 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 1.25, ease: 'expo.out', stagger: 0.08,
          clearProps: 'transform,opacity'
        });
      }
    });

    /* --- Compteurs --- */
    $$('[data-count]').forEach(function (el) {
      var end = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.decimals || '0', 10);
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end, duration: 2.2, ease: 'power3.out',
            onUpdate: function () { el.textContent = dec ? obj.v.toFixed(dec).replace('.', ',') : Math.round(obj.v); }
          });
        }
      });
    });

    /* --- Étude de cas : visuel principal en parallaxe --- */
    $$('[data-case-parallax]').forEach(function (el) {
      gsap.fromTo(el, { yPercent: 6, rotate: -2 }, {
        yPercent: -6, rotate: 2, ease: 'none',
        scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* --- Grande phrase du footer : légère montée --- */
    if ($('.footer__statement')) {
      gsap.fromTo('.footer__statement', { yPercent: 18 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.footer__statement', start: 'top bottom', end: 'top 45%', scrub: true }
      });
    }

    /* --- Marque géante du footer --- */
    if ($('.footer__mark')) {
      gsap.fromTo('.footer__mark svg', { yPercent: 40, opacity: 0.2 }, {
        yPercent: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.footer__mark', start: 'top bottom', end: 'bottom bottom', scrub: true }
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------ */
  splitChars();
  initLenis();
  initClock();
  initNav();
  initMenu();
  initAnchors();
  initCursor();
  initMagnetic();
  initAccordion();
  initQuotes();
  initTabs();
  initForms();
  initMarquees();
  initCircuit();
  initScrollAnimations();

  window.scrollTo(0, 0);
  body.classList.add('is-locked');

  runLoader().then(function () {
    body.classList.remove('is-locked');
    var hashTarget = location.hash && location.hash.length > 1 ? $(location.hash) : null;
    if (lenis) lenis.start();
    if (!hashTarget) {
      window.scrollTo(0, 0);
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    }
    requestAnimationFrame(function () {
      body.classList.add('is-ready');
      if (hasGSAP) ScrollTrigger.refresh();
      if (hashTarget) setTimeout(function () { scrollToTarget(hashTarget); }, 900);
    });
  });
})();
