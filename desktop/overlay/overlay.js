// =========================================================
// Oyen Jaga Postur — overlay desktop (Tauri 2)
// Jendela "overlay": transparan, tanpa bingkai, selalu di atas, selayar penuh.
// Rust menampilkan jendela + mengirim event "oyen-anger" / "oyen-calm".
// Suara tetap dari jendela utama; Oyen di sini bisu.
// =========================================================
import { createOyen } from './js/oyen.js';

const TAURI = window.__TAURI__ ?? null;
const HAS_TAURI = !!TAURI?.core?.invoke;

const CALM_HOLD_MS = 1600;   // "Nah gitu dong" tampil segini sebelum Oyen turun
const ENTER_MS = 1200;       // durasi animasi lompat + kartu
const VIS_GRACE_MS = 1500;   // abaikan visibilitychange sesaat setelah tampil

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const leaveMs = () => (reducedMotion?.matches ? 250 : 450);

async function invoke(cmd, args) {
  if (!HAS_TAURI) {
    console.log('[overlay demo] invoke', cmd, args ?? '');
    return null;
  }
  try {
    return await TAURI.core.invoke(cmd, args);
  } catch (e) {
    console.warn('[overlay] invoke gagal:', cmd, e);
    throw e;
  }
}
const invokeSafe = (cmd, args) => invoke(cmd, args).catch(() => null);

// ---------------------------------------------------------
// DOM
// ---------------------------------------------------------
const root = document.getElementById('ov');
const titleEl = document.getElementById('ov-title');
const textEl = document.getElementById('ov-text');
const btn = document.getElementById('ov-btn');
const oyenBox = document.getElementById('ov-oyen');

let oyen = null;
try {
  oyen = createOyen(oyenBox);
  oyen.setMuted(true);
} catch (e) {
  console.warn('[overlay] Oyen gagal dibuat:', e);
  oyen = null;
  oyenBox.innerHTML = '<span class="ov-emoji" aria-hidden="true">😾</span>';
}

const safe = (fn) => { try { fn(); } catch { /* abaikan */ } };

let state = 'hidden'; // 'hidden' | 'angry' | 'calm'
let stage = 0;
let shownAt = 0;
let enterTimer = 0;
let bumpTimer = 0;
let leaveTimer = 0;
let hideTimer = 0;

function clearTimers() {
  clearTimeout(enterTimer);
  clearTimeout(bumpTimer);
  clearTimeout(leaveTimer);
  clearTimeout(hideTimer);
  enterTimer = bumpTimer = leaveTimer = hideTimer = 0;
}

function setText(el, text) { if (el && el.textContent !== text) el.textContent = text; }

/** Kembali ke keadaan tersembunyi (tidak ada yang terlihat). */
function resetDom() {
  clearTimers();
  state = 'hidden';
  stage = 0;
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.classList.remove('is-entering', 'is-bump', 'is-calm', 'is-leaving', 'stage-3');
  safe(() => { oyen?.setAnger(0); oyen?.setMood('neutral'); });
  if (root.contains(document.activeElement)) safe(() => document.activeElement.blur());
}

// ---------------------------------------------------------
// Marah
// ---------------------------------------------------------
function renderAnger(p, { jump = true } = {}) {
  if (!p || typeof p !== 'object') return;
  const s = Number(p.stage) >= 3 ? 3 : 2;
  const fresh = state !== 'angry';
  const stageUp = !fresh && s > stage;
  clearTimers();

  stage = s;
  setText(titleEl, p.title || (s >= 3 ? 'OYEN MARAH BANGET! 😾💢' : 'Oyen marah! 😾'));
  setText(textEl, p.text || '');
  safe(() => {
    oyen?.setLevel(Number(p.level) || 1);
    oyen?.setMood('angry');
    oyen?.setAnger(s);
  });
  root.classList.remove('is-calm', 'is-leaving');
  root.classList.toggle('stage-3', s >= 3);

  if (fresh) {
    state = 'angry';
    shownAt = Date.now();
    root.classList.remove('is-entering', 'is-bump');
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    if (jump) {
      void root.offsetWidth; // mulai ulang animasi lompat
      root.classList.add('is-entering');
      enterTimer = setTimeout(() => root.classList.remove('is-entering'), ENTER_MS);
    }
    safe(() => btn.focus({ preventScroll: true }));
    return;
  }

  // Sudah tampil: perbarui di tempat, tanpa lompat ulang
  root.classList.remove('is-entering');
  if (stageUp) {
    root.classList.remove('is-bump');
    void root.offsetWidth;
    root.classList.add('is-bump');
    bumpTimer = setTimeout(() => root.classList.remove('is-bump'), 1000);
  }
}

