/* 조명 연출 도구모음 공통 — 곡 데이터 저장, 마디 계산, 상단 메뉴
   음악 파일 자체는 저장하지 않는다. 곡마다 적은 노트(마디, 변화, 색, 판정)만 이 브라우저에 저장된다. */
(function () {
  'use strict';
  var KEY = 'lx-tools-v1';
  var mem = null;
  function read() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : mem; } catch (e) { return mem; } }
  function write(l) { mem = l; try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function uid() { return Math.random().toString(36).slice(2, 9); }

  var MARKS = [
    { id: 'sec', sym: '┃', k: 'sec', label: '구간 시작', key: 'S' },
    { id: 'in', sym: '▲', k: 'point', label: '진입', key: '1' },
    { id: 'pull', sym: '◆', k: 'point', label: '앤티시페이션', key: '2' },
    { id: 'hit', sym: '▼', k: 'impact', label: '큰 히트·드롭', key: '3' },
    { id: 'build', sym: '↗', k: 'trans', label: '빌드업', key: '4' },
    { id: 'roll', sym: '≋', k: 'trans', label: '스네어 롤', key: '5' },
    { id: 'drop', sym: '○', k: 'trans', label: '브레이크', key: '6' },
    { id: 'stop', sym: '×', k: 'trans', label: '킥 아웃', key: '7' }
  ];
  var KIND = { sec: '구간', point: '포인트', impact: '임팩트', trans: '트랜지션' };
  var PALETTE = [
    ['빨강', '#e0352b'], ['주황', '#f07a1f'], ['앰버', '#f4a62a'], ['노랑', '#f2d43a'],
    ['연두', '#9bd34a'], ['초록', '#2fa84f'], ['청록', '#1fa79a'], ['시안', '#27b6de'],
    ['파랑', '#2f62d4'], ['남색', '#3b2fa3'], ['라벤더', '#a58be6'], ['보라', '#8a3fc2'],
    ['마젠타', '#d43a9c'], ['핑크', '#f28bb5'], ['웜 화이트', '#ffe0b0'], ['화이트', '#f3f5fb']
  ];
  var SEC_NAMES = ['인트로', '벌스', '프리코러스', '후렴', '포스트코러스', '브리지', '댄스 브레이크', '빌드업', '드롭', '비트 구간', '아웃트로', '끝'];
  var NUMBERED = ['벌스', '프리코러스', '후렴', '포스트코러스', '빌드업', '드롭'];

  function markDef(t) { for (var i = 0; i < MARKS.length; i++) if (MARKS[i].id === t) return MARKS[i]; return MARKS[0]; }

  function blank(title) {
    return { id: uid(), title: title || '새 곡', artist: '', bpm: 120, bpmConf: '◐', t0: 0, t0Conf: '◐', bpb: 4, nbars: 0,
      duration: 0, musicEnd: 0, fileName: '', impression: '', marks: [], colors: {}, mood: {}, energy: {},
      mv: { beat: '', move: '' }, questions: [], layers: {}, follow: {}, sample: false, updated: Date.now() };
  }

  function sample() {
    var s = blank('LOVE ATTACK');
    s.artist = '리센느(RESCENE)'; s.bpm = 112; s.bpmConf = '●'; s.t0 = 1.5; s.t0Conf = '◐'; s.nbars = 83;
    s.duration = 197; s.musicEnd = 179; s.sample = true;
    s.impression = '디스토션 기타로 거칠게 열리고, 후렴에서 드럼이 터진다.';
    var secs = [[1, '인트로'], [7, '벌스 1'], [14, '프리코러스 1'], [18, '후렴 1'], [34, '벌스 2'], [42, '프리코러스 2'],
      [46, '후렴 2'], [62, '브리지'], [63, '비트 구간(드롭 후보)', '◐'], [68, '후렴 3'], [82, '끝']];
    var ev = [['in', 7, 1, null, '멜로디 시작, 음량이 크게 오름'], ['build', 14, 1, 17, '4마디 연속 상승'], ['hit', 18, 1, null, '후렴 1 큰 히트'],
      ['stop', 33, 1, null, '킥 아웃 1마디'], ['drop', 42, 1, 43, '저음을 비움'], ['build', 44, 1, 45, '다시 올림'], ['hit', 46, 1, null, '후렴 2 큰 히트'],
      ['stop', 61, 1, null, '킥 아웃 1마디'], ['drop', 67, 1, null, '브레이크(1~3박)'], ['pull', 67, 4, null, '후렴 3이 한 박 당겨 들어옴'],
      ['hit', 67, 4, null, '후렴 3 진입 히트'], ['build', 69, 1, 70, '후렴 3 안에서 한 번 더 커짐'], ['stop', 82, 1, null, '킥이 빠지고 83마디까지 잦아듦(곡 끝)']];
    secs.forEach(function (x) { s.marks.push({ id: uid(), t: 'sec', bar: x[0], beat: 1, end: null, name: x[1], memo: '', conf: x[2] || '●' }); });
    ev.forEach(function (x) { s.marks.push({ id: uid(), t: x[0], bar: x[1], beat: x[2], end: x[3], name: '', memo: x[4], conf: '●' }); });
    var col = { '인트로': ['앰버'], '벌스 1': ['마젠타'], '프리코러스 1': ['보라'], '후렴 1': ['빨강', '화이트'], '벌스 2': ['마젠타'],
      '프리코러스 2': ['보라'], '후렴 2': ['빨강', '앰버'], '브리지': ['파랑'], '비트 구간(드롭 후보)': ['시안'], '후렴 3': ['빨강', '화이트'], '끝': ['앰버'] };
    var en = { '인트로': 2, '벌스 1': 2, '프리코러스 1': 3, '후렴 1': 4, '벌스 2': 3, '프리코러스 2': 3, '후렴 2': 4, '브리지': 2, '비트 구간(드롭 후보)': 4, '후렴 3': 4, '끝': 2 };
    s.marks.forEach(function (m) { if (m.t === 'sec') { s.colors[m.id] = col[m.name] || []; s.energy[m.id] = en[m.name] || 3; } });
    s.questions = [{ text: '평론이 말한 "비트 드롭"이 63~66마디인지 18·46마디인지', conf: '○' }];
    return s;
  }

  // 예전 이름으로 저장된 역할·포지션 프리셋·구간 이름을 새 이름으로 바꿈(2026-10-25, 10-28 용어 정리)
  var RMAP = { '효과': 'FX', '객석': '오디언스' };
  var SMAP = { '부채꼴': '팬', '평행 빔 벽': '월', '별 방사': '스타', '교차': '크로스', '하늘 빔': '스카이 빔', '객석 방향 빔': '오디언스 빔' };
  function migrate(l) {
    try { var js = JSON.stringify(l); if (/브릿지|스폿|써클/.test(js)) l = JSON.parse(js.replace(/브릿지/g, '브리지').replace(/스폿/g, '스팟').replace(/써클/g, '서클')); } catch (e) {}
    if (l.rig && l.rig.rows) l.rig.rows.forEach(function (r) { if (r.roles) r.roles = r.roles.map(function (x) { return RMAP[x] || x; }); });
    Object.keys(l.songs || {}).forEach(function (id) {
      var d = l.songs[id].design; if (!d || !d.looks) return;
      Object.keys(d.looks).forEach(function (k) { var v = d.looks[k]; if (!v) return; if (RMAP[v.hero]) v.hero = RMAP[v.hero]; if (SMAP[v.pos]) v.pos = SMAP[v.pos]; });
    });
    return l;
  }
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
  function eul(w) { var c = String(w).replace(/[^가-힣]+$/, '').slice(-1).charCodeAt(0); if (!c || c < 0xAC00 || c > 0xD7A3) return w + '을(를)'; return w + (((c - 0xAC00) % 28) ? '을' : '를'); }
  function josa(w, pair) { var s = String(w).replace(/<[^>]*>/g, '').replace(/[^가-힣0-9A-Za-z]+$/, ''), c = s.slice(-1), code = c.charCodeAt(0), has;
    if (code >= 0xAC00 && code <= 0xD7A3) has = (code - 0xAC00) % 28 !== 0; else if (/[0-9]/.test(c)) has = '013678'.indexOf(c) >= 0; else has = /[lmnr]$/i.test(c);
    return w + (has ? pair[0] : pair[1]); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }


  // ── 2부(설계) 공통: 역할, 포지션 프리셋, 곡마다 설계 노트(design) ──
  var ROLES = ['키', '필', '백', '사이드', '탑', '워시', '빔', 'FX', '픽셀', '오디언스'];
  var STILLS = ['팬', '월', '스타', '프리즘 스타버스트', '터널', '크로스', 'V', '센터 포커스', '원뿔',
    '스카이 빔', '다운라이트', '오디언스 빔', '상하 분할', '단색 워시', '실루엣', '키 스팟', '벽 고보'];
  var PROLE = { base: '메인', acc: '서브', pair: '짝', scene: '한 장면', reserve: '스페셜', white: '흰색', key: '키 흰색' };
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
    c.layers = { sound: '112 BPM의 경쾌한 댄스 팝, 디스토션 기타로 거칠게 열리고 후렴에서 드럼이 터짐, 밝게 들림', emotion: '숨길 수 없는 설렘에서 장난스러운 고백으로',
      voice: '좋아하는 사람에게 장난처럼 마음을 들이미는 이야기', artist: '앨범마다 이어 온 "향기" — 번지는 부드러운 색' };
    c.hs = { tempo: 'mid', mode: 'bright' };
    c.line = '경쾌한 댄스 팝, 설렘에서 장난스러운 고백으로, 향기처럼 번지는 파스텔과 마지막 하트 하나.';
    c.avoid = '어두운 단색 워시';
    c.forms = '하트 — 픽셀로 그려 인트로와 끝에서 열고 닫음';
    c.refs = '';
    c.chips = [[1, '진주 하트', '#ffb8d9'], [7, '정원 햇빛', '#fff1d6'], [18, '옥상 하늘', '#8ccbff'], [29, '수영장', '#00f2d9'], [33, '거리 낮빛', '#ffe7c2'], [39, '오래된 가게', '#f4a62a'],
      [46, '픽셀 하트', '#ff0a00'], [62, '노을 역광', '#ff7a2e'], [64, 'CRT 화면', '#144dff'], [68, '밤의 스팟', '#ad73ff']].map(function (x) { return { id: uid(), bar: x[0], name: x[1], hex: x[2] }; });
    c.meet = { artist: '피하고 싶은 색이 있는지', director: '카메라가 가장 공들이는 순간(후렴 3 진입?)', choreo: '정지 동작 마디', video: '구간별 LED 화면의 주된 색과 밝기', camera: '화이트밸런스 기준과 키 색온도', costume: '의상 색과 소재(흰 옷, 스팽글)', stage: '특효(CO₂·불꽃) 시점과 그 순간의 메인', audio: '최종 음원 버전과 길이' };
    var P = [['c1', '진주 핑크', 100, 72, 85, 'base'], ['c2', '라일락', 68, 45, 100, 'acc'], ['c3', '아쿠아', 0, 95, 85, 'acc'],
      ['c6', '빨강', 100, 4, 0, 'reserve'], ['w', '흰색', 100, 100, 100, 'white']];
    d.pal.colors = P.map(function (x) { return { id: x[0], name: x[1], r: x[2], g: x[3], b: x[4], role: x[5] }; });
    var kq = kelvinPct(4200); d.pal.colors.push({ id: 'k', name: '키 흰색', r: kq.r, g: kq.g, b: kq.b, kelvin: 4200, role: 'key' });
    var F = { '인트로': ['c1'], '벌스 1': ['c1', 'c2'], '프리코러스 1': ['c1', 'c3'], '후렴 1': ['c3', 'c1'], '벌스 2': ['c1', 'c2'], '프리코러스 2': ['c1', 'c3'],
      '후렴 2': ['c3', 'c1'], '브리지': ['c2'], '비트 구간(드롭 후보)': ['c2', 'c1'], '후렴 3': ['c3', 'c2'], '끝': ['c2'] };
    var Lk = { '인트로': ['진주 하트', '픽셀', '단색 워시', '하트 그리기, 4박', '첫 박 스냅'], '벌스 1': ['정원 햇빛', '키', '다운라이트', '', '2박 페이드'],
      '프리코러스 1': ['풍선 하늘', '사이드', '월', '한 겹씩 쌓기, 마디마다', '첫 박 스냅'], '후렴 1': ['옥상 팬', '빔', '팬', '두 색 스냅, 2박', '첫 박 스냅'],
      '벌스 2': ['정원 햇빛', '키', '다운라이트', '', '2박 페이드'], '프리코러스 2': ['풍선 하늘', '사이드', '월', '한 겹씩 쌓기, 마디마다', '첫 박 스냅'],
      '후렴 2': ['옥상 팬', '빔', '팬', '두 색 스냅, 2박 · 진입은 무빙 버스트 · 47~48마디 픽셀만 빨강', '첫 박 스냅'], '브리지': ['라일락 역광', '백', '스카이 빔', '', '1마디 페이드'],
      '비트 구간(드롭 후보)': ['크로스 빔', '빔', '크로스', '두 색 스냅, 2박', '첫 박 스냅'], '후렴 3': ['옥상 팬 · 밤', '빔', '팬', '두 색 스냅, 2박', '브레이크 뒤 히트'],
      '끝': ['진주 하트 · 밤', '픽셀', '단색 워시', '', '2마디 페이드'] };
    var B = { '인트로': [50, 30], '벌스 1': [50, 35], '프리코러스 1': [70, 45], '후렴 1': [80, 60], '벌스 2': [60, 40], '프리코러스 2': [75, 50],
      '후렴 2': [90, 65], '브리지': [45, 30], '비트 구간(드롭 후보)': [85, 60], '후렴 3': [100, 75], '끝': [40, 30] };
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
  var GRID_ROWS = [['scene', '장면', 0], ['back', '백 펄스', 1], ['side', '사이드 체이스', 1], ['pix', '픽셀', 1], ['up', '위 무빙', 1], ['down', '아래 무빙', 1], ['acc', '강조', 0]];
  function seedGrid(s, d) {
    var g = d.grid; g.seeded = 2;
    g.cuts = [1, 3, 7, 11, 14, 18, 22, 26, 30, 33, 34, 38, 42, 44, 46, 50, 54, 58, 61, 62, 63, 67, 68, 72, 78, 82];
    // [마디, 줄, 글, 리듬(1), 메인(1)]
    var C = [
      [1, 'scene', '진주 하트: 워시 30%'], [1, 'pix', '하트가 진주 핑크로 피어남, 스파클', 1, 1], [1, 'down', '바닥 쪽 좁게, 정지'],
      [3, 'scene', '그대로'], [3, 'back', '마디 첫 박 한 번', 1], [3, 'pix', '스파클', 0, 1], [3, 'down', '5마디 1박에 한 칸 올림'],
      [7, 'scene', '정원 햇빛(메인 키): 진주 핑크·라일락 워시 35%(2박 페이드), 키 80% 켬'], [7, 'side', '하이햇에 맞춰 박마다 좌우 교차 체이스', 1], [7, 'pix', '하트를 닫고 끔'], [7, 'up', '다운라이트, 정지'], [7, 'down', '느린 틸트 웨이브, 주기 2마디', 1], [7, 'acc', '7마디 진입'],
      [11, 'scene', '라일락 쪽으로 3마디 틴트'], [11, 'side', '그대로', 1], [11, 'up', '느린 팬 웨이브, 주기 2마디', 1], [11, 'down', '11마디 1박에 새 포지션, 정지'],
      [14, 'scene', '풍선 하늘: 베이스 25%에서 마디마다 올림, 아쿠아 첫 등장'], [14, 'side', '마디마다 두 배로 빨라짐', 1, 1], [14, 'up', '위아래 같은 스윕, 4박→2박→1박→반 박', 1], [14, 'down', '위와 같음(합침)'], [14, 'acc', '17마디 3·4박 다크 큐'],
      [18, 'scene', '옥상 팬: 아쿠아 베이스 60%, 진주 핑크'], [18, 'back', '저음 베이스 매 박', 1], [18, 'pix', '두 색 스냅, 2·4박', 1], [18, 'up', '아쿠아로 정지'], [18, 'down', '팬 포지션, 80%', 0, 1], [18, 'acc', '18마디 1박 밝기 히트'],
      [22, 'scene', '그대로'], [22, 'back', '저음 베이스 매 박', 1], [22, 'pix', '두 색으로 고정'], [22, 'up', '팬 웨이브, 주기 2박', 1, 1], [22, 'down', '팬 포지션 그대로'],
      [26, 'back', '저음 베이스 매 박', 1], [26, 'pix', '두 색 스냅, 2·4박', 1, 1], [26, 'up', '정지'],
      [30, 'back', '저음 베이스 매 박', 1], [30, 'pix', '두 색으로 고정'], [30, 'up', '팬 웨이브, 주기 2박', 1, 1],
      [33, 'scene', '킥 아웃: 키 + 베이스, 모든 이펙트 멈춤'], [33, 'up', '어둠 속에서 다운라이트로'], [33, 'acc', '다크 큐'],
      [34, 'scene', '정원 햇빛 60%'], [34, 'side', '하이햇 좌우 교차 체이스', 1], [34, 'down', '킥, 마디 첫 박 펄스(무빙은 정지)', 1],
      [38, 'side', '하이햇 좌우 교차 체이스', 1], [38, 'down', '킥, 마디 첫 박 펄스', 1],
      [42, 'scene', '풍선 하늘 75%, 42~43마디는 베이스만'], [42, 'acc', '다크 큐(베이스만)'],
      [44, 'scene', '마디마다 올림'], [44, 'side', '빨라짐', 1, 1], [44, 'up', '위아래 같은 스윕', 1], [44, 'down', '위와 같음(합침)'], [44, 'acc', '45마디 4박 다크 큐'],
      [46, 'scene', '옥상 팬 90%'], [46, 'back', '저음 베이스 매 박', 1], [46, 'pix', '두 색 스냅 · 47~48마디 빨강 하트', 1], [46, 'down', '무빙 버스트, 팬', 0, 1], [46, 'acc', '46 무빙 버스트, 47 빨강 하트'],
      [50, 'back', '저음 베이스 매 박', 1], [50, 'up', '팬 웨이브', 1, 1],
      [54, 'back', '저음 베이스 매 박', 1], [54, 'pix', '두 색 스냅', 1, 1],
      [58, 'back', '저음 베이스 매 박', 1], [58, 'up', '팬 웨이브', 1, 1],
      [61, 'scene', '킥 아웃: 키 + 베이스'], [61, 'acc', '다크 큐'],
      [62, 'scene', '라일락 역광 45%, 1마디 페이드'], [62, 'back', '라일락 역광', 0, 1],
      [63, 'scene', '크로스 빔 85%'], [63, 'back', '저음 베이스 매 박', 1], [63, 'down', '크로스 스윕', 1, 1],
      [67, 'scene', '브레이크: 베이스만'], [67, 'acc', '67마디 4박 화이트 플래시'],
      [68, 'scene', '옥상 팬 · 밤 100%'], [68, 'back', '저음 베이스 매 박', 1], [68, 'pix', '두 색 스냅', 1, 1], [68, 'down', '킥 매 박', 1],
      [72, 'back', '저음 베이스 매 박', 1], [72, 'pix', '두 색 스냅', 1], [72, 'down', '킥 매 박', 1, 1],
      [78, 'scene', '모든 역할 켬'], [78, 'back', '저음 베이스 매 박', 1], [78, 'pix', '두 색 스냅', 1, 1], [78, 'down', '킥 매 박', 1], [78, 'acc', '78 모든 역할'],
      [82, 'scene', '진주 하트 · 밤, 2마디 페이드'], [82, 'pix', '하트를 다시 켜고 닫음', 0, 1]
    ];
    g.cells = {};
    C.forEach(function (x) { g.cells[x[1] + '|' + x[0]] = { txt: x[2], lay: !!x[3], star: !!x[4] }; });
  }
  // 상단 메뉴와 곡 고르기
  var PAGES = [['index.html', '도구모음'], ['listen.html', '듣기 노트'], ['pairs.html', '사운드와 조명 매칭'], ['calc.html', '박자 계산기'], ['map.html', '음악 지도 연습장'], ['sheet.html', '곡 구성표'], ['rig.html', '장비 역할표'], ['concept.html', '컨셉 시트'], ['palette.html', '팔레트'], ['looks.html', '룩 시트'], ['bright.html', '밝기 계획'], ['grid.html', '비트 그리드'], ['recs.html', '구간 추천표'], ['trans.html', '전환 곡선'], ['cues.html', '큐 시트'], ['bcast.html', '방송 점검'], ['setlist.html', '셋리스트 아크'], ['busk.html', '버스킹 페이지'], ['rigcalc.html', '장비 계산기와 패치 시트'], ['scene.html', '장면 보기'], ['showplan.html', '쇼 파일 계획'], ['phaser.html', '페이저 계산기'], ['tc.html', '타임코드 표'], ['rehearsal.html', '리허설 노트'], ['gocall.html', 'GO 연습'], ['safety.html', '안전 점검'], ['song.html', '한 곡 작업판']];
  function top(active, opt) {
    opt = opt || {};
    var l = lib(), cur = l.songs[l.current];
    var h = document.createElement('header'); h.className = 'top';
    var opts = Object.keys(l.songs).map(function (id) { var s = l.songs[id]; return '<option value="' + id + '"' + (id === l.current ? ' selected' : '') + '>' + esc(s.title || '제목 없음') + (s.sample ? ' (예시)' : '') + '</option>'; }).join('');
    var embedded = /[?&]embed=1/.test(location.search);
    var HUB = location.pathname.split('/').pop() || 'index.html', hk = '';
    h.innerHTML = '<div class="wrap">' + (embedded ? '<span class="brand"><b>LX</b> 조명 연출 도구모음</span><nav class="nav"><a href="' + HUB + '" target="_blank" rel="noopener">새 창에서 크게 열기 ↗</a></nav>' :
      '<a class="brand" href="index.html"><b>LX</b> 조명 연출 도구모음</a><nav class="nav" aria-label="도구">' +
      PAGES.map(function (p) { return '<a href="' + p[0] + '"' + (p[0] === active ? ' aria-current="page"' : '') + '>' + p[1] + '</a>'; }).join('') + '</nav>') +
      (opt.noSong ? '' : '<div class="song-pick"><label for="lx-song" class="muted">곡</label><select id="lx-song">' + opts + '</select>' +
      '<button type="button" id="lx-new" class="ghost">새 곡</button></div>') + '</div>';
    document.body.insertBefore(h, document.body.firstChild);
    (function () {
      var TOOL_CH = { 'listen.html': [1], 'pairs.html': [1], 'sheet.html': [5], 'rig.html': [6], 'concept.html': [7, 10], 'palette.html': [8], 'looks.html': [9], 'bright.html': [10], 'grid.html': [11, 13], 'recs.html': [12], 'trans.html': [14], 'cues.html': [16], 'bcast.html': [17], 'setlist.html': [18, 19], 'busk.html': [21], 'rigcalc.html': [22], 'showplan.html': [24, 29], 'phaser.html': [25, 26], 'tc.html': [28], 'rehearsal.html': [28, 30], 'gocall.html': [31], 'safety.html': [32], 'song.html': [33] };
      var chs = TOOL_CH[active] || [];
      fetch(new URL('book.json', document.baseURI)).then(function (r) { return r.json(); }).then(function (bk) {
        var c = null, n = 0;
        for (var i = 0; i < chs.length; i++) { var x = (bk.chapters || {})[chs[i]]; if (x && x.url) { c = x; n = chs[i]; break; } }
        var a = document.createElement('a'); a.className = 'book-link'; a.target = '_blank'; a.rel = 'noopener';
        if (c) { a.href = c.url; a.textContent = '책 ' + n + '장 읽기 ↗'; } else { a.href = bk.home; a.textContent = '책 읽기 ↗'; }
        var w = h.querySelector('.wrap'), b = w && w.querySelector('.brand'); if (b) b.insertAdjacentElement('afterend', a);
      }).catch(function () {});
    })();
    var cur0 = h.querySelector('.nav [aria-current]'); if (cur0) { var nv = cur0.parentNode, fit = function () { nv.scrollLeft = cur0.offsetLeft - nv.offsetLeft - (nv.clientWidth - cur0.offsetWidth) / 2; }; fit(); window.addEventListener('load', fit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); } // 좁은 화면: 지금 도구가 보이게
    if (opt.noSong) return cur;
    h.querySelector('#lx-song').addEventListener('change', function (e) { var l2 = lib(); l2.current = e.target.value; write(l2); location.reload(); });
    h.querySelector('#lx-new').addEventListener('click', function () {
      var l2 = lib(), s = blank('새 곡'); l2.songs[s.id] = s; l2.current = s.id; write(l2); location.reload();
    });
    return cur;
  }

  function refreshPicker() {
    var sel = document.getElementById('lx-song'); if (!sel) return; var l = lib();
    sel.innerHTML = Object.keys(l.songs).map(function (id) { var s = l.songs[id]; return '<option value="' + id + '"' + (id === l.current ? ' selected' : '') + '>' + esc(s.title || '제목 없음') + (s.sample ? ' (예시)' : '') + '</option>'; }).join('');
  }

  // ---------- 복사: 엑셀용(TSV)과 메신저용(줄글) ----------
  function cell(v) { return String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ').trim(); }
  function asTSV(d) { return [d.head].concat(d.rows).map(function (r) { return r.map(cell).join('\t'); }).join('\n'); }
  function asMsg(d) {
    var out = d.title ? ['[' + d.title + ']'] : [];
    d.rows.forEach(function (r) {
      if (d.msgRow) { var m = d.msgRow(r); if (m) out.push(m); return; }
      var rest = []; for (var i = 1; i < r.length; i++) { var v = cell(r[i]); if (v && v !== '—') rest.push((d.head[i] && d.head[i] !== '내용' ? d.head[i] + ' ' : '') + v); }
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
    wrap.innerHTML = '<button type="button" class="' + (btn.className || '') + '" data-f="tsv" title="엑셀·구글 시트에 붙여 넣으면 칸이 나뉩니다">엑셀용 복사</button><button type="button" data-f="msg" title="카카오톡·문자에 붙여 넣기 좋은 줄글">메신저용 복사</button>';
    wrap.id = btn.id; btn.replaceWith(wrap);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var d = get(); var f = b.dataset.f;
      if (!d.rows.length) { if (msg) msg.textContent = '복사할 내용이 아직 없습니다.'; return; }
      writeClip(f === 'tsv' ? asTSV(d) : asMsg(d), function (ok) {
        if (!msg) return;
        msg.textContent = !ok ? '복사가 막혀 있습니다. 표를 끌어 선택해 복사합니다.' : f === 'tsv' ? '복사했습니다. 엑셀이나 구글 시트의 칸 하나를 누르고 붙여 넣으면 표로 들어갑니다.' : '복사했습니다. 메신저나 메모장에 그대로 붙여 넣습니다.';
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
/* 책 본문 iframe 높이 맞춤: 부모(티스토리)에 내용 높이를 알림 */
(function(){if(window.parent===window)return;var last=0;function post(){var h=Math.ceil(document.body.getBoundingClientRect().height);if(Math.abs(h-last)>2){last=h;parent.postMessage({lxh:h},'*')}}if(window.ResizeObserver)new ResizeObserver(post).observe(document.body);window.addEventListener('load',post);setTimeout(post,300);setTimeout(post,1500)})();
