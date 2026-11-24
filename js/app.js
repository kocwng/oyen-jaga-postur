// =========================================================
// Oyen Jaga Postur — app shell
// Merangkai pose tracker (js/pose.js) + Oyen (js/oyen.js)
// dengan Pomodoro, pengingat minum, statistik, PiP, pengaturan.
// =========================================================

// ---------------------------------------------------------
// Konstanta & teks
// ---------------------------------------------------------
const STATUS = { GOOD: 'good', SLOUCH: 'slouch', AWAY: 'away', NOCAL: 'nocal', CALIBRATING: 'calibrating' };

const DEFAULT_SETTINGS = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  slouchSec: 15,
  sensitivity: 0.5,
  waterEnabled: true,
  waterMin: 45,
  muted: false,
  notify: false,
  showPreview: true,
  galak: true, // Mode Galak: Oyen marah & muncul ke layar kalau bungkuk kelamaan
};

const ALERT_COOLDOWN_MS = 60_000;
const IDLE_SLEEP_MS = 5 * 60_000;
const STRETCH_PHASE_MS = 60_000;
const XP_PER_SESSION = 10;
const SESSIONS_PER_LEVEL = 4;

// Mode Galak (eskalasi bungkuk)
const ANGRY_REPEAT_MS = 20_000;   // jarak minimal meong marah berulang di tahap 3
const CALM_GOOD_MS = 2000;        // harus tegak terus selama ini biar Oyen reda
const ANGER_COOLDOWN_MS = 30_000; // jeda setelah reda sebelum pop-up boleh muncul lagi
const POPUP_SNOOZE_MS = 60_000;   // tombol "Iya iya" / Esc menunda pop-up
const AWAY_RESET_MS = 10_000;     // pergi lebih lama dari ini → eskalasi direset
const ANGRY_TITLE = '😾 TEGAK! · Oyen';
const ANGRY_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%98%BE%3C/text%3E%3C/svg%3E";

const NAG_LINES = [
  'Punggungmu kayak udang rebus nih 🦐',
  'Tegak dikit yuk, Oyen ikut pegel 😿',
  'Psst… bahumu turun, kepalamu maju. Balik tegak yuk!',
  'Kucing aja duduknya rapi, masa kamu kalah? 🐱',
  'Leher bukan jerapah, jangan dijulurin terus ya 🦒',
  'Oyen nggak mau kamu encok. Tarik napas, tegakkan punggung~',
  'Hayo, layar nggak bakal kabur kok. Mundur dikit, duduk tegak!',
  'Meong! Saatnya reset postur: bahu rileks, dagu masuk 👌',
];

const PRAISE_LINES = [
  'Nah gitu dong! Kerennn ✨',
  'Postur juara! Oyen bangga 😻',
  'Tegak lagi, mantap! Lanjutkan~',
  'Makasih udah dengerin Oyen 🧡',
  'Punggung lurus, hati senang 🐾',
];

// Tahap 2: marah tapi tetap imut
const ANGRY_LINES = [
  'HEH! Punggungmu udah kayak tanda tanya! TEGAK! 😾',
  'Oyen nggak mau ngomong sama kamu sebelum kamu duduk tegak. Hmph!',
  'Udang aja malu liat postur kamu 🦐💢',
  'Kamu duduk apa lagi meleleh?! Tegak sekarang! 😾',
  'Oyen udah bilang baik-baik lho tadi… SEKARANG TEGAK! 💢',
  'Leher kamu udah maju sejauh harapan Oyen dapat ikan. TARIK BALIK! 🐟😾',
  'Grrr… bahu turun, punggung bengkok. Oyen ngambek nih! 😤',
  'Mau jadi kucing bungkuk kayak di Halloween? Nggak kan?! TEGAK! 🎃😾',
];

// Tahap 3: makin marah
const FURIOUS_LINES = [
  'HSSSS! Oyen udah nungguin dari tadi! DUDUK. TEGAK. SEKARANG! 😾💢',
  'Oke cukup! Oyen mogok jaga kamu kalau kamu nggak tegak! 😤💢',
  'Punggungmu udah kayak pisang! Oyen nggak suka pisang! TEGAK! 🍌😾',
  'Oyen hitung sampai tiga ya… SATU… DUA… KOK BELUM TEGAK?! 💢',
  'Kalau kamu nggak tegak, Oyen dudukin keyboard kamu! 😾⌨️',
  'Encok itu nyata, Kak! Oyen marah karena sayang! TEGAK!! 😾🧡',
  'Grrrr… ekor Oyen udah ngembang segede sapu! Duduk yang bener! 🧹💢',
  'HEH HEH HEH! Masih bungkuk aja?! Oyen cakar kursimu nih! 😾🐾',
];

const PIP_TIP = 'Tips: nyalakan Oyen Melayang 🪟 biar aku bisa muncul di atas aplikasi lain waktu kamu bungkuk!';

const STRETCH_TIPS = [
  'Putar bahu ke belakang 10x pelan-pelan 🔄',
  'Tarik dagu ke belakang (double chin!) tahan 5 detik, ulangi 5x',
  'Miringkan kepala ke kanan, tahan 15 detik, ganti kiri 🙆',
  'Jalin jari, dorong tangan ke depan, rasakan punggung atas meregang',
  'Berdiri, tangan di pinggang, condong ke belakang sedikit 5x',
  'Putar badan ke kanan sambil duduk, pegang sandaran kursi, ganti kiri',
  'Lihat benda jauh 20 detik biar mata istirahat 👀',
  'Regangkan pergelangan: tangan lurus, tarik jari ke belakang 15 detik ✋',
];

const WATER_LINES = [
  'Minum dulu yuk! Oyen juga haus 💧',
  'Glek glek… waktunya segelas air 🥛',
  'Jangan lupa minum ya, biar nggak pusing 💦',
  'Ginjalmu titip salam: minum air dong 💧',
];

const FOCUS_DONE_LINES = [
  'Sesi fokus selesai! Oyen dapat camilan 🐟',
  'Yeay, satu sesi beres! Nyam nyam 🍣',
  'Hebat! Fokus terus sampai tuntas 🎉',
];

const CAMERA_ERRORS = {
  'no-camera': 'Kamera nggak ketemu 😿 Pastikan webcam terpasang dan nggak lagi dipakai aplikasi lain.',
  'denied': 'Izin kamera ditolak. Klik ikon gembok/kamera di address bar → izinkan Kamera, lalu coba lagi ya.',
  'model-failed': 'Model pose gagal dimuat. Cek koneksi internet (cuma perlu sekali buat unduh model), lalu coba lagi.',
  'insecure': 'Kamera cuma bisa dipakai lewat https atau localhost. Coba buka lewat alamat yang aman ya.',
  'module': 'Modul deteksi pose gagal dimuat. Coba muat ulang halaman ya.',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ---------------------------------------------------------
// DOM helper (semua lookup dijaga)
// ---------------------------------------------------------
const $ = (id) => document.getElementById(id);
const on = (el, ev, fn, opts) => { if (el) el.addEventListener(ev, fn, opts); };
const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };

const els = {};
function grabElements() {
  [
    'oyen-stage', 'oyen-message', 'posture-label', 'posture-meter', 'posture-fill',
    'level-num', 'xp-label', 'xp-fill',
    'timer-mode', 'timer-display', 'session-dots', 'btn-timer-start', 'btn-timer-reset', 'btn-timer-skip',
    'btn-pip', 'pip-hint', 'pip-galak-hint',
    'toggle-preview', 'camera-wrap', 'cam-video', 'cam-canvas', 'btn-camera', 'btn-calibrate', 'camera-status',
    'stat-sessions', 'stat-posture', 'stat-water', 'stat-streak', 'stat-posture-detail', 'btn-drink', 'water-next',
    'set-focus', 'set-short', 'set-long', 'set-long-every', 'set-slouch', 'set-sensitivity', 'sensitivity-value',
    'set-water-enabled', 'set-water-min', 'set-mute', 'set-notify', 'notify-hint', 'btn-clear-cal', 'btn-reset-all',
    'set-galak',
  ].forEach((id) => { els[id] = $(id); });
  els.timerCard = document.querySelector('.timer-card');
}

