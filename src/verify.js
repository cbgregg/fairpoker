/* ---------- verification ---------- */
let modalEntry = null;
function openVerify(entry){
  modalEntry = entry || null;
  $('#mTitle').textContent = entry ? `Verify hand #${entry.nonce}` : 'Verify a seed';
  $('#v-server').value = entry ? entry.serverSeed : '';
  $('#v-commit').value = entry ? entry.commitment : '';
  $('#v-client').value = entry ? entry.clientSeed : (G ? G.clientSeed : '');
  $('#v-nonce').value = entry ? entry.nonce : 1;
  $('#vChecks').innerHTML = ''; $('#vDeck').innerHTML = '';
  $('#modal').hidden = false;
  $('#mClose').focus();
  if (entry) runVerify();
}
async function runVerify(){
  const server = $('#v-server').value.trim(), commit = $('#v-commit').value.trim().toLowerCase();
  const client = $('#v-client').value, nonce = parseInt($('#v-nonce').value, 10);
  if (!server || !Number.isFinite(nonce)){ $('#vChecks').innerHTML = '<li><span class="no">!</span>Enter a server seed and a hand number to recompute.</li>'; return; }
  const hash = await sha256Hex(server);
  const deck = await shuffleDeck(server, client, nonce);
  const rows = [];
  if (commit) rows.push(hash === commit
    ? `<li><span class="ok">✓</span><span>SHA-256 of the server seed matches the commitment shown before the deal.</span></li>`
    : `<li><span class="no">✗</span><span>Fingerprint mismatch. Computed <span class="mono" style="word-break:break-all">${hash}</span></span></li>`);
  else rows.push(`<li><span class="ok">#</span><span>Fingerprint: <span class="mono" style="word-break:break-all">${hash}</span></span></li>`);
  const used = new Map();
  const entry = modalEntry && modalEntry.serverSeed === server && modalEntry.clientSeed === client && modalEntry.nonce === nonce ? modalEntry : null;
  if (entry){
    const bad = entry.dealt.filter(d => deck[d.idx] !== d.card);
    rows.push(bad.length
      ? `<li><span class="no">✗</span><span>${bad.length} dealt card(s) do not match the recomputed deck.</span></li>`
      : `<li><span class="ok">✓</span><span>All ${entry.dealt.length} dealt cards (every hole card and the board) sit at their recomputed deck positions.</span></li>`);
    entry.dealt.forEach(d => used.set(d.idx, d.who));
  }
  $('#vChecks').innerHTML = rows.join('');
  $('#vDeck').innerHTML = `<div class="hint">Recomputed deck order${entry ? ', dealt cards outlined' : ''}. Hover a card for its position.</div>
    <div class="deckgrid">${deck.map((c, i) => `<span class="${(c&3) === 1 || (c&3) === 2 ? 'red' : ''} ${used.has(i) ? 'used' : ''}" title="#${i}${used.has(i) ? ' · ' + esc(used.get(i)) : ''}">${cardShort(c)}</span>`).join('')}</div>`;
}

