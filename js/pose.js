// pose.js — pelacak postur via webcam (MediaPipe PoseLandmarker), sepenuhnya di browser.
// Video tidak pernah meninggalkan perangkat.

const MP_VERSION = '0.10.14';
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const MP_BUNDLE = `${MP_BASE}/vision_bundle.mjs`;
const MP_WASM = `${MP_BASE}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const STORAGE_KEY = 'oyen.pose.baseline';

const VIS_MIN = 0.5;
const AWAY_MS = 3000;
const CALIB_MS = 2000;
const CALIB_MIN_FRAMES = 5;
const EMA_ALPHA = 0.3;
const THRESHOLD = 0.65;
const HYST = 0.05;
const LEAN_LIMIT = 1.12;
const TILT_LIMIT = 8; // derajat

export const POSE_STATUS = {
  GOOD: 'good',
  SLOUCH: 'slouch',
  AWAY: 'away',
  NOCAL: 'nocal',
  CALIBRATING: 'calibrating',
};

// Model dibagi di level modul: dimuat sekali, tetap ada setelah stop().
let landmarkerPromise = null;
let lastTs = 0; // timestamp VIDEO mode harus naik terus per landmarker

function makeError(code, message, cause) {
  const err = new Error(message);
  err.code = code;
  if (cause) err.cause = cause;
  return err;
}

async function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import(MP_BUNDLE);
      const fileset = await FilesetResolver.forVisionTasks(MP_WASM);
      const opts = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      try {
        return await PoseLandmarker.createFromOptions(fileset, opts('GPU'));
      } catch (gpuErr) {
        console.warn('[pose] GPU delegate gagal, pakai CPU:', gpuErr);
        return await PoseLandmarker.createFromOptions(fileset, opts('CPU'));
      }
    })().catch((err) => {
      landmarkerPromise = null; // izinkan coba lagi
      throw makeError('model-failed', 'Gagal memuat model pose.', err);
    });
  }
  return landmarkerPromise;
}

// Ticker di Web Worker supaya tetap jalan saat tab di background.
function createTicker(onTick) {
  const src =
    'let id=null;onmessage=e=>{if(id!==null)clearInterval(id);id=null;' +
    'if(e.data>0)id=setInterval(()=>postMessage(0),e.data);};';
  try {
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = onTick;
    return {
      set(ms) { worker.postMessage(ms); },
      stop() { worker.terminate(); },
    };
  } catch {
    // Fallback: timer main thread (bisa di-throttle di background).
    let id = null;
    return {
      set(ms) { if (id !== null) clearInterval(id); id = ms > 0 ? setInterval(onTick, ms) : null; },
      stop() { if (id !== null) clearInterval(id); id = null; },
    };
  }
}

function loadBaseline() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw);
    if (b && b.shoulderWidth > 0 && b.headHeight > 0 && Number.isFinite(b.tilt)) return b;
  } catch { /* abaikan */ }
  return null;
}

function saveBaseline(b) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch { /* abaikan */ }
}

function removeBaseline() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* abaikan */ }
}

const visible = (p) => !!p && (p.visibility ?? 1) > VIS_MIN;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

// Hitung metrik mentah dari landmark (koordinat ternormalisasi, x dikoreksi aspek).
function computeRaw(lm, aspect) {
  if (!lm) return null;
  const nose = lm[0], le = lm[7], re = lm[8], ls = lm[11], rs = lm[12];
  if (!visible(nose) || !visible(ls) || !visible(rs)) return null;
  const dx = (ls.x - rs.x) * aspect;
  const dy = ls.y - rs.y;
  const shoulderWidth = Math.hypot(dx, dy);
  if (!(shoulderWidth > 0.01)) return null;
  const midY = (ls.y + rs.y) / 2;
  const headHeight = (midY - nose.y) / shoulderWidth;
  const earHeight = visible(le) && visible(re) ? (midY - (le.y + re.y) / 2) / shoulderWidth : null;
  const tilt = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
  return { shoulderWidth, headHeight, earHeight, tilt };
}

export function createPoseTracker({ video, canvas = null, fps = 4, onUpdate }) {
  let landmarker = null;
  let stream = null;
  let ticker = null;
  let running = false;
  let busy = false;
  let gen = 0; // token untuk membatalkan start() yang sedang berjalan
  let startPromise = null;

  let curFps = Math.max(0.5, Number(fps) || 4);
  let sensitivity = 0.5;
  let baseline = loadBaseline();

  let smoothed = null;
  let status = null;
  let lastSeenT = 0;
  let calib = null; // { startT, frames: [], resolve, timer }

  const emit = (payload) => {
    if (typeof onUpdate === 'function') {
      try { onUpdate(payload); } catch (e) { console.error('[pose] onUpdate error:', e); }
    }
  };

  function scoreFrom(raw) {
    const k = 0.5 + sensitivity * 1.5; // sensitivitas 0..1 → pengali penalti 0.5..2
    const headRatio = raw.headHeight / baseline.headHeight;
    let drop = Math.max(0, 1 - headRatio - 0.03); // deadzone kecil untuk noise
    if (raw.earHeight != null && baseline.earHeight > 0) {
      const earDrop = Math.max(0, 1 - raw.earHeight / baseline.earHeight - 0.03);
      drop = 0.6 * drop + 0.4 * earDrop;
    }
    const lean = raw.shoulderWidth / baseline.shoulderWidth;
    const leanEx = Math.max(0, lean - LEAN_LIMIT);
    const tiltEx = Math.max(0, raw.tilt - TILT_LIMIT);
    const penalty = k * (drop * 2.2 + leanEx * 2.5 + tiltEx / 20);
    return { score: clamp01(1 - penalty), lean };
  }

  function finishCalibration() {
    if (!calib) return;
    const { frames, resolve, timer } = calib;
    clearTimeout(timer);
    calib = null;
    if (frames.length < CALIB_MIN_FRAMES) { resolve(false); return; }
    const ears = frames.map((f) => f.earHeight).filter((v) => v != null);
    baseline = {
      shoulderWidth: mean(frames.map((f) => f.shoulderWidth)),
      headHeight: mean(frames.map((f) => f.headHeight)),
      earHeight: ears.length >= frames.length / 2 ? mean(ears) : null,
      tilt: mean(frames.map((f) => f.tilt)),
      at: Date.now(),
    };
    if (!(baseline.headHeight > 0)) { baseline = loadBaseline(); resolve(false); return; }
    saveBaseline(baseline);
    smoothed = null;
    status = null;
    resolve(true);
  }

  function drawOverlay(lm) {
    if (!canvas || canvas.offsetParent === null) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    if (!lm) return;
    const pt = (p) => [(1 - p.x) * w, p.y * h]; // dicerminkan seperti video
    const ls = lm[11], rs = lm[12];
    if (visible(ls) && visible(rs)) {
      const [x1, y1] = pt(ls), [x2, y2] = pt(rs);
      ctx.strokeStyle = 'rgba(255,170,60,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(80,200,255,0.95)';
    for (const i of [0, 7, 8, 11, 12]) {
      const p = lm[i];
      if (!visible(p)) continue;
      const [x, y] = pt(p);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function clearOverlay() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function processFrame() {
    if (!running || busy || !landmarker || video.readyState < 2) return;
    busy = true;
    try {
      let ts = performance.now();
      if (ts <= lastTs) ts = lastTs + 1;
      lastTs = ts;
      let result;
      try {
        result = landmarker.detectForVideo(video, ts);
      } catch (e) {
        console.warn('[pose] deteksi gagal:', e);
        return;
      }
      const lm = result && result.landmarks && result.landmarks[0];
      const aspect = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 4 / 3;
      const raw = computeRaw(lm, aspect);
      drawOverlay(raw ? lm : null);
      const t = ts;

      if (raw) lastSeenT = t;

      // Kalibrasi
      if (calib) {
        if (raw) calib.frames.push(raw);
        emit({
          status: POSE_STATUS.CALIBRATING,
          score: null,
          metrics: raw ? { headHeight: raw.headHeight, lean: 1, tilt: raw.tilt } : null,
          t,
        });
        if (t - calib.startT >= CALIB_MS) finishCalibration();
        return;
      }

      if (!raw) {
        if (t - lastSeenT > AWAY_MS) {
          smoothed = null;
          status = POSE_STATUS.AWAY;
          emit({ status, score: null, metrics: null, t });
        } else if (!baseline) {
          emit({ status: POSE_STATUS.NOCAL, score: null, metrics: null, t });
        } else if (status === POSE_STATUS.GOOD || status === POSE_STATUS.SLOUCH) {
          // Hilang sebentar: pertahankan status sebelumnya.
          emit({ status, score: smoothed, metrics: null, t });
        }
        return;
      }

      if (!baseline) {
        status = POSE_STATUS.NOCAL;
        emit({ status, score: null, metrics: { headHeight: raw.headHeight, lean: null, tilt: raw.tilt }, t });
        return;
      }

      const { score, lean } = scoreFrom(raw);
      smoothed = smoothed == null ? score : smoothed + EMA_ALPHA * (score - smoothed);

      if (smoothed >= THRESHOLD + HYST) status = POSE_STATUS.GOOD;
      else if (smoothed < THRESHOLD - HYST) status = POSE_STATUS.SLOUCH;
      else if (status !== POSE_STATUS.GOOD && status !== POSE_STATUS.SLOUCH) {
        status = smoothed >= THRESHOLD ? POSE_STATUS.GOOD : POSE_STATUS.SLOUCH;
      }

      emit({ status, score: smoothed, metrics: { headHeight: raw.headHeight, lean, tilt: raw.tilt }, t });
    } finally {
      busy = false;
    }
  }

  async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw makeError('no-camera', 'Kamera tidak tersedia di browser ini.');
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
      });
    } catch (err) {
      const name = err && err.name;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
        throw makeError('denied', 'Izin kamera ditolak.', err);
      }
      throw makeError('no-camera', 'Kamera tidak ditemukan atau tidak bisa dipakai.', err);
    }
  }

  function stopStream(s) {
    if (s) s.getTracks().forEach((tr) => { try { tr.stop(); } catch { /* abaikan */ } });
  }

  async function doStart() {
    const myGen = ++gen;
    const camP = openCamera();
    const modelP = loadLandmarker();
    // Hindari unhandled rejection bila salah satu gagal lebih dulu.
    camP.catch(() => {});
    modelP.catch(() => {});

    const s = await camP;
    try {
      landmarker = await modelP;
    } catch (err) {
      stopStream(s);
      throw err;
    }
    if (myGen !== gen) { stopStream(s); return; } // stop() dipanggil saat loading

    stream = s;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.srcObject = stream;
    try { await video.play(); } catch { /* autoplay bisa menolak; frame tetap dicek via readyState */ }
    if (myGen !== gen) { stopStream(s); return; }

    running = true;
    smoothed = null;
    status = null;
    lastSeenT = performance.now();
    ticker = createTicker(processFrame);
    ticker.set(Math.round(1000 / curFps));
  }

  const tracker = {
    start() {
      if (running) return Promise.resolve();
      if (!startPromise) {
        startPromise = doStart().finally(() => { startPromise = null; });
      }
      return startPromise;
    },

    stop() {
      gen++;
      running = false;
      if (ticker) { ticker.stop(); ticker = null; }
      stopStream(stream);
      stream = null;
      try { video.srcObject = null; } catch { /* abaikan */ }
      if (calib) {
        const { resolve, timer } = calib;
        clearTimeout(timer);
        calib = null;
        resolve(false);
      }
      smoothed = null;
      status = null;
      clearOverlay();
    },

    calibrate() {
      if (!running) return Promise.resolve(false);
      if (calib) return calib.promise;
      let resolveFn;
      const promise = new Promise((r) => { resolveFn = r; });
      calib = {
        startT: performance.now(),
        frames: [],
        resolve: resolveFn,
        promise,
        // Pengaman bila frame tidak masuk (mis. video macet).
        timer: setTimeout(() => finishCalibration(), CALIB_MS * 2.5),
      };
      return promise;
    },

    setSensitivity(v) {
      const n = Number(v);
      if (Number.isFinite(n)) sensitivity = clamp01(n);
    },

    setFps(n) {
      const f = Number(n);
      if (!Number.isFinite(f) || f <= 0) return;
      curFps = Math.min(30, Math.max(0.5, f));
      if (ticker) ticker.set(Math.round(1000 / curFps));
    },

    hasCalibration() {
      return !!baseline;
    },

    clearCalibration() {
      baseline = null;
      smoothed = null;
      status = null;
      removeBaseline();
    },

    isRunning() {
      return running;
    },
  };

  return tracker;
}
