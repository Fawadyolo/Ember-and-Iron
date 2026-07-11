(function () {
  function mainImg() { return document.getElementById('pgalMainImg'); }
  function overlay() { return document.getElementById('pgalZoom'); }
  function zoomImg() { return document.getElementById('pgalZoomImg'); }

  function selectThumb(btn) {
    var full = btn.getAttribute('data-full');
    var alt = btn.getAttribute('data-alt') || '';
    var mi = mainImg();
    if (mi && full) { mi.src = full; mi.alt = alt; }
    var all = document.querySelectorAll('.pgal-thumb');
    for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i] === btn);
    if (btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }
  function openZoom() {
    var mi = mainImg(); if (!mi) return;
    var zi = zoomImg();
    zi.src = mi.currentSrc || mi.src; zi.alt = mi.alt;
    zi.classList.remove('zoomed'); zi.style.transformOrigin = 'center center';
    overlay().classList.add('open'); overlay().setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeZoom() {
    var ov = overlay(); if (!ov) return;
    ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var thumb = e.target.closest && e.target.closest('.pgal-thumb');
    if (thumb) { selectThumb(thumb); return; }
    if (e.target.closest && (e.target.closest('.pgal-zoom') || e.target.closest('.pgal-main'))) { openZoom(); return; }
    if (e.target.closest && e.target.closest('.pgal-lb-close')) { closeZoom(); return; }
    var ov = overlay();
    if (ov && e.target === ov) closeZoom();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeZoom(); return; }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.querySelector('.pgal-thumb')) {
      var list = Array.prototype.slice.call(document.querySelectorAll('.pgal-thumb'));
      var idx = 0;
      for (var i = 0; i < list.length; i++) if (list[i].classList.contains('on')) idx = i;
      idx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
      selectThumb(list[idx]);
    }
  });
  function init() {
    // Read more toggle
    var intro = document.getElementById('pdpIntro');
    var btn = document.getElementById('pdpReadMore');
    if (intro && btn) {
      if (intro.scrollHeight <= intro.clientHeight + 4) {
        intro.classList.add('noclamp');
        btn.style.display = 'none';
      }
      btn.addEventListener('click', function () {
        var open = intro.classList.toggle('open');
        btn.textContent = open ? 'Read less −' : 'Read more +';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    // Lightbox zoom-on-click
    var zi = zoomImg(); if (!zi) return;
    zi.addEventListener('click', function (e) { e.stopPropagation(); this.classList.toggle('zoomed'); });
    zi.addEventListener('mousemove', function (e) {
      if (!this.classList.contains('zoomed')) return;
      var r = this.getBoundingClientRect();
      this.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
    });
    zi.addEventListener('touchmove', function (e) {
      if (!this.classList.contains('zoomed') || !e.touches[0]) return;
      var r = this.getBoundingClientRect();
      this.style.transformOrigin = ((e.touches[0].clientX - r.left) / r.width * 100) + '% ' + ((e.touches[0].clientY - r.top) / r.height * 100) + '%';
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
