// Scam library: static, plain-English content with a type filter.
(function () {
  'use strict';
  var DATA = [
    { t: 'Fake internship fee', c: 'Jobs and study',
      how: 'A recruiter offers a paid internship with no interview, then asks for a registration, training or laptop deposit.',
      flags: ['Offer comes without an interview', 'A fee is needed to start', 'Only a few seats left, reply today'],
      todo: ['Never pay to get a job', 'Check the company on its official website', 'Ask your placement cell'] },
    { t: 'Fake scholarship prize', c: 'Jobs and study',
      how: 'You are told you won a scholarship you never applied for. To get the money you must pay a processing fee or share bank details.',
      flags: ['You never applied', 'A fee is needed to receive money', 'Asks for OTP or bank login'],
      todo: ['Check the scholarship on the official government or college portal', 'Pay nothing', 'Never share an OTP'] },
    { t: 'Part-time task job', c: 'Jobs and study',
      how: 'You are offered easy money for liking videos or rating products. Small first payouts build trust. Then you are asked to deposit money to unlock bigger tasks.',
      flags: ['Easy money for simple tasks', 'Contact only on Telegram or WhatsApp', 'Asks you to deposit to continue'],
      todo: ['Stop at the first deposit request', 'Do not send more to recover earlier money', 'Report at cybercrime.gov.in'] },
    { t: 'UPI refund trick', c: 'Bank and UPI',
      how: 'A caller says money was taken by mistake. To "refund" it, they ask you to approve a request or enter your UPI PIN. That sends money out of your account.',
      flags: ['Asks for your UPI PIN', 'Asks you to approve a collect request', 'Strict deadline of a few minutes'],
      todo: ['You never need a PIN to receive money', 'Hang up', 'Check your bank app yourself'] },
    { t: 'Fake KYC block', c: 'Bank and UPI',
      how: 'A message says your account will be blocked unless you update KYC now. The link opens a copy of a bank site, or a caller asks for your OTP.',
      flags: ['Threat to block your account today', 'Link with a strange web address', 'Asks for OTP, card number or CVV'],
      todo: ['Do not tap the link', 'Call the number printed on your card', 'Update KYC only in the official app or branch'] },
    { t: 'Wrong transfer request', c: 'Bank and UPI',
      how: 'Someone sends money to you "by mistake" and begs you to send it back. The first payment may be fake, or the request may be a way to get your details.',
      flags: ['Money appears, then a pressing call', 'Asks you to return it to a different account', 'Emotional or angry tone'],
      todo: ['Do not send money back yourself', 'Tell your bank and let them reverse it', 'Block the number'] },
    { t: 'Parcel customs fee', c: 'Shopping and delivery',
      how: 'A message says a parcel is held and you must pay a small fee through a link. The link steals card details, or the small payment is only the first step.',
      flags: ['A parcel you did not order', 'Fee through a payment link', 'Deadline or return threat'],
      todo: ['Check the courier app or website yourself', 'Do not tap the link', 'Never pay customs fees through a message'] },
    { t: 'Fake police or "digital arrest" call', c: 'Other',
      how: 'A caller claims to be police or a government officer and says you are linked to a crime. They keep you on a video call and demand money to "clear" your name.',
      flags: ['Caller claims you broke the law', 'You are told to stay on the call and tell no one', 'Demands money or a transfer to a "safe" account'],
      todo: ['Hang up. Police do not arrest people over video calls or take payments to close a case', 'Tell a family member', 'Call 1930 if you paid'] }
  ];
  var cats = ['All'].concat(DATA.map(function (d) { return d.c; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
  var chips = document.getElementById('chips'), list = document.getElementById('list');
  var current = 'All';
  function ul(a) { return '<ul>' + a.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
  function draw() {
    chips.innerHTML = cats.map(function (c) { return '<button type="button" class="chip" aria-pressed="' + (c === current) + '" data-c="' + c + '">' + c + '</button>'; }).join('');
    list.innerHTML = DATA.filter(function (d) { return current === 'All' || d.c === current; }).map(function (d) {
      return '<details class="learn-item"><summary><span>' + d.t + '<span class="cat">' + d.c + '</span></span></summary>' +
        '<div class="learn-body"><div><h4>How it works</h4><p>' + d.how + '</p></div><div><h4>Warning signs</h4>' + ul(d.flags) + '</div><div><h4>What to do</h4>' + ul(d.todo) + '</div></div></details>';
    }).join('');
  }
  chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) { current = b.dataset.c; draw(); } });
  draw();
})();
