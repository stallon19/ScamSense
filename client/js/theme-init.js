// Runs in <head> before paint: sets theme and decides whether to play the intro (home page, once per session).
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var t = null;
  try { t = localStorage.getItem('ss-theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  d.dataset.theme = t;
  try {
    var home = location.pathname === '/' || /\/index(\.html)?$/.test(location.pathname);
    if (home && !sessionStorage.getItem('ss-intro') && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('intro-on');
  } catch (e) {}
})();
