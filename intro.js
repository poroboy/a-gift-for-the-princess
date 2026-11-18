/* Intro: a closed storybook tied with a satin band and a heart wax seal.
   Tap the seal → it cracks, the band falls away, the cover swings open, we zoom into the page
   and hand over to the story's cover page underneath.
   Usage: Intro.show({ bg: 'backdrop.webp', onReveal() { ...start the first page... } })
          Intro.back({ ... })  - play the opening in reverse and wait for the seal again */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 120) : ms));

  const TEXT = {
    t1: 'A Gift for the',
    t2: 'Princess',
    hint: 'Tap the seal to open',
    inner: 'Once upon a time…',
  };

  /* ---------- artwork ---------- */
  const GOLD_DEF = `<linearGradient id="inGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6e08f"/><stop offset=".45" stop-color="#c9963a"/>
      <stop offset=".7" stop-color="#f3d987"/><stop offset="1" stop-color="#b8862e"/></linearGradient>`;
  const CORNER = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs>${GOLD_DEF}</defs>
      <g fill="none" stroke="url(#inGold)" stroke-width="1.8" stroke-linecap="round">
        <path d="M3 37 V15 Q3 3 15 3 H37"/>
        <path d="M9 31 Q9 9 31 9"/>
        <path d="M15 3 Q19 11 11 15 Q5 17 3 15"/>
      </g>
      <circle cx="9" cy="9" r="2.6" fill="url(#inGold)"/>
    </svg>`;
  const CROWN = `<svg viewBox="0 0 60 40" aria-hidden="true"><defs>${GOLD_DEF}</defs>
      <path d="M6 32 L4 10 L17 21 L30 4 L43 21 L56 10 L54 32 Z" fill="url(#inGold)" stroke="#8a5c1d" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="6" y="31" width="48" height="6" rx="2" fill="url(#inGold)" stroke="#8a5c1d" stroke-width="1.2"/>
      <circle cx="30" cy="4" r="3" fill="#f7e7a8" stroke="#8a5c1d" stroke-width="1"/>
      <circle cx="4" cy="10" r="2.5" fill="#f7e7a8" stroke="#8a5c1d" stroke-width="1"/>
      <circle cx="56" cy="10" r="2.5" fill="#f7e7a8" stroke="#8a5c1d" stroke-width="1"/>
      <circle cx="30" cy="25" r="3.2" fill="#d94a5a" stroke="#8a5c1d" stroke-width="1"/>
    </svg>`;
  const RULE = `<svg viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true"><defs>${GOLD_DEF}</defs>
      <path d="M2 5 H48 M72 5 H118" stroke="url(#inGold)" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M60 0 L64 5 L60 10 L56 5 Z" fill="url(#inGold)"/>
      <circle cx="51" cy="5" r="1.6" fill="url(#inGold)"/><circle cx="69" cy="5" r="1.6" fill="url(#inGold)"/>
    </svg>`;
  // wax seal: a wobbly blob, two rings, an embossed heart; drawn twice and clipped along a crack
  const sealBlob = (() => {
    let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const n = 26, pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, r = 50 + (rnd() - .5) * 7;
      pts.push([60 + r * Math.cos(a), 60 + r * Math.sin(a)]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2].map(v => v.toFixed(1)).join(' ');
    let d = `M${mid(pts[n - 1], pts[0])}`;
    for (let i = 0; i < n; i++) d += ` Q${pts[i].map(v => v.toFixed(1)).join(' ')} ${mid(pts[i], pts[(i + 1) % n])}`;
    return d + 'Z';
  })();
  const SEAL_BODY = `
      <path d="${sealBlob}" fill="url(#sealG)"/>
      <circle cx="60" cy="60" r="37" fill="none" stroke="#6e141b" stroke-width="2.6" opacity=".65"/>
      <circle cx="60" cy="60" r="31" fill="none" stroke="#f08a8f" stroke-width="1" opacity=".35"/>
      <path d="M59 77 C 43 66 37 57 39 49 C 41 41 51 39 59 47 C 67 39 77 41 79 49 C 81 57 75 66 59 77 Z" fill="#f5a3a8" opacity=".5"/>
      <path d="M60 78 C 44 67 38 58 40 50 C 42 42 52 40 60 48 C 68 40 78 42 80 50 C 82 58 76 67 60 78 Z" fill="#741820"/>
      <ellipse cx="42" cy="38" rx="15" ry="7" fill="#fff" opacity=".2" transform="rotate(-35 42 38)"/>`;
  const SEAL = `<svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="sealG" cx=".38" cy=".32" r=".78">
          <stop offset="0" stop-color="#ee5961"/><stop offset=".55" stop-color="#b12630"/><stop offset="1" stop-color="#78161e"/>
        </radialGradient>
        <clipPath id="sealL"><polygon points="-10,-10 63,-10 56,24 67,47 54,70 65,94 58,130 -10,130"/></clipPath>
        <clipPath id="sealR"><polygon points="63,-10 130,-10 130,130 58,130 65,94 54,70 67,47 56,24"/></clipPath>
      </defs>
      <g class="seal-l" clip-path="url(#sealL)">${SEAL_BODY}</g>
      <g class="seal-r" clip-path="url(#sealR)">${SEAL_BODY}</g>
    </svg>`;
  const STAR = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="currentColor" d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg>';

  /* ---------- DOM ---------- */
  let root, els, onReveal = null;   // onReveal: called as the book fades and the story shows through
  function build() {
    root = document.createElement('div');
    root.className = 'intro';
    root.innerHTML = `
      <div class="in-bg"><img alt=""></div>
      <div class="in-glow"></div>
      <div class="book-wrap">
        <div class="book">
          <div class="book-pages"></div>
          <div class="book-inner"><p>${TEXT.inner}</p></div>
          <div class="book-cover">
            <div class="cover-face">
              <div class="cover-frame"></div>
              <div class="corner tl">${CORNER}</div><div class="corner tr">${CORNER}</div>
              <div class="corner bl">${CORNER}</div><div class="corner br">${CORNER}</div>
              <div class="cover-crown">${CROWN}</div>
              <div class="cover-title">
                <span class="t1 gold">${TEXT.t1}</span>
                <span class="t2 gold">${TEXT.t2}</span>
                <div class="cover-rule">${RULE}</div>
              </div>
            </div>
            <div class="cover-back"></div>
          </div>
          <div class="book-band"><i class="band-l"></i><i class="band-r"></i></div>
          <button class="seal" aria-label="Break the seal and open the book">${SEAL}</button>
          <div class="bookmark"></div>
        </div>
      </div>
      <p class="in-hint">${TEXT.hint}</p>`;
    document.querySelector('.page').appendChild(root);
    const q = s => root.querySelector(s);
    els = { bg: q('.in-bg img'), wrap: q('.book-wrap'), book: q('.book'), seal: q('.seal'),
            sealL: q('.seal-l'), sealR: q('.seal-r'), bandL: q('.band-l'), bandR: q('.band-r'),
            hint: q('.in-hint'), inner: q('.book-inner') };
    // a few gold sparkles drifting around the book
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      s.className = 'in-spark';
      s.innerHTML = STAR;
      s.style.left = (8 + Math.random() * 84) + '%';
      s.style.top = (10 + Math.random() * 75) + '%';
      const z = 6 + Math.random() * 9;
      s.style.width = s.style.height = z + 'px';
      s.style.animationDuration = (2.6 + Math.random() * 2.4) + 's';
      s.style.animationDelay = (-Math.random() * 4) + 's';
      root.insertBefore(s, els.wrap);
    }
  }

  function crumbs(cx, cy, n = 12) {
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'crumb';
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 60;
      c.style.left = cx + 'px'; c.style.top = cy + 'px';
      c.style.setProperty('--dx', Math.cos(a) * d + 'px');
      c.style.setProperty('--dy', (Math.sin(a) * d + 40) + 'px');
      const z = 3 + Math.random() * 5;
      c.style.width = c.style.height = z + 'px';
      root.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    }
  }
  function goldBurst(cx, cy, n = 16) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'burst';
      b.innerHTML = STAR;
      b.style.color = ['#ffe39a', '#fff4c8', '#f3c86a'][i % 3];
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
      b.style.left = cx + 'px'; b.style.top = cy + 'px';
      b.style.setProperty('--dx', Math.cos(a) * d + 'px');
      b.style.setProperty('--dy', Math.sin(a) * d + 'px');
      const z = 9 + Math.random() * 12;
      b.style.width = b.style.height = z + 'px';
      root.appendChild(b);
      b.addEventListener('animationend', () => b.remove());
    }
  }

  /* ---------- flow ---------- */
  // resolves once she has broken the seal and the book has opened into the story
  function waitForTap() {
    return new Promise(resolve => {
      const open = async () => {
        els.seal.removeEventListener('click', open);
        await breakSeal();
        await openBook();
        root.hidden = true;
        resolve();
      };
      els.seal.addEventListener('click', open);
    });
  }

  function show(opts = {}) {
    if (!root) build();
    reset();
    onReveal = opts.onReveal || null;
    els.bg.src = opts.bg || '';
    root.hidden = false;
    root.classList.remove('leaving');
    els.wrap.animate([{ opacity: 0, transform: 'translateY(30px) scale(.92)' }, { opacity: 1, transform: 'none' }],
      { duration: reduced ? 1 : 900, easing: 'cubic-bezier(.3,.8,.4,1)' });
    return waitForTap();
  }

  // going back from the story's cover page: the opening plays in reverse —
  // zoom out of the page, the cover closes, the ribbon and the seal come back
  async function back(opts = {}) {
    if (!root) build();
    reset();
    onReveal = opts.onReveal || null;
    if (opts.bg) els.bg.src = opts.bg;
    const cover = els.book.querySelector('.book-cover');
    const pieces = [els.seal, els.bandL, els.bandR];
    // start exactly where the opening ended: book open, zoomed in, invisible
    els.book.style.transition = cover.style.transition = 'none';
    els.book.classList.add('open');
    els.book.style.transform = 'translateX(-4%) scale(3.2)';
    els.book.style.opacity = '0';
    pieces.forEach(p => p.style.opacity = '0');
    els.hint.style.opacity = '0';
    els.wrap.style.animation = 'none';
    root.hidden = false;
    root.classList.remove('leaving');
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 1 : 450 });
    void els.book.offsetWidth;
    els.book.style.transition = cover.style.transition = '';
    els.book.style.transform = els.book.style.opacity = '';     // zoom back out
    await wait(1000);
    els.book.classList.remove('open');                          // the cover swings shut
    await wait(1300);
    const o = { duration: reduced ? 1 : 500, easing: 'cubic-bezier(.3,1.4,.5,1)' };
    els.bandL.animate([{ opacity: 0, transform: 'translateX(-30%)' }, { opacity: 1, transform: 'none' }], o);
    els.bandR.animate([{ opacity: 0, transform: 'translateX(30%)' }, { opacity: 1, transform: 'none' }], o);
    await wait(250);
    els.seal.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }],
      { duration: reduced ? 1 : 450, easing: 'cubic-bezier(.4,1.6,.6,1)' });   // stamped back on
    pieces.forEach(p => p.style.opacity = '');
    await wait(450);
    els.hint.style.opacity = '';
    els.wrap.style.animation = '';
    return waitForTap();
  }

  async function breakSeal() {
    const r = els.seal.getBoundingClientRect(), p = root.getBoundingClientRect();
    const cx = r.left - p.left + r.width / 2, cy = r.top - p.top + r.height / 2;
    els.hint.style.opacity = 0;
    els.seal.classList.add('broken');
    if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(20);
    // a tiny press, then the crack
    await els.seal.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(.9)' }, { transform: 'translate(-50%,-50%) scale(1.04)' }],
      { duration: reduced ? 1 : 260, easing: 'ease-out' }).finished.catch(() => {});
    crumbs(cx, cy);
    const opts = { duration: reduced ? 1 : 750, easing: 'cubic-bezier(.3,.6,.5,1)', fill: 'forwards' };
    els.sealL.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(-26px, 90px) rotate(-40deg)', opacity: 0 }], opts);
    els.sealR.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(26px, 96px) rotate(34deg)', opacity: 0 }], opts);
    await wait(180);
    const bandOpts = { duration: reduced ? 1 : 650, easing: 'cubic-bezier(.4,.1,.6,1)', fill: 'forwards' };
    els.bandL.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(-40%, 60px) rotate(-14deg)', opacity: 0 }], bandOpts);
    els.bandR.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(40%, 60px) rotate(14deg)', opacity: 0 }], bandOpts);
    await wait(520);
  }

  async function openBook() {
    els.wrap.style.animation = 'none';
    els.book.classList.add('open');           // the cover swings open (CSS 3D)
    await wait(650);
    const r = els.inner.getBoundingClientRect(), p = root.getBoundingClientRect();
    goldBurst(r.left - p.left + r.width / 2, r.top - p.top + r.height / 2);
    await wait(650);
    // fly into the page, then let the story's cover page show through
    els.book.style.transform = 'translateX(-4%) scale(3.2)';
    els.book.style.opacity = '0';
    root.classList.add('leaving');
    await wait(450);
    if (onReveal) onReveal();                // the story's words start as the book fades out
    await wait(800);
  }

  function reset() {
    if (!root) return;
    els.book.classList.remove('open');
    els.book.style.transform = els.book.style.opacity = '';
    els.wrap.style.animation = '';
    els.seal.classList.remove('broken');
    els.hint.style.opacity = '';
    [els.sealL, els.sealR, els.bandL, els.bandR].forEach(e => e.getAnimations().forEach(a => a.cancel()));
  }

  window.Intro = { show, back };
})();
