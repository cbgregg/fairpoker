/* =====================================================================
   FLAT THEMES — drawn as screens, not as a 3D room
   cli    : a green-phosphor terminal. No audio; table talk scrolls by as text.
   vpoker : a casino video poker cabinet. Paytable lights up your hand; machine dings.
   ===================================================================== */
const SUIT_CH = ['♠', '♥', '♦', '♣'];
const cliCard = c => c == null ? '??' : (RANKS[c >> 2] === '10' ? 'T' : RANKS[c >> 2]) + SUIT_CH[c & 3];
const isRed = c => c != null && ((c & 3) === 1 || (c & 3) === 2);
// everything that happens, as lines of text: the game log and the table talk
const CLI_LOG = [];
function cliPush(kind, text, who){
  CLI_LOG.push({ kind, text, who, t:performance.now() });
  if (CLI_LOG.length > 120) CLI_LOG.shift();
}
const HAND_ROWS = ['ROYAL FLUSH', 'STRAIGHT FLUSH', 'FOUR OF A KIND', 'FULL HOUSE', 'FLUSH', 'STRAIGHT', 'THREE OF A KIND', 'TWO PAIR', 'ONE PAIR', 'HIGH CARD'];
function heroHandRow(){
  const h = H, p = me();
  if (!h || !p.hole.length || !(h.heroFlip >= 1) || p.folded) return -1;
  if (!h.board.length) return p.hole[0] >> 2 === p.hole[1] >> 2 ? 8 : 9;
  const e = evaluate([...p.hole, ...h.board]);
  return e.cat === 8 && e.vals[0] === 12 ? 0 : 9 - e.cat;
}
function tableFacts(){
  const h = H, p = me();
  const seats = G.players.map((q, i) => {
    const active = !!(h && !h.done && h.toAct === i && needsAction(q));
    const b = seatBadge(q, i, active);
    return { i, name:i ? q.name : 'YOU', stack:q.chips - (q.carry || 0), bet:q.bet || 0, status:b ? b[0] : '', kind:b ? b[1] : '', active,
      folded:!!(h && q.folded && !h.done), out:q.chips <= 0 && !(h && q.inHand && !h.done), button:G.button === i };
  });
  const pot = h ? potAll() : 0, toCall = h && !h.done ? Math.max(0, Math.min(h.currentBet - p.bet, p.chips)) : 0;
  const street = !h ? '' : h.done ? 'HAND OVER' : ['PRE-FLOP', 'FLOP', 'TURN', 'RIVER'][h.street] || '';
  return { seats, pot, toCall, street, board:h && !h.boardGone ? h.board : [], flips:h ? h.boardFlip : [], hole:p.hole, up:!!(h && h.heroFlip >= 1), eq:eqCache.val };
}

