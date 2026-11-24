# Oyen Jaga Postur 🐱

Teman kucing oranye yang ngingetin kamu duduk tegak, nemenin fokus pakai Pomodoro, dan nggak lupa nyuruh kamu minum. Semuanya jalan langsung di browser — tanpa akun, tanpa server.

- 🌐 **Coba di browser:** https://kocwng.github.io/oyen-jaga-postur/
- 🖥️ **Pasang aplikasi macOS** (Apple Silicon) — Oyen bisa muncul marah di atas semua aplikasi, termasuk yang layar penuh:

```bash
curl -fsSL https://kocwng.github.io/oyen-jaga-postur/install.sh | bash
```

Hapus lagi: `curl -fsSL https://kocwng.github.io/oyen-jaga-postur/install.sh | bash -s -- --uninstall`.
Atau unduh `.dmg`-nya langsung dari [halaman Releases](https://github.com/kocwng/oyen-jaga-postur/releases/latest).

> Aplikasi belum dinotarisasi Apple. Lewat perintah di atas aplikasinya langsung terbuka; kalau mengunduh `.dmg` lewat browser dan macOS memblokirnya, klik kanan aplikasinya → **Open**.

## Fitur

- **Deteksi postur via webcam** — kalibrasi sekali ("duduk tegak dulu ya, 3… 2… 1…"), lalu Oyen menegur dengan lucu kalau kamu bungkuk terlalu lama, dan memuji kalau kamu tegak lagi.
- **Pomodoro** — fokus / istirahat pendek / istirahat panjang (default 25/5/15, istirahat panjang tiap 4 sesi). Timer berbasis timestamp jadi tetap akurat walau tab di belakang. Tiap sesi selesai, Oyen dapat camilan + XP.
- **Tips peregangan** saat istirahat.
- **Pengingat minum** tiap N menit + penghitung gelas hari ini.
- **Progres** — level, XP, sesi hari ini, persentase postur bagus, streak harian.
- **Mode Galak 😾** (default nyala, bisa dimatikan di Pengaturan) — kalau kamu bungkuk terus:
  - **1× waktu tegur** (default 15 detik): Oyen menegur dengan lucu seperti biasa.
  - **2×**: Oyen **marah** dan **lompat muncul ke layar** — pop-up besar dengan Oyen cemberut, desis + geraman, dan omelan imut. Tombol “Iya iya, aku tegak 😅” (atau Esc) menunda pop-up 60 detik.
  - **3×**: makin marah — layar berkedip merah, omelan & desis diulang tiap ±20 detik.
  - Judul tab berkedip “😾 TEGAK!” dan favicon jadi 😾. Kalau tab sedang tidak dilihat, Oyen kirim **notifikasi sistem** bergambar Oyen marah.
  - Duduk tegak ±2 detik → “Nah gitu dong 😺”, Oyen reda dan memuji (lalu jeda 30 detik sebelum boleh marah lagi).
- **Oyen Melayang** — Oyen bisa “mengapung” di jendela kecil (Document Picture-in-Picture, Chrome/Edge terbaru). Saat Mode Galak, jendela ini berubah merah berkedip dengan Oyen marah dan tulisan besar “TEGAK! 😾”.
- **Notifikasi** opsional saat tab sedang tidak dilihat.

### Kenapa harus Oyen Melayang biar Oyen muncul di atas aplikasi lain?

Demi keamanan, halaman web **tidak bisa menggambar di atas aplikasi lain** (misalnya di atas VS Code atau Word). Satu-satunya jalan resmi adalah jendela **Document Picture-in-Picture** — jendela kecil yang selalu di atas. Jadi:

- Nyalakan kamera, lalu klik **Oyen Melayang 🪟**. Selama jendela itu terbuka, Oyen akan marah-marah di atas aplikasi apa pun yang sedang kamu pakai.
- Di Chrome versi baru, jendela ini bisa terbuka otomatis saat kamu pindah tab selagi kamera aktif (lewat Media Session `enterpictureinpicture`) — kalau browser belum mendukung, buka manual saja.
- Tanpa Oyen Melayang, Oyen cuma bisa muncul di halamannya sendiri + notifikasi sistem (kalau diizinkan).
- Browser tidak mengizinkan halaman memperbesar atau memindah jendela PiP tanpa klik dari kamu, jadi atur ukurannya sendiri sesukamu.
- Tetap bisa dipakai **tanpa kamera** (timer, pengingat minum, statistik).

## Versi Desktop (Tauri)

Ada juga versi desktop (macOS/Windows/Linux) berbasis [Tauri 2](https://tauri.app) di folder `desktop/`. Bedanya dengan versi web:

- Saat Mode Galak, **Oyen muncul besar di atas semua aplikasi** lewat jendela overlay transparan selayar penuh — tanpa perlu Oyen Melayang (PiP) maupun notifikasi.
- Menutup jendela utama tidak menghentikan Oyen: ia tetap berjaga dari **menu bar / tray**.
- Kode antarmuka sama persis (`index.html`, `css/`, `js/`); overlay-nya ada di `desktop/overlay/`. Tampilan overlay bisa diuji di browser biasa: setelah skrip sinkronisasi menyalin file ke `desktop/dist/`, sajikan folder itu (mis. `python3 -m http.server 8000`) lalu buka `overlay.html?demo=2`, `?demo=3`, atau `?demo=calm`.

Cara build & jalankan: lihat [desktop/README.md](desktop/README.md).

## Privasi

Video dari kamera diproses **di perangkatmu sendiri** pakai MediaPipe di browser dan **tidak pernah dikirim ke mana pun**. Data (pengaturan, statistik, kalibrasi) cuma disimpan di `localStorage` browser kamu dan bisa dihapus lewat **Pengaturan → Reset semua data**.

## Jalankan secara lokal

Kamera hanya bisa diakses lewat `https` atau `localhost`, jadi jangan buka `index.html` langsung dari file. Jalankan server statis sederhana:

```bash
python3 -m http.server 8000
```

Lalu buka http://localhost:8000.

## Deploy ke GitHub Pages

1. Push repo ini ke GitHub.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch** → branch `main`, folder `/ (root)` → **Save**.
4. Tunggu sebentar, situs akan tersedia di `https://<username>.github.io/<nama-repo>/`.

Semua path di proyek ini relatif, dan ada file `.nojekyll` supaya GitHub Pages menyajikan file apa adanya.

## Struktur file

```
oyen-jaga-postur/
├── index.html      # halaman utama
├── css/style.css   # tampilan (terang & gelap)
├── js/app.js       # app shell: timer, postur, minum, statistik, PiP, pengaturan
├── js/pose.js      # deteksi pose & kalibrasi (MediaPipe)
├── js/oyen.js      # karakter Oyen (ekspresi, suara, animasi)
├── desktop/        # versi desktop Tauri 2 (overlay di desktop/overlay/)
├── .nojekyll
└── README.md
```

## Kredit

- Deteksi pose: [MediaPipe](https://developers.google.com/mediapipe) oleh Google.
- Font: [Fredoka](https://fonts.google.com/specimen/Fredoka) via Google Fonts.
- Oyen: kucing oranye kesayangan semua orang 🧡
