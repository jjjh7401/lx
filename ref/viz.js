/* 음악을 비추다 자료실 — 이펙트 미리보기 렌더러
   카드의 viz 스펙을 받아 무대 앞에서 본 장면을 박에 맞춰 그립니다. */
(function (root) {
  'use strict';
  var ATTRS = ['dim', 'strobe', 'color', 'pan', 'tilt', 'zoom', 'prism', 'gobo'];
  var WAVES = ['sine', 'square', 'saw', 'rampdown', 'pulse', 'steps', 'random', 'hold', 'fixed'];
  var ORDERS = ['lr', 'rl', 'center', 'outin', 'oddeven', 'random', 'pairs', 'halves', 'x', 'y', 'radial', 'angle', 'diag'];
  var SELS = ['all', 'odd', 'even', 'left', 'right', 'center', 'outer', 'first', 'last'];
  var RIGS = ['row', 'grid'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function frac(x) { return x - Math.floor(x); }
  function hash(a, b) { var x = Math.sin(a * 127.1 + b * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); }
  function hex(c) {
    c = String(c || '#ffffff').replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var n = parseInt(c, 16); if (isNaN(n)) n = 0xffffff;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* ---- 장비마다 순서(위상 분산에 쓰는 0~1 값) ---- */
  function ranks(order, rig) {
    var n = rig.n, out = [], i;
    var cols = rig.cols || n, rows = rig.rows || 1;
    for (i = 0; i < n; i++) {
      var c = i % cols, r = Math.floor(i / cols), v;
      var cx = (cols - 1) / 2, cy = (rows - 1) / 2;
      switch (order) {
        case 'rl': v = cols - 1 - c; break;
        case 'center': v = Math.abs(c - cx); break;
        case 'outin': v = cx - Math.abs(c - cx); break;
        case 'oddeven': v = i % 2; break;
        case 'random': v = hash(i, 7); break;
        case 'pairs': v = Math.floor(c / 2); break;
        case 'halves': v = c < cols / 2 ? 0 : 1; break;
        case 'y': v = r; break;
        case 'radial': v = Math.hypot(c - cx, (r - cy) * (cols / Math.max(rows, 1)) * 0.5); break;
        case 'angle': v = (Math.atan2(r - cy, c - cx) + Math.PI) / (2 * Math.PI); break;
        case 'diag': v = c + r; break;
        default: v = c; /* lr, x */
      }
      out.push(v);
    }
    var mx = Math.max.apply(null, out), mn = Math.min.apply(null, out);
    if (order === 'angle') return out; /* 이미 0~1 */
    return out.map(function (v) { return mx > mn ? (v - mn) / (mx - mn) : 0; });
  }
  function selected(sel, i, rig) {
    var cols = rig.cols || rig.n, c = i % cols, half = cols / 2;
    switch (sel) {
      case 'odd': return i % 2 === 0;      /* 1, 3, 5…번(사람이 세는 홀수) */
      case 'even': return i % 2 === 1;
      case 'left': return c < half;
      case 'right': return c >= half;
      case 'center': return Math.abs(c - (cols - 1) / 2) < cols / 4;
      case 'outer': return Math.abs(c - (cols - 1) / 2) >= cols / 4;
      case 'first': return i === 0;
      case 'last': return i === rig.n - 1;
      default: return true;
    }
  }

  /* ---- 한 레이어의 값 ---- */
  function shape(L, p, cyc, i) {
    var w = L.width == null ? 0.5 : L.width;
    switch (L.wave) {
      case 'sine': return 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
      case 'square': return p < w ? 1 : 0;
      case 'saw': return p;
      case 'rampdown': return 1 - p;
      case 'pulse': return p < w ? Math.pow(1 - p / w, 1.6) : 0;
      case 'random': return hash(cyc * 13 + 1, i * 7 + 3) < w ? 1 : 0;
      case 'hold': return 1;
      default: return 0;
    }
  }
  function layerValue(L, tb, i, rk) {
    var beats = L.beats > 0 ? L.beats : 4;
    var sp = L.spread || [0, 0];
    var ph = (sp[0] + (sp[1] - sp[0]) * rk) + (L.offset || 0);
    var x = tb / beats - ph / 360;
    var p = frac(x), cyc = Math.floor(x);
    if (L.wave === 'steps') {
      var vals = L.values || [], m = vals.length; if (!m) return null;
      var pos = p * m, k = Math.floor(pos) % m, t = pos - Math.floor(pos);
      var a = vals[k], b = vals[(k + 1) % m];
      var f = L.fade ? (L.fade === true ? t : clamp((t - (1 - L.fade)) / L.fade, 0, 1)) : 0;
      if (L.attr === 'color') return mix(hex(a), hex(b), f);
      return a + (b - a) * f;
    }
    var s = L.wave === 'fixed' ? rk : shape(L, p, cyc, i);
    if (L.attr === 'color') {
      var cv = L.values && L.values.length >= 2 ? L.values : ['#000000', '#ffffff'];
      return mix(hex(cv[0]), hex(cv[1]), s);
    }
    var lo = L.lo == null ? 0 : L.lo, hi = L.hi == null ? 1 : L.hi;
    return lo + (hi - lo) * s;
  }

  function defaults(rig) {
    var b = rig.base || {};
    return { dim: b.dim == null ? 1 : b.dim, color: hex(b.color || '#ffffff'), pan: b.pan || 0, tilt: b.tilt || 0,
      zoom: b.zoom == null ? 0.35 : b.zoom, prism: !!b.prism, gobo: !!b.gobo, strobe: 1 };
  }
  /* 시각 tb(박)에서 장비마다 상태를 계산합니다 */
  function frame(spec, tb) {
    var rig = { n: spec.n || (spec.rig === 'grid' ? (spec.cols || 8) * (spec.rows || 4) : 8), cols: spec.cols, rows: spec.rows };
    if (spec.rig !== 'grid') { rig.cols = rig.n; rig.rows = 1; }
    var seg = null, local = tb, segs = spec.segments;
    if (segs && segs.length) {
      var tot = segs.reduce(function (a, s) { return a + (s.beats || 4); }, 0), t = frac(tb / tot) * tot, acc = 0;
      for (var s = 0; s < segs.length; s++) { if (t < acc + (segs[s].beats || 4)) { seg = segs[s]; local = t - acc; seg._i = s; break; } acc += segs[s].beats || 4; }
    }
    var base = (seg && seg.base) ? Object.assign({}, spec.base || {}, seg.base) : (spec.base || {});
    var layers = seg ? (seg.layers || []) : (spec.layers || []);
    var d0 = defaults({ base: base });
    var cache = {};
    var out = [];
    for (var i = 0; i < rig.n; i++) {
      var st = { dim: d0.dim, color: d0.color.slice(), pan: d0.pan, tilt: d0.tilt, zoom: d0.zoom, prism: d0.prism, gobo: d0.gobo, strobe: 1 };
      if (spec.mirrorPan && (i % rig.cols) >= rig.cols / 2) st.pan = -st.pan;
      for (var l = 0; l < layers.length; l++) {
        var L = layers[l];
        if (L.sel && !selected(L.sel, i, rig)) continue;
        var key = L.order || 'lr';
        var rk = (cache[key] || (cache[key] = ranks(key, rig)))[i];
        var v = layerValue(L, seg ? local : tb, i, rk);
        if (v == null) continue;
        if (L.mirror && (i % rig.cols) >= rig.cols / 2 && (L.attr === 'pan')) v = -v;
        if (L.attr === 'color') st.color = v;
        else if (L.attr === 'strobe') st.strobe = v;
        else if (L.attr === 'prism' || L.attr === 'gobo') st[L.attr] = v > 0.5;
        else if (L.attr === 'dim' && L.mul) st.dim *= v;
        else if ((L.attr === 'pan' || L.attr === 'tilt') && L.add) st[L.attr] += v;
        else st[L.attr] = v;
      }
      st.dim = clamp(st.dim, 0, 1) * (st.strobe > 0.5 ? 1 : 0);
      out.push(st);
    }
    return { fx: out, rig: rig, seg: seg };
  }

  /* 가장 빠른 깜박임(Hz) — 안전 보기에 씁니다 */
  function flashHz(spec, bpm) {
    var hz = 0;
    function scan(ls) {
      (ls || []).forEach(function (L) {
        if ((L.attr === 'strobe' || L.attr === 'dim') && /square|pulse|random|steps/.test(L.wave || '')) {
          var per = (L.beats > 0 ? L.beats : 4) * 60 / bpm;
          var k = L.wave === 'steps' ? Math.max(1, Math.ceil((L.values || []).length / 2)) : 1;
          hz = Math.max(hz, k / per);
        }
      });
    }
    scan(spec.layers); (spec.segments || []).forEach(function (s) { scan(s.layers); });
    return hz;
  }

  /* ---- 그리기 ---- */
  function draw(ctx, W, H, spec, f, opt) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07080b'); g.addColorStop(0.72, '#0d0f14'); g.addColorStop(1, '#16181f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var floorY = H * 0.86;
    if (spec.rig !== 'grid') { ctx.fillStyle = '#1a1c24'; ctx.fillRect(0, floorY, W, H - floorY); }
    ctx.globalCompositeOperation = 'lighter';
    if (spec.rig === 'grid') drawGrid(ctx, W, H, f);
    else drawRow(ctx, W, H, floorY, f, opt);
    ctx.restore();
    /* 트러스 */
    if (spec.rig !== 'grid') {
      ctx.save(); ctx.fillStyle = '#2a2d36'; ctx.fillRect(W * 0.04, H * 0.085, W * 0.92, 5); ctx.restore();
      var n = f.fx.length;
      for (var i = 0; i < n; i++) {
        var x = W * (0.08 + 0.84 * (n > 1 ? i / (n - 1) : 0.5)), s = f.fx[i], c = s.color;
        ctx.save(); ctx.fillStyle = '#3a3e4a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 7, H * 0.1, 14, 12, 3) : ctx.rect(x - 7, H * 0.1, 14, 12); ctx.fill();
        ctx.fillStyle = 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (0.15 + 0.85 * s.dim) + ')';
        ctx.beginPath(); ctx.arc(x, H * 0.1 + 12, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
  }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; }
  function drawRow(ctx, W, H, floorY, f, opt) {
    var n = f.fx.length, oy = H * 0.1 + 14, L = floorY - oy;
    for (var i = 0; i < n; i++) {
      var s = f.fx[i]; if (s.dim < 0.01) continue;
      var x = W * (0.08 + 0.84 * (n > 1 ? i / (n - 1) : 0.5));
      var pan = clamp(s.pan, -80, 80) * Math.PI / 180, tilt = clamp(s.tilt, -80, 80);
      var len = L / Math.max(0.35, Math.cos(pan));
      var ex = x + Math.tan(pan) * L, ey = floorY - (tilt / 90) * L * 0.55;
      var spread = 0.035 + clamp(s.zoom, 0, 1) * 0.22; /* 빔 반폭(라디안) */
      var beams = s.prism ? [-0.11, 0, 0.11] : [0];
      for (var b = 0; b < beams.length; b++) {
        var dx = ex - x + Math.tan(beams[b]) * L, dy = ey - oy, dl = Math.hypot(dx, dy);
        var nx = -dy / dl, ny = dx / dl, hw = Math.tan(spread) * dl;
        var a = (opt.haze ? 0.38 : 0.2) * s.dim / (s.prism ? 1.6 : 1);
        var gr = ctx.createLinearGradient(x, oy, x + dx, oy + dy);
        gr.addColorStop(0, rgba(s.color, a)); gr.addColorStop(1, rgba(s.color, a * 0.25));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - nx * 2, oy - ny * 2); ctx.lineTo(x + nx * 2, oy + ny * 2);
        ctx.lineTo(x + dx + nx * hw, oy + dy + ny * hw); ctx.lineTo(x + dx - nx * hw, oy + dy - ny * hw); ctx.closePath(); ctx.fill();
        /* 바닥 원 */
        var px = x + dx, py = Math.max(oy + dy, floorY - 2), rr = Math.max(8, hw * 1.05);
        if (oy + dy >= floorY - 30) {
          var pg = ctx.createRadialGradient(px, py, 0, px, py, rr);
          pg.addColorStop(0, rgba(s.color, 0.7 * s.dim)); pg.addColorStop(1, rgba(s.color, 0));
          ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(px, py, rr, rr * 0.28, 0, 0, Math.PI * 2); ctx.fill();
          if (s.gobo) {
            ctx.fillStyle = rgba([0, 0, 0], 0); ctx.globalCompositeOperation = 'destination-out';
            for (var k = 0; k < 6; k++) { var an = k / 6 * Math.PI * 2 + (opt.t || 0) * 0.6; ctx.beginPath(); ctx.ellipse(px + Math.cos(an) * rr * 0.55, py + Math.sin(an) * rr * 0.15, rr * 0.13, rr * 0.05, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fill(); }
            ctx.globalCompositeOperation = 'lighter';
          }
        }
      }
      /* 렌즈 빛 */
      var lg = ctx.createRadialGradient(x, oy, 0, x, oy, 16);
      lg.addColorStop(0, rgba(s.color, 0.9 * s.dim)); lg.addColorStop(1, rgba(s.color, 0));
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, oy, 16, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawGrid(ctx, W, H, f) {
    var cols = f.rig.cols || 8, rows = f.rig.rows || 4;
    var pad = 18, cw = (W - pad * 2) / cols, ch = (H - pad * 2) / rows, sz = Math.min(cw, ch) * 0.62;
    var ox = (W - cw * cols) / 2, oy = pad;
    for (var i = 0; i < f.fx.length; i++) {
      var s = f.fx[i], c = i % cols, r = Math.floor(i / cols);
      var x = ox + cw * (c + 0.5), y = oy + ch * (r + 0.5);
      ctx.fillStyle = 'rgba(60,64,76,.35)'; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      if (s.dim < 0.01) continue;
      var gg = ctx.createRadialGradient(x, y, 0, x, y, sz * 1.1);
      gg.addColorStop(0, rgba(s.color, 0.55 * s.dim)); gg.addColorStop(1, rgba(s.color, 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, sz * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(s.color, 0.95 * s.dim); ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
  }

  /* ---- 스펙 점검(작성용) ---- */
  function validate(spec) {
    var e = [];
    if (!spec || typeof spec !== 'object') return ['viz가 객체가 아님'];
    if (spec.rig && RIGS.indexOf(spec.rig) < 0) e.push('rig ' + spec.rig);
    if (spec.rig === 'grid' && (!(spec.cols > 0) || !(spec.rows > 0))) e.push('grid에는 cols, rows 필요');
    if (!spec.caption) e.push('caption 없음');
    function chk(ls, where) {
      if (!Array.isArray(ls)) { e.push(where + ': layers 배열 아님'); return; }
      ls.forEach(function (L, k) {
        var w = where + ' L' + k;
        if (ATTRS.indexOf(L.attr) < 0) e.push(w + ' attr ' + L.attr);
        if (WAVES.indexOf(L.wave) < 0) e.push(w + ' wave ' + L.wave);
        if (L.order && ORDERS.indexOf(L.order) < 0) e.push(w + ' order ' + L.order);
        if (L.sel && SELS.indexOf(L.sel) < 0) e.push(w + ' sel ' + L.sel);
        if (L.wave === 'steps' && !(L.values && L.values.length >= 2)) e.push(w + ' steps에는 values 2개 이상');
        if (L.attr === 'color' && L.wave !== 'hold' && !(L.values && L.values.length >= 2)) e.push(w + ' color에는 values(색) 2개 이상');
        if (L.beats != null && !(L.beats > 0)) e.push(w + ' beats');
        if (L.spread && !(Array.isArray(L.spread) && L.spread.length === 2)) e.push(w + ' spread');
      });
    }
    if (spec.segments) {
      if (!Array.isArray(spec.segments) || !spec.segments.length) e.push('segments');
      else spec.segments.forEach(function (s, k) { if (!s.label) e.push('seg' + k + ' label 없음'); chk(s.layers || [], 'seg' + k); });
    } else chk(spec.layers || [], 'layers');
    try { for (var t = 0; t < 16; t += 0.37) frame(spec, t); } catch (x) { e.push('계산 오류 ' + x.message); }
    return e;
  }

  /* ---- 플레이어 ---- */
  function Player(canvas, spec, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.spec = spec; this.o = opts || {};
    this.tb = 0; this.last = 0; this.playing = false; this.rate = 1; this.safe = true; this.haze = true;
    this._loop = this._loop.bind(this);
  }
  Player.prototype.bpm = function () { return (this.o.getBpm && this.o.getBpm()) || 112; };
  Player.prototype.slow = function () { /* 안전 보기: 깜박임이 2Hz를 넘지 않게 느리게 */
    if (!this.safe) return 1;
    var sp = this.seg ? { layers: this.seg.layers } : this.spec;
    var hz = flashHz(sp, this.bpm()) * this.rate;
    return hz > 2 ? 2 / hz : 1;
  };
  Player.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(2, root.devicePixelRatio || 1);
    var w = Math.max(200, Math.round(r.width)), h = Math.round(w * (this.spec.rig === 'grid' ? 0.42 : 0.46));
    h = Math.min(h, 300);
    this.c.style.height = h + 'px'; this.c.width = w * dpr; this.c.height = h * dpr; this.W = w; this.H = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.render();
  };
  Player.prototype.render = function () {
    var f = frame(this.spec, this.tb); this.seg = f.seg;
    draw(this.ctx, this.W || 300, this.H || 140, this.spec, f, { haze: this.haze, t: this.tb });
    if (this.o.onFrame) this.o.onFrame(this.tb, f, this.slow());
  };
  Player.prototype._loop = function (ts) {
    if (!this.playing) return;
    if (!this.c.isConnected) { this.playing = false; return; }
    var dt = this.last ? Math.min(0.1, (ts - this.last) / 1000) : 0; this.last = ts;
    this.tb += dt * this.bpm() / 60 * this.rate * this.slow();
    this.render(); this.raf = root.requestAnimationFrame(this._loop);
  };
  Player.prototype.play = function () { if (this.playing) return; this.playing = true; this.last = 0; this.raf = root.requestAnimationFrame(this._loop); if (this.o.onState) this.o.onState(true); };
  Player.prototype.pause = function () { this.playing = false; if (this.raf) root.cancelAnimationFrame(this.raf); if (this.o.onState) this.o.onState(false); };
  Player.prototype.toggle = function () { this.playing ? this.pause() : this.play(); };
  Player.prototype.restart = function () { this.tb = 0; this.render(); };

  var api = { frame: frame, validate: validate, flashHz: flashHz, Player: Player, ATTRS: ATTRS, WAVES: WAVES, ORDERS: ORDERS, SELS: SELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LXViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