// =========================================================
// STATE & STORAGE
// =========================================================
const store = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem('oyen.' + key);
      if (raw == null) return fallback;
      const val = JSON.parse(raw);
      return val ?? fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { window.localStorage.setItem('oyen.' + key, JSON.stringify(val)); } catch { /* storage penuh/terblokir: abaikan */ }
  },
  clearAll() {
    try {
      const ls = window.localStorage;
      const keys = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith('oyen.')) keys.push(k);
      }
      keys.forEach((k) => ls.removeItem(k));
    } catch { /* abaikan */ }
  },
};

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function freshStats() {
  return { date: dateKey(), sessions: 0, focusMin: 0, goodMs: 0, trackedMs: 0, water: 0 };
}

const settings = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) };
let stats = { ...freshStats(), ...store.get('stats', {}) };
const progress = { totalSessions: 0, lastSessionDate: null, streak: 0, ...store.get('progress', {}) };

const timer = {
  mode: 'focus',          // 'focus' | 'short' | 'long'
  running: false,
  endAt: null,            // Date.now() target saat berjalan
  remainingMs: null,      // sisa saat dijeda / belum mulai
  cycleCount: 0,          // sesi fokus sejak istirahat panjang terakhir
  phaseStartedAt: null,   // kapan fase sekarang mulai berjalan
  ...store.get('timer', {}),
};

const posture = {
  status: null,
  score: null,
  alerted: false,
  lastAlertAt: 0,
  lastSampleAt: null,
};

const ui = {
  oyen: null,
  tracker: null,
  poseModule: null,
  cameraOn: false,
  cameraBusy: false,
  calibrating: false,
  feeding: false,
  currentMood: null,
  holdMood: null,
  holdUntil: 0,
  lastInteraction: Date.now(),
  lastWaterAt: Date.now(),
  lastTitle: '',
  pip: null, // { win, oyenEl, timerEl, modeEl, fillEl, angryEl }
  statsDirty: false,
  skipSaveOnUnload: false,
  oyenModule: null,
  angryMood: 'alert',   // jadi 'angry' kalau oyen.js mendukung
  overlay: null,        // pop-up Oyen marah (dibuat saat pertama dibutuhkan)
  angrySnapshot: null,  // data URL PNG Oyen marah untuk notifikasi
  angryNotif: null,
  faviconHref: null,
  pipTipShown: false,
};

// Mode Galak: status eskalasi bungkuk
const anger = {
  stage: 0,           // 0 aman · 1 tegur · 2 pop-up marah · 3 marah banget
  slouchMs: 0,        // akumulasi bungkuk beruntun (dijeda saat pergi sebentar)
  prevStatus: null,
  lastAt: null,       // waktu sampel pose terakhir
  goodSince: null,
  awaySince: null,
  lastMeowAt: 0,
  cooldownUntil: 0,
  snoozeUntil: 0,
  line: '',
};

// =========================================================
// DESKTOP (Tauri 2) — Oyen bisa muncul di atas semua aplikasi
// Di web (GitHub Pages) semua ini diam: IS_DESKTOP = false.
// =========================================================
const TAURI = window.__TAURI__ ?? null;
const IS_DESKTOP = !!TAURI?.core?.invoke;
const DESKTOP_HINT = '🖥️ Versi desktop: Oyen bisa muncul di atas semua aplikasi. Tutup jendela ini = Oyen tetap jaga dari menu bar.';

const desktop = {
  overlayOpen: false, // jendela overlay sedang menampilkan Oyen marah
  failed: false,      // invoke gagal → pakai pop-up di halaman seperti versi web
};

/** Pop-up marah lewat jendela overlay Tauri (bukan pop-up di halaman)? */
function useDesktopOverlay() { return IS_DESKTOP && !desktop.failed; }

function desktopInvoke(cmd, args) {
  try { return Promise.resolve(TAURI.core.invoke(cmd, args)); } catch (e) { return Promise.reject(e); }
}

function desktopEmit(name, payload) {
  try { Promise.resolve(TAURI?.event?.emit?.(name, payload)).catch(() => {}); } catch { /* abaikan */ }
}

function desktopShowOverlay(stage, title, text) {
  desktop.overlayOpen = true;
  desktopInvoke('overlay_show', { stage, title, text, level: levelFor(progress.totalSessions) }).catch((e) => {
    console.warn('[oyen] overlay_show gagal, pakai pop-up di halaman:', e);
    desktop.failed = true;
    desktop.overlayOpen = false;
    if (anger.stage >= 2 && settings.galak && Date.now() >= anger.snoozeUntil) showAngryOverlay();
  });
}

function desktopCalmOverlay(text) {
  desktop.overlayOpen = false;
  desktopInvoke('overlay_calm', { text }).catch((e) => {
    console.warn('[oyen] overlay_calm gagal:', e);
    desktopInvoke('overlay_hide').catch(() => {});
  });
}

function desktopHideOverlay() {
  desktop.overlayOpen = false;
  desktopInvoke('overlay_hide').catch((e) => console.warn('[oyen] overlay_hide gagal:', e));
  desktopEmit('oyen-reset'); // overlay ikut kembali ke keadaan tersembunyi
}

function initDesktop() {
  if (!IS_DESKTOP) return;
  document.documentElement.classList.add('is-desktop');

  // Oyen Melayang (PiP) nggak diperlukan: overlay sudah tampil di atas semua aplikasi
  ['btn-pip', 'pip-hint', 'pip-galak-hint'].forEach((id) => { if (els[id]) els[id].hidden = true; });

  const status = els['camera-status'];
  if (status && !$('desktop-hint')) {
    const p = document.createElement('p');
    p.id = 'desktop-hint';
    p.className = 'hint desktop-hint';
    p.textContent = DESKTOP_HINT;
    status.insertAdjacentElement('afterend', p);
  }

  // Tanpa izin notifikasi browser di desktop
  if (els['set-notify']) { els['set-notify'].checked = false; els['set-notify'].disabled = true; }
  setText(els['notify-hint'], 'Di versi desktop, Oyen langsung muncul di atas semua aplikasi — notifikasi nggak diperlukan.');

  // Tombol "Iya iya, aku tegak 😅" / Esc di overlay → snooze yang sama dengan versi web
  try {
    Promise.resolve(TAURI.event?.listen?.('oyen-snooze', () => snoozeAngryOverlay({ fromDesktop: true })))
      .catch((e) => console.warn('[oyen] listen oyen-snooze gagal:', e));
  } catch (e) { console.warn('[oyen] listen oyen-snooze gagal:', e); }
}

function saveSettings() { store.set('settings', settings); }
function saveStats() { store.set('stats', stats); ui.statsDirty = false; }
function saveProgress() { store.set('progress', progress); }
function saveTimer() {
  store.set('timer', {
    mode: timer.mode, running: timer.running, endAt: timer.endAt,
    remainingMs: timer.remainingMs, cycleCount: timer.cycleCount, phaseStartedAt: timer.phaseStartedAt,
  });
}

function ensureToday() {
  if (stats.date !== dateKey()) {
    stats = freshStats();
    saveStats();
    return true;
  }
  return false;
}

// ---------------------------------------------------------
// Oyen (dengan fallback kalau modul gagal dimuat)
// ---------------------------------------------------------
function createOyenStub(container) {
  if (container) {
    container.innerHTML = '<p class="oyen-fallback">😿 Oyen lagi nggak bisa tampil, tapi timer &amp; pengingat tetap jalan.</p>';
  }
  let mood = 'neutral';
  return {
    setMood(m) { mood = m; }, getMood() { return mood; },
    setPostureScore() {}, setLevel() {}, feed() { return Promise.resolve(); },
    say() {}, meow() {}, setMuted() {}, mount() {}, destroy() {}, el: null,
    setAnger() {}, snapshot() { return Promise.resolve(null); },
  };
}

