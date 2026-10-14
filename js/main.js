/* =======================================================
   little corner — entry point
   dimuat paling awal. modul lain (player, router, dll)
   nempel ke window.LC, lalu semuanya dijalankan di sini.
======================================================= */
(function () {
  const LC = (window.LC = {
    // folder utama situs (yang isinya index.html, assets/, pages/)
    root: new URL('../../', document.currentScript.src).href,
    hooks: [],

    // jalan tiap halaman selesai tampil, termasuk pas pindah halaman tanpa reload
    onPage(fn) { this.hooks.push(fn); },
    runPage() {
      this.hooks.forEach((fn) => {
        try { fn(); } catch (err) { console.error(err); }
      });
    },

    store: {
      get(key, fallback) {
        try {
          const raw = localStorage.getItem('lc:' + key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
          return fallback;
        }
      },
      set(key, value) {
        try { localStorage.setItem('lc:' + key, JSON.stringify(value)); } catch (e) {}
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (LC.player) LC.player.init();
    if (LC.router) LC.router.init();
    LC.runPage();
  });
})();