/* ---------- terminal ---------- */
const CLI = { fg:'#5dff7f', dim:'#1f8a3c', hi:'#d8ffe0', amber:'#ffc23a', red:'#ff6d5a', bg:'#020603' };
function drawCli(g, t){
  const F = tableFacts(), narrow = CW < 560;
  const cols = narrow ? 44 : 78;
  g.fillStyle = CLI.bg; g.fillRect(0, 0, CW, CH);
  let fs = 20; g.font = `${fs}px VT323, "JetBrains Mono", ui-monospace, monospace`;
  const cw0 = g.measureText('M').width/fs;
  fs = Math.floor(Math.min((CW - 16)/(cols*cw0), 26)); g.font = `${fs}px VT323, "JetBrains Mono", ui-monospace, monospace`;
  const cw = g.measureText('M').width, lh = Math.round(fs*1.12), x0 = Math.round((CW - cols*cw)/2), y0 = 10;
  const rows = Math.floor((CH - y0*2)/lh);
  g.textBaseline = 'top'; g.textAlign = 'left';
  g.shadowColor = 'rgba(93,255,127,.55)'; g.shadowBlur = 6;
  const put = (c, r, s, col = CLI.fg) => { g.fillStyle = col; g.fillText(s, x0 + c*cw, y0 + r*lh); };
  const rule = r => put(0, r, '-'.repeat(cols), CLI.dim);
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n), lpad = (s, n) => (' '.repeat(n) + s).slice(-n);
  let r = 0;
  put(0, r, pad(`FAIRPOKER :: NLHE ${money(G.cfg.sb)}/${money(G.cfg.bb)}`, cols - 9), CLI.hi); put(cols - 9, r, lpad(`HAND ${H ? H.nonce : 0}`, 9), CLI.dim); r++;
  rule(r++);
  // board
  put(0, r, 'BOARD', CLI.dim);
  for (let k = 0; k < 5; k++){
    const c = F.board[k], shown = c != null && (F.flips[k] ?? 1) >= .5;
    const s = shown ? cliCard(c) : c != null ? '##' : '..';
    put(7 + k*5, r, '[', CLI.dim); put(8 + k*5, r, s, shown && isRed(c) ? CLI.red : shown ? CLI.hi : CLI.dim); put(10 + k*5, r, ']', CLI.dim);
  }
  if (narrow){ r++; put(0, r, F.street, CLI.amber); put(cols - 12, r, lpad('POT ' + money(F.pot), 12), CLI.amber); }
  else { put(34, r, F.street, CLI.amber); put(cols - 14, r, lpad('POT ' + money(F.pot), 14), CLI.amber); }
  r++;
  rule(r++);
  // seats
  put(0, r, narrow ? '  NAME      STACK   BET  ACTION' : '  SEAT  NAME        STACK     BET    ACTION', CLI.dim); r++;
  for (const s of F.seats){
    if (!s.i) continue;
    const col = s.out || s.folded ? CLI.dim : s.active ? CLI.amber : CLI.fg;
    const act = s.active ? (H && H.think ? 'THINKING' + '.'.repeat(1 + Math.floor(t/400) % 3) : 'TO ACT') : s.status.toUpperCase();
    const line = narrow
      ? `${s.active ? '>' : ' '}${s.button ? 'D' : ' '} ${pad(s.name, 7)}${lpad(money(s.stack), 7)}${lpad(s.bet ? money(s.bet) : '-', 6)}  ${act}`
      : `${s.active ? '>' : ' '}${s.button ? 'D' : ' '} ${lpad(String(s.i), 3)}   ${pad(s.name, 10)}${lpad(money(s.stack), 7)}${lpad(s.bet ? money(s.bet) : '-', 8)}    ${act}`;
    put(0, r++, pad(line, cols), col);
  }
  rule(r++);
  // you
  const you = F.seats[0], hand = heroHandRow() >= 0 ? HAND_ROWS[heroHandRow()] : '';
  put(0, r, `${you.active ? '>' : ' '}${you.button ? 'D' : ' '}YOU`, you.active ? CLI.amber : CLI.hi);
  F.hole.forEach((c, k) => { const s = F.up ? cliCard(c) : '##'; put(7 + k*5, r, '[', CLI.dim); put(8 + k*5, r, s, F.up && isRed(c) ? CLI.red : CLI.hi); put(10 + k*5, r, ']', CLI.dim); });
  put(18, r, pad(hand, cols - 30), CLI.amber); put(cols - 12, r, lpad(money(you.stack), 12), CLI.hi); r++;
  const eqs = F.eq != null && you && !you.folded ? `WIN ${Math.round(F.eq*100)}%` : '';
  const callS = F.toCall > 0 ? `TO CALL ${money(F.toCall)}` : (humanResolve ? 'CHECK IS FREE' : '');
  put(2, r, pad(callS, 24), CLI.fg); put(cols - 12, r, lpad(eqs, 12), CLI.fg); r++;
  rule(r++);
  // scrolling log: game events and table talk, newest at the bottom
  const room = rows - r - 1;
  const lines = [];
  for (let i = CLI_LOG.length - 1; i >= 0 && lines.length < room; i--){
    const e = CLI_LOG[i];
    const pre = e.kind === 'say' ? `${(e.who || '').toUpperCase()}: ` : '* ';
    const full = pre + e.text;
    const chunks = []; for (let s = 0; s < full.length; s += cols - 2) chunks.push(full.slice(s, s + cols - 2));
    for (let j = chunks.length - 1; j >= 0 && lines.length < room; j--) lines.unshift({ s:(j ? '  ' : '') + chunks[j], e, first:j === 0, len:full.length, off:j*(cols - 2) });
  }
  lines.forEach((L2, j) => {
    const e = L2.e, age = t - e.t, shown = Math.floor(age/14);                     // typewriter
    const vis = Math.max(0, Math.min(L2.s.length, shown - L2.off));
    put(0, r + j, L2.s.slice(0, vis), e.kind === 'say' ? CLI.hi : CLI.fg);
  });
  // prompt with a blinking cursor
  const pr = humanResolve ? '> YOUR MOVE: FOLD / ' + (F.toCall > 0 ? 'CALL' : 'CHECK') + ' / RAISE' : '> ';
  put(0, rows - 1, pr.slice(0, cols - 1), CLI.amber);
  if (Math.floor(t/500) % 2) { g.fillStyle = CLI.amber; g.fillRect(x0 + Math.min(pr.length, cols - 1)*cw, y0 + (rows - 1)*lh + 2, cw*.8, lh - 4); }
  g.shadowBlur = 0;
  // scanlines and a soft vignette
  g.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < CH; y += 3) g.fillRect(0, y, CW, 1);
  const vg = g.createRadialGradient(CW/2, CH/2, Math.min(CW, CH)*.3, CW/2, CH/2, Math.max(CW, CH)*.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, CW, CH);
}