function speak(text, ms = 5000) {
  try { ui.oyen?.say(text, ms); } catch { /* abaikan */ }
  if (els['oyen-message']) {
    // kosongkan dulu supaya pembaca layar mengumumkan teks yang sama berulang
    els['oyen-message'].textContent = '';
    setTimeout(() => { if (els['oyen-message']) els['oyen-message'].textContent = text; }, 60);
  }
}

function meow(kind) {
  try { ui.oyen?.meow(kind); } catch { /* abaikan */ }
}

function holdMood(mood, ms) {
  ui.holdMood = mood;
  ui.holdUntil = Date.now() + ms;
  applyMood(true);
}

function desiredMood(now) {
  if (anger.stage >= 2 && ui.cameraOn) return ui.angryMood;
  if (ui.holdMood && now < ui.holdUntil) return ui.holdMood;
  ui.holdMood = null;

  const isBreak = timer.mode !== 'focus';
  if (isBreak && timer.running) {
    if (now - (timer.phaseStartedAt || now) < STRETCH_PHASE_MS) return 'stretch';
    if (!ui.cameraOn || posture.status === STATUS.AWAY) return 'sleep';
    return 'neutral';
  }

  if (ui.cameraOn && posture.status) {
    switch (posture.status) {
      case STATUS.GOOD: return 'happy';
      case STATUS.SLOUCH: return 'slouch';
      case STATUS.AWAY: return 'away';
      default: return 'neutral';
    }
  }

  if (!timer.running && now - ui.lastInteraction > IDLE_SLEEP_MS) return 'sleep';
  return timer.running ? 'happy' : 'neutral';
}

function applyMood(force = false) {
  if (!ui.oyen || ui.feeding) return;
  const mood = desiredMood(Date.now());
  if (force || mood !== ui.currentMood) {
    ui.currentMood = mood;
    try { ui.oyen.setMood(mood); } catch { /* abaikan */ }
  }
}

// ---------------------------------------------------------
// Notifikasi
// ---------------------------------------------------------
function canNotify() {
  return !IS_DESKTOP && settings.notify && 'Notification' in window && Notification.permission === 'granted';
}

function notify(title, body) {
  if (!document.hidden || !canNotify()) return;
  try {
    const n = new Notification(title, { body, tag: 'oyen-' + title, renotify: true });
    n.onclick = () => { try { window.focus(); n.close(); } catch { /* abaikan */ } };
  } catch { /* beberapa browser (mis. Android) tidak izinkan konstruktor Notification */ }
}

// =========================================================
// TIMER (Pomodoro berbasis timestamp)
// =========================================================
const MODE_LABEL = { focus: 'Fokus', short: 'Istirahat pendek', long: 'Istirahat panjang' };

function modeDurationMs(mode) {
  const min = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin;
  return Math.round(min * 60_000);
}

function timerRemainingMs(now = Date.now()) {
  if (timer.running && timer.endAt) return Math.max(0, timer.endAt - now);
  if (typeof timer.remainingMs === 'number') return Math.max(0, timer.remainingMs);
  return modeDurationMs(timer.mode);
}

function isFreshPhase() {
  return !timer.running && (timer.remainingMs == null || timer.remainingMs >= modeDurationMs(timer.mode));
}

function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  const now = Date.now();
  const remaining = timerRemainingMs(now);
  const fresh = isFreshPhase();
  if (fresh || !timer.phaseStartedAt) timer.phaseStartedAt = now;
  timer.endAt = now + remaining;
  timer.remainingMs = null;
  timer.running = true;
  saveTimer();
  applyFpsForMode();
  if (timer.mode === 'focus') speak(fresh ? 'Fokus dimulai! Oyen jagain posturmu ya 💪' : 'Lanjut fokus! 💪', 3000);
  renderTimer();
  applyMood();
}

function pauseTimer() {
  if (!timer.running) return;
  timer.remainingMs = timerRemainingMs();
  timer.running = false;
  timer.endAt = null;
  saveTimer();
  renderTimer();
  applyMood();
}

function resetTimer() {
  timer.running = false;
  timer.endAt = null;
  timer.remainingMs = modeDurationMs(timer.mode);
  timer.phaseStartedAt = null;
  saveTimer();
  renderTimer();
  applyMood();
}

function setPhase(mode, autoStart) {
  timer.mode = mode;
  timer.running = false;
  timer.endAt = null;
  timer.remainingMs = modeDurationMs(mode);
  timer.phaseStartedAt = null;
  if (autoStart) startTimer();
  else { saveTimer(); renderTimer(); }
  applyFpsForMode();
}

function nextBreakMode() {
  return timer.cycleCount >= settings.longEvery ? 'long' : 'short';
}

function beginBreak(mode, announceAfter = Promise.resolve()) {
  if (mode === 'long') timer.cycleCount = 0;
  setPhase(mode, true);
  const tip = pick(STRETCH_TIPS);
  holdMood('stretch', STRETCH_PHASE_MS);
  if (ui.cameraOn) setCameraStatus('Lagi istirahat — boleh matikan kamera biar hemat baterai 🔋');
  announceAfter.then(() => {
    speak(`${mode === 'long' ? 'Istirahat panjang' : 'Istirahat dulu'}~ ${tip}`, 12000);
    notify('Waktunya istirahat ☕', tip);
  });
}

function skipPhase() {
  if (timer.mode === 'focus') {
    beginBreak(nextBreakMode());
  } else {
    setPhase('focus', false);
    speak('Istirahat dilewati. Tekan Mulai kalau sudah siap fokus ya!', 4000);
  }
}

function completePhase() {
  const finished = timer.mode;
  if (finished === 'focus') {
    timer.cycleCount += 1;
    recordFocusSession();
    const line = pick(FOCUS_DONE_LINES);
    notify('Sesi fokus selesai! 🎉', line);
    meow('happy');
    speak(line, 4000);
    beginBreak(nextBreakMode(), feedOyen());
  } else {
    setPhase('focus', false);
    meow('soft');
    speak('Istirahat selesai! Siap fokus lagi? Tekan Mulai ya 🐾', 6000);
    notify('Istirahat selesai 🐾', 'Siap fokus lagi? Buka Oyen dan tekan Mulai.');
  }
}

function feedOyen() {
  if (!ui.oyen) return Promise.resolve();
  ui.feeding = true;
  let p;
  try { p = Promise.resolve(ui.oyen.feed()); } catch { p = Promise.resolve(); }
  return p.catch(() => {}).finally(() => {
    ui.feeding = false;
    ui.currentMood = null;
    applyMood(true);
  });
}

function renderTimer() {
  const now = Date.now();
  const remaining = timerRemainingMs(now);
  const text = formatMs(remaining);
  const isBreak = timer.mode !== 'focus';

  setText(els['timer-display'], text);
  if (els['timer-mode']) {
    setText(els['timer-mode'], MODE_LABEL[timer.mode]);
    els['timer-mode'].classList.toggle('chip-focus', !isBreak);
    els['timer-mode'].classList.toggle('chip-break', isBreak);
  }
  if (els['btn-timer-start']) {
    const label = timer.running ? 'Jeda ⏸' : isFreshPhase() ? 'Mulai ▶' : 'Lanjut ▶';
    setText(els['btn-timer-start'], label);
  }
  els.timerCard?.classList.toggle('is-paused', !timer.running && !isFreshPhase());

  // Titik sesi menuju istirahat panjang
  const dots = els['session-dots'];
  if (dots) {
    const n = settings.longEvery;
    if (dots.childElementCount !== n) {
      dots.innerHTML = '';
      for (let i = 0; i < n; i++) dots.appendChild(document.createElement('span'));
    }
    [...dots.children].forEach((d, i) => d.classList.toggle('is-done', i < timer.cycleCount));
    dots.setAttribute('aria-label', `${timer.cycleCount} dari ${n} sesi menuju istirahat panjang`);
  }

  // Judul tab
  let title;
  if (timer.running) title = `${isBreak ? '☕' : '⏳'} ${text} ${isBreak ? 'Istirahat' : 'Fokus'} · Oyen`;
  else if (!isFreshPhase()) title = `⏸ ${text} Dijeda · Oyen`;
  else title = 'Oyen Jaga Postur 🐱';
  // Mode Galak: judul tab kedip-kedip tiap detik (ikut tick yang sudah ada)
  if (anger.stage >= 2 && Math.floor(now / 1000) % 2 === 0) title = ANGRY_TITLE;
  if (title !== ui.lastTitle) { document.title = title; ui.lastTitle = title; }

  // PiP
  if (ui.pip) {
    setText(ui.pip.timerEl, text);
    setText(ui.pip.modeEl, timer.running ? MODE_LABEL[timer.mode] : `${MODE_LABEL[timer.mode]} · dijeda`);
  }
}

