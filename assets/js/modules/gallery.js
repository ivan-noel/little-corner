/* =======================================================
   gallery — grid foto + lightbox (Photo Library)
   daftar foto diambil dari window.GALLERY_PHOTOS di gallery-library.html
======================================================= */
(function () {
  let box = null;
  let img, count;
  let photos = [];
  let current = 0;

  function folder(file) {
    return LC.root + 'assets/images/gallery/' + encodeURI(file);
  }

  function show() {
    img.src = folder(photos[current]);
    count.textContent = (current + 1) + ' / ' + photos.length;
  }

  function open(i) {
    current = i;
    show();
    box.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = '';
  }

  function step(n) {
    current = (current + n + photos.length) % photos.length;
    show();
  }

  function init() {
    document.body.style.overflow = '';
    const grid = document.getElementById('gallery-grid');
    box = document.getElementById('lightbox');
    if (!grid || !box || !window.GALLERY_PHOTOS) {
      box = null;
      return;
    }

    photos = window.GALLERY_PHOTOS;
    img = document.getElementById('lightbox-img');
    count = document.getElementById('lightbox-count');

    photos.forEach((file, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'photo-tile reveal in-view';
      tile.innerHTML = `<img src="${folder(file)}" alt="A little moment" loading="lazy">`;
      tile.addEventListener('click', () => open(i));
      grid.appendChild(tile);
    });

    document.getElementById('lightbox-close').addEventListener('click', close);
    document.getElementById('lightbox-prev').addEventListener('click', () => step(-1));
    document.getElementById('lightbox-next').addEventListener('click', () => step(1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
  }

  document.addEventListener('keydown', (e) => {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  LC.onPage(init);
})();
