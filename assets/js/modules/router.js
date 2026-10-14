/* =======================================================
   router — pindah halaman tanpa reload
   cuma isi <main> yang diganti. sidebar (dan pemutar musik di
   dalamnya) tetap di tempat, makanya lagu nggak putus.
   kalau fetch gagal atau dibuka dari file://, otomatis balik
   ke perpindahan halaman biasa.
======================================================= */
(function () {
  const pages = new Map(); // url -> promise html
  const fade = 160;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let here = '';
  let navId = 0;

  const wait = (ms) => new Promise((done) => setTimeout(done, reduceMotion ? 0 : ms));
  const pathOf = (url) => url.pathname + url.search;

  // link yang boleh ditangani router: halaman .html di dalam situs ini
  function target(a) {
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
    const url = new URL(a.href);
    const ok = url.href.startsWith(LC.root) && (/\.html$/.test(url.pathname) || url.pathname.endsWith('/'));
    return ok ? url : null;
  }

  function fetchPage(url) {
    const key = url.origin + pathOf(url);
    if (!pages.has(key)) {
      const req = fetch(key, { credentials: 'same-origin' }).then((res) => {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.text();
      });
      req.catch(() => pages.delete(key));
      pages.set(key, req);
    }
    return pages.get(key);
  }

  function runScripts(root) {
    // script yang masuk lewat innerHTML nggak jalan sendiri, jadi dibikin ulang
    root.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach((attr) => s.setAttribute(attr.name, attr.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  function markActive(doc, url) {
    const cur = doc.querySelector('.sidebar-nav .nav-item.active');
    const href = cur ? new URL(cur.getAttribute('href'), url.href).href : '';
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((a) => {
      a.classList.toggle('active', a.href === href);
    });
  }

  function swap(doc, url, push) {
    const main = document.querySelector('main.main');
    document.title = doc.title;
    main.innerHTML = doc.querySelector('main.main').innerHTML;
    runScripts(main);
    markActive(doc, url);
    here = pathOf(url);

    const toggle = document.getElementById('nav-toggle');
    if (toggle) toggle.checked = false;

    const anchor = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'instant' });
    } else {
      const y = push ? 0 : (history.state && history.state.y) || 0;
      window.scrollTo({ top: y, behavior: 'instant' });
    }

    main.classList.remove('is-leaving');
    main.focus({ preventScroll: true });
    LC.runPage();
  }

  async function go(url, push) {
    const id = ++navId;
    document.querySelector('main.main').classList.add('is-leaving');

    let doc;
    try {
      const results = await Promise.all([fetchPage(url), wait(fade)]);
      doc = new DOMParser().parseFromString(results[0], 'text/html');
      if (!doc.querySelector('main.main')) throw new Error('bukan halaman situs');
    } catch (err) {
      location.href = url.href;
      return;
    }
    if (id !== navId) return; // keburu pindah ke halaman lain

    if (push) {
      history.replaceState({ y: window.scrollY }, '');
      history.pushState({ y: 0 }, '', url.href);
    }
    swap(doc, url, push);
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    const url = target(a);
    if (!url) return;

    if (pathOf(url) === here) {
      // halaman yang sama: jangan reload (musik bisa kepotong), cukup balik ke atas
      if (!url.hash) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    e.preventDefault();
    go(url, true);
  }

  // ambil halaman duluan pas kursor lewat / disentuh biar pindahnya terasa instan
  function warm(e) {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const url = target(a);
    if (url && pathOf(url) !== here) fetchPage(url).catch(() => {});
  }

  function init() {
    if (location.protocol === 'file:' || !window.fetch || !history.pushState) return;
    const main = document.querySelector('main.main');
    if (!main) return;

    here = pathOf(location);
    main.setAttribute('tabindex', '-1');

    // link sidebar ditulis relatif ke halaman pertama, jadi dikunci ke alamat lengkap
    // supaya tetap bener setelah pindah antara index.html dan folder pages/
    document.querySelectorAll('.sidebar a[href]').forEach((a) => a.setAttribute('href', a.href));

    // posisi scroll dipegang sendiri, karena isi halaman diganti lewat js
    history.scrollRestoration = 'manual';
    const y = history.state && history.state.y;
    if (y) window.scrollTo({ top: y, behavior: 'instant' });
    window.addEventListener('pagehide', () => history.replaceState({ y: window.scrollY }, ''));

    document.addEventListener('click', onClick);
    document.addEventListener('mouseover', warm);
    document.addEventListener('touchstart', warm, { passive: true });
    window.addEventListener('popstate', () => {
      if (pathOf(location) === here) return; // cuma ganti #hash
      go(new URL(location.href), false);
    });
  }

  LC.router = { init };
})();