function applyFpsForMode() {
  if (!ui.tracker || !ui.cameraOn) return;
  const fps = timer.mode !== 'focus' && timer.running ? 2 : 4;
  try { ui.tracker.setFps(fps); } catch { /* abaikan */ }
}

// =========================================================
// POSTURE
// =========================================================
function onPoseUpdate(update) {
  if (!update) return;
  const now = Date.now();
  const { status, score } = update;
  posture.status = status;
  posture.score = typeof score === 'number' && Number.isFinite(score) ? clamp(score, 0, 1) : null;

  // Akumulasi waktu postur (hanya saat terdeteksi duduk)
  if (posture.lastSampleAt != null) {
    const dt = Math.min(now - posture.lastSampleAt, 2000);
    if (dt > 0 && (status === STATUS.GOOD || status === STATUS.SLOUCH)) {
      ensureToday();
      stats.trackedMs += dt;
      if (status === STATUS.GOOD) stats.goodMs += dt;
      ui.statsDirty = true;
    }
  }
  posture.lastSampleAt = now;

  if (posture.score != null) {
    try { ui.oyen?.setPostureScore(posture.score); } catch { /* abaikan */ }
  }

  handleSlouchLogic(status, now);
  renderPosture();
  applyMood();
}

function handleSlouchLogic(status, now) {
  const onBreak = timer.mode !== 'focus' && timer.running;
  const prevStatus = anger.prevStatus;
  const dt = anger.lastAt == null ? 0 : clamp(now - anger.lastAt, 0, 2000);
  anger.prevStatus = status;
  anger.lastAt = now;

  // Saat istirahat / kalibrasi / belum dikalibrasi: eskalasi dibatalkan diam-diam
  if (onBreak || ui.calibrating || (status !== STATUS.SLOUCH && status !== STATUS.GOOD && status !== STATUS.AWAY)) {
    if (anger.stage || anger.slouchMs) resetAnger();
    return;
  }

  if (status === STATUS.SLOUCH) {
    anger.goodSince = null;
    anger.awaySince = null;
    if (prevStatus === STATUS.SLOUCH) anger.slouchMs += dt;
    escalate(now);
    return;
  }

  if (status === STATUS.AWAY) {
    // Pergi sebentar: eskalasi dijeda. Kelamaan pergi: reset.
    anger.goodSince = null;
    if (anger.awaySince == null) anger.awaySince = now;
    if (now - anger.awaySince > AWAY_RESET_MS && (anger.stage || anger.slouchMs || posture.alerted)) resetAnger();
    return;
  }

  // STATUS.GOOD
  anger.awaySince = null;
  if (anger.stage >= 2) {
    if (anger.goodSince == null) anger.goodSince = now;
    if (now - anger.goodSince >= CALM_GOOD_MS) calmDown(now);
    return;
  }
  anger.slouchMs = 0;
  if (anger.stage) { anger.stage = 0; applyAnger(0); }
  if (posture.alerted) {
    posture.alerted = false;
    meow('happy');
    holdMood('happy', 3000);
    speak(pick(PRAISE_LINES), 4000);
  }
}

// =========================================================
// MODE GALAK — Oyen marah & muncul ke layar
// =========================================================
function escalate(now) {
  const S = settings.slouchSec * 1000;
  const ms = anger.slouchMs;

  // Tahap 1 (perilaku lama): tegur sekali, dengan cooldown
  if (ms >= S && anger.stage < 1) { anger.stage = 1; applyAnger(1); }
  if (ms >= S && anger.stage < 2 && !posture.alerted && now - posture.lastAlertAt >= ALERT_COOLDOWN_MS) {
    posture.alerted = true;
    posture.lastAlertAt = now;
    const line = pick(NAG_LINES);
    holdMood('alert', 6000);
    meow('alert');
    speak(line, 6000);
    notify('Oyen: tegak dulu yuk! 🐱', line);
  }

  if (!settings.galak) return;

  if (anger.stage < 2 && ms >= 2 * S && now >= anger.cooldownUntil) {
    enterAngry(ms >= 3 * S ? 3 : 2, now);
    return;
  }
  if (anger.stage === 2 && ms >= 3 * S) {
    enterAngry(3, now);
    return;
  }
  if (anger.stage >= 3 && now - anger.lastMeowAt >= ANGRY_REPEAT_MS) {
    anger.lastMeowAt = now;
    anger.line = pick(FURIOUS_LINES);
    meow('angry');
    speak(anger.line, 8000);
    if (isOverlayOpen()) showAngryOverlay();
  }
  // Pop-up yang ditunda muncul lagi setelah snooze habis
  if (anger.stage >= 2 && !isOverlayOpen() && now >= anger.snoozeUntil) showAngryOverlay();
}

function enterAngry(stage, now) {
  anger.stage = stage;
  anger.lastMeowAt = now;
  anger.line = pick(stage >= 3 ? FURIOUS_LINES : ANGRY_LINES);
  posture.alerted = true;
  applyAnger(stage);
  meow('angry');
  speak(anger.line, 8000);
  if (now >= anger.snoozeUntil || isOverlayOpen()) showAngryOverlay();
  setAngryFavicon(true);
  sendAngryNotification(anger.line);
  applyMood(true);
  renderTimer();
}

function calmDown(now) {
  const wasOpen = isOverlayOpen();
  anger.stage = 0;
  anger.slouchMs = 0;
  anger.goodSince = null;
  anger.cooldownUntil = now + ANGER_COOLDOWN_MS;
  posture.alerted = false;
  applyAnger(0);
  setAngryFavicon(false);
  closeAngryNotification();
  const line = pick(PRAISE_LINES);
  meow('happy');
  holdMood('happy', 3000);
  speak(line, 4000);
  if (wasOpen) celebrateAndCloseOverlay(line);
  renderTimer();
}

/** Batalkan eskalasi tanpa drama (istirahat, kamera mati, kelamaan pergi, dsb). */
function resetAnger() {
  const wasAngry = anger.stage >= 2;
  anger.stage = 0;
  anger.slouchMs = 0;
  anger.goodSince = null;
  anger.awaySince = null;
  posture.alerted = false;
  applyAnger(0);
  hideAngryOverlay();
  setAngryFavicon(false);
  closeAngryNotification();
  if (wasAngry) { ui.currentMood = null; applyMood(true); renderTimer(); }
}

function setOyenAnger(o, level) {
  try { if (typeof o?.setAnger === 'function') o.setAnger(level); } catch { /* abaikan */ }
}

function applyAnger(level) {
  setOyenAnger(ui.oyen, level);
  if (ui.overlay?.oyen && !ui.overlay.root.hidden && !ui.overlay.root.classList.contains('is-calm')) {
    setOyenAnger(ui.overlay.oyen, Math.max(2, level));
  }
  renderPipAnger();
}

// ---- Pop-up di halaman (atau jendela overlay di versi desktop) ----
function isOverlayOpen() {
  if (useDesktopOverlay()) return desktop.overlayOpen;
  return !!ui.overlay && !ui.overlay.root.hidden;
}

function angryTitle(lvl) { return lvl >= 3 ? 'OYEN MARAH BANGET! 😾💢' : 'Oyen marah! 😾'; }

