/* =======================================================
   page — reveal pas scroll, anchor halus, tombol back to top
======================================================= */
(function () {
  let io;

  function reveal() {
    if (io) io.disconnect();
    const els = document.querySelectorAll('.reveal:not(.in-view)');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  // pakai delegasi biar tetap jalan setelah isi halaman diganti router
  document.addEventListener('click', (e) => {
    if (e.target.closest('.back-to-top')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  LC.onPage(reveal);
})();
