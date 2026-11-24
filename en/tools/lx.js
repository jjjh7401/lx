/* 조명 연출 도구모음 공통 — 곡 데이터 저장, 마디 계산, 상단 메뉴
   음악 파일 자체는 저장하지 않는다. 곡마다 적은 노트(마디, 변화, 색, 판정)만 이 브라우저에 저장된다. */
(function () {
  'use strict';
  var KEY = 'lx-tools-en-v1';
  var mem = null;
  function read() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : mem; } catch (e) { return mem; } }
  function write(l) { mem = l; try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function uid() { return Math.random().toString(36).slice(2, 9); }

  var MARKS = [
    { id: 'sec', sym: '┃', k: 'sec', label: 'Section start', key: 'S' },
    { id: 'in', sym: '▲', k: 'point', label: 'Entry', key: '1' },
    { id: 'pull', sym: '◆', k: 'point', label: 'Anticipation', key: '2' },
    { id: 'hit', sym: '▼', k: 'impact', label: 'Big hit / drop', key: '3' },
    { id: 'build', sym: '↗', k: 'trans', label: 'Build-up', key: '4' },
    { id: 'roll', sym: '≋', k: 'trans', label: 'Snare roll', key: '5' },
    { id: 'drop', sym: '○', k: 'trans', label: 'Break', key: '6' },
    { id: 'stop', sym: '×', k: 'trans', label: 'Kick-out', key: '7' }
  ];
  var KIND = { sec: 'Section', point: 'Point', impact: 'Impact', trans: 'Transition' };
  var PALETTE = [
    ['Red', '#e0352b'], ['Orange', '#f07a1f'], ['Amber', '#f4a62a'], ['Yellow', '#f2d43a'],
    ['Lime', '#9bd34a'], ['Green', '#2fa84f'], ['Teal', '#1fa79a'], ['Cyan', '#27b6de'],
    ['Blue', '#2f62d4'], ['Indigo', '#3b2fa3'], ['Lavender', '#a58be6'], ['Purple', '#8a3fc2'],
    ['Magenta', '#d43a9c'], ['Pink', '#f28bb5'], ['Warm white', '#ffe0b0'], ['White', '#f3f5fb']
  ];
  var SEC_NAMES = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Post-chorus', 'Bridge', 'Dance break', 'Build-up', 'Drop', 'Beat section', 'Outro', 'End'];
  var NUMBERED = ['Verse', 'Pre-chorus', 'Chorus', 'Post-chorus', 'Build-up', 'Drop'];

  function markDef(t) { for (var i = 0; i < MARKS.length; i++) if (MARKS[i].id === t) return MARKS[i]; return MARKS[0]; }

  function blank(title) {
    return { id: uid(), title: title || 'New song', artist: '', bpm: 120, bpmConf: '◐', t0: 0, t0Conf: '◐', bpb: 4, nbars: 0,
      duration: 0, musicEnd: 0, fileName: '', impression: '', marks: [], colors: {}, mood: {}, energy: {},
      mv: { beat: '', move: '' }, questions: [], layers: {}, follow: {}, sample: false, updated: Date.now() };
  }

  function sample() {
    var s = blank('LOVE ATTACK');
    s.artist = 'RESCENE'; s.bpm = 112; s.bpmConf = '●'; s.t0 = 1.5; s.t0Conf = '◐'; s.nbars = 83;
    s.duration = 197; s.musicEnd = 179; s.sample = true;
    s.impression = 'Opens rough with distorted guitar; the drums burst in at the chorus.';
    var secs = [[1, 'Intro'], [7, 'Verse 1'], [14, 'Pre-chorus 1'], [18, 'Chorus 1'], [34, 'Verse 2'], [42, 'Pre-chorus 2'],
      [46, 'Chorus 2'], [62, 'Bridge'], [63, 'Beat section (drop candidate)', '◐'], [68, 'Chorus 3'], [82, 'End']];
    var ev = [['in', 7, 1, null, 'Melody starts, volume jumps up'], ['build', 14, 1, 17, 'Four bars of steady rise'], ['hit', 18, 1, null, 'Chorus 1 big hit'],
      ['stop', 33, 1, null, 'One-bar kick-out'], ['drop', 42, 1, 43, 'Low end drops out'], ['build', 44, 1, 45, 'Builds again'], ['hit', 46, 1, null, 'Chorus 2 big hit'],
      ['stop', 61, 1, null, 'One-bar kick-out'], ['drop', 67, 1, null, 'Break (beats 1–3)'], ['pull', 67, 4, null, 'Chorus 3 comes in one beat early'],
      ['hit', 67, 4, null, 'Chorus 3 entry hit'], ['build', 69, 1, 70, 'Swells once more inside Chorus 3'], ['stop', 82, 1, null, 'Kick drops out and it fades through bar 83 (end of song)']];
    secs.forEach(function (x) { s.marks.push({ id: uid(), t: 'sec', bar: x[0], beat: 1, end: null, name: x[1], memo: '', conf: x[2] || '●' }); });
    ev.forEach(function (x) { s.marks.push({ id: uid(), t: x[0], bar: x[1], beat: x[2], end: x[3], name: '', memo: x[4], conf: '●' }); });
    var col = { 'Intro': ['Amber'], 'Verse 1': ['Magenta'], 'Pre-chorus 1': ['Purple'], 'Chorus 1': ['Red', 'White'], 'Verse 2': ['Magenta'],
      'Pre-chorus 2': ['Purple'], 'Chorus 2': ['Red', 'Amber'], 'Bridge': ['Blue'], 'Beat section (drop candidate)': ['Cyan'], 'Chorus 3': ['Red', 'White'], 'End': ['Amber'] };
    var en = { 'Intro': 2, 'Verse 1': 2, 'Pre-chorus 1': 3, 'Chorus 1': 4, 'Verse 2': 3, 'Pre-chorus 2': 3, 'Chorus 2': 4, 'Bridge': 2, 'Beat section (drop candidate)': 4, 'Chorus 3': 4, 'End': 2 };
    s.marks.forEach(function (m) { if (m.t === 'sec') { s.colors[m.id] = col[m.name] || []; s.energy[m.id] = en[m.name] || 3; } });
    s.questions = [{ text: 'Does the critics’ "beat drop" fall at bars 63–66 or at bars 18 and 46?', conf: '○' }];
    return s;
  }

  function migrate(l) { return l; }
  function lib() {
    var l = read(); if (l) l = migrate(l);
    if (!l || !l.songs || !Object.keys(l.songs).length) { var s = sample(); l = { songs: {}, current: s.id }; l.songs[s.id] = s; write(l); }
    if (!l.songs[l.current]) l.current = Object.keys(l.songs)[0];
    return l;
  }

  // 시간 계산
  function beatLen(s) { return 60 / (+s.bpm || 120); }
  function barLen(s) { return beatLen(s) * (+s.bpb || 4); }
  function timeOf(s, bar, beat) { return (+s.t0 || 0) + (((bar || 1) - 1) * (+s.bpb || 4) + ((beat || 1) - 1)) * beatLen(s); }
  function posOf(s, t, round) {
    var b = (t - (+s.t0 || 0)) / beatLen(s);
    var bi = round ? Math.round(b) : Math.floor(b + 1e-6);
    var bpb = +s.bpb || 4;
    var bar = Math.floor(bi / bpb) + 1, beat = ((bi % bpb) + bpb) % bpb + 1;
    return { bar: bar, beat: beat };
  }
  function nbars(s) {
    if (+s.nbars) return +s.nbars;
    var end = +s.musicEnd || +s.duration;
    return end ? Math.max(1, Math.ceil((end - (+s.t0 || 0)) / barLen(s))) : 64;
  }
  function total(s) { return Math.max(+s.duration || 0, timeOf(s, nbars(s) + 1, 1)); }
  function fmt(t) { if (!isFinite(t)) return '–'; var neg = t < 0; t = Math.abs(t); var m = Math.floor(t / 60), r = t - m * 60; return (neg ? '-' : '') + m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); }
  function sortMarks(a, b) { return (a.bar - b.bar) || (a.beat - b.beat) || (a.t === 'sec' ? -1 : b.t === 'sec' ? 1 : 0); }
  function sections(s) {
    var secs = s.marks.filter(function (m) { return m.t === 'sec'; }).sort(sortMarks), N = nbars(s);
    return secs.map(function (m, i) { var end = i + 1 < secs.length ? secs[i + 1].bar - 1 : N; return { m: m, start: m.bar, end: Math.max(m.bar, end), len: Math.max(1, end - m.bar + 1) }; });
  }
  function sectionAt(s, bar) { var list = sections(s), cur = null; list.forEach(function (x) { if (x.start <= bar) cur = x; }); return cur; }
  function colorHex(name) { for (var i = 0; i < PALETTE.length; i++) if (PALETTE[i][0] === name) return PALETTE[i][1]; return null; }
  function nextSecName(s, base) {
    if (NUMBERED.indexOf(base) < 0) return base;
    var n = s.marks.filter(function (m) { return m.t === 'sec' && (m.name === base || m.name.indexOf(base + ' ') === 0); }).length;
    return base + ' ' + (n + 1);
  }
  function eul(w) { return w; }
  function josa(w) { return w; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }


  // ── 2부(설계) 공통: 역할, 포지션 프리셋, 곡마다 설계 노트(design) ──
  var ROLES = ['Key', 'Fill', 'Back', 'Side', 'Top', 'Wash', 'Beam', 'FX', 'Pixel', 'Audience'];
  var STILLS = ['Fan', 'Wall', 'Star', 'Prism starburst', 'Tunnel', 'Cross', 'V', 'Center focus', 'Cone',
    'Sky beam', 'Downlight', 'Audience beam', 'Top/bottom split', 'Single-color wash', 'Silhouette', 'Key spot', 'Wall gobo'];
  var PROLE = { base: 'Main', acc: 'Secondary', pair: 'Pair', scene: 'One scene', reserve: 'Special', white: 'White', key: 'Key white' };
  // 색온도(K) → 화면 표시용 RGB %(근사식). 키 흰색은 RGB가 아니라 색온도로 적고, 화면에는 이 근사색으로만 보여 줍니다.
  function kelvinPct(k) {
    var t = Math.max(1000, Math.min(12000, +k || 4200)) / 100, r, g, b;
    if (t <= 66) { r = 255; g = 99.4708 * Math.log(t) - 161.1196; b = t <= 19 ? 0 : 138.5177 * Math.log(t - 10) - 305.0448; }
    else { r = 329.6987 * Math.pow(t - 60, -0.1332); g = 288.1222 * Math.pow(t - 60, -0.0755); b = 255; }
    function c(v) { return Math.round(Math.max(0, Math.min(255, v)) / 2.55); }
    return { r: c(r), g: c(g), b: c(b) };
  }
  function hexOf(c) { function h(v) { v = Math.max(0, Math.min(255, Math.round(v * 2.55))); return (v < 16 ? '0' : '') + v.toString(16); } if (c.role === 'key' && c.kelvin) { var q = kelvinPct(c.kelvin); return '#' + h(q.r) + h(q.g) + h(q.b); } return '#' + h(+c.r) + h(+c.g) + h(+c.b); }
  function initDesign(d) {
    d.concept = d.concept || { layers: { sound: '', emotion: '', voice: '', artist: '' }, hs: {}, line: '', avoid: '', forms: '', refs: '', chips: [], meet: {} };
    if (!d.concept.layers) d.concept.layers = { sound: '', emotion: '', voice: '', artist: '' };
    d.pal = d.pal || { colors: [], flow: {} };
    d.looks = d.looks || {};
    d.bright = d.bright || { key: 70, rows: {}, dark: {}, cards: {} };
    d.grid = d.grid || { cuts: null, cells: {} };
    d.recs = d.recs || {};
    d.trans = d.trans || {};
    if (!d.cueSheet) d.cueSheet = null;
    return d;
  }
  function design(s) {
    // 예시 곡은 책의 예(2판)로 한 번 채운다. 사용자 곡은 빈 칸으로 시작한다.
    if (s.sample && (!s.design || s.design.seeded !== 6)) { s.design = initDesign({ seeded: 6 }); seedSample(s, s.design); }
    var d = initDesign(s.design || (s.design = {}));
    if (s.sample && d.grid.seeded !== 2) seedGrid(s, d);
    return d;
  }
  function seedSample(s, d) {
    var c = d.concept;
    c.layers = { sound: 'Upbeat dance pop at 112 BPM; opens rough with distorted guitar, drums burst in at the chorus; sounds bright', emotion: 'From unmistakable fluttering to a playful confession',
      voice: 'A story of playfully pushing your feelings onto the one you like', artist: 'Running through every album: the "scent" — a soft color that spreads' };
    c.hs = { tempo: 'mid', mode: 'bright' };
    c.line = 'Upbeat dance pop, from fluttering to a playful confession; pastels that spread like a scent, and one last heart.';
    c.avoid = 'Dark single-color wash';
    c.forms = 'Heart — drawn in pixels, opened at the intro and closed at the end';
    c.refs = '';
    c.chips = [[1, 'Pearl heart', '#ffb8d9'], [7, 'Garden sunlight', '#fff1d6'], [18, 'Rooftop sky', '#8ccbff'], [29, 'Pool', '#00f2d9'], [33, 'Street daylight', '#ffe7c2'], [39, 'Old shop', '#f4a62a'],
      [46, 'Pixel heart', '#ff0a00'], [62, 'Sunset backlight', '#ff7a2e'], [64, 'CRT screen', '#144dff'], [68, 'Night spot', '#ad73ff']].map(function (x) { return { id: uid(), bar: x[0], name: x[1], hex: x[2] }; });
    c.meet = { artist: 'Whether there are colors to avoid', director: 'The moment the camera works hardest on (Chorus 3 entry?)', choreo: 'Bars with freeze poses', video: 'Main color and brightness of the LED screen per section', camera: 'White-balance reference and key color temperature', costume: 'Costume colors and materials (white clothes, sequins)', stage: 'Timing of special effects (CO₂, fireworks) and the main look at that moment', audio: 'Final audio version and length' };
    var P = [['c1', 'Pearl pink', 100, 72, 85, 'base'], ['c2', 'Lilac', 68, 45, 100, 'acc'], ['c3', 'Aqua', 0, 95, 85, 'acc'],
      ['c6', 'Red', 100, 4, 0, 'reserve'], ['w', 'White', 100, 100, 100, 'white']];
    d.pal.colors = P.map(function (x) { return { id: x[0], name: x[1], r: x[2], g: x[3], b: x[4], role: x[5] }; });
    var kq = kelvinPct(4200); d.pal.colors.push({ id: 'k', name: 'Key white', r: kq.r, g: kq.g, b: kq.b, kelvin: 4200, role: 'key' });
    var F = { 'Intro': ['c1'], 'Verse 1': ['c1', 'c2'], 'Pre-chorus 1': ['c1', 'c3'], 'Chorus 1': ['c3', 'c1'], 'Verse 2': ['c1', 'c2'], 'Pre-chorus 2': ['c1', 'c3'],
      'Chorus 2': ['c3', 'c1'], 'Bridge': ['c2'], 'Beat section (drop candidate)': ['c2', 'c1'], 'Chorus 3': ['c3', 'c2'], 'End': ['c2'] };
    var Lk = { 'Intro': ['Pearl heart', 'Pixel', 'Single-color wash', 'Draw the heart, 4 beats', 'Snap on beat 1'], 'Verse 1': ['Garden sunlight', 'Key', 'Downlight', '', '2-beat fade'],
      'Pre-chorus 1': ['Balloon sky', 'Side', 'Wall', 'Add one layer per bar', 'Snap on beat 1'], 'Chorus 1': ['Rooftop fan', 'Beam', 'Fan', 'Two-color snap, 2 beats', 'Snap on beat 1'],
      'Verse 2': ['Garden sunlight', 'Key', 'Downlight', '', '2-beat fade'], 'Pre-chorus 2': ['Balloon sky', 'Side', 'Wall', 'Add one layer per bar', 'Snap on beat 1'],
      'Chorus 2': ['Rooftop fan', 'Beam', 'Fan', 'Two-color snap, 2 beats · entry is a moving-head burst · only pixels red in bars 47–48', 'Snap on beat 1'], 'Bridge': ['Lilac backlight', 'Back', 'Sky beam', '', '1-bar fade'],
      'Beat section (drop candidate)': ['Cross beams', 'Beam', 'Cross', 'Two-color snap, 2 beats', 'Snap on beat 1'], 'Chorus 3': ['Rooftop fan · night', 'Beam', 'Fan', 'Two-color snap, 2 beats', 'Hit after the break'],
      'End': ['Pearl heart · night', 'Pixel', 'Single-color wash', '', '2-bar fade'] };
    var B = { 'Intro': [50, 30], 'Verse 1': [50, 35], 'Pre-chorus 1': [70, 45], 'Chorus 1': [80, 60], 'Verse 2': [60, 40], 'Pre-chorus 2': [75, 50],
      'Chorus 2': [90, 65], 'Bridge': [45, 30], 'Beat section (drop candidate)': [85, 60], 'Chorus 3': [100, 75], 'End': [40, 30] };
    sections(s).forEach(function (x) {
      var nm = x.m.name;
      if (F[nm]) d.pal.flow[x.m.id] = F[nm].slice();
      if (Lk[nm]) d.looks[x.m.id] = { name: Lk[nm][0], hero: Lk[nm][1], pos: Lk[nm][2], fx: Lk[nm][3], entry: Lk[nm][4] };
      if (B[nm]) d.bright.rows[x.m.id] = { hero: B[nm][0], base: B[nm][1] };
    });
    s.marks.forEach(function (m) { if (m.t === 'stop' && m.bar < 82 || m.t === 'drop' && m.bar === 67) d.bright.dark[m.id] = true; });
    d.bright.key = 80; d.bright.cards = { burst: 46, reserve: 47, flash: 67, all: 78, blinder: 0, strobe: 0, aud: 0 };
  }

  // ── 3부: 비트 그리드 예시(11장 표 11-2, 13장 그림 13-3) ──
  var GRID_ROWS = [['scene', 'Scene', 0], ['back', 'Back pulse', 1], ['side', 'Side chase', 1], ['pix', 'Pixel', 1], ['up', 'Upper movers', 1], ['down', 'Lower movers', 1], ['acc', 'Accent', 0]];
  function seedGrid(s, d) {
    var g = d.grid; g.seeded = 2;
    g.cuts = [1, 3, 7, 11, 14, 18, 22, 26, 30, 33, 34, 38, 42, 44, 46, 50, 54, 58, 61, 62, 63, 67, 68, 72, 78, 82];
    // [마디, 줄, 글, 리듬(1), 메인(1)]
    var C = [
      [1, 'scene', 'Pearl heart: wash 30%'], [1, 'pix', 'Heart blooms in pearl pink, sparkle', 1, 1], [1, 'down', 'Narrow toward the floor, static'],
      [3, 'scene', 'Same'], [3, 'back', 'Once on beat 1 of each bar', 1], [3, 'pix', 'Sparkle', 0, 1], [3, 'down', 'Raise one step on bar 5 beat 1'],
      [7, 'scene', 'Garden sunlight (main key): pearl pink and lilac wash at 35% (2-beat fade), key on at 80%'], [7, 'side', 'Left-right alternating chase on every beat, following the hi-hat', 1], [7, 'pix', 'Close the heart and turn it off'], [7, 'up', 'Downlight, static'], [7, 'down', 'Slow tilt wave, 2-bar cycle', 1], [7, 'acc', 'Bar 7 entry'],
      [11, 'scene', 'Tint toward lilac over 3 bars'], [11, 'side', 'Same', 1], [11, 'up', 'Slow pan wave, 2-bar cycle', 1], [11, 'down', 'New position on bar 11 beat 1, static'],
      [14, 'scene', 'Balloon sky: base from 25%, raised every bar; aqua appears for the first time'], [14, 'side', 'Twice as fast every bar', 1, 1], [14, 'up', 'Same sweep up and down, 4 beats → 2 → 1 → half a beat', 1], [14, 'down', 'Same as above (merged)'], [14, 'acc', 'Dark cue on bar 17 beats 3–4'],
      [18, 'scene', 'Rooftop fan: aqua base 60%, pearl pink'], [18, 'back', 'Low bass on every beat', 1], [18, 'pix', 'Two-color snap, beats 2 and 4', 1], [18, 'up', 'Hold on aqua'], [18, 'down', 'Fan position, 80%', 0, 1], [18, 'acc', 'Brightness hit on bar 18 beat 1'],
      [22, 'scene', 'Same'], [22, 'back', 'Low bass on every beat', 1], [22, 'pix', 'Fixed on two colors'], [22, 'up', 'Fan wave, 2-beat cycle', 1, 1], [22, 'down', 'Fan position unchanged'],
      [26, 'back', 'Low bass on every beat', 1], [26, 'pix', 'Two-color snap, beats 2 and 4', 1, 1], [26, 'up', 'Static'],
      [30, 'back', 'Low bass on every beat', 1], [30, 'pix', 'Fixed on two colors'], [30, 'up', 'Fan wave, 2-beat cycle', 1, 1],
      [33, 'scene', 'Kick-out: key + bass, all effects stop'], [33, 'up', 'Downlight in the dark'], [33, 'acc', 'Dark cue'],
      [34, 'scene', 'Garden sunlight 60%'], [34, 'side', 'Hi-hat left-right alternating chase', 1], [34, 'down', 'Kick, pulse on beat 1 of each bar (movers static)', 1],
      [38, 'side', 'Hi-hat left-right alternating chase', 1], [38, 'down', 'Kick, pulse on beat 1 of each bar', 1],
      [42, 'scene', 'Balloon sky 75%, bass only in bars 42–43'], [42, 'acc', 'Dark cue (bass only)'],
      [44, 'scene', 'Raise every bar'], [44, 'side', 'Speeds up', 1, 1], [44, 'up', 'Same sweep up and down', 1], [44, 'down', 'Same as above (merged)'], [44, 'acc', 'Dark cue on bar 45 beat 4'],
      [46, 'scene', 'Rooftop fan 90%'], [46, 'back', 'Low bass on every beat', 1], [46, 'pix', 'Two-color snap · red heart in bars 47–48', 1], [46, 'down', 'Mover burst, fan', 0, 1], [46, 'acc', '46 mover burst, 47 red heart'],
      [50, 'back', 'Low bass on every beat', 1], [50, 'up', 'Fan wave', 1, 1],
      [54, 'back', 'Low bass on every beat', 1], [54, 'pix', 'Two-color snap', 1, 1],
      [58, 'back', 'Low bass on every beat', 1], [58, 'up', 'Fan wave', 1, 1],
      [61, 'scene', 'Kick-out: key + bass'], [61, 'acc', 'Dark cue'],
      [62, 'scene', 'Lilac backlight 45%, 1-bar fade'], [62, 'back', 'Lilac backlight', 0, 1],
      [63, 'scene', 'Cross beams 85%'], [63, 'back', 'Low bass on every beat', 1], [63, 'down', 'Cross sweep', 1, 1],
      [67, 'scene', 'Break: bass only'], [67, 'acc', 'White flash on bar 67 beat 4'],
      [68, 'scene', 'Rooftop fan · night 100%'], [68, 'back', 'Low bass on every beat', 1], [68, 'pix', 'Two-color snap', 1, 1], [68, 'down', 'Kick on every beat', 1],
      [72, 'back', 'Low bass on every beat', 1], [72, 'pix', 'Two-color snap', 1], [72, 'down', 'Kick on every beat', 1, 1],
      [78, 'scene', 'All roles on'], [78, 'back', 'Low bass on every beat', 1], [78, 'pix', 'Two-color snap', 1, 1], [78, 'down', 'Kick on every beat', 1], [78, 'acc', '78 all roles'],
      [82, 'scene', 'Pearl heart · night, 2-bar fade'], [82, 'pix', 'Heart lights again and closes', 0, 1]
    ];
    g.cells = {};
    C.forEach(function (x) { g.cells[x[1] + '|' + x[0]] = { txt: x[2], lay: !!x[3], star: !!x[4] }; });
  }
  // 상단 메뉴와 곡 고르기
  var PAGES = [['index.html', 'All tools'], ['listen.html', 'Listening Notes'], ['pairs.html', 'Sound and Light Matching'], ['calc.html', 'Beat Calculator'], ['map.html', 'Music Map Practice'], ['sheet.html', 'Song Map'], ['rig.html', 'Fixture Roles'], ['concept.html', 'Concept Sheet'], ['palette.html', 'Palette'], ['looks.html', 'Look Sheet'], ['bright.html', 'Brightness Plan'], ['grid.html', 'Beat Grid'], ['recs.html', 'Section Guide'], ['trans.html', 'Transition Curves'], ['cues.html', 'Cue Sheet'], ['bcast.html', 'Broadcast Check'], ['setlist.html', 'Setlist Arc'], ['busk.html', 'Busking Page'], ['rigcalc.html', 'Rig Calculator and Patch Sheet'], ['scene.html', 'Scene Viewer'], ['showplan.html', 'Show File Plan'], ['phaser.html', 'Phaser Calculator'], ['tc.html', 'Timecode Table'], ['rehearsal.html', 'Rehearsal Notes'], ['gocall.html', 'GO Practice'], ['safety.html', 'Safety Check'], ['song.html', 'One-Song Workbench']];
  /* English edition: tools that exist in English live next to this file; the rest open the Korean original */
  var EN_TOOLS = ["index.html","listen.html","pairs.html","calc.html","map.html","sheet.html"];
  var EN_CH = [1, 2, 3, 4, 5];
  function top(active, opt) {
    opt = opt || {};
    var l = lib(), cur = l.songs[l.current];
    var h = document.createElement('header'); h.className = 'top';
    var opts = Object.keys(l.songs).map(function (id) { var s = l.songs[id]; return '<option value="' + id + '"' + (id === l.current ? ' selected' : '') + '>' + esc(s.title || 'Untitled') + (s.sample ? ' (sample)' : '') + '</option>'; }).join('');
    var embedded = /[?&]embed=1/.test(location.search);
    h.innerHTML = '<div class="wrap">' + (embedded ? '<span class="brand"><b>LX</b> Lighting Direction Tools</span>' :
      '<a class="brand" href="index.html"><b>LX</b> Lighting Direction Tools</a><nav class="nav" aria-label="Tools">' +
      PAGES.map(function (p) {
        var en = EN_TOOLS.indexOf(p[0]) >= 0;
        return '<a href="' + (en ? p[0] : '../../' + p[0]) + '"' + (en ? '' : ' target="_blank" rel="noopener" title="Korean only for now"') + (p[0] === active ? ' aria-current="page"' : '') + '>' + p[1] + (en ? '' : ' <small class="muted">KO</small>') + '</a>';
      }).join('') + '</nav>') +
      (opt.noSong ? '' : '<div class="song-pick"><label for="lx-song" class="muted">Song</label><select id="lx-song">' + opts + '</select>' +
      '<button type="button" id="lx-new" class="ghost">New song</button></div>') + '</div>';
    document.body.insertBefore(h, document.body.firstChild);
    (function () {
      var TOOL_CH = { 'listen.html': [1], 'pairs.html': [1], 'calc.html': [2], 'map.html': [3, 4], 'sheet.html': [5], 'rig.html': [6], 'concept.html': [7, 10], 'palette.html': [8], 'looks.html': [9], 'bright.html': [10], 'grid.html': [11, 13], 'recs.html': [12], 'trans.html': [14], 'cues.html': [16], 'bcast.html': [17], 'setlist.html': [18, 19], 'busk.html': [21], 'rigcalc.html': [22], 'showplan.html': [24, 29], 'phaser.html': [25, 26], 'tc.html': [28], 'rehearsal.html': [28, 30], 'gocall.html': [31], 'safety.html': [32], 'song.html': [33] };
      if (embedded) return;
      var chs = TOOL_CH[active] || [];
      var a = document.createElement('a'); a.className = 'book-link'; a.rel = 'noopener';
      var en = null; for (var i = 0; i < chs.length; i++) if (EN_CH.indexOf(chs[i]) >= 0) { en = chs[i]; break; }
      a.href = en ? '../ch' + en + '.html' : '../';
      a.textContent = en ? 'Read chapter ' + en + ' ↗' : 'Read the book ↗';
      var w = h.querySelector('.wrap'), b = w && w.querySelector('.brand'); if (b) b.insertAdjacentElement('afterend', a);
    })();
    var cur0 = h.querySelector('.nav [aria-current]'); if (cur0) { var nv = cur0.parentNode, fit = function () { nv.scrollLeft = cur0.offsetLeft - nv.offsetLeft - (nv.clientWidth - cur0.offsetWidth) / 2; }; fit(); window.addEventListener('load', fit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); }
    if (opt.noSong) return cur;
    h.querySelector('#lx-song').addEventListener('change', function (e) { var l2 = lib(); l2.current = e.target.value; write(l2); location.reload(); });
    h.querySelector('#lx-new').addEventListener('click', function () {
      var l2 = lib(), s = blank('New song'); l2.songs[s.id] = s; l2.current = s.id; write(l2); location.reload();
    });
    return cur;
  }

  function refreshPicker() {
    var sel = document.getElementById('lx-song'); if (!sel) return; var l = lib();
    sel.innerHTML = Object.keys(l.songs).map(function (id) { var s = l.songs[id]; return '<option value="' + id + '"' + (id === l.current ? ' selected' : '') + '>' + esc(s.title || 'Untitled') + (s.sample ? ' (sample)' : '') + '</option>'; }).join('');
  }

  // ---------- 복사: 엑셀용(TSV)과 메신저용(줄글) ----------
  function cell(v) { return String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ').trim(); }
  function asTSV(d) { return [d.head].concat(d.rows).map(function (r) { return r.map(cell).join('\t'); }).join('\n'); }
  function asMsg(d) {
    var out = d.title ? ['[' + d.title + ']'] : [];
    d.rows.forEach(function (r) {
      if (d.msgRow) { var m = d.msgRow(r); if (m) out.push(m); return; }
      var rest = []; for (var i = 1; i < r.length; i++) { var v = cell(r[i]); if (v && v !== '—') rest.push((d.head[i] && d.head[i] !== 'Content' ? d.head[i] + ' ' : '') + v); }
      out.push('▪ ' + cell(r[0]) + (rest.length ? '\n   ' + rest.join(' · ') : ''));
    });
    return out.join('\n');
  }
  function writeClip(txt, cb) {
    var fallback = function () {
      try { var t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); var ok = document.execCommand('copy'); t.remove(); cb(ok); } catch (e) { cb(false); }
    };
    try { navigator.clipboard.writeText(txt).then(function () { cb(true); }, fallback); } catch (e) { fallback(); }
  }
  // btn: 기존 복사 버튼(자리), msg: 안내 문단, get: function () { return { title, head:[], rows:[[]] }; }
  function copyBar(btn, msg, get) {
    if (!btn) return;
    var wrap = document.createElement('span'); wrap.className = 'row'; wrap.style.gap = '6px'; wrap.style.display = 'inline-flex'; wrap.style.flexWrap = 'wrap';
    wrap.innerHTML = '<button type="button" class="' + (btn.className || '') + '" data-f="tsv" title="Paste into Excel or Google Sheets and it splits into cells">Copy for Excel</button><button type="button" data-f="msg" title="Plain lines that paste well into a chat app or text message">Copy for chat</button>';
    wrap.id = btn.id; btn.replaceWith(wrap);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var d = get(); var f = b.dataset.f;
      if (!d.rows.length) { if (msg) msg.textContent = 'There is nothing to copy yet.'; return; }
      writeClip(f === 'tsv' ? asTSV(d) : asMsg(d), function (ok) {
        if (!msg) return;
        msg.textContent = !ok ? 'Copying is blocked here. Drag to select the table and copy it.' : f === 'tsv' ? 'Copied. Click one cell in Excel or Google Sheets and paste to get the table.' : 'Copied. Paste it straight into a chat app or notepad.';
      });
    });
  }
  // 두 번 눌러 확인하는 버튼: 첫 클릭에 문구가 바뀌고, 3초 안에 다시 누르면 실행
  function confirmBtn(btn, ask, run) {
    if (!btn) return; var label = btn.textContent, timer = null;
    btn.addEventListener('click', function (e) {
      if (btn.dataset.armed === '1') { clearTimeout(timer); btn.dataset.armed = ''; btn.textContent = label; btn.classList.remove('danger'); run(e); return; }
      e.stopImmediatePropagation(); btn.dataset.armed = '1'; btn.textContent = ask; btn.classList.add('danger');
      timer = setTimeout(function () { btn.dataset.armed = ''; btn.textContent = label; btn.classList.remove('danger'); }, 3000);
    });
  }

  window.LX = {
    copyBar: copyBar, asTSV: asTSV, asMsg: asMsg, writeClip: writeClip, confirmBtn: confirmBtn,
    MARKS: MARKS, KIND: KIND, PALETTE: PALETTE, SEC_NAMES: SEC_NAMES,
    lib: lib, uid: uid, blank: blank, sample: sample, markDef: markDef,
    song: function () { var l = lib(); return l.songs[l.current]; },
    put: function (s) { var l = lib(); s.updated = Date.now(); l.songs[s.id] = s; l.current = s.id; write(l); },
    remove: function (id) { var l = lib(); delete l.songs[id]; l.current = Object.keys(l.songs)[0]; write(l); },
    importLib: function (obj) { var l = lib(); Object.keys(obj.songs || {}).forEach(function (id) { l.songs[id] = obj.songs[id]; }); Object.keys(obj).forEach(function (k) { if (k !== 'songs' && obj[k] != null) l[k] = obj[k]; }); write(l); }, // 곡은 합치고, 쇼 단위 데이터(장비, 셋리스트, 버스킹, 패치 등)는 백업 것으로 바꿈
    rig: function () { return lib().rig || null; },
    putRig: function (r) { var l = lib(); r.updated = Date.now(); l.rig = r; write(l); },
    getKey: function (k) { var l = lib(); return l[k] || null; },
    putKey: function (k, v) { var l = lib(); l[k] = v; write(l); },
    exportLib: function () { return JSON.stringify(lib()); },
    beatLen: beatLen, barLen: barLen, timeOf: timeOf, posOf: posOf, nbars: nbars, total: total, fmt: fmt,
    ROLES: ROLES, STILLS: STILLS, PROLE: PROLE, hexOf: hexOf, kelvinPct: kelvinPct, design: design, GRID_ROWS: GRID_ROWS,
    sortMarks: sortMarks, sections: sections, sectionAt: sectionAt, colorHex: colorHex, nextSecName: nextSecName, esc: esc, eul: eul, josa: josa, refreshPicker: refreshPicker, top: top
  };
})();
/* Report content height to the parent page so the book chapter can size this iframe */
(function(){if(window.parent===window)return;var last=0;function post(){var h=Math.ceil(document.body.getBoundingClientRect().height);if(Math.abs(h-last)>2){last=h;parent.postMessage({lxh:h},'*')}}if(window.ResizeObserver)new ResizeObserver(post).observe(document.body);window.addEventListener('load',post);setTimeout(post,300);setTimeout(post,1500)})();
