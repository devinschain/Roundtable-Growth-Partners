/* Modern touches shared by all pages: reading progress, header shadow, count-up numbers */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }

  var prog = document.getElementById('prog'), hdr = document.querySelector('header.site');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (prog && h > 0) prog.style.transform = 'scaleX(' + clamp(window.scrollY / h) + ')';
    if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce || !('IntersectionObserver' in window)) return;

  /* Count-up for result numbers such as 125%, 5+, 42% */
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      var el = e.target, to = el._to, suf = el._suf, t0 = performance.now(), dur = 1400;
      var step = function (now) {
        var p = clamp((now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = v + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = '0' + suf;
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.cs-stats b, .cs-stats-lg b').forEach(function (b) {
    var m = /^(\d+)(.*)$/.exec(b.textContent.trim());
    if (!m) return;
    b._to = parseInt(m[1], 10); b._suf = m[2];
    co.observe(b);
  });

  /* Approach steps light up one after another */
  var steps = document.querySelector('.steps');
  if (steps) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { steps.classList.add('go'); so.disconnect(); } });
    }, { threshold: 0.35 });
    so.observe(steps);
  }
})();
