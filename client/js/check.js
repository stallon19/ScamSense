// Message Checker page
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = window.SS.esc, toast = window.SS.toast, setLabel = window.SS.setLabel;

  var msg = $('#msg'), count = $('#count'), file = $('#file'), pick = $('#pick'), prev = $('#prev'),
      prevImg = $('#prevImg'), prevName = $('#prevName'), rm = $('#rm'), go = $('#go'), err = $('#err'),
      skel = $('#skel'), result = $('#result'), lang = $('#lang'), sample = $('#sample'),
      histWrap = $('#histWrap'), hist = $('#hist'), clearHist = $('#clearHist');
  var image = null;

  var SAMPLE = 'SBI ALERT: Your account will be blocked today. Update KYC immediately at sbi-kyc-update.in or your account will be closed. Reply with your OTP to confirm.';
  var SCENARIO = { 'Fake internship/job': 'internship', 'UPI/refund': 'upi', 'KYC/bank': 'kyc', 'Parcel/customs': 'parcel', 'Lottery/prize': 'scholarship' };
  var LABEL = { Safe: 'Safe', Risky: 'Risky', Scam: 'Scam' };

  function showErr(m) { err.textContent = m; err.classList.add('show'); }
  function clearErr() { err.classList.remove('show'); err.textContent = ''; }
  function updateCount() { count.textContent = msg.value.length.toLocaleString('en-IN') + ' / 2,000'; }
  msg.addEventListener('input', function () { updateCount(); clearErr(); });
  sample.addEventListener('click', function () { msg.value = SAMPLE; updateCount(); clearErr(); msg.focus(); });

  /* ---------- screenshot: validate, shrink to 1400px, keep as base64 ---------- */
  function loadImage(f) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(f), i = new Image();
      i.onload = function () { URL.revokeObjectURL(url); res(i); };
      i.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That file could not be read as an image.')); };
      i.src = url;
    });
  }
  pick.addEventListener('click', function () { file.click(); });
  file.addEventListener('change', async function () {
    var f = file.files && file.files[0]; if (!f) return;
    clearErr();
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) throw new Error('Upload a PNG, JPG or WebP screenshot.');
      if (f.size > 12 * 1024 * 1024) throw new Error('That image is too large. Use a screenshot under 12 MB.');
      var img = await loadImage(f);
      var s = Math.min(1, 1400 / Math.max(img.width, img.height));
      var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      var url = c.toDataURL('image/jpeg', 0.85);
      image = { mime: 'image/jpeg', data: url.split(',')[1] };
      prevImg.src = url; prevName.textContent = f.name; prev.classList.add('show');
    } catch (e) { image = null; showErr(e.message); }
    file.value = '';
  });
  rm.addEventListener('click', function () { image = null; prev.classList.remove('show'); prevImg.removeAttribute('src'); });

  /* ---------- run the check ---------- */
  function busy(on) {
    go.disabled = on; go.classList.toggle('is-loading', on);
    setLabel(go, on ? 'Checking' : 'Check message');
  }
  go.addEventListener('click', async function () {
    clearErr();
    var text = msg.value.trim();
    if (!text && !image) { showErr('Paste a message or upload a screenshot first.'); msg.focus(); return; }
    busy(true); result.className = ''; result.innerHTML = ''; skel.classList.add('show');
    skel.scrollIntoView({ behavior: window.SS.reduce ? 'auto' : 'smooth', block: 'center' });
    try {
      var r = await fetch('/api/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, image: image || undefined, language: lang.value })
      });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      render(data);
      save(data, text);
    } catch (e) {
      showErr(e instanceof TypeError ? 'Could not reach ScamSense. Check your internet connection and try again.' : e.message);
    } finally { busy(false); skel.classList.remove('show'); }
  });

  /* ---------- marked-up message ---------- */
  function highlight(text, flags) {
    var lower = text.toLowerCase(), ranges = [];
    flags.forEach(function (f, i) {
      if (!f.quote) return;
      var idx = lower.indexOf(f.quote.toLowerCase());
      if (idx > -1) ranges.push({ s: idx, e: idx + f.quote.length, n: i + 1 });
    });
    ranges.sort(function (a, b) { return a.s - b.s; });
    var out = '', pos = 0;
    ranges.forEach(function (r) {
      if (r.s < pos) return; // skip overlaps
      out += esc(text.slice(pos, r.s));
      out += '<mark class="hl" style="--i:' + r.n + ';--base:.35s">' + esc(text.slice(r.s, r.e)) + '<sup>' + r.n + '</sup></mark>';
      pos = r.e;
    });
    return out + esc(text.slice(pos));
  }

  function render(d) {
    var v = d.verdict, safe = v === 'Safe';
    var flagsHtml = d.red_flags.length
      ? '<ol class="flags">' + d.red_flags.map(function (f, i) {
          return '<li><span class="n">' + (i + 1) + '</span><div><b>' + esc(f.title) + '</b><span>' + esc(f.explanation) + '</span></div></li>';
        }).join('') + '</ol>'
      : '<p class="muted" style="margin:0">No warning signs were found. This does not guarantee the message is safe.</p>';
    var steps = '<ol class="ol">' + d.next_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    var moves = d.next_moves.length ? '<ol class="ol">' + d.next_moves.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '';
    var scn = SCENARIO[d.scam_type];
    var practiceHref = '/practice' + (scn ? '?scenario=' + scn : '');

    result.className = 'show v-' + v.toLowerCase();
    result.innerHTML =
      '<div class="verdict-hero">' +
        '<div class="verdict-row"><span class="verdict-word">' + LABEL[v] + '</span><span class="label">' + d.confidence + '% confidence. An AI estimate, it can be wrong.</span></div>' +
        '<div class="meter" role="img" aria-label="Confidence ' + d.confidence + ' percent"><i></i></div>' +
        (d.headline ? '<p>' + esc(d.headline) + '</p>' : '') +
      '</div>' +
      (d.source_text ? '<div class="card"><h3>The message</h3><p class="src-text">' + highlight(d.source_text, d.red_flags) + '</p></div>' : '') +
      '<div class="card"><h3>' + (safe ? 'What we noticed' : 'Red flags') + '</h3>' + flagsHtml + '</div>' +
      '<div class="two">' +
        '<div class="card"><h3>' + (safe ? 'Good habits' : 'What to do now') + '</h3>' + steps + '</div>' +
        (moves ? '<div class="card forecast"><h3>What the scammer will do next</h3>' + moves + '</div>' : '') +
      '</div>' +
      (safe ? '' : '<div class="help-box"><b>Lost money or shared an OTP?</b> Call 1930 right away or visit cybercrime.gov.in. <a href="/help">See the checklist</a>.</div>') +
      '<div class="result-actions">' +
        '<a class="btn btn-primary" href="' + practiceHref + '">' + (safe ? 'Try Practice Mode' : 'Practise this scam') + '</a>' +
        '<button class="btn btn-ghost" type="button" id="copyBtn">Copy summary</button>' +
        '<button class="btn btn-ghost" type="button" id="printBtn">Print</button>' +
        '<button class="btn btn-ghost" type="button" id="againBtn">Check another</button>' +
      '</div>';

    // roll labels for the new buttons
    result.querySelectorAll('.btn').forEach(function (b) {
      var t = b.textContent.trim();
      b.innerHTML = '<span class="roll"><span class="roll-in" data-t="' + esc(t) + '">' + esc(t) + '</span></span>';
    });

    requestAnimationFrame(function () { var bar = result.querySelector('.meter i'); if (bar) bar.style.width = d.confidence + '%'; });
    result.scrollIntoView({ behavior: window.SS.reduce ? 'auto' : 'smooth', block: 'start' });

    $('#copyBtn').addEventListener('click', function () {
      var t = 'ScamSense verdict: ' + v + ' (' + d.confidence + '% confidence)\n' + (d.headline || '') + '\n\n' +
        d.red_flags.map(function (f, i) { return (i + 1) + '. ' + f.title + ': ' + f.explanation; }).join('\n') +
        '\n\nWhat to do now:\n' + d.next_steps.map(function (s) { return '- ' + s; }).join('\n') +
        '\n\nAI result, it can be wrong. If you lost money, call 1930.';
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Summary copied'); }, function () { toast('Could not copy. Select the text and copy it.'); });
    });
    $('#printBtn').addEventListener('click', function () { window.print(); });
    $('#againBtn').addEventListener('click', function () {
      result.className = ''; result.innerHTML = ''; msg.value = ''; updateCount(); image = null; prev.classList.remove('show');
      window.scrollTo({ top: 0, behavior: window.SS.reduce ? 'auto' : 'smooth' }); msg.focus();
    });
  }

  /* ---------- recent checks, kept only in this browser ---------- */
  function readHist() { try { return JSON.parse(localStorage.getItem('ss-history') || '[]'); } catch (e) { return []; } }
  function save(d, text) {
    var h = readHist();
    h.unshift({ t: Date.now(), v: d.verdict, s: (text || d.source_text || 'Screenshot').slice(0, 70) });
    try { localStorage.setItem('ss-history', JSON.stringify(h.slice(0, 5))); } catch (e) {}
    drawHist();
  }
  function drawHist() {
    var h = readHist();
    histWrap.hidden = !h.length;
    hist.innerHTML = h.map(function (x) {
      var d = new Date(x.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return '<div class="hist-item v-' + String(x.v).toLowerCase() + '"><i class="dot"></i><b>' + esc(x.v) + '</b><span>' + esc(x.s) + '</span><time>' + d + '</time></div>';
    }).join('');
  }
  clearHist.addEventListener('click', function () { try { localStorage.removeItem('ss-history'); } catch (e) {} drawHist(); toast('History cleared'); });
  drawHist(); updateCount();
})();
