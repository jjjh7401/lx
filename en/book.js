/* Lighting the Music — English edition: shared chapter list and page chrome */
(function () {
  var KO = 'https://ablitzdesign.tistory.com';
  var BOOK = [
    { id: 'intro', n: '', t: 'Introduction', s: 'Lighting That Listens', file: 'intro.html', ko: KO + '/51' },
    { part: 'Part 1 · Reading the Song' },
    { id: 'ch1', n: '1', t: 'Listening Three Times', s: 'Listening notes, and the light that fits each sound', file: 'ch1.html', ko: KO + '/49' },
    { id: 'ch2', n: '2', t: 'Beats and Bars', s: 'Counting the time of a song', file: 'ch2.html', ko: KO + '/52' },
    { id: 'ch3', n: '3', t: 'Song Structure', s: 'From intro to outro', file: 'ch3.html', ko: KO + '/53' },
    { id: 'ch4', n: '4', t: 'Energy and Change', s: 'When a song swells and settles', file: 'ch4.html', ko: KO + '/54' },
    { id: 'ch5', n: '5', t: 'The Song Map', s: 'Everything you heard on one sheet', file: 'ch5.html', ko: KO + '/55' },
    { part: 'Part 2 · Designing the Light' },
    { id: 'ch6', n: '6', t: 'Fixtures and Their Roles', s: 'Five things light can change', file: 'ch6.html', ko: KO + '/56' },
    { id: 'ch7', n: '7', t: 'Concept', s: 'Finding the mood in the song and agreeing on it with the team', file: 'ch7.html', ko: KO + '/57' },
    { id: 'ch8', n: '8', t: 'Color Planning', s: 'Palette, white and area', file: 'ch8.html', ko: KO + '/58' },
    { id: 'ch9', n: '9', t: 'Looks and the Main Light', s: 'What makes up a scene', file: 'ch9.html', ko: KO + '/59' },
    { id: 'ch10', n: '10', t: 'Contrast and Restraint', s: 'Saving intensity and using darkness', file: 'ch10.html', ko: KO + '/60' },
    { part: 'Part 3 · Directing the Song' },
    { id: 'ch11', n: '11', t: 'Principles of Placement', s: 'How fast intensity, direction and color change', file: 'ch11.html', ko: KO + '/61' },
    { id: 'ch12', n: '12', t: 'Lighting Each Section', s: 'How the light changes from intro to chorus', file: 'ch12.html', ko: KO + '/62' },
    { id: 'ch13', n: '13', t: 'Building Layers', s: 'Splitting the light by instrument', file: 'ch13.html', ko: KO + '/63' },
    { id: 'ch14', n: '14', t: 'Transitions', s: 'Connecting one scene to the next', file: 'ch14.html', ko: KO + '/64' },
    { id: 'ch15', n: '15', t: 'Adjusting for Genre', s: 'From ballads to EDM' },
    { id: 'ch16', n: '16', t: 'Cue Sheets and the Beat Grid', s: 'Turning a song into a lighting script' },
    { part: 'Part 4 · Lighting by Show Type' },
    { id: 'ch17', n: '17', t: 'TV Music Shows', s: 'A stage where the camera is the audience' },
    { id: 'ch18', n: '18', t: 'Concerts and Tours', s: 'Shaping the flow of a whole show' },
    { id: 'ch19', n: '19', t: 'Award Shows and Large TV Shows', s: 'A stage that changes with every segment' },
    { id: 'ch20', n: '20', t: 'Light Shows and Openings', s: 'When the light is the star' },
    { id: 'ch21', n: '21', t: 'Festivals and Guest LDs', s: 'Lighting without knowing the set list' },
    { id: 'ch22', n: '22', t: 'Lighting Design and the Rig', s: 'From the song to the plot and patch sheet' },
    { part: 'Part 5 · Building It on the Console — grandMA3' },
    { id: 'ch23', n: '23', t: 'How the Console Works', s: 'From the values you enter to the stage' },
    { id: 'ch24', n: '24', t: 'Patch, Groups and Presets', s: 'Moving the rig into the console' },
    { id: 'ch25', n: '25', t: 'Phaser Basics', s: 'Five settings of a moving effect' },
    { id: 'ch26', n: '26', t: 'MAtricks and Recipes', s: 'One phaser, many shapes' },
    { id: 'ch27', n: '27', t: 'Programming a Song into Cues', s: 'Song pages and layer sequences' },
    { id: 'ch28', n: '28', t: 'Tempo and Timecode', s: 'Locking to the speed and time of the song' },
    { id: 'ch29', n: '29', t: 'Show File Templates', s: 'Build once, use again' },
    { part: 'Part 6 · Rehearsal and Show' },
    { id: 'ch30', n: '30', t: 'Rehearsal', s: 'Checklists and notes' },
    { id: 'ch31', n: '31', t: 'Running the Show', s: 'The person who presses GO' },
    { id: 'ch32', n: '32', t: 'Safety and Regulations', s: 'Flashing, rigging and special effects' },
    { part: 'Part 7 · Case Studies' },
    { id: 'ch33', n: '33', t: 'LOVE ATTACK', s: 'A TV music show song from start to finish' },
    { id: 'ch34', n: '34', t: 'ATEEZ BAD', s: 'A concert song from start to finish' },
    { id: 'ch35', n: '35', t: 'Light Show', s: 'A five-minute show from start to finish' },
    { id: 'ch36', n: '36', t: 'Reading Nine Pro Shows', s: 'Learning from public footage' },
    { part: 'Afterword · Appendix' },
    { id: 'outro', n: '', t: 'Afterword', s: 'It starts and ends with listening' },
    { id: 'appx', n: '', t: 'Appendix', s: 'Resource library guide, common mistakes, glossary, references' }
  ];
  window.LTM_BOOK = BOOK;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function label(c) { return (c.n ? 'Chapter ' + c.n + ' · ' : '') + c.t; }

  /* Contents drawer, shared by the home page and the chapter pages */
  function drawerHTML(curId) {
    var h = '<div class="ltm-drawer" id="ltmDrawer" hidden><div class="ltm-drawer-in" role="dialog" aria-label="Contents">' +
      '<div class="ltm-drawer-head"><b>Contents</b><button type="button" class="ltm-x" id="ltmClose" aria-label="Close contents">×</button></div><ol class="ltm-toc">';
    BOOK.forEach(function (c) {
      if (c.part) { h += '<li class="p">' + esc(c.part) + '</li>'; return; }
      var inner = '<span class="n">' + (c.n || '·') + '</span><span class="t">' + esc(c.t) + '</span>';
      if (c.file) h += '<li' + (c.id === curId ? ' class="cur"' : '') + '><a href="' + c.file + '">' + inner + '</a></li>';
      else h += '<li class="soon">' + inner + '<em>coming soon</em></li>';
    });
    return h + '</ol></div></div>';
  }
  function bindDrawer() {
    var d = document.getElementById('ltmDrawer');
    function open() { d.hidden = false; document.body.classList.add('ltm-lock'); var c = d.querySelector('.cur a'); if (c) c.scrollIntoView({ block: 'center' }); }
    function close() { d.hidden = true; document.body.classList.remove('ltm-lock'); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-toc]'), function (b) { b.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
    document.getElementById('ltmClose').addEventListener('click', close);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !d.hidden) close(); });
  }
  window.LTM_drawer = function (curId) { document.body.insertAdjacentHTML('beforeend', drawerHTML(curId)); bindDrawer(); };

  /* Chapter page chrome */
  window.LTM_chapter = function (id) {
    var list = BOOK.filter(function (c) { return !c.part; });
    var i = list.map(function (c) { return c.id; }).indexOf(id), cur = list[i];
    var bar = document.getElementById('ltmBar');
    bar.innerHTML = '<a class="ltm-home" href="./">Lighting the Music</a><span class="ltm-where">' + esc(label(cur)) + '</span>' +
      (cur.ko ? '<a class="ltm-lang" href="' + cur.ko + '" lang="ko" hreflang="ko">한국어</a>' : '') +
      '<button type="button" class="ltm-btn" data-toc>Contents</button>';
    function side(c, dir) {
      if (!c) return '<span class="ltm-pb empty"></span>';
      var txt = '<small>' + (dir === 'prev' ? '← Previous' : 'Next →') + '</small><b>' + esc(label(c)) + '</b>';
      return c.file ? '<a class="ltm-pb ' + dir + '" href="' + c.file + '">' + txt + '</a>'
                    : '<span class="ltm-pb ' + dir + ' soon">' + txt + '<i>coming soon</i></span>';
    }
    document.getElementById('ltmPager').innerHTML = side(list[i - 1], 'prev') + side(list[i + 1], 'next');
    LTM_drawer(id);
    /* Note under each embedded tool: the tool UI is still Korean */
    Array.prototype.forEach.call(document.querySelectorAll('#article-view .web-desc'), function (p) {
      var box = p.closest('.web'), fr = box && box.querySelector('iframe');
      if (fr && /\/en\/tools\//.test(fr.getAttribute('src') || '')) return;
      p.insertAdjacentHTML('afterend', '<p class="ltm-ko-note">The tool’s screens are in Korean for now. An English version is in progress.</p>');
    });
  };

  /* Embedded tools report their height; resize the matching iframe */
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://jjjh7401.github.io' || !e.data || typeof e.data.lxh !== 'number') return;
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (f) {
      if (f.contentWindow === e.source) f.style.setProperty('--h', Math.ceil(e.data.lxh) + 'px');
    });
  });
})();
