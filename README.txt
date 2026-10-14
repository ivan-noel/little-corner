little corner. — panduan singkat
=================================

Situs ini murni HTML/CSS/JS statis. Tidak perlu install apa pun —
tinggal buka index.html di browser, atau upload semua isi folder ini
ke hosting/GitHub Pages.

DI MANA HARUS ISI KONTEN SENDIRI
---------------------------------

1. FOTO ENA (Memory Room)
   Taruh foto dengan nama persis:  assets/images/profile/ena.jpg
   Fotonya akan otomatis muncul menggantikan placeholder huruf "E" —
   tidak perlu edit kode sama sekali.

2. MUSIK / LAGU (sidebar + Music Corner + Music Library)
   Taruh file mp3 di assets/audio/. Nama file harus sama persis dengan
   yang ditulis di kode, termasuk huruf besar-kecil (di hosting seperti
   GitHub Pages "am-I-bothering-you.mp3" dan "am-i-bothering-you.mp3"
   dianggap dua file yang beda).
   Menambah lagu baru butuh dua langkah:
     a. daftarkan di assets/js/data/playlist.js (ini yang dipakai tombol
        prev/next dan judul di sidebar)
     b. tambah barisnya di pages/music-library.html (salin satu blok
        <div class="song-row"> lalu ganti data-title, data-artist,
        data-file, dan teksnya)

3. GAME TAMBAHAN (Game Shelf + Game Library)
   Ada 10 slot game di pages/game-shelf.html dan pages/game-library.html
   (cari kata GAMES = [ ... ] di gen.py kalau kamu pakai generator,
   atau langsung cari "Judul Game 5" dst di kedua file HTML tersebut).
   Setiap kartu punya cover, judul, genre, rating bintang (1-5), dan
   review — tinggal ganti gambar cover di assets/images/games/ dan
   edit teksnya.

4. FOTO GALERI (Open Window + Photo Library)
   Buka pages/gallery-library.html, cari bagian:
     window.GALLERY_PHOTOS = [ "gallery1.jpg", "gallery2.jpg", ... ];
   Tambahkan nama file foto barumu ke daftar itu (taruh filenya di
   assets/images/gallery/). Mendukung sampai 100 foto — makin banyak
   nama file di daftar itu, makin banyak foto yang muncul di galeri,
   lengkap dengan lightbox (klik foto untuk memperbesar + navigasi
   panah kiri/kanan/Escape).

TENTANG PEMUTAR MUSIK
---------------------
Di layar kecil (HP) pemutar ada di dalam menu samping, jadi setelah ada lagu
yang diputar muncul mini player di bagian bawah layar (play/pause, next).
Mengetuk nama lagunya membuka menu dengan kontrol lengkap.

Featured Song di Music Corner juga bisa diputar lewat tombol di covernya.
Untuk mengganti lagunya, ubah data-file, data-title, dan data-artist di
<div class="featured-strip"> (nama file mp3 harus ada di assets/audio/).

Pemutar di sidebar punya tombol play/pause, geser posisi lagu, prev/next,
repeat (default: ulang lagu yang sama, seperti sebelumnya), dan volume
(+ mute). Volume dan lagu terakhir diingat browser.

Musik tidak putus saat pindah halaman: yang diganti cuma isi <main>,
sidebar (beserta pemutarnya) tetap di tempat. Ini dikerjakan
assets/js/modules/router.js dan butuh situs dibuka lewat http(s), jadi
jalan di GitHub Pages atau server lokal (mis. "python -m http.server").
Kalau index.html dibuka langsung dari folder (file://), pindah halaman
kembali normal (halaman dimuat ulang); pemutar tetap mencoba melanjutkan
lagunya, tapi sebagian browser menahan autoplay sampai tombol play ditekan
lagi.

STRUKTUR KODE
-------------
assets/css/reset.css          -> reset
assets/css/layout.css         -> struktur / kerangka halaman
assets/css/theme.css          -> warna, font, tampilan
assets/css/player.css         -> widget pemutar musik (pakai variabel tema)
assets/js/main.js             -> titik awal, nyalain semua modul
assets/js/data/playlist.js    -> daftar lagu
assets/js/modules/player.js   -> pemutar musik
assets/js/modules/router.js   -> pindah halaman tanpa reload
assets/js/modules/page.js     -> efek muncul pas scroll, anchor, back to top
assets/js/modules/gallery.js  -> grid foto + lightbox

Halaman baru: salin salah satu file di pages/ (termasuk tag <script defer>
dan <link> di bagian <head>-nya). Widget musik di sidebar tidak perlu
ditulis manual, <div class="sidebar-foot"></div> dibiarkan kosong.

STRUKTUR HALAMAN
------------------
index.html                    -> Homepage
pages/living-room.html        -> About + akses ke semua ruangan
pages/game-shelf.html         -> Cuplikan 4 game favorit
pages/game-library.html       -> Semua 10 game + rating & review
pages/music-corner.html       -> 6 lagu favorit
pages/music-library.html      -> Semua 10 lagu
pages/memory-room.html        -> Cerita Mizuki & Ena
pages/open-window.html        -> Cuplikan galeri
pages/gallery-library.html    -> Galeri penuh (sampai 100 foto) + lightbox
pages/connect.html            -> Social links + footer
