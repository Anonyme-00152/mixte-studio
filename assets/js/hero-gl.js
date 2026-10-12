/* ==========================================================================
   MIXTE® — Hero WebGL
   Métaballes irisées en raymarching (chrome sombre, reflets lime / lavande).
   Aucune dépendance. Rendu en basse résolution puis mis à l'échelle (perf).
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.querySelector('[data-hero-gl]');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uMouse;',
    'uniform float uScroll;',
    'uniform vec2  uOffset;',
    'uniform float uScale;',

    'mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }',

    'float smin(float a, float b, float k){',
    '  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);',
    '  return mix(b, a, h) - k * h * (1.0 - h);',
    '}',

    'float map(vec3 p){',
    '  float t = uTime * 0.32;',
    '  p.xz *= rot(t * 0.35 + uMouse.x * 0.55);',
    '  p.yz *= rot(-uMouse.y * 0.35);',
    '  float spread = 1.0 + uScroll * 1.6;',
    '  vec3 c1 = vec3(sin(t) * 0.38, cos(t * 1.3) * 0.18, sin(t * 0.7) * 0.25);',
    '  vec3 c2 = vec3(cos(t * 0.8 + 1.0) * -0.92, sin(t * 0.9) * 0.52, cos(t * 0.6) * 0.32) * spread;',
    '  vec3 c3 = vec3(sin(t * 1.1 + 2.0) * 0.78, cos(t * 0.7 + 1.0) * -0.62, sin(t * 1.2) * 0.4) * spread;',
    '  vec3 c4 = vec3(uMouse.x * 1.25, uMouse.y * 0.9, 0.55);',
    '  float d = length(p - c1) - 0.74;',
    '  d = smin(d, length(p - c2) - 0.42, 0.55);',
    '  d = smin(d, length(p - c3) - 0.32, 0.5);',
    '  d = smin(d, length(p - c4) - 0.2, 0.45);',
    '  d += 0.032 * sin(4.2 * p.x + t * 3.1) * sin(4.0 * p.y + t * 2.3) * sin(3.8 * p.z + t * 2.0);',
    '  return d;',
    '}',

    'vec3 calcNormal(vec3 p){',
    '  const vec2 k = vec2(1.0, -1.0);',
    '  const float e = 0.0015;',
    '  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) +',
    '                   k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));',
    '}',

    'vec3 env(vec3 r){',
    '  vec3 col = mix(vec3(0.018, 0.02, 0.015), vec3(0.085, 0.095, 0.07), smoothstep(-0.7, 0.9, r.y));',
    '  col += vec3(0.79, 0.82, 0.93) * smoothstep(0.45, 0.95, dot(r, normalize(vec3(-0.45, 0.8, 0.4)))) * 1.15;',
    '  col += vec3(0.82, 1.0, 0.0) * pow(max(dot(r, normalize(vec3(0.95, 0.05, 0.3))), 0.0), 10.0) * 1.7;',
    '  col += vec3(1.0, 0.36, 0.22) * pow(max(dot(r, normalize(vec3(-0.85, -0.35, 0.35))), 0.0), 7.0) * 0.6;',
    '  col += vec3(0.61, 0.48, 1.0) * smoothstep(-0.15, -0.9, r.y) * 0.35;',
    '  return col;',
    '}',

    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
    '  uv -= uOffset;',
    '  uv /= uScale;',
    '  vec3 ro = vec3(0.0, 0.0, 3.4);',
    '  vec3 rd = normalize(vec3(uv, -1.6));',
    '  float t = 0.0;',
    '  float minD = 10.0;',
    '  bool hit = false;',
    '  for (int i = 0; i < 72; i++) {',
    '    vec3 p = ro + rd * t;',
    '    float d = map(p);',
    '    minD = min(minD, d);',
    '    if (d < 0.0012) { hit = true; break; }',
    '    t += d * 0.92;',
    '    if (t > 7.0) break;',
    '  }',
    '  vec3 col = vec3(0.0);',
    '  float a = 0.0;',
    '  if (hit) {',
    '    vec3 p = ro + rd * t;',
    '    vec3 n = calcNormal(p);',
    '    vec3 r = reflect(rd, n);',
    '    float ndv = max(dot(n, -rd), 0.0);',
    '    float fres = pow(1.0 - ndv, 2.6);',
    '    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.7 + n.y * 0.25 + uTime * 0.035));',
    '    irid = mix(irid, vec3(0.82, 1.0, 0.0), 0.18);',
    '    vec3 refl = env(r);',
    '    col = vec3(0.035, 0.038, 0.03) + refl * mix(0.5, 1.05, fres);',
    '    col += irid * fres * 0.62;',
    '    col += pow(max(dot(r, normalize(vec3(0.5, 0.75, 0.6))), 0.0), 60.0) * 1.2;',
    '    col = 1.0 - exp(-col * 1.45);',
    '    a = 1.0;',
    '  } else {',
    '    float g = exp(-minD * 9.0) * 0.22;',
    '    col = vec3(0.82, 1.0, 0.0) * g;',
    '    a = g;',
    '  }',
    '  col = pow(col, vec3(0.4545));',
    '  gl_FragColor = vec4(col * (hit ? 1.0 : 1.0), a);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[MIXTE GL]', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { document.documentElement.classList.add('no-webgl'); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[MIXTE GL]', gl.getProgramInfoLog(prog));
    document.documentElement.classList.add('no-webgl');
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    scroll: gl.getUniformLocation(prog, 'uScroll'),
    offset: gl.getUniformLocation(prog, 'uOffset'),
    scale: gl.getUniformLocation(prog, 'uScale')
  };

  gl.clearColor(0, 0, 0, 0);

  var quality = 0.72;
  var w = 0, h = 0;
  var offset = [0, 0];
  var scale = 1;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var q = quality * dpr;
    var maxPx = 1100000;
    var cw = rect.width * q, ch = rect.height * q;
    if (cw * ch > maxPx) {
      var k = Math.sqrt(maxPx / (cw * ch));
      cw *= k; ch *= k;
    }
    w = Math.max(2, Math.round(cw));
    h = Math.max(2, Math.round(ch));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);

    var aspect = rect.width / Math.max(rect.height, 1);
    if (aspect > 1.25) {           // desktop : blob à droite
      offset = [Math.min(0.42, (aspect - 1) * 0.42), 0.02];
      scale = 1.0;
    } else if (aspect > 0.85) {    // tablette
      offset = [0.12, 0.04];
      scale = 0.9;
    } else {                        // mobile portrait
      offset = [0.08, 0.06];
      scale = 0.62;
    }
  }

  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  var running = true;
  var visible = true;
  var rafId = 0;
  var start = performance.now();
  var last = start;
  var frames = 0, acc = 0, degraded = false;
  var scrollSmooth = 0;

  function kick() {
    if (!rafId && running && visible && !reduceMotion) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      kick();
    }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    kick();
  });

  function draw(now) {
    var t = (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    var sp = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
    scrollSmooth += (sp - scrollSmooth) * 0.08;

    gl.uniform2f(U.res, w, h);
    gl.uniform1f(U.time, reduceMotion ? 6.0 : t);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform1f(U.scroll, scrollSmooth);
    gl.uniform2f(U.offset, offset[0], offset[1]);
    gl.uniform1f(U.scale, scale);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    rafId = 0;
    if (!running || !visible) return;
    var dt = now - last;
    last = now;

    // Qualité adaptative : si la machine peine, on baisse la résolution.
    if (!degraded) {
      frames++; acc += dt;
      if (frames === 40) {
        if (acc / frames > 24) { quality = 0.5; degraded = true; resize(); }
        frames = 0; acc = 0;
      }
    }

    draw(now);
    if (!reduceMotion) rafId = requestAnimationFrame(loop);
  }

  resize();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); if (reduceMotion) draw(performance.now()); }, 120);
  });

  requestAnimationFrame(function (now) {
    draw(now);
    canvas.classList.add('is-ready');
    kick();
  });
})();