// ---------------------------------------------------------
// Reda
// ---------------------------------------------------------
function renderCalm(p) {
  if (state === 'hidden') {
    // Tidak ada yang sedang tampil: pastikan jendela tetap tersembunyi & tembus klik
    invokeSafe('overlay_hide');
    return;
  }
  clearTimers();
  state = 'calm';
  root.classList.remove('is-entering', 'is-bump', 'is-leaving', 'stage-3');
  root.classList.add('is-calm');
  setText(titleEl, 'Nah gitu dong 😺');
  setText(textEl, p?.text || '');
  safe(() => { oyen?.setMood('happy'); oyen?.setAnger(0); });
  if (root.contains(document.activeElement)) safe(() => document.activeElement.blur());

  leaveTimer = setTimeout(() => {
    root.classList.add('is-leaving');
    hideTimer = setTimeout(() => {
      resetDom();
      invokeSafe('overlay_hide');
    }, leaveMs());
  }, CALM_HOLD_MS);
}

// ---------------------------------------------------------
// Tunda ("Iya iya, aku tegak 😅" / Esc)
// ---------------------------------------------------------
async function snooze() {
  if (state !== 'angry') return;
  resetDom();
  try {
    await invoke('overlay_snooze');
  } catch {
    // Jangan sampai jendela transparan yang menangkap klik tertinggal di layar
    invokeSafe('overlay_hide');
  }
}

btn.addEventListener('click', snooze);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state === 'angry') { e.preventDefault(); snooze(); }
  else if (e.key === 'Tab' && state === 'angry') { e.preventDefault(); safe(() => btn.focus()); }
});

// Jendela disembunyikan dari luar (mis. overlay_hide dari jendela utama): reset diam-diam
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state !== 'hidden' && Date.now() - shownAt > VIS_GRACE_MS) resetDom();
});

// ---------------------------------------------------------
// Sambungan ke Tauri / mode uji
// ---------------------------------------------------------
async function initTauri() {
  const ev = TAURI.event;
  try {
    await ev.listen('oyen-anger', ({ payload }) => renderAnger(payload, { jump: true }));
    await ev.listen('oyen-calm', ({ payload }) => renderCalm(payload));
    // Dikirim jendela utama saat eskalasi dibatalkan diam-diam (istirahat, kamera mati, dsb)
    await ev.listen('oyen-reset', () => resetDom());
  } catch (e) {
    console.warn('[overlay] gagal mendengarkan event:', e);
  }
  // Mungkin event pertama terlewat sebelum halaman siap
  const last = await invokeSafe('overlay_state');
  if (last && state === 'hidden') renderAnger(last, { jump: false });
}

function initDemo() {
  const demo = new URLSearchParams(window.location.search).get('demo');
  if (!demo) return;
  document.documentElement.classList.add('is-demo');
  const sample = {
    2: { stage: 2, title: 'Oyen marah! 😾', text: 'HEH! Punggungmu udah kayak tanda tanya! TEGAK! 😾', level: 3 },
    3: { stage: 3, title: 'OYEN MARAH BANGET! 😾💢', text: 'Kalau kamu nggak tegak, Oyen dudukin keyboard kamu! 😾⌨️', level: 8 },
  };
  if (demo === 'calm') {
    renderAnger(sample[2], { jump: false });
    renderCalm({ text: 'Postur juara! Oyen bangga 😻' });
  } else if (demo === '2' || demo === '3') {
    renderAnger(sample[demo], { jump: true });
  }
}

if (HAS_TAURI) initTauri();
else initDemo();
