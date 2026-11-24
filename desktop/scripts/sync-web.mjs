// Menyalin web app statis (../index.html, ../css, ../js) + overlay ke desktop/dist/.
// Jalur dihitung dari lokasi file ini, jadi cwd tidak berpengaruh.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(here, '..');
const webRoot = resolve(desktopDir, '..');
const dist = join(desktopDir, 'dist');
const overlayDir = join(desktopDir, 'overlay');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const webItems = ['index.html', 'css', 'js'];
for (const item of webItems) {
  const src = join(webRoot, item);
  if (!existsSync(src)) {
    console.error(`[sync-web] GAGAL: ${src} tidak ditemukan.`);
    process.exit(1);
  }
  cpSync(src, join(dist, item), { recursive: true });
}

if (existsSync(overlayDir)) {
  const files = readdirSync(overlayDir);
  for (const name of files) {
    cpSync(join(overlayDir, name), join(dist, name), { recursive: true });
  }
  if (!files.includes('overlay.html')) {
    console.warn('[sync-web] PERINGATAN: overlay/overlay.html belum ada.');
  }
} else {
  console.warn('[sync-web] PERINGATAN: folder overlay/ tidak ada; jendela overlay akan kosong.');
}

console.log(`[sync-web] Selesai menyalin web app ke ${dist}`);
