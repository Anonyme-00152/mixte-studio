/* ==========================================================================
   MIXTE® — Page étude de cas
   Construit la page à partir de window.MIXTE_PROJECTS (assets/js/projects.js)
   selon le paramètre ?p= de l'URL. S'exécute avant main.js.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-case]');
  var list = window.MIXTE_PROJECTS || [];
  if (!root || !list.length) return;

  var id = new URLSearchParams(window.location.search).get('p');
  var idx = list.findIndex(function (p) { return p.id === id; });
  if (idx < 0) idx = 0;
  var p = list[idx];
  var next = list[(idx + 1) % list.length];
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var total = pad(list.length);

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Chaque instance d'une même couverture SVG reçoit des identifiants uniques.
  function cover(svg, suffix) {
    return svg
      .replace(/id="([^"]+)"/g, 'id="$1-' + suffix + '"')
      .replace(/url\(#([^)]+)\)/g, 'url(#$1-' + suffix + ')');
  }

  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
  }

  document.title = p.name + ' — Étude de cas | MIXTE®';
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', p.name + ' — ' + p.tagline + ' Étude de cas MIXTE.');
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', p.bg);

  root.style.setProperty('--c-bg', p.bg);
  root.style.setProperty('--c-fg', p.fg);
  root.style.setProperty('--c-accent', p.accent);
  root.style.setProperty('--c-accent-fg', p.accentFg);

  var altTheme = p.theme === 'dark' ? 'light' : 'dark';
  var accentTheme = p.accentFg.toLowerCase() === '#ffffff' || p.accentFg.toLowerCase() === '#fff6ea' ? 'dark' : 'lime';

  var titleWords = p.name.split(' ').map(function (w) {
    return '<span class="hero__word" data-split>' + esc(w) + '</span>';
  }).join(' ');

  var arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var arrowLeft = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

  root.innerHTML = [
    /* ---------- En-tête ---------- */
    '<section class="case-hero" data-theme="' + p.theme + '">',
    '  <div class="container">',
    '    <div class="case-hero__top" data-intro>',
    '      <a href="index.html#travaux" class="case-back mono">' + arrowLeft + 'Tous les projets</a>',
    '      <span class="mono case-hero__count">Étude de cas — ' + pad(idx + 1) + '/' + total + '</span>',
    '    </div>',
    '    <h1 class="case-title" aria-label="' + esc(p.name) + '">' + titleWords + '</h1>',
    '    <p class="case-tagline" data-intro>' + esc(p.tagline) + '</p>',
    '    <dl class="case-meta" data-intro>',
    '      <div><dt class="mono">Client</dt><dd>' + esc(p.name) + '</dd></div>',
    '      <div><dt class="mono">Secteur</dt><dd>' + esc(p.sector) + '</dd></div>',
    '      <div><dt class="mono">Année</dt><dd>' + esc(p.year) + '</dd></div>',
    '      <div><dt class="mono">Durée</dt><dd>' + esc(p.duration) + '</dd></div>',
    '      <div><dt class="mono">Distinction</dt><dd><span class="case-award">' + esc(p.award) + '</span></dd></div>',
    '    </dl>',
    '  </div>',
    '</section>',

    /* ---------- Visuel principal ---------- */
    '<section class="case-cover" data-theme="' + p.theme + '">',
    '  <div class="container">',
    '    <div class="case-cover__stage" data-intro>',
    '      <div class="case-cover__card" data-case-parallax>' + cover(p.cover, 'a') + '</div>',
    '      <ul class="case-cover__chips mono">' + p.services.map(function (s, i) {
      return '<li style="--i:' + i + '">' + esc(s) + '</li>';
    }).join('') + '</ul>',
    '    </div>',
    '  </div>',
    '</section>',

    /* ---------- Défi / approche ---------- */
    '<section class="case-body" data-theme="' + p.theme + '">',
    '  <div class="container">',
    '    <div class="case-block" data-reveal>',
    '      <p class="mono case-block__label">(01) — Le défi</p>',
    '      <p class="case-block__text">' + esc(p.challenge) + '</p>',
    '    </div>',
    '    <div class="case-block" data-reveal>',
    '      <p class="mono case-block__label">(02) — Notre approche</p>',
    '      <p class="case-block__text">' + esc(p.approach) + '</p>',
    '    </div>',
    '    <div class="case-block" data-reveal>',
    '      <p class="mono case-block__label">(03) — Ce que nous avons fait</p>',
    '      <ul class="pills case-pills">' + p.services.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>',
    '    </div>',
    '  </div>',
    '</section>',

    /* ---------- Résultats ---------- */
    '<section class="case-results" data-theme="' + p.theme + '">',
    '  <div class="container">',
    '    <p class="mono case-results__label">(04) — Résultats</p>',
    '    <div class="case-kpis">' + p.results.map(function (r, i) {
      return '<div class="case-kpi' + (i === 0 ? ' is-lead' : '') + '" data-reveal>' +
        '<span class="case-kpi__pos mono">P' + (i + 1) + '</span>' +
        '<span class="case-kpi__v">' + esc(r[0]) + '</span>' +
        '<span class="case-kpi__l mono">' + esc(r[1]) + '</span></div>';
    }).join('') + '</div>',
    '  </div>',
    '</section>',

    /* ---------- Galerie : desktop + mobile ---------- */
    '<section class="case-gallery" data-theme="' + altTheme + '">',
    '  <div class="container">',
    '    <div class="section-head case-gallery__head">',
    '      <div><p class="eyebrow mono" data-reveal>(05) — En images</p>',
    '      <h2 class="h-display h-display--sm" data-reveal>Pensé pour<br>chaque écran.</h2></div>',
    '    </div>',
    '    <div class="browser" data-reveal>',
    '      <div class="browser__bar"><i></i><i></i><i></i><span class="browser__url mono">' + esc(p.url) + '</span></div>',
    '      <div class="browser__screen">',
    '        <div class="mock-hero">',
    '          <div class="mock-hero__nav"><b>' + esc(p.short) + '</b><span></span><span></span><span></span><em></em></div>',
    '          <div class="mock-hero__body"><p class="mock-hero__title">' + esc(p.tagline) + '</p><span class="mock-hero__btn"></span></div>',
    '          <div class="mock-hero__visual">' + cover(p.cover, 'b') + '</div>',
    '        </div>',
    '      </div>',
    '    </div>',
    '    <div class="phones">',
    '      <div class="phone" data-reveal><div class="phone__screen">',
    '        <div class="phone__status"><span>9:41</span><span>●●● ▮</span></div>',
    '        <div class="phone__head"><b>' + esc(p.short) + '</b><i></i></div>',
    '        <div class="phone__card">' + cover(p.cover, 'c') + '</div>',
    '        <span class="phone__cta">Découvrir</span>',
    '      </div></div>',
    '      <div class="phone phone--offset" data-reveal><div class="phone__screen">',
    '        <div class="phone__status"><span>9:41</span><span>●●● ▮</span></div>',
    '        <div class="phone__head"><b>Tableau de bord</b><i></i></div>',
    '        <p class="phone__label">' + esc(p.results[0][1]) + '</p>',
    '        <p class="phone__kpi">' + esc(p.results[0][0]) + '</p>',
    '        <svg class="phone__chart" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,70 25,62 50,66 75,48 100,52 125,30 150,36 175,14 200,18"/></svg>',
    '        <ul class="phone__rows"><li><i></i><span></span></li><li><i></i><span></span></li><li><i></i><span></span></li></ul>',
    '      </div></div>',
    '      <div class="gallery-note" data-reveal>',
    '        <p class="mono">Responsive &amp; accessible</p>',
    '        <p class="gallery-note__text">Conçu mobile d’abord, testé sur plus de 30 appareils, conforme aux standards d’accessibilité.</p>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</section>',

    /* ---------- Citation ---------- */
    '<section class="case-quote" data-theme="' + accentTheme + '">',
    '  <div class="container">',
    '    <p class="mono">(06) — Le mot du client</p>',
    '    <blockquote class="case-quote__text" data-reveal>«&#8239;' + esc(p.quote[0]) + '&#8239;»</blockquote>',
    '    <p class="case-quote__by" data-reveal><span class="quote__avatar">' + initials(p.quote[1]) + '</span><span><b>' + esc(p.quote[1]) + '</b><br><span class="mono">' + esc(p.quote[2]) + '</span></span></p>',
    '  </div>',
    '</section>',

    /* ---------- Projet suivant ---------- */
    '<section class="case-next" data-theme="dark">',
    '  <div class="container">',
    '    <a href="projet.html?p=' + next.id + '" class="case-next__link" data-cursor="Suivant">',
    '      <span class="case-next__label mono">Projet suivant — ' + pad((idx + 1) % list.length + 1) + '/' + total + '</span>',
    '      <span class="case-next__name">' + esc(next.name) + '</span>',
    '      <span class="case-next__thumb" aria-hidden="true">' + cover(next.cover, 'n') + '</span>',
    '      <span class="case-next__arrow" aria-hidden="true">' + arrow + '</span>',
    '    </a>',
    '  </div>',
    '</section>'
  ].join('\n');
})();
