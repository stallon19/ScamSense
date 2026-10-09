// Practice Mode: chat with a simulated scammer, then see the score.
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = window.SS.esc, setLabel = window.SS.setLabel;
  var MAX = 8;
  var SCEN = [
    { id: 'internship', t: 'Fake internship', d: 'A recruiter offers a paid internship if you pay a small fee.' },
    { id: 'upi', t: 'UPI refund', d: 'A support agent says money was taken by mistake and needs your PIN to return it.' },
    { id: 'kyc', t: 'KYC call', d: 'A bank officer says your account will be blocked in two hours.' },
    { id: 'parcel', t: 'Parcel customs', d: 'A courier says your parcel is held and needs a fee to be released.' },
    { id: 'scholarship', t: 'Scholarship prize', d: 'A board says you won a scholarship, but you must pay first.' }
  ];
  var pickView = $('#pickView'), chatView = $('#chatView'), scoreView = $('#scoreView'), grid = $('#scenarios'),
      log = $('#log'), form = $('#form'), inp = $('#inp'), send = $('#send'), endBtn = $('#end'), restart = $('#restart'),
      err = $('#err'), turns = $('#turns'), title = $('#scnTitle');
  var scenario = null, history = [], busy = false, userCount = 0;

  grid.innerHTML = SCEN.map(function (s) {
    return '<button type="button" class="scn" data-id="' + s.id + '"><b>' + s.t + '</b><span>' + s.d + '</span></button>';
  }).join('');
  grid.addEventListener('click', function (e) { var b = e.target.closest('.scn'); if (b) start(b.dataset.id); });

  function show(view) {
    pickView.style.display = view === 'pick' ? '' : 'none';
    chatView.classList.toggle('show', view === 'chat');
    scoreView.classList.toggle('show', view === 'score');
    var head = document.querySelector('.page-head'); if (head) head.style.display = view === 'pick' ? '' : 'none';
    window.scrollTo({ top: 0, behavior: window.SS.reduce ? 'auto' : 'smooth' });
  }
  function showErr(m, retry) {
    err.innerHTML = esc(m) + (retry ? ' <button type="button" class="link-btn" id="retry" data-noroll>Try again</button>' : '');
    err.classList.add('show');
    var r = $('#retry'); if (r) r.addEventListener('click', function () { hideErr(); retry(); });
  }
  function hideErr() { err.classList.remove('show'); err.textContent = ''; }
  function setBusy(on) { busy = on; send.disabled = on; endBtn.disabled = on; inp.disabled = on; send.classList.toggle('is-loading', on); }

  function addMsg(role, text) {
    var d = document.createElement('div');
    d.className = 'msg ' + role; d.textContent = text; log.appendChild(d);
    log.scrollTop = log.scrollHeight; return d;
  }
  function typing(on) {
    var t = $('#typing');
    if (!on) { if (t) t.remove(); return; }
    if (t) return;
    t = document.createElement('div'); t.id = 'typing'; t.className = 'msg them typing'; t.setAttribute('aria-label', 'The scammer is typing');
    t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); log.scrollTop = log.scrollHeight;
  }
  function updateTurns() { turns.textContent = 'Your messages: ' + userCount + ' of ' + MAX; }

  async function api(path, body) {
    var r;
    try { r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error('Could not reach ScamSense. Check your internet connection.'); }
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
    return d;
  }

  function start(id) {
    var s = SCEN.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    scenario = id; history = []; userCount = 0; log.innerHTML = ''; hideErr(); updateTurns();
    title.textContent = s.t; show('chat');
    addMsg('sys', 'Practice simulation. The messages below are from an AI, not a real person.');
    nextScammer();
  }

  async function nextScammer() {
    setBusy(true); typing(true);
    try {
      var d = await api('/api/practice/message', { scenario: scenario, history: history });
      typing(false); history.push({ role: 'scammer', text: d.reply }); addMsg('them', d.reply);
    } catch (e) { typing(false); showErr(e.message, nextScammer); }
    finally { setBusy(false); if (!busy && window.matchMedia('(pointer: fine)').matches) inp.focus(); }
  }

  function digits(s) { return s.replace(/\D/g, '').length; }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;
    var text = inp.value.trim(); if (!text) return;
    if (history.length === 0 || history[history.length - 1].role !== 'scammer') return;
    if (digits(text) >= 12) { showErr('That looks like a real card or account number. Do not type real details here. Use a made-up answer instead.'); return; }
    hideErr();
    history.push({ role: 'user', text: text }); userCount++; addMsg('me', text); updateTurns();
    inp.value = ''; inp.style.height = '';
    if (userCount >= MAX) { addMsg('sys', 'That was your last message. Getting your score.'); finish(); } else nextScammer();
  });
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  inp.addEventListener('input', function () { inp.style.height = 'auto'; inp.style.height = Math.min(120, inp.scrollHeight) + 'px'; });
  endBtn.addEventListener('click', function () {
    if (busy) return;
    if (!userCount) { showErr('Reply to the scammer at least once, then end the chat.'); return; }
    finish();
  });
  restart.addEventListener('click', function () { if (!busy) { show('pick'); } });

  async function finish() {
    setBusy(true); hideErr(); typing(true);
    try {
      var d = await api('/api/practice/score', { scenario: scenario, history: history });
      typing(false); renderScore(d); show('score');
    } catch (e) { typing(false); showErr(e.message, finish); }
    finally { setBusy(false); }
  }

  function list(items, empty) {
    if (!items.length) return '<p class="muted" style="margin:0">' + empty + '</p>';
    return items.map(function (i) { return '<div class="qa"><p class="quote">' + esc(i.quote) + '</p><span>' + esc(i.why) + '</span></div>'; }).join('');
  }
  function renderScore(d) {
    var v = d.score >= 70 ? 'safe' : d.score >= 40 ? 'risky' : 'scam';
    scoreView.className = 'show v-' + v;
    scoreView.innerHTML =
      '<div class="score-top"><span class="label">' + esc(d.scenario) + ' scenario</span>' +
      '<div class="score-num"><span id="num">0</span><small>/ 100</small></div>' +
      '<p class="lead" style="color:var(--ink)">' + esc(d.summary) + '</p></div>' +
      '<div style="display:grid;gap:20px">' +
      '<div class="card"><h3>Where you slipped</h3>' + list(d.slipped, 'Nothing stood out. You did not fall for the main tricks.') + '</div>' +
      '<div class="card"><h3>What you did well</h3>' + list(d.good_moves, 'No standout moves yet. Try refusing clearly and saying you will call the official number.') + '</div>' +
      '<div class="card"><h3>3 tips</h3><ol class="ol">' + d.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="result-actions"><button class="btn btn-primary" type="button" id="again">Try another scenario</button><a class="btn btn-ghost" href="/check">Check a real message</a></div></div>';
    scoreView.querySelectorAll('.btn').forEach(function (b) {
      var t = b.textContent.trim(); b.innerHTML = '<span class="roll"><span class="roll-in" data-t="' + esc(t) + '">' + esc(t) + '</span></span>';
    });
    $('#again').addEventListener('click', function () { show('pick'); });
    var el = $('#num');
    if (window.SS.reduce) { el.textContent = d.score; return; }
    var t0 = performance.now();
    (function tick(t) { var p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(d.score * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0);
  }

  var pre = new URLSearchParams(location.search).get('scenario');
  if (pre && SCEN.some(function (s) { return s.id === pre; })) start(pre); else show('pick');
})();