/* ---------- video poker cabinet ---------- */
const VP = { bg0:'#0b2aa8', bg1:'#05124f', yellow:'#ffe24a', red:'#e8261c', white:'#ffffff', cyan:'#6ef0ff', dark:'#030a33' };
const VP_FONT = (s, w = '900') => `${w} ${s}px "Barlow Condensed","Arial Narrow",Impact,sans-serif`;
function vpText(g, s, x, y, size, col, align = 'center', stroke = true){
  g.font = VP_FONT(size); g.textAlign = align; g.textBaseline = 'middle';
  if (stroke){ g.lineWidth = Math.max(2, size*.16); g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y);
}
function drawVPoker(g, t){
  const F = tableFacts(), narrow = CW < 560;
  const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, VP.bg0); bg.addColorStop(1, VP.bg1);
  g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  const m = narrow ? 8 : 16, W = CW - m*2;
  let y = m;
  // paytable: your current hand lights up
  const row = heroHandRow(), ptH = narrow ? 15 : 18, cols2 = 2, perCol = 5, colW = W/cols2;
  g.fillStyle = VP.dark; g.fillRect(m, y, W, ptH*perCol + 10);
  g.strokeStyle = VP.yellow; g.lineWidth = 2; g.strokeRect(m + 1, y + 1, W - 2, ptH*perCol + 8);
  HAND_ROWS.forEach((name, i) => {
    const c = Math.floor(i/perCol), rr = i % perCol, x = m + c*colW, yy = y + 5 + rr*ptH;
    const lit = i === row;
    if (lit){ g.fillStyle = (Math.floor(t/350) % 2) ? VP.red : '#b51410'; g.fillRect(x + 4, yy, colW - 8, ptH); }
    vpText(g, name, x + 10, yy + ptH/2 + 1, ptH*.86, lit ? VP.white : VP.yellow, 'left', false);
  });
  y += ptH*perCol + 10 + (narrow ? 8 : 12);
  // opponents: one credit meter each
  const opp = F.seats.filter(s => s.i), per = narrow ? 4 : Math.min(7, opp.length), bw = W/per, bh = narrow ? 46 : 52;
  opp.forEach((s, j) => {
    const cx0 = m + (j % per)*bw, cy0 = y + Math.floor(j/per)*(bh + 6);
    g.fillStyle = s.active ? '#16349a' : VP.dark; g.fillRect(cx0 + 2, cy0, bw - 4, bh);
    g.strokeStyle = s.active && Math.floor(t/300) % 2 ? VP.yellow : s.folded || s.out ? '#22306a' : '#3a5ad8'; g.lineWidth = 2; g.strokeRect(cx0 + 3, cy0 + 1, bw - 6, bh - 2);
    vpText(g, (s.button ? '◉ ' : '') + s.name.toUpperCase(), cx0 + bw/2, cy0 + bh*.24, narrow ? 12 : 14, s.folded || s.out ? '#7c86b8' : VP.white, 'center', false);
    vpText(g, money(s.stack), cx0 + bw/2, cy0 + bh*.52, narrow ? 15 : 18, s.folded || s.out ? '#8a7a30' : VP.yellow, 'center', false);
    const st = s.active ? 'THINKING' : s.status.toUpperCase();
    vpText(g, st, cx0 + bw/2, cy0 + bh*.8, narrow ? 10 : 12, s.kind === 'fold' ? '#ff8a80' : VP.cyan, 'center', false);
  });
  y += Math.ceil(opp.length/per)*(bh + 6) + (narrow ? 6 : 10);
  // street banner + pot
  vpText(g, F.street || 'INSERT COIN', CW/2, y + 14, narrow ? 22 : 28, VP.yellow);
  y += narrow ? 32 : 40;
  // board: five big cards
  const mh0 = narrow ? 44 : 52, room = CH - y - (narrow ? 32 : 40) - 30 - mh0 - 14 - 34;      // leave space for meters, your cards and the marquee
  const gap = narrow ? 5 : 10, cwid = Math.max(30, Math.min((W - gap*4)/5, 110, room/(1.42*2.2))), chh = cwid*1.42, bx = CW/2 - (cwid*5 + gap*4)/2;
  const labels = ['FLOP', 'FLOP', 'FLOP', 'TURN', 'RIVER'];
  for (let k = 0; k < 5; k++){
    const x = bx + k*(cwid + gap), c = F.board[k], f = F.flips[k] ?? 1;
    vpText(g, labels[k], x + cwid/2, y + 8, narrow ? 12 : 15, c != null ? VP.yellow : '#4f63b8', 'center', false);
    const img = cardCanvas(c != null && f >= .5 ? c : null, cwid, 'modern');
    if (c == null){ g.globalAlpha = .25; }
    g.drawImage(img, x, y + 18, cwid, chh);
    g.globalAlpha = 1;
    if (c != null && H && H.highlight.has(c)){ g.strokeStyle = VP.yellow; g.lineWidth = 3; g.strokeRect(x - 2, y + 16, cwid + 4, chh + 4); }
  }
  y += chh + 30;
  // meters: pot, to call, credits
  const mw = W/3, mh = narrow ? 44 : 52;
  [['POT', money(F.pot)], ['TO CALL', F.toCall > 0 ? money(F.toCall) : '—'], ['CREDITS', money(F.seats[0].stack)]].forEach(([k, v], i) => {
    const x = m + i*mw;
    vpText(g, k, x + mw/2, y + 8, narrow ? 12 : 14, VP.yellow, 'center', false);
    g.fillStyle = '#000'; g.fillRect(x + 6, y + 18, mw - 12, mh - 18);
    g.shadowColor = VP.red; g.shadowBlur = 8;
    g.font = `700 ${narrow ? 20 : 24}px "JetBrains Mono", ui-monospace, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff3a2a';
    g.fillText(v, x + mw/2, y + 18 + (mh - 18)/2 + 1);
    g.shadowBlur = 0;
  });
  y += mh + (narrow ? 10 : 14);
  // your two cards
  const hw = Math.min(cwid*1.2, (CH - y - 34)/1.42, 130), hh = hw*1.42, hx = CW/2 - (hw*2 + gap)/2;
  if (hh > 40){
    F.hole.forEach((c, k) => {
      const img = cardCanvas(F.up ? c : null, hw, 'modern');
      g.drawImage(img, hx + k*(hw + gap), y, hw, hh);
      if (H && H.highlight.has(c)){ g.strokeStyle = VP.yellow; g.lineWidth = 3; g.strokeRect(hx + k*(hw + gap) - 2, y - 2, hw + 4, hh + 4); }
    });
    if (F.eq != null && F.up) vpText(g, `WIN ${Math.round(F.eq*100)}%`, hx + hw*2 + gap + 12, y + hh/2, narrow ? 16 : 20, VP.cyan, 'left');
    y += hh + 8;
  }
  // last thing said, as a marquee line
  const last = [...CLI_LOG].reverse().find(e => e.kind === 'say' && t - e.t < 6000);
  if (last && y < CH - 10) vpText(g, `${(last.who || '').toUpperCase()}: ${last.text}`.slice(0, narrow ? 46 : 90), CW/2, Math.min(y + 10, CH - 12), narrow ? 14 : 17, VP.white, 'center');
}
function drawFlatTheme(g, t){
  if (TH.key === 'cli') drawCli(g, t); else drawVPoker(g, t);
}
