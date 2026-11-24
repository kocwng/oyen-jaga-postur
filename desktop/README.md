# Oyen Jaga Postur — Versi Desktop (Tauri 2)

Versi desktop dari web app Oyen Jaga Postur. Bedanya dengan versi web: saat kamu
membungkuk, **Oyen yang marah muncul di atas semua aplikasi** lewat jendela overlay
transparan yang selalu di atas (always-on-top). Menutup jendela utama hanya
menyembunyikannya, jadi pemantauan postur jalan terus dari ikon tray / menu bar.

## Prasyarat

- **Node.js** 18+ (untuk Tauri CLI dan skrip sinkronisasi).
- **Rust** (stable) lewat [rustup](https://rustup.rs).
- **macOS**: Xcode Command Line Tools (`xcode-select --install`).
- Ikon aplikasi di `src-tauri/icons/`. Buat sekali dari PNG persegi 1024x1024:

  ```sh
  npx tauri icon path/ke/oyen-1024.png
  ```

## Menjalankan

```sh
cd desktop
npm install        # memasang @tauri-apps/cli (biner siap pakai)
npm run dev        # mode pengembangan
npm run build      # build rilis
```

Hasil build rilis (`.app` dan `.dmg`) ada di `src-tauri/target/release/bundle/`.

`npm run dev` dan `npm run build` otomatis menjalankan `npm run sync`
(`scripts/sync-web.mjs`), yang menyalin `../index.html`, `../css`, `../js` dan isi
`overlay/` ke `dist/`. Jangan mengedit `dist/` langsung — edit sumber aslinya.

## Izin kamera (macOS)

Saat pertama kali dibuka, macOS akan meminta izin kamera dengan pesan dari
`src-tauri/Info.plist`. Video diproses di perangkatmu dan tidak dikirim ke mana pun.
Kalau tidak sengaja menolak, aktifkan lagi di **Pengaturan Sistem → Privasi &
Keamanan → Kamera**. Jika app nanti ditandatangani (codesign) dengan hardened
runtime, tambahkan entitlement `com.apple.security.device.camera`.

## Cara kerja overlay

1. Jendela `main` menjalankan web app (kamera + deteksi postur). Throttling latar
   belakang dimatikan agar deteksi tetap jalan walau jendela tersembunyi/tertutup.
2. Saat postur buruk, web app memanggil perintah Rust `overlay_show`. Rust
   memperbesar jendela `overlay` (transparan, tanpa bingkai, always-on-top, tampil di
   semua Space) menutupi monitor tempat kursor berada, menampilkannya, lalu mengirim
   event `oyen-anger` ke halaman overlay.
3. Saat postur membaik, web app memanggil `overlay_calm` → event `oyen-calm`; halaman
   overlay memutar animasi senang lalu memanggil `overlay_hide`.
4. Tombol "tunda" di overlay memanggil `overlay_snooze` → overlay disembunyikan dan
   jendela utama menerima event `oyen-snooze` (tunda 60 detik).
5. Saat tersembunyi, overlay mengabaikan klik mouse sehingga tidak mengganggu
   aplikasi lain.

Menu tray: **Buka Oyen**, **Sembunyikan jendela**, **Keluar**. Klik kiri ikon tray
(atau ikon Dock di macOS) untuk membuka jendela utama lagi.
