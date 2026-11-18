/* Finale: chat bubbles → tap the gift → a cake rises → hold to make a wish →
   tap the candles to blow them out (one by one, or all at once) → confetti + "Happy Birthday".
   Usage: Finale.open({ bg: 'backdrop.webp', charDir: 'assets/characters/', onReplay() {} }) */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 150) : ms));
  const anim = (el, frames, opts) => el.animate(frames, { fill: 'forwards', ...opts }).finished.catch(() => {});

  /* ---------- copy (edit the words here) ---------- */
  const TEXT = {
    wishTitle: 'Make a wish',
    wishMsg:   'Press and hold, close your eyes, and make a wish',
    wishDone:  'May every wish come true',
    blowTitle: 'Blow out the candles!',
    blowMsg:   'Tap each candle, or blow them all out at once',
    blowAll:   'Blow them all out',
    endTitle:  'Happy Birthday',
    // the closing: the knight bows and says this (each item is a line; words drift in one by one)
    knightSays: [
      'Happy birthday, Princess.',
      'May all your wishes come true.',
    ],
    replay:    'Read again',
  };

  /* ---------- the gift (SVG, lid animates separately) ---------- */
  const GIFT_SVG = `
  <svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="gBoxF" x1="0" x2="1"><stop offset="0" stop-color="#fbf1e1"/><stop offset=".7" stop-color="#f6e6cf"/><stop offset="1" stop-color="#e9d2b2"/></linearGradient>
      <linearGradient id="gRib" x1="0" x2="1"><stop offset="0" stop-color="#e46e64"/><stop offset=".5" stop-color="#f08a7f"/><stop offset="1" stop-color="#cf5248"/></linearGradient>
    </defs>
    <g stroke="#9a6650" stroke-width="2" stroke-linejoin="round">
      <g class="g-box">
        <rect x="42" y="98" width="116" height="84" rx="7" fill="url(#gBoxF)"/>
        <rect x="89" y="98" width="22" height="84" fill="url(#gRib)"/>
        <rect x="48" y="104" width="7" height="70" rx="3.5" fill="#fff" opacity=".45" stroke="none"/>
      </g>
      <g class="g-lid">
        <path d="M100 76 C 84 40, 50 48, 59 70 C 65 83, 88 81, 100 76 Z" fill="url(#gRib)"/>
        <path d="M100 76 C 116 40, 150 48, 141 70 C 135 83, 112 81, 100 76 Z" fill="url(#gRib)"/>
        <path d="M70 66 C 74 58, 84 56, 92 64" stroke="#fff" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>
        <rect x="34" y="76" width="132" height="27" rx="7" fill="#fdf5e9"/>
        <rect x="89" y="76" width="22" height="27" fill="url(#gRib)"/>
        <circle cx="100" cy="75" r="9" fill="#d65a50"/>
      </g>
    </g>
  </svg>`;

  /* ---------- the cake: two round tiers, drips, strawberries, pastel candles ---------- */
  const CAKE = (() => {
    const ellY = (cx, cy, rx, ry, x) => cy + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    const frontArc = (cx, cy, rx, ry) => `M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`;
    const drips = (cx, cy, rx, ry, xs, lens, w, fill) => xs.map((x, i) => {
      const y = ellY(cx, cy, rx, ry, x) - 3, L = lens[i % lens.length];
      return `<path d="M${x - w} ${y} v${L} a${w} ${w} 0 0 0 ${2 * w} 0 v${-L} Z" fill="${fill}"/>`;
    }).join('');
    const range = (a, b, step) => { const r = []; for (let x = a; x <= b; x += step) r.push(x); return r; };
    const berry = (x, y, s) => `
      <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})">
        <path d="M0 -8 C 7 -8 9 1 0 10 C -9 1 -7 -8 0 -8Z" fill="url(#gBerry)" stroke="#b5463f" stroke-width="1"/>
        <g fill="#ffeeb0" stroke="none"><circle cx="-2.6" cy="-1" r=".9"/><circle cx="2.6" cy="0" r=".9"/><circle cx="0" cy="4" r=".9"/><circle cx="-.8" cy="-4.2" r=".8"/><circle cx="3" cy="-4" r=".7"/></g>
        <path d="M-5.5 -8 Q0 -4 5.5 -8 Q2.5 -11.5 0 -9.2 Q-2.5 -11.5 -5.5 -8Z" fill="#86c46f" stroke="#5f9a4c" stroke-width=".8"/>
        <ellipse cx="-2.6" cy="-3.5" rx="1.5" ry="2.6" fill="#fff" opacity=".35" stroke="none"/>
      </g>`;
    const dollop = (x, y) => `
      <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <ellipse cx="0" cy="0" rx="7.5" ry="5" fill="#fffaf2" stroke="#e3cdb6" stroke-width="1"/>
        <ellipse cx="0" cy="-3.5" rx="5" ry="3.6" fill="#fffaf2" stroke="#e3cdb6" stroke-width="1"/>
        <path d="M0 -9 q2 1 1 3.5" fill="#fffaf2" stroke="#e3cdb6" stroke-width="1"/>
        <ellipse cx="-2" cy="-4.5" rx="1.6" ry="1" fill="#fff" stroke="none"/>
      </g>`;
    const SPRINKLES = [[46,166,30,'#f6d77a'],[70,178,-25,'#a9c6e8'],[96,170,50,'#c5b3ec'],[150,176,-40,'#f6d77a'],
      [176,166,20,'#b5e3c0'],[196,178,-15,'#f3a7b5'],[124,186,35,'#a9c6e8'],[58,186,-50,'#f3a7b5'],[184,188,40,'#c5b3ec']];
    // candles: x, base y on the top tier (bigger y = nearer the front), colour
    const CANDLES = [[108, 89, '#a9d0f0'], [132, 89, '#c5b3ec'], [96, 97, '#f7b3c2'], [120, 95, '#ffe08a'], [144, 97, '#b5e3c0']];
    const H = 28;
    const candle = ([x, b, c]) => `
      <ellipse cx="${x}" cy="${b}" rx="5.5" ry="2.4" fill="#fffaf2" stroke="#e3cdb6" stroke-width=".8"/>
      <rect x="${x - 3.2}" y="${b - H}" width="6.4" height="${H}" rx="2" fill="${c}" stroke="#b98a77" stroke-width="1"/>
      <path d="M${x - 3.2} ${b - 21} l6.4 -3.4 M${x - 3.2} ${b - 13} l6.4 -3.4 M${x - 3.2} ${b - 5} l6.4 -3.4" stroke="#fff" stroke-width="2" opacity=".9"/>
      <path d="M${x} ${b - H} v-5" stroke="#4a3426" stroke-width="1.6" stroke-linecap="round"/>`;
    const berries = [.35, .95, 1.6, 2.2, 2.8].map(t => berry(120 + 78 * Math.cos(t), 141 + 13.5 * Math.sin(t), 1.15)).join('');
    const dollops = [.65, 1.28, 1.92, 2.5].map(t => dollop(120 + 78 * Math.cos(t), 143 + 13.5 * Math.sin(t))).join('');
    const svg = `
    <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <linearGradient id="gPink" x1="0" x2="1"><stop offset="0" stop-color="#eaa7aa"/><stop offset=".22" stop-color="#fbd2d0"/><stop offset=".55" stop-color="#f8c6c5"/><stop offset="1" stop-color="#e29ea2"/></linearGradient>
        <linearGradient id="gCream" x1="0" x2="1"><stop offset="0" stop-color="#ecd7bb"/><stop offset=".25" stop-color="#fff7ea"/><stop offset=".6" stop-color="#fbeedb"/><stop offset="1" stop-color="#e6cfae"/></linearGradient>
        <radialGradient id="gTop" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f7e9d6"/></radialGradient>
        <radialGradient id="gTopPink" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fde3e6"/><stop offset="1" stop-color="#f6b9c2"/></radialGradient>
        <radialGradient id="gPlate" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6e2ec"/></radialGradient>
        <radialGradient id="gBerry" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#ff9a8f"/><stop offset=".6" stop-color="#e5544b"/><stop offset="1" stop-color="#c63f37"/></radialGradient>
      </defs>
      <g stroke="#c4927f" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
        <!-- plate -->
        <ellipse cx="120" cy="198" rx="114" ry="23" fill="url(#gPlate)" stroke="#cfc6d6"/>
        <ellipse cx="120" cy="196" rx="98" ry="17" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
        <!-- bottom tier: strawberry sponge with cream on top -->
        <path d="M28 141 V188 A92 18 0 0 0 212 188 V141 Z" fill="url(#gPink)"/>
        <rect x="38" y="152" width="8" height="38" rx="4" fill="#fff" opacity=".35" stroke="none"/>
        <g stroke="none">${SPRINKLES.map(([x, y, r, c]) => `<rect x="${x - 3.5}" y="${y - 1.2}" width="7" height="2.4" rx="1.2" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>
        <ellipse cx="120" cy="141" rx="92" ry="18" fill="url(#gTop)"/>
        <g stroke="none">${drips(120, 141, 92, 18, range(34, 206, 15), [9, 15, 6, 12, 18, 8, 13, 10, 16, 7, 12, 9], 5.2, '#fffaf3')}</g>
        <path d="${frontArc(120, 141, 92, 18)}" fill="none" stroke="#fffaf3" stroke-width="7"/>
        <!-- top tier: vanilla with pink glaze -->
        <path d="M66 93 V139 A54 11 0 0 0 174 139 V93 Z" fill="url(#gCream)"/>
        <rect x="73" y="104" width="6" height="32" rx="3" fill="#fff" opacity=".45" stroke="none"/>
        <ellipse cx="120" cy="93" rx="54" ry="11" fill="url(#gTopPink)"/>
        <g stroke="none">${drips(120, 93, 54, 11, range(70, 170, 11), [7, 12, 5, 10, 14, 6, 9, 11, 8, 13], 4.2, '#f6b3bd')}</g>
        <path d="${frontArc(120, 93, 54, 11)}" fill="none" stroke="#f6b3bd" stroke-width="5"/>
        <ellipse cx="104" cy="90" rx="16" ry="3.2" fill="#fff" opacity=".45" stroke="none"/>
        ${dollops}
        ${berries}
        ${CANDLES.map(candle).join('')}
      </g>
    </svg>`;
    // where each flame sits (percent of the cake box)
    const wicks = CANDLES.map(([x, b]) => ({ x: x / 240 * 100, y: (b - H - 5) / 240 * 100, z: b }));
    return { svg, wicks };
  })();

  const STAR = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="currentColor" d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg>';
  const HEART = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';

  /* ---------- DOM ---------- */
  let root, els, opts, running = 0, state = 'idle';
  function build() {
    root = document.createElement('div');
    root.className = 'finale';
    root.hidden = true;
    root.innerHTML = `
      <div class="f-bg"><img alt=""></div>
      <div class="f-dim"></div>
      <div class="f-light"></div>
      <div class="f-wishveil"></div>
      <canvas class="f-confetti"></canvas>
      <div class="f-stage">
        <div class="f-gift" role="button" aria-label="Open the gift">${GIFT_SVG}<div class="f-rays"></div></div>
        <div class="f-cake">${CAKE.svg}</div>
        <div class="f-kwrap">
          <img class="f-knight" alt="" draggable="false">
        </div>
      </div>
      <div class="f-ui">
        <h2 class="f-title"></h2>
        <p class="f-sub"></p>
        <p class="f-msg"></p>
        <div class="f-speech" aria-live="polite"></div>
        <button class="f-hold" hidden aria-label="Press and hold to make a wish">
          <svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="45"/><circle class="prog" cx="50" cy="50" r="45" stroke-dasharray="283" stroke-dashoffset="283"/></svg>🙏
        </button>
        <button class="f-btn f-blowall" hidden></button>
        <button class="f-btn solid f-replay" hidden></button>
        <p class="f-note"></p>
      </div>`;
    document.querySelector('.page').appendChild(root);
    const q = s => root.querySelector(s);
    els = {
      bg: q('.f-bg img'), gift: q('.f-gift'), lid: q('.g-lid'), box: q('.g-box'), rays: q('.f-rays'),
      cake: q('.f-cake'), knight: q('.f-knight'), kwrap: q('.f-kwrap'), speech: q('.f-speech'), title: q('.f-title'), sub: q('.f-sub'),
      msg: q('.f-msg'), hold: q('.f-hold'), prog: q('.f-hold .prog'), blowAll: q('.f-blowall'),
      replay: q('.f-replay'), note: q('.f-note'), canvas: q('.f-confetti'),
    };
    els.blowAll.textContent = TEXT.blowAll;
    els.replay.textContent = TEXT.replay;
    // flames sit on each wick; back candles first so front ones overlap them
    els.flames = CAKE.wicks.map((w, i) => {
      const f = document.createElement('button');
      f.className = 'flame unlit';
      f.setAttribute('aria-label', 'Blow out candle ' + (i + 1));
      f.style.left = w.x + '%';
      f.style.top = w.y + '%';
      f.style.zIndex = w.z;
      f.innerHTML = '<div class="flame-in"></div>';
      f.addEventListener('click', () => { if (state === 'blow') extinguish(i); });
      els.cake.appendChild(f);
      return f;
    });
    els.blowAll.addEventListener('click', blowAll);
    els.replay.addEventListener('click', () => { close(); opts.onReplay && opts.onReplay(); });
    els.knight.addEventListener('click', () => {
      els.knight.classList.remove('jump'); void els.knight.offsetWidth; els.knight.classList.add('jump');
      hearts(els.knight);
    });
    els.knight.addEventListener('animationend', e => { if (e.animationName === 'kJump') els.knight.classList.remove('jump'); });
    setupHold();
  }

  /* ---------- helpers ---------- */
  function say(el, text, step = .05) {
    el.innerHTML = '';
    if (!text) return;
    text.split(/(\s+)/).forEach((w, n) => {
      const s = document.createElement('span');
      s.textContent = w;
      s.style.animationDelay = (reduced ? 0 : n * step) + 's';
      el.appendChild(s);
    });
  }
  function centerOf(el) {
    const r = el.getBoundingClientRect(), p = root.getBoundingClientRect();
    return { x: r.left - p.left + r.width / 2, y: r.top - p.top + r.height / 2, r, p };
  }
  function burstAt(x, y, n = 14, palette = ['#ffd36e', '#fff1b8', '#ef8fa2']) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'burst';
      const isHeart = Math.random() < .3;
      b.innerHTML = isHeart ? HEART : STAR;
      b.style.color = isHeart ? '#ef8fa2' : palette[i % palette.length];
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.style.setProperty('--dx', Math.cos(a) * d + 'px');
      b.style.setProperty('--dy', Math.sin(a) * d + 'px');
      const sz = 10 + Math.random() * 14;
      b.style.width = b.style.height = sz + 'px';
      root.appendChild(b);
      b.addEventListener('animationend', () => b.remove());
    }
  }
  function hearts(el) {
    const c = centerOf(el);
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.innerHTML = HEART;
      h.style.left = (c.r.left - c.p.left + c.r.width * (.3 + Math.random() * .4)) + 'px';
      h.style.top = (c.r.top - c.p.top + c.r.height * .1) + 'px';
      h.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px');
      h.style.setProperty('--rot', (Math.random() * 40 - 20) + 'deg');
      h.style.animationDelay = (i * .08) + 's';
      root.appendChild(h);
      h.addEventListener('animationend', () => h.remove());
    }
  }

  /* ---------- the knight speaks: words drift in one by one, line after line, then stay ---------- */
  async function speak(lines, run) {
    if (run !== running) return;
    els.speech.innerHTML = '';
    els.speech.classList.add('show');
    let n = 0;
    for (const line of lines) {
      const row = document.createElement('div');
      line.split(' ').forEach((w, i) => {
        if (i) row.appendChild(document.createTextNode(' '));
        const s = document.createElement('span');
        s.textContent = w;
        s.style.animationDelay = (reduced ? 0 : .15 + n++ * .16) + 's';
        row.appendChild(s);
      });
      n += 2;   // a short pause between lines
      els.speech.appendChild(row);
    }
    await wait(600 + n * 160);
  }

  /* ---------- confetti (small canvas system) ---------- */
  const COLORS = ['#f3a7b5', '#ffd36e', '#a9c6e8', '#c9b3e6', '#fff1d6', '#e0665b', '#b5d69a'];
  let parts = [], rafC = 0;
  function confetti(n, x, y, spread = Math.PI * .9, power = 900) {
    if (reduced) return;
    const cv = els.canvas, dpr = Math.min(2, devicePixelRatio || 1);
    const W = root.clientWidth, H = root.clientHeight;
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * spread, v = power * (.45 + Math.random() * .6);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - .5) * 14,
        w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, c: COLORS[i % COLORS.length], t: 0, life: 2.6 + Math.random() * 1.4,
        round: Math.random() < .3 });
    }
    if (!rafC) { let last = performance.now(); rafC = requestAnimationFrame(function step(now) {
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(p => (p.t += dt) < p.life);
      for (const p of parts) {
        p.vy += 1100 * dt; p.vx *= .985; p.vy *= .985;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save(); ctx.globalAlpha = Math.min(1, (p.life - p.t) * 1.5);
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h * .7, 0, 7); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.3)) + .8);
        ctx.restore();
      }
      rafC = parts.length ? requestAnimationFrame(step) : 0;
      if (!rafC) ctx.clearRect(0, 0, W, H);
    }); }
  }

  /* ---------- flow ---------- */
  async function open(o) {
    opts = { charDir: 'assets/characters/', ...(o || {}) };
    if (!root) build();
    const run = ++running;
    reset();
    els.bg.src = opts.bg || '';
    els.knight.src = opts.charDir + 'bow.webp';
    root.hidden = false;
    anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });

    // 1) she already tapped the gift on the last page: it comes forward and opens straight away
    state = 'gift';
    await anim(els.gift, [{ transform: 'translateY(40%) scale(.3)', opacity: 0 },
                          { transform: 'translateY(-4%) scale(1.06)', opacity: 1, offset: .7 },
                          { transform: 'none', opacity: 1 }], { duration: 750, easing: 'cubic-bezier(.3,.8,.4,1)' });
    await wait(250);
    if (run !== running) return;
    await anim(els.gift, [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg) scale(1.04)' }, { transform: 'rotate(6deg) scale(1.04)' }, { transform: 'rotate(0)' }],
      { duration: 360, easing: 'ease-in-out', fill: 'none' });

    const gc = centerOf(els.gift);
    anim(els.lid, [{ transform: 'none', opacity: 1 }, { transform: 'translate(-30%, -160%) rotate(-38deg)', opacity: 0 }],
      { duration: 800, easing: 'cubic-bezier(.2,.7,.4,1)' });
    anim(els.rays, [{ transform: 'translate(-50%,-50%) scale(.2) rotate(0)', opacity: 0 },
                    { transform: 'translate(-50%,-50%) scale(1) rotate(25deg)', opacity: 1, offset: .4 },
                    { transform: 'translate(-50%,-50%) scale(1.25) rotate(45deg)', opacity: 0 }], { duration: 1800, easing: 'ease-out' });
    burstAt(gc.x, gc.y - gc.r.height * .1, 16);
    confetti(70, gc.x, gc.y, Math.PI * .7, 700);
    await wait(450);
    anim(els.box, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(30%) scale(.9)', opacity: 0 }], { duration: 700, easing: 'ease-in' });
    await anim(els.cake, [{ transform: 'translateY(35%) scale(.55)', opacity: 0 },
                          { transform: 'translateY(-3%) scale(1.04)', opacity: 1, offset: .75 },
                          { transform: 'none', opacity: 1 }], { duration: 1000, easing: 'cubic-bezier(.3,.8,.4,1)' });
    if (run !== running) return;

    // evening falls, candles light one by one
    root.classList.add('dark');
    root.style.setProperty('--light', 0);
    await wait(500);
    for (const [i, f] of els.flames.entries()) {
      f.classList.remove('unlit'); f.classList.add('lit-in');
      root.style.setProperty('--light', (i + 1) / els.flames.length);
      await wait(260);
    }
    if (run !== running) return;

    // 3) make a wish
    state = 'wish';
    say(els.title, TEXT.wishTitle);
    say(els.msg, TEXT.wishMsg);
    els.hold.hidden = false;
  }

  /* ---------- hold to wish ---------- */
  function setupHold() {
    const DUR = 2600, C = 283;
    let start = 0, raf = 0, done = false;
    const setP = v => {
      els.prog.style.strokeDashoffset = C * (1 - v);
      root.style.setProperty('--veil', v * .9);
    };
    const tick = now => {
      const v = Math.min(1, (now - start) / DUR);
      setP(v);
      if (v >= 1) { finish(); return; }
      raf = requestAnimationFrame(tick);
    };
    const down = e => {
      if (state !== 'wish' || done) return;
      e.preventDefault();
      els.hold.classList.add('holding');
      root.classList.add('wishing');
      start = performance.now();
      raf = requestAnimationFrame(tick);
      if (els.hold.setPointerCapture && e.pointerId != null) try { els.hold.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const up = () => {
      if (done || !start) return;
      cancelAnimationFrame(raf); start = 0;
      els.hold.classList.remove('holding');
      root.classList.remove('wishing');
      setP(0);
    };
    const finish = async () => {
      done = true;
      cancelAnimationFrame(raf);
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(30);
      els.hold.classList.remove('holding');
      els.hold.hidden = true;
      const c = centerOf(els.cake);
      burstAt(c.x, c.y - c.r.height * .3, 18, ['#ffd36e', '#fff1b8', '#c9b3e6']);
      root.style.setProperty('--veil', 0);
      say(els.title, '');
      say(els.msg, TEXT.wishDone);
      await wait(1400);
      root.classList.remove('wishing');
      startBlow();
    };
    els.hold.addEventListener('pointerdown', down);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => els.hold.addEventListener(t, up));
    els.hold.addEventListener('contextmenu', e => e.preventDefault());
    els.hold.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); });
    els.hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
    els.resetHold = () => { done = false; start = 0; cancelAnimationFrame(raf); setP(0); };
  }

  /* ---------- blow out the candles (tap) ---------- */
  function startBlow() {
    state = 'blow';
    say(els.title, TEXT.blowTitle);
    say(els.msg, TEXT.blowMsg);
    els.blowAll.hidden = false;
    els.flames.forEach(f => f.classList.add('tappable'));
  }
  async function blowAll() {
    if (state !== 'blow') return;
    els.blowAll.hidden = true;
    // a gust sweeps across: every flame leans, then they go out left to right
    els.flames.forEach(f => f.classList.add('gust'));
    await wait(260);
    const order = els.flames.map((f, i) => i).sort((a, b) => parseFloat(els.flames[a].style.left) - parseFloat(els.flames[b].style.left));
    for (const i of order) {
      if (!els.flames[i].classList.contains('out')) { extinguish(i); await wait(110); }
    }
  }
  function extinguish(i) {
    const f = els.flames[i];
    if (!f || f.classList.contains('out')) return;
    f.classList.remove('tappable');
    f.classList.add('out');
    const left = els.flames.filter(x => !x.classList.contains('out')).length;
    root.style.setProperty('--light', left / els.flames.length);
    for (let k = 0; k < 3; k++) {
      const s = document.createElement('div');
      s.className = 'smoke';
      s.style.left = f.style.left; s.style.top = `calc(${f.style.top} - 2%)`;
      s.style.setProperty('--dx', (Math.random() * 30 - 10) + 'px');
      s.style.animationDelay = (k * .15) + 's';
      els.cake.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
    if (left === 0) celebrate();
  }

  /* ---------- celebrate ---------- */
  async function celebrate() {
    if (state === 'end') return;
    state = 'end';
    const run = running;
    els.blowAll.hidden = true;
    say(els.title, '');
    say(els.msg, '');
    await wait(700);
    if (run !== running) return;
    root.classList.remove('dark');
    root.classList.add('end');
    const W = root.clientWidth, H = root.clientHeight;
    confetti(120, W * .2, H * .62, Math.PI * .55, 1050);
    confetti(120, W * .8, H * .62, Math.PI * .55, 1050);
    anim(els.cake, [{ transform: 'none' }, { transform: 'translateY(-6%) scale(1.05)' }, { transform: 'none' }], { duration: 600, easing: 'ease-out' });
    say(els.title, TEXT.endTitle, .12);
    await wait(2600);
    if (run !== running) return;

    // closing scene: the cake and title fade away, the knight stands alone, bows, and speaks
    anim(els.title, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    await anim(els.cake, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6%) scale(.92)' }], { duration: 700, easing: 'ease-in' });
    if (run !== running) return;
    say(els.title, '');   // free the space at the bottom for the knight's words
    els.kwrap.classList.add('solo');
    els.knight.classList.add('show');
    await wait(900);
    await speak(TEXT.knightSays, run);
    if (run !== running) return;
    confetti(90, W * .5, H * .1, Math.PI * 2, 380);
    els.replay.hidden = false;
  }

  /* ---------- reset / close ---------- */
  function reset() {
    state = 'idle';
    root.classList.remove('dark', 'wishing', 'end');
    root.style.setProperty('--light', 0);
    root.style.setProperty('--veil', 0);
    [els.gift, els.lid, els.box, els.cake, els.rays, els.title].forEach(e => e.getAnimations().forEach(a => a.cancel()));
    els.kwrap.classList.remove('solo');
    els.speech.classList.remove('show');
    els.speech.textContent = '';
    els.flames.forEach(f => { f.className = 'flame unlit'; });
    els.knight.classList.remove('show', 'jump');
    els.hold.hidden = els.blowAll.hidden = els.replay.hidden = true;
    [els.title, els.sub, els.msg].forEach(e => e.innerHTML = '');
    els.note.textContent = '';
    els.resetHold && els.resetHold();
    parts = [];
  }
  function close() {
    running++;
    if (!root) return;
    reset();
    root.hidden = true;
  }

  window.Finale = { open, close };
})();
