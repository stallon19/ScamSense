// Commonly seen scam themes by time of year. General patterns, not live data.
(function () {
  'use strict';
  var el = document.getElementById('seasons');
  if (!el) return;
  var SEASONS = [
    { name: 'Admissions and internships', range: 'March to June', months: [2, 3, 4, 5],
      tricks: ['Fake internship offers that ask for a registration fee', 'Fake seat-booking calls that ask for an advance', 'Fake scholarship approvals that ask for a processing fee'],
      habit: 'Check the company on its official website. Never pay to get a job, seat or scholarship.' },
    { name: 'Back to college', range: 'July to August', months: [6, 7],
      tricks: ['Fake hostel and flat ads that ask for token money', 'Fake sellers of laptops and used books who ask for advance payment', 'Fake fee-waiver or education loan offers'],
      habit: 'Never pay a token amount to someone you have not met or verified.' },
    { name: 'Festive sales', range: 'September to November', months: [8, 9, 10],
      tricks: ['Fake refund calls after an online order', 'Parcel or customs fee messages with payment links', 'Fake sale and coupon links shared on WhatsApp'],
      habit: 'Open shopping apps yourself. Do not tap links sent in messages.' },
    { name: 'Placements and tax', range: 'December to February', months: [11, 0, 1],
      tricks: ['Fake offer letters that ask for training or document fees', 'Fake KYC update messages that threaten to block your account', 'Fake tax refund messages that ask for bank details'],
      habit: 'Real recruiters do not ask you to pay. A refund never needs your PIN.' }
  ];
  var m = new Date().getMonth();
  var full = el.getAttribute('data-full') === 'true';
  if (full) el.classList.add('full');
  el.innerHTML = SEASONS.map(function (s) {
    var now = s.months.indexOf(m) > -1;
    return '<article class="season' + (now ? ' now' : '') + '">' +
      (now ? '<span class="tag now-tag">Now</span>' : '') +
      '<h3>' + s.name + '</h3><span class="months">' + s.range + '</span>' +
      '<ul>' + s.tricks.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      (full ? '<p class="habit"><b>Your habit:</b> ' + s.habit + '</p>' : '') + '</article>';
  }).join('');
  var cur = SEASONS.filter(function (s) { return s.months.indexOf(m) > -1; })[0];
  var n = document.getElementById('nowSeason');
  if (n && cur) n.textContent = cur.name;
})();