function ensureOverlay() {
  if (ui.overlay) return ui.overlay;
  const root = document.createElement('div');
  root.id = 'angry-overlay';
  root.className = 'angry-overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="angry-vignette" aria-hidden="true"></div>
    <div class="angry-dialog" role="alertdialog" aria-modal="true" aria-labelledby="angry-title" aria-describedby="angry-text">
      <div class="angry-speech">
        <h2 id="angry-title" class="angry-title">Oyen marah! 😾</h2>
        <p id="angry-text" class="angry-text" aria-live="assertive"></p>
        <button id="btn-angry-ok" class="btn btn-primary btn-angry" type="button">Iya iya, aku tegak 😅</button>
      </div>
      <div id="angry-oyen" class="angry-oyen"></div>
    </div>`;
  document.body.appendChild(root);
  const o = {
    root,
    titleEl: root.querySelector('#angry-title'),
    textEl: root.querySelector('#angry-text'),
    btn: root.querySelector('#btn-angry-ok'),
    oyenBox: root.querySelector('#angry-oyen'),
    oyen: null,
    returnFocus: null,
    closeTimer: 0,
  };
  // Oyen kedua khusus pop-up (bisu: suara tetap dari Oyen utama)
  try {
    if (typeof ui.oyenModule?.createOyen === 'function') {
      o.oyen = ui.oyenModule.createOyen(o.oyenBox);
      o.oyen.setMuted(true);
    }
  } catch (e) { console.warn('[oyen] Oyen pop-up gagal dibuat:', e); o.oyen = null; }
  if (!o.oyen) o.oyenBox.innerHTML = '<span class="angry-emoji" aria-hidden="true">😾</span>';

  on(o.btn, 'click', () => snoozeAngryOverlay());
  on(root, 'keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); o.btn?.focus(); } // satu-satunya kontrol: kunci fokus
  });
  ui.overlay = o;
  return o;
}

function setBackgroundInert(onOff) {
  ['main', '.site-header', '.site-footer', '.skip-link'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.inert = onOff;
  });
}

function restoreOverlayFocus(o) {
  const el = o.returnFocus;
  o.returnFocus = null;
  if (el && el.isConnected && typeof el.focus === 'function') {
    try { el.focus({ preventScroll: true }); } catch { /* abaikan */ }
  } else if (o.root.contains(document.activeElement)) {
    try { document.activeElement.blur(); } catch { /* abaikan */ }
  }
}

function showAngryOverlay() {
  const lvl = Math.max(2, anger.stage);
  const title = angryTitle(lvl);
  const text = anger.line || pick(ANGRY_LINES);
  if (useDesktopOverlay()) { desktopShowOverlay(lvl, title, text); return; }

  const o = ensureOverlay();
  clearTimeout(o.closeTimer);
  o.root.classList.remove('is-calm', 'is-leaving');
  o.root.classList.toggle('anger-3', lvl >= 3);
  setText(o.titleEl, title);
  setText(o.textEl, text);
  try {
    o.oyen?.setLevel(levelFor(progress.totalSessions));
    o.oyen?.setMood(ui.angryMood);
  } catch { /* abaikan */ }
  setOyenAnger(o.oyen, lvl);

  if (!o.root.hidden) return; // sudah tampil: cukup perbarui isi
  const active = document.activeElement;
  o.returnFocus = active && active !== document.body && !o.root.contains(active) ? active : null;
  o.root.hidden = false;
  o.root.classList.remove('is-open');
  void o.root.offsetWidth; // mulai ulang animasi lompat
  o.root.classList.add('is-open');
  setBackgroundInert(true);
  try { o.btn.focus({ preventScroll: true }); } catch { /* abaikan */ }
}

function hideAngryOverlay() {
  if (useDesktopOverlay()) {
    if (desktop.overlayOpen) desktopHideOverlay();
    return;
  }
  const o = ui.overlay;
  if (!o || o.root.hidden) return;
  clearTimeout(o.closeTimer);
  o.closeTimer = 0;
  o.root.hidden = true;
  o.root.classList.remove('is-open', 'is-calm', 'is-leaving', 'anger-3');
  setBackgroundInert(false);
  restoreOverlayFocus(o);
}

/**
 * "Iya iya, aku tegak 😅" / Esc: tunda pop-up 60 detik (eskalasi tetap berjalan).
 * Dipakai tombol di halaman, Esc, dan event "oyen-snooze" dari overlay desktop
 * (fromDesktop: jendela overlay sudah disembunyikan oleh Rust).
 */
function snoozeAngryOverlay({ fromDesktop = false } = {}) {
  if (fromDesktop) {
    desktop.overlayOpen = false;
    if (anger.stage < 2) return;
  } else if (!isOverlayOpen() || ui.overlay?.root.classList.contains('is-calm')) {
    return;
  }
  anger.snoozeUntil = Date.now() + POPUP_SNOOZE_MS;
  hideAngryOverlay();
  speak('Hmph. Oyen tunggu ya… tapi beneran tegak! 😾', 4000);
}

function celebrateAndCloseOverlay(line) {
  if (useDesktopOverlay()) { desktopCalmOverlay(line); return; }
  const o = ui.overlay;
  if (!o || o.root.hidden) return;
  clearTimeout(o.closeTimer);
  o.root.classList.remove('anger-3');
  o.root.classList.add('is-calm');
  setText(o.titleEl, 'Nah gitu dong 😺');
  setText(o.textEl, line);
  try { o.oyen?.setMood('happy'); } catch { /* abaikan */ }
  setOyenAnger(o.oyen, 0);
  setBackgroundInert(false);
  restoreOverlayFocus(o);
  o.closeTimer = setTimeout(() => {
    o.root.classList.add('is-leaving');
    o.closeTimer = setTimeout(hideAngryOverlay, 350);
  }, 1700);
}

// ---- Favicon ----
function setAngryFavicon(angry) {
  const link = document.querySelector('link[rel~="icon"]');
  if (!link) return;
  if (ui.faviconHref == null) ui.faviconHref = link.getAttribute('href') || '';
  const href = angry ? ANGRY_FAVICON : ui.faviconHref;
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
}

// ---- Notifikasi sistem (tab tersembunyi & PiP tidak terbuka) ----
async function prepareAngrySnapshot() {
  if (IS_DESKTOP) return; // desktop tidak pakai notifikasi sistem
  if (ui.angrySnapshot || typeof ui.oyen?.snapshot !== 'function') return;
  try {
    const url = await ui.oyen.snapshot({ mood: 'angry', anger: 3, level: levelFor(progress.totalSessions), size: 192 });
    if (typeof url === 'string' && url) ui.angrySnapshot = url;
  } catch { /* tanpa ikon juga nggak apa-apa */ }
}

function sendAngryNotification(line) {
  if (!document.hidden || ui.pip || !canNotify()) return;
  try {
    const opts = { body: line, tag: 'oyen-angry', renotify: true, requireInteraction: true, silent: false };
    if (ui.angrySnapshot) { opts.icon = ui.angrySnapshot; opts.image = ui.angrySnapshot; }
    const n = new Notification('Oyen marah! 😾', opts);
    n.onclick = () => { try { window.focus(); n.close(); } catch { /* abaikan */ } };
    ui.angryNotif = n;
  } catch { /* beberapa browser tidak izinkan konstruktor Notification */ }
}

function closeAngryNotification() {
  const n = ui.angryNotif;
  ui.angryNotif = null;
  try { n?.close(); } catch { /* abaikan */ }
}

function scoreClass(score) {
  if (score == null) return '';
  if (score >= 0.7) return 'is-good';
  if (score >= 0.4) return 'is-warn';
  return 'is-bad';
}

function postureLabel() {
  if (!ui.cameraOn) return 'Kamera mati';
  switch (posture.status) {
    case STATUS.CALIBRATING: return 'Lagi kalibrasi…';
    case STATUS.NOCAL: return 'Belum dikalibrasi';
    case STATUS.AWAY: return 'Kamu lagi pergi?';
    case STATUS.GOOD: return `Tegak ${Math.round((posture.score ?? 1) * 100)}%`;
    case STATUS.SLOUCH: return `Bungkuk ${Math.round((posture.score ?? 0) * 100)}%`;
    default: return 'Menunggu…';
  }
}

function renderPosture() {
  const pct = ui.cameraOn && posture.score != null ? Math.round(posture.score * 100) : 0;
  const cls = ui.cameraOn ? scoreClass(posture.score) : '';
  const label = postureLabel();
  const apply = (fill) => {
    if (!fill) return;
    fill.style.width = pct + '%';
    fill.classList.remove('is-good', 'is-warn', 'is-bad');
    if (cls) fill.classList.add(cls);
  };
  apply(els['posture-fill']);
  if (ui.pip) apply(ui.pip.fillEl);
  setText(els['posture-label'], label);
  if (els['posture-meter']) {
    els['posture-meter'].setAttribute('aria-valuenow', String(pct));
    els['posture-meter'].setAttribute('aria-valuetext', label);
  }
}

// ---------------------------------------------------------
// Kamera & kalibrasi
// ---------------------------------------------------------
async function loadPoseModule() {
  if (!ui.poseModule) ui.poseModule = await import('./pose.js');
  return ui.poseModule;
}

async function ensureTracker() {
  if (ui.tracker) return ui.tracker;
  const mod = await loadPoseModule();
  if (mod.POSE_STATUS) Object.assign(STATUS, mod.POSE_STATUS);
  ui.tracker = mod.createPoseTracker({
    video: els['cam-video'],
    canvas: settings.showPreview ? els['cam-canvas'] : null,
    fps: 4,
    onUpdate: onPoseUpdate,
  });
  return ui.tracker;
}

function setCameraStatus(text) { setText(els['camera-status'], text); }

function renderCamera() {
  setText(els['btn-camera'], ui.cameraBusy ? 'Menyalakan…' : ui.cameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera');
  if (els['btn-camera']) {
    els['btn-camera'].disabled = ui.cameraBusy;
    els['btn-camera'].classList.toggle('btn-primary', !ui.cameraOn);
  }
  if (els['btn-calibrate']) els['btn-calibrate'].disabled = !ui.cameraOn || ui.calibrating;
  els['camera-wrap']?.classList.toggle('is-off', !ui.cameraOn);
  els['camera-wrap']?.classList.toggle('is-hidden', !settings.showPreview);
  renderPosture();
}

async function startCamera() {
  if (ui.cameraOn || ui.cameraBusy) return;
  if (!window.isSecureContext) { setCameraStatus(CAMERA_ERRORS.insecure); return; }
  if (!els['cam-video']) return;
  ui.cameraBusy = true;
  setCameraStatus('Lagi nyiapin kamera & model pose… (pertama kali bisa agak lama)');
  renderCamera();
  try {
    let tracker;
    try { tracker = await ensureTracker(); } catch (e) {
      const err = new Error('module'); err.code = 'module'; err.cause = e; throw err;
    }
    await tracker.start();
    ui.cameraOn = true;
    posture.lastSampleAt = null;
    try { tracker.setSensitivity(settings.sensitivity); } catch { /* abaikan */ }
    applyFpsForMode();
    let calibrated = false;
    try { calibrated = tracker.hasCalibration(); } catch { /* abaikan */ }
    prepareAngrySnapshot();
    if (pipSupported() && !ui.pip && !ui.pipTipShown) {
      ui.pipTipShown = true;
      setTimeout(() => {
        if (ui.cameraOn && !ui.pip && !ui.calibrating && anger.stage === 0) speak(PIP_TIP, 8000);
      }, calibrated ? 4000 : 7000);
    }
    if (calibrated) {
      setCameraStatus('Kamera nyala. Oyen lagi jagain posturmu 👀');
      speak('Oyen siap jagain posturmu! 👀', 3500);
    } else {
      setCameraStatus('Kamera nyala. Kalibrasi dulu yuk biar Oyen tahu posisi tegakmu.');
      speak('Kalibrasi dulu yuk biar Oyen tahu posisi tegakmu 🙏', 6000);
      els['btn-calibrate']?.classList.add('is-pulsing');
    }
  } catch (err) {
    ui.cameraOn = false;
    const msg = CAMERA_ERRORS[err?.code] || 'Waduh, kamera gagal nyala. Coba lagi ya 🙏';
    setCameraStatus(msg);
    speak(msg, 6000);
    console.warn('[oyen] kamera gagal:', err);
  } finally {
    ui.cameraBusy = false;
    renderCamera();
    applyMood();
  }
}

function stopCamera() {
  try { ui.tracker?.stop(); } catch { /* abaikan */ }
  ui.cameraOn = false;
  posture.status = null;
  posture.score = null;
  posture.lastSampleAt = null;
  resetAnger();
  anger.prevStatus = null;
  anger.lastAt = null;
  els['btn-calibrate']?.classList.remove('is-pulsing');
  setCameraStatus('Kamera dimatikan. Timer & pengingat tetap jalan kok.');
  if (ui.statsDirty) saveStats();
  renderCamera();
  applyMood(true);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCalibration() {
  if (!ui.cameraOn || !ui.tracker) { speak('Nyalakan kamera dulu ya 📷', 3000); return; }
  if (ui.calibrating) return;
  ui.calibrating = true;
  renderCamera();
  els['btn-calibrate']?.classList.remove('is-pulsing');
  try {
    speak('Duduk tegak dulu ya, 3… 2… 1…', 4000);
    setCameraStatus('Duduk tegak, lihat layar, bahu rileks…');
    await wait(1200);
    for (const n of ['3…', '2…', '1…']) {
      speak(`Duduk tegak dulu ya… ${n}`, 1200);
      setCameraStatus(`Kalibrasi dalam ${n}`);
      await wait(1000);
    }
    setCameraStatus('Tahan posisi… Oyen lagi mengukur 📏');
    let ok = false;
    try { ok = await ui.tracker.calibrate(); } catch (e) { console.warn('[oyen] kalibrasi gagal:', e); ok = false; }
    if (ok) {
      meow('happy');
      holdMood('happy', 3000);
      speak('Kalibrasi berhasil! Sekarang Oyen tahu postur tegakmu 😻', 5000);
      setCameraStatus('Kalibrasi tersimpan ✓');
    } else {
      meow('soft');
      speak('Hmm, Oyen belum bisa lihat kamu jelas. Pastikan kepala & bahu kelihatan, lalu coba lagi ya.', 7000);
      setCameraStatus('Kalibrasi gagal — pastikan kepala & bahu masuk kamera dan cahaya cukup.');
    }
  } finally {
    ui.calibrating = false;
    renderCamera();
  }
}

// =========================================================
// WATER
// =========================================================
function checkWater(now) {
  if (!settings.waterEnabled) return;
  if (now - ui.lastWaterAt >= settings.waterMin * 60_000) {
    ui.lastWaterAt = now;
    const line = pick(WATER_LINES);
    holdMood('drink', 8000);
    meow('soft');
    speak(line, 8000);
    notify('Waktunya minum 💧', line);
  }
}

function drink() {
  ensureToday();
  stats.water += 1;
  saveStats();
  ui.lastWaterAt = Date.now();
  holdMood('drink', 3000);
  speak(stats.water >= 8 ? `Gelas ke-${stats.water}! Kamu juara hidrasi 🏆` : `Sip! Gelas ke-${stats.water} hari ini 💧`, 3500);
  renderStats();
}

function renderWaterNext(now) {
  if (!els['water-next']) return;
  if (!settings.waterEnabled) { setText(els['water-next'], 'Pengingat minum mati'); return; }
  const left = Math.max(0, settings.waterMin * 60_000 - (now - ui.lastWaterAt));
  setText(els['water-next'], `Pengingat berikutnya ± ${Math.ceil(left / 60_000)} menit`);
}

// =========================================================
// STATS & PROGRESS
// =========================================================
function recordFocusSession() {
  ensureToday();
  const today = dateKey();
  stats.sessions += 1;
  stats.focusMin += settings.focusMin;
  progress.totalSessions += 1;
  if (progress.lastSessionDate !== today) {
    progress.streak = progress.lastSessionDate === yesterdayKey() ? (progress.streak || 0) + 1 : 1;
    progress.lastSessionDate = today;
  }
  const prevLevel = levelFor(progress.totalSessions - 1);
  const newLevel = levelFor(progress.totalSessions);
  saveStats();
  saveProgress();
  renderStats();
  if (newLevel > prevLevel) {
    setTimeout(() => speak(`Naik level! Oyen sekarang level ${newLevel} 🎉`, 5000), 5500);
  }
}

function levelFor(sessions) { return 1 + Math.floor(Math.max(0, sessions) / SESSIONS_PER_LEVEL); }

function currentStreak() {
  const last = progress.lastSessionDate;
  if (last === dateKey() || last === yesterdayKey()) return progress.streak || 0;
  return 0;
}

function renderStats() {
  ensureToday();
  setText(els['stat-sessions'], String(stats.sessions));
  setText(els['stat-water'], String(stats.water));
  setText(els['stat-streak'], `${currentStreak()} hari`);

  const trackedMin = Math.floor(stats.trackedMs / 60_000);
  const goodMin = Math.floor(stats.goodMs / 60_000);
  if (stats.trackedMs >= 10_000) {
    const pct = Math.round((stats.goodMs / stats.trackedMs) * 100);
    setText(els['stat-posture'], `${pct}%`);
    setText(els['stat-posture-detail'], `Postur bagus ${goodMin} dari ${trackedMin} menit dipantau · fokus ${stats.focusMin} menit`);
  } else {
    setText(els['stat-posture'], '–');
    setText(els['stat-posture-detail'], stats.focusMin ? `Fokus ${stats.focusMin} menit hari ini` : '');
  }

  const level = levelFor(progress.totalSessions);
  const xp = progress.totalSessions * XP_PER_SESSION;
  const into = progress.totalSessions % SESSIONS_PER_LEVEL;
  setText(els['level-num'], String(level));
  setText(els['xp-label'], `${xp} XP · ${SESSIONS_PER_LEVEL - into} sesi lagi naik level`);
  if (els['xp-fill']) els['xp-fill'].style.width = `${(into / SESSIONS_PER_LEVEL) * 100}%`;
  try { ui.oyen?.setLevel(level); } catch { /* abaikan */ }
}

// =========================================================
// PiP — Oyen Melayang
// =========================================================
function pipSupported() { return !IS_DESKTOP && 'documentPictureInPicture' in window; }

function copyStylesTo(doc) {
  for (const sheet of [...document.styleSheets]) {
    try {
      const css = [...sheet.cssRules].map((r) => r.cssText).join('\n');
      const style = doc.createElement('style');
      style.textContent = css;
      doc.head.appendChild(style);
    } catch {
      if (sheet.href) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        doc.head.appendChild(link);
      }
    }
  }
}

function togglePip() {
  if (ui.pip) { try { ui.pip.win.close(); } catch { /* abaikan */ } return; }
  openPip();
}

function renderPipAnger() {
  if (!ui.pip) return;
  const body = ui.pip.win?.document?.body;
  if (!body) return;
  body.classList.toggle('pip-angry', anger.stage >= 2);
  body.classList.toggle('pip-anger-3', anger.stage >= 3);
  setText(ui.pip.angryEl, anger.stage >= 3 ? 'TEGAK!! 😾💢' : 'TEGAK! 😾');
}

function renderPipHint() {
  if (els['pip-galak-hint']) els['pip-galak-hint'].hidden = !pipSupported() || !!ui.pip;
}

async function openPip() {
  if (ui.pip || !pipSupported() || !ui.oyen) return;
  let win;
  try {
    win = await window.documentPictureInPicture.requestWindow({ width: 220, height: 300 });
  } catch (e) {
    console.warn('[oyen] PiP gagal:', e);
    speak('Oyen gagal melayang 😿 Coba lagi ya.', 3000);
    return;
  }
  const doc = win.document;
  doc.title = 'Oyen';
  copyStylesTo(doc);
  doc.body.className = 'pip-body';
  doc.body.innerHTML = `
    <div class="pip-wrap">
      <p class="pip-angry-text" id="pip-angry-text" aria-live="assertive">TEGAK! 😾</p>
      <div class="pip-oyen" id="pip-oyen"></div>
      <p class="pip-mode" id="pip-mode"></p>
      <p class="pip-timer" id="pip-timer">--:--</p>
      <div class="meter" role="meter" aria-label="Skor postur"><div class="meter-fill" id="pip-fill"></div></div>
    </div>`;
  ui.pip = {
    win,
    oyenEl: doc.getElementById('pip-oyen'),
    timerEl: doc.getElementById('pip-timer'),
    modeEl: doc.getElementById('pip-mode'),
    fillEl: doc.getElementById('pip-fill'),
    angryEl: doc.getElementById('pip-angry-text'),
  };
  try { ui.oyen.mount(ui.pip.oyenEl); } catch (e) { console.warn('[oyen] mount PiP gagal:', e); }
  ui.currentMood = null;
  win.addEventListener('pagehide', () => {
    try { ui.oyen?.mount(els['oyen-stage']); } catch { /* abaikan */ }
    ui.pip = null;
    ui.currentMood = null;
    setText(els['btn-pip'], 'Oyen Melayang 🪟');
    renderPipHint();
    applyMood(true);
  }, { once: true });
  setText(els['btn-pip'], 'Panggil Oyen pulang 🏠');
  renderPipHint();
  renderPipAnger();
  closeAngryNotification(); // PiP sekarang yang tampil di atas aplikasi lain
  renderTimer();
  renderPosture();
  applyMood(true);
}

// =========================================================
// SETTINGS
// =========================================================
const NUM_FIELDS = [
  ['set-focus', 'focusMin', 1, 180],
  ['set-short', 'shortMin', 1, 60],
  ['set-long', 'longMin', 1, 90],
  ['set-long-every', 'longEvery', 2, 12],
  ['set-slouch', 'slouchSec', 3, 300],
  ['set-water-min', 'waterMin', 5, 240],
];

function fillSettingsForm() {
  NUM_FIELDS.forEach(([id, key]) => { if (els[id]) els[id].value = String(settings[key]); });
  if (els['set-sensitivity']) els['set-sensitivity'].value = String(settings.sensitivity);
  renderSensitivityLabel();
  if (els['set-water-enabled']) els['set-water-enabled'].checked = !!settings.waterEnabled;
  if (els['set-mute']) els['set-mute'].checked = !!settings.muted;
  if (els['set-notify']) els['set-notify'].checked = canNotify();
  if (els['toggle-preview']) els['toggle-preview'].checked = !!settings.showPreview;
  if (els['set-galak']) els['set-galak'].checked = !!settings.galak;
  if (!('Notification' in window)) {
    if (els['set-notify']) els['set-notify'].disabled = true;
    setText(els['notify-hint'], 'Browser ini belum mendukung notifikasi.');
  }
}

function renderSensitivityLabel() {
  const v = settings.sensitivity;
  const word = v < 0.34 ? 'santai' : v < 0.67 ? 'sedang' : 'ketat';
  setText(els['sensitivity-value'], `(${word})`);
}

function sanitizeSettings() {
  NUM_FIELDS.forEach(([, key, lo, hi]) => {
    const n = Number(settings[key]);
    settings[key] = Number.isFinite(n) ? clamp(Math.round(n), lo, hi) : DEFAULT_SETTINGS[key];
  });
  const s = Number(settings.sensitivity);
  settings.sensitivity = Number.isFinite(s) ? clamp(s, 0, 1) : DEFAULT_SETTINGS.sensitivity;
  settings.galak = settings.galak !== false;
}

function onNumberSetting(id, key, lo, hi) {
  const input = els[id];
  if (!input) return;
  const n = Number(input.value);
  if (!Number.isFinite(n) || input.value === '') { input.value = String(settings[key]); return; }
  const val = clamp(Math.round(n), lo, hi);
  input.value = String(val);
  if (settings[key] === val) return;
  const wasFresh = isFreshPhase();
  settings[key] = val;
  saveSettings();
  // Kalau timer belum mulai di fase ini, terapkan durasi baru langsung
  if (['focusMin', 'shortMin', 'longMin'].includes(key) && wasFresh) {
    timer.remainingMs = modeDurationMs(timer.mode);
    saveTimer();
  }
  renderTimer();
  renderWaterNext(Date.now());
}

async function onNotifyToggle(e) {
  const input = e.currentTarget;
  if (!input.checked) { settings.notify = false; saveSettings(); setText(els['notify-hint'], ''); return; }
  if (!('Notification' in window)) { input.checked = false; return; }
  let perm = Notification.permission;
  if (perm === 'default') {
    try { perm = await Notification.requestPermission(); } catch { perm = 'denied'; }
  }
  if (perm === 'granted') {
    settings.notify = true;
    setText(els['notify-hint'], 'Oke! Oyen akan kirim notifikasi kalau tab ini lagi nggak dilihat.');
  } else {
    settings.notify = false;
    input.checked = false;
    setText(els['notify-hint'], 'Izin notifikasi ditolak. Bisa diubah lewat ikon gembok di address bar.');
  }
  saveSettings();
}

function bindSettings() {
  NUM_FIELDS.forEach(([id, key, lo, hi]) => on(els[id], 'change', () => onNumberSetting(id, key, lo, hi)));

  on(els['set-sensitivity'], 'input', () => {
    const v = clamp(Number(els['set-sensitivity'].value), 0, 1);
    if (!Number.isFinite(v)) return;
    settings.sensitivity = v;
    renderSensitivityLabel();
    try { ui.tracker?.setSensitivity(v); } catch { /* abaikan */ }
  });
  on(els['set-sensitivity'], 'change', saveSettings);

  on(els['set-water-enabled'], 'change', () => {
    settings.waterEnabled = !!els['set-water-enabled'].checked;
    ui.lastWaterAt = Date.now();
    saveSettings();
    renderWaterNext(Date.now());
  });

  on(els['set-mute'], 'change', () => {
    settings.muted = !!els['set-mute'].checked;
    try { ui.oyen?.setMuted(settings.muted); } catch { /* abaikan */ }
    saveSettings();
  });

  on(els['set-notify'], 'change', onNotifyToggle);

  on(els['set-galak'], 'change', () => {
    settings.galak = !!els['set-galak'].checked;
    saveSettings();
    if (!settings.galak && anger.stage >= 2) {
      // Turun ke tahap 1 saja: tutup semua tampilan marah
      anger.stage = 1;
      applyAnger(1);
      hideAngryOverlay();
      setAngryFavicon(false);
      closeAngryNotification();
      ui.currentMood = null;
      applyMood(true);
      renderTimer();
    }
    speak(settings.galak ? 'Mode Galak nyala 😾 Awas kalau bungkuk!' : 'Oke, Oyen jadi kalem 😺', 3000);
  });

  on(els['btn-clear-cal'], 'click', async () => {
    try {
      const tracker = await ensureTracker();
      tracker.clearCalibration();
      speak('Kalibrasi dihapus. Kalibrasi ulang kapan aja ya!', 4000);
      if (ui.cameraOn) {
        setCameraStatus('Kalibrasi dihapus — tekan Kalibrasi untuk mengatur ulang.');
        els['btn-calibrate']?.classList.add('is-pulsing');
      }
    } catch (e) {
      console.warn('[oyen] hapus kalibrasi gagal:', e);
      speak('Gagal hapus kalibrasi 😿', 3000);
    }
  });

  on(els['btn-reset-all'], 'click', () => {
    const ok = window.confirm('Yakin mau reset semua data? Statistik, level, pengaturan, dan kalibrasi akan dihapus dari browser ini.');
    if (!ok) return;
    try { ui.tracker?.clearCalibration(); } catch { /* abaikan */ }
    try { ui.tracker?.stop(); } catch { /* abaikan */ }
    store.clearAll();
    ui.skipSaveOnUnload = true;
    window.location.reload();
  });

  on(els['toggle-preview'], 'change', () => {
    settings.showPreview = !!els['toggle-preview'].checked;
    saveSettings();
    renderCamera();
  });
}

// =========================================================
// INIT
// =========================================================
function bindControls() {
  on(els['btn-timer-start'], 'click', () => (timer.running ? pauseTimer() : startTimer()));
  on(els['btn-timer-reset'], 'click', resetTimer);
  on(els['btn-timer-skip'], 'click', skipPhase);
  on(els['btn-camera'], 'click', () => (ui.cameraOn ? stopCamera() : startCamera()));
  on(els['btn-calibrate'], 'click', runCalibration);
  on(els['btn-drink'], 'click', drink);

  if (pipSupported()) {
    if (els['btn-pip']) els['btn-pip'].hidden = false;
    on(els['btn-pip'], 'click', togglePip);
    // Chrome bisa membuka Document PiP otomatis saat pindah tab selagi kamera aktif
    try { navigator.mediaSession?.setActionHandler('enterpictureinpicture', () => { openPip(); }); } catch { /* belum didukung */ }
  } else if (els['pip-hint'] && !IS_DESKTOP) {
    els['pip-hint'].hidden = false;
  }
  renderPipHint();

  // Esc menunda pop-up Oyen marah
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && isOverlayOpen()) { e.preventDefault(); snoozeAngryOverlay(); }
  });

  const markActive = () => {
    const wasAsleep = ui.currentMood === 'sleep' && !timer.running;
    ui.lastInteraction = Date.now();
    if (wasAsleep) applyMood();
  };
  on(document, 'pointerdown', markActive, { passive: true });
  on(document, 'keydown', markActive);

  on(document, 'visibilitychange', () => {
    tick();
    if (document.hidden && ui.statsDirty) saveStats();
    if (!document.hidden) closeAngryNotification(); // pop-up di halaman yang ambil alih
  });
  on(window, 'pagehide', () => {
    if (ui.skipSaveOnUnload) return;
    if (ui.statsDirty) saveStats();
    saveTimer();
  });
}

let lastStatsSave = Date.now();
function tick() {
  const now = Date.now();
  if (ensureToday()) renderStats();

  if (timer.running && timer.endAt && now >= timer.endAt) completePhase();

  checkWater(now);
  renderTimer();
  renderWaterNext(now);
  applyMood();

  if (ui.statsDirty && now - lastStatsSave > 15_000) {
    lastStatsSave = now;
    saveStats();
    renderStats();
  }
}

async function initOyen() {
  const stage = els['oyen-stage'];
  try {
    const mod = await import('./oyen.js');
    ui.oyen = mod.createOyen(stage);
    ui.oyenModule = mod;
    if (Array.isArray(mod.MOODS) && mod.MOODS.includes('angry')) ui.angryMood = 'angry';
  } catch (e) {
    console.warn('[oyen] oyen.js gagal dimuat:', e);
    ui.oyen = createOyenStub(stage);
  }
  try { ui.oyen.setMuted(!!settings.muted); } catch { /* abaikan */ }
}

async function init() {
  grabElements();
  sanitizeSettings();
  ensureToday();

  // Pulihkan timer: kalau fase sudah habis selama halaman ditutup, selesaikan sekarang.
  if (timer.remainingMs == null && !timer.running) timer.remainingMs = modeDurationMs(timer.mode);
  if (!['focus', 'short', 'long'].includes(timer.mode)) { timer.mode = 'focus'; timer.remainingMs = modeDurationMs('focus'); }

  await initOyen();
  fillSettingsForm();
  bindControls();
  bindSettings();
  initDesktop();
  renderCamera();
  renderStats();
  renderTimer();
  applyMood(true);

  if (timer.running && timer.endAt && Date.now() >= timer.endAt) {
    completePhase();
  } else if (stats.sessions === 0 && !timer.running) {
    speak('Hai! Aku Oyen 🐱 Nyalakan kamera biar aku bisa jagain posturmu, atau langsung mulai fokus aja!', 7000);
  }

  setInterval(tick, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
