/* =======================================================
   player — pemutar musik di sidebar
   elemen audio dibuat sekali dan nggak ikut diganti pas pindah
   halaman (lihat router.js), jadi lagunya lanjut terus.
   state disimpan di localStorage buat jaga-jaga kalau halaman
   di-reload atau kebuka lewat link biasa.
======================================================= */
(function () {
  const playlist = window.LC_PLAYLIST || [];
  const audioRoot = LC.root + 'assets/audio/';
  const audio = new Audio();
  audio.preload = 'none';

  const saved = LC.store.get('player', {});
  let volume = typeof saved.volume === 'number' ? saved.volume : 0.8;
  let current = { file: '', title: '', artist: '' };
  let ui = null;
  let seeking = false;
  let lastSave = 0;

  const svg = (body, extra) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"${extra || ''}>${body}</svg>`;

  const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>';

  // mini player: cuma muncul di layar kecil, setelah ada lagu yang diputar
  const miniMarkup = `
    <button class="mini-info" id="bgm-mini-info" type="button" aria-label="Open player">
      <span class="mini-title" id="bgm-mini-title"></span>
      <span class="mini-artist" id="bgm-mini-artist"></span>
    </button>
    <button class="np-toggle" id="bgm-mini-toggle" type="button"></button>
    <button class="np-btn" id="bgm-mini-next" type="button" aria-label="Next song">${svg('<path d="M6 6.5v11L14.5 12 6 6.5Z"/><path d="M18 6v12"/>')}</button>`;

  const markup = `
    <div class="now-playing" id="bgm-widget">
      <div class="np-main">
        <div class="np-art" id="bgm-art"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg></div>
        <div class="np-text">
          <div class="np-title" id="bgm-title"></div>
          <div class="np-artist" id="bgm-artist"></div>
        </div>
        <button class="np-toggle" id="bgm-toggle" type="button">
          <span class="np-icon-play"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg></span>
          <span class="np-icon-pause" hidden><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg></span>
        </button>
      </div>
      <input class="np-range" id="bgm-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek" disabled>
      <div class="np-controls">
        <button class="np-btn" id="bgm-prev" type="button" aria-label="Previous song" title="Previous">${svg('<path d="M18 6.5v11L9.5 12 18 6.5Z"/><path d="M6 6v12"/>')}</button>
        <button class="np-btn" id="bgm-next" type="button" aria-label="Next song" title="Next">${svg('<path d="M6 6.5v11L14.5 12 6 6.5Z"/><path d="M18 6v12"/>')}</button>
        <button class="np-btn" id="bgm-repeat" type="button" aria-label="Repeat this song" aria-pressed="true" title="Repeat this song">${svg('<path d="M17 3.5l3 3-3 3"/><path d="M4 11V9.5a3 3 0 0 1 3-3h13"/><path d="M7 20.5l-3-3 3-3"/><path d="M20 13v1.5a3 3 0 0 1-3 3H4"/><path d="M11 10.8l1.3-.9v4.2"/>')}</button>
        <div class="np-volume">
          <button class="np-btn np-mute" id="bgm-mute" type="button" aria-label="Mute" data-level="high">${svg('<path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4Z"/><path class="v-low" d="M15 9.5a3.5 3.5 0 0 1 0 5"/><path class="v-high" d="M17.5 7a7 7 0 0 1 0 10"/><path class="v-x" d="M16 9.5l5 5M21 9.5l-5 5"/>')}</button>
          <input class="np-range" id="bgm-volume" type="range" min="0" max="1" step="0.01" aria-label="Volume">
        </div>
      </div>
    </div>
    <p class="np-hint" id="bgm-hint" hidden></p>`;

  // ---------------------------------------------------
  // helpers
  // ---------------------------------------------------
  function trackFor(file, title, artist) {
    const known = playlist.find((t) => t.file === file);
    return known || { file, title: title || file, artist: artist || '' };
  }

  function paint(input) {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--fill', pct + '%');
  }

  function save() {
    lastSave = Date.now();
    LC.store.set('player', {
      file: current.file,
      title: current.title,
      artist: current.artist,
      time: audio.currentTime || 0,
      playing: !audio.paused,
      volume: volume,
      muted: audio.muted,
      loop: audio.loop,
      ts: lastSave
    });
  }

  // ---------------------------------------------------
  // tampilan
  // ---------------------------------------------------
  function syncRows() {
    const playing = !audio.paused;
    document.querySelectorAll('.song-row, .featured-strip[data-file]').forEach((row) => {
      const on = playing && row.dataset.file === current.file;
      row.classList.toggle('is-playing', on);

      // nomor urut diganti equalizer pas lagunya main (disiapkan sekali per baris)
      const idx = row.querySelector('.song-index');
      if (idx && !idx.querySelector('.eq')) {
        idx.innerHTML = '<span class="num">' + idx.textContent + '</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';
      }

      const label = row.querySelector('.label');
      if (label) {
        label.dataset.idle = label.dataset.idle || label.textContent;
        label.textContent = on ? 'Now Playing' : label.dataset.idle;
      }

      const btn = row.querySelector('.song-play');
      if (btn) {
        btn.setAttribute('aria-label', (on ? 'Pause ' : 'Play ') + row.dataset.title);
        if (btn.dataset.on !== String(on)) {
          btn.dataset.on = String(on);
          btn.innerHTML = on ? pauseIcon : playIcon;
        }
      }
    });
  }

  function render() {
    if (!ui) return;
    const playing = !audio.paused;
    ui.widget.classList.toggle('is-playing', playing);
    ui.title.textContent = current.title;
    ui.title.title = current.title;
    ui.artist.textContent = current.artist;
    ui.toggle.querySelector('.np-icon-play').hidden = playing;
    ui.toggle.querySelector('.np-icon-pause').hidden = !playing;
    ui.toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play ' + current.title);

    ui.miniTitle.textContent = current.title;
    ui.miniArtist.textContent = current.artist;
    ui.miniToggle.innerHTML = playing ? pauseIcon : playIcon;
    ui.miniToggle.setAttribute('aria-label', playing ? 'Pause' : 'Play ' + current.title);
    if (playing) {
      ui.mini.hidden = false;
      document.body.classList.add('has-mini');
    }
    syncRows();
  }

  function renderVolume() {
    const quiet = audio.muted || volume === 0;
    ui.mute.dataset.level = quiet ? 'mute' : volume < 0.5 ? 'low' : 'high';
    ui.mute.setAttribute('aria-label', quiet ? 'Unmute' : 'Mute');
    ui.volume.value = quiet ? 0 : volume;
    paint(ui.volume);
  }

  function setLoop(on) {
    audio.loop = on;
    ui.repeat.setAttribute('aria-pressed', String(on));
  }

  // ---------------------------------------------------
  // kontrol
  // ---------------------------------------------------
  function load(track) {
    current = track;
    audio.src = audioRoot + encodeURIComponent(track.file);
    ui.hint.hidden = true;
    ui.seek.value = 0;
    ui.seek.disabled = true;
    paint(ui.seek);

    if ('mediaSession' in navigator && window.MediaMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'little corner.'
      });
    }
    render();
  }

  function play() {
    const p = audio.play();
    // gagal play ditangani lewat event audio (error), autoplay yang diblok browser diam aja
    if (p && p.catch) p.catch(() => {});
  }

  function toggle() {
    if (audio.paused) play();
    else audio.pause();
  }

  function step(dir) {
    if (!playlist.length) return;
    const i = playlist.findIndex((t) => t.file === current.file);
    const n = i < 0 ? 0 : (i + dir + playlist.length) % playlist.length;
    load(playlist[n]);
    play();
  }

  function playRow(row) {
    if (!row || !row.dataset.file) return;
    if (row.dataset.file === current.file) {
      toggle();
      return;
    }
    load(trackFor(row.dataset.file, row.dataset.title, row.dataset.artist));
    play();
  }

  // ---------------------------------------------------
  // setup
  // ---------------------------------------------------
  function mount() {
    const foot = document.querySelector('.sidebar-foot');
    if (!foot) return false;
    foot.innerHTML = markup;

    const $ = (id) => document.getElementById(id);
    ui = {
      widget: $('bgm-widget'), title: $('bgm-title'), artist: $('bgm-artist'),
      toggle: $('bgm-toggle'), seek: $('bgm-seek'), prev: $('bgm-prev'),
      next: $('bgm-next'), repeat: $('bgm-repeat'), mute: $('bgm-mute'),
      volume: $('bgm-volume'), hint: $('bgm-hint')
    };

    const mini = document.createElement('div');
    mini.className = 'mini-player';
    mini.id = 'bgm-mini';
    mini.hidden = true;
    mini.innerHTML = miniMarkup;
    document.body.appendChild(mini);
    ui.mini = mini;
    ui.miniTitle = $('bgm-mini-title');
    ui.miniArtist = $('bgm-mini-artist');
    ui.miniToggle = $('bgm-mini-toggle');
    ui.miniNext = $('bgm-mini-next');
    ui.miniInfo = $('bgm-mini-info');

    // iOS Safari selalu ngembaliin volume 1, jadi slider-nya disembunyiin di sana
    audio.volume = 0.5;
    if (audio.volume !== 0.5) ui.widget.classList.add('no-volume');
    return true;
  }

  function bind() {
    ui.toggle.addEventListener('click', toggle);
    ui.prev.addEventListener('click', () => step(-1));
    ui.next.addEventListener('click', () => step(1));

    ui.miniToggle.addEventListener('click', toggle);
    ui.miniNext.addEventListener('click', () => step(1));
    ui.miniInfo.addEventListener('click', () => {
      const menu = document.getElementById('nav-toggle');
      if (menu) menu.checked = true;
    });

    ui.repeat.addEventListener('click', () => {
      setLoop(!audio.loop);
      save();
    });

    ui.mute.addEventListener('click', () => {
      if (audio.muted || volume === 0) {
        audio.muted = false;
        if (volume === 0) volume = 0.5;
      } else {
        audio.muted = true;
      }
      audio.volume = volume;
      renderVolume();
      save();
    });

    ui.volume.addEventListener('input', () => {
      volume = parseFloat(ui.volume.value);
      audio.volume = volume;
      audio.muted = volume === 0;
      renderVolume();
      save();
    });

    // geser dulu, baru lompat pas dilepas
    ui.seek.addEventListener('input', () => {
      seeking = true;
      paint(ui.seek);
    });
    ui.seek.addEventListener('change', () => {
      if (isFinite(audio.duration)) audio.currentTime = (ui.seek.value / 1000) * audio.duration;
      seeking = false;
    });

    ['play', 'pause'].forEach((name) => {
      audio.addEventListener(name, () => {
        render();
        save();
      });
    });

    audio.addEventListener('ended', () => {
      render();
      step(1); // cuma kepanggil kalau repeat dimatikan
    });

    audio.addEventListener('playing', () => { ui.hint.hidden = true; });

    audio.addEventListener('durationchange', () => {
      ui.seek.disabled = !isFinite(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (!seeking && isFinite(audio.duration) && audio.duration > 0) {
        ui.seek.value = (audio.currentTime / audio.duration) * 1000;
        paint(ui.seek);
      }
      if (Date.now() - lastSave > 1000) save();
    });

    audio.addEventListener('error', () => {
      console.warn('[player] lagu nggak bisa dimuat:', audio.currentSrc || audio.src);
      audio.pause();
      ui.hint.textContent = "This song can't be played right now.";
      ui.hint.hidden = false;
      render();
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.song-play');
      if (btn) playRow(btn.closest('.song-row, .featured-strip'));
    });

    window.addEventListener('pagehide', save);

    if ('mediaSession' in navigator) {
      const actions = {
        play: play,
        pause: () => audio.pause(),
        previoustrack: () => step(-1),
        nexttrack: () => step(1)
      };
      Object.keys(actions).forEach((name) => {
        try { navigator.mediaSession.setActionHandler(name, actions[name]); } catch (e) {}
      });
    }
  }

  function restore() {
    audio.muted = !!saved.muted;
    audio.volume = volume;
    renderVolume();
    setLoop(saved.loop !== false);

    const start = saved.file ? trackFor(saved.file, saved.title, saved.artist) : playlist[0];
    if (!start) {
      ui.toggle.disabled = true;
      return;
    }
    load(start);

    // kebuka lewat reload / link biasa dan tadi lagi muter: coba lanjutin
    const fresh = saved.playing && Date.now() - saved.ts < 15000;
    if (fresh) {
      try { if (saved.time > 0) audio.currentTime = saved.time; } catch (e) {}
      play();
    }
  }

  function init() {
    if (!mount()) return;
    bind();
    restore();
  }

  LC.onPage(syncRows);
  LC.player = { init, audio };
})();
