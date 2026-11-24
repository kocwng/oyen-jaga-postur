#!/usr/bin/env bash
# Oyen Jaga Postur — installer satu baris untuk macOS
#
#   curl -fsSL https://kocwng.github.io/oyen-jaga-postur/install.sh | bash
#
# Pilihan:
#   ... | bash -s -- --uninstall        # hapus Oyen
#   OYEN_VERSION=v0.1.0 ... | bash      # pasang versi tertentu (default: rilis terbaru)
#
# Skrip ini mengunduh .dmg dari GitHub Releases, memasang "Oyen Jaga Postur.app"
# ke /Applications (atau ~/Applications kalau tidak punya izin), lalu membukanya.

set -euo pipefail

REPO="kocwng/oyen-jaga-postur"
APP_NAME="Oyen Jaga Postur"
ASSET="OyenJagaPostur-macos-arm64.dmg"

say()  { printf '\033[1;33m🐱 %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✔ %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m😾 %s\033[0m\n' "$*" >&2; exit 1; }

pick_dest() {
  if [ -w /Applications ]; then echo "/Applications"; else mkdir -p "$HOME/Applications"; echo "$HOME/Applications"; fi
}

quit_running() {
  osascript -e "quit app \"$APP_NAME\"" >/dev/null 2>&1 || true
  pkill -f "$APP_NAME.app/Contents/MacOS" >/dev/null 2>&1 || true
  sleep 1
}

uninstall() {
  quit_running
  local removed=0
  for dir in /Applications "$HOME/Applications"; do
    if [ -d "$dir/$APP_NAME.app" ]; then
      rm -rf "$dir/$APP_NAME.app" && ok "Dihapus: $dir/$APP_NAME.app" && removed=1
    fi
  done
  [ "$removed" = 1 ] || say "Oyen memang belum terpasang."
  say "Dadah~ Jangan lupa tetap duduk tegak ya! 👋"
}

install() {
  [ "$(uname -s)" = "Darwin" ] || die "Installer ini khusus macOS."
  # hw.optional.arm64 = 1 juga saat terminal jalan lewat Rosetta
  if [ "$(sysctl -n hw.optional.arm64 2>/dev/null || echo 0)" != "1" ]; then
    die "Saat ini Oyen baru tersedia untuk Mac Apple Silicon (M1 ke atas)."
  fi
  command -v curl >/dev/null || die "curl tidak ditemukan."
  command -v hdiutil >/dev/null || die "hdiutil tidak ditemukan."

  local url
  if [ -n "${OYEN_VERSION:-}" ]; then
    url="https://github.com/$REPO/releases/download/$OYEN_VERSION/$ASSET"
  else
    url="https://github.com/$REPO/releases/latest/download/$ASSET"
  fi

  local tmp; tmp="$(mktemp -d)"
  local mnt="$tmp/mnt"
  cleanup() { hdiutil detach "$mnt" -quiet >/dev/null 2>&1 || true; rm -rf "$tmp"; }
  trap cleanup EXIT

  say "Mengunduh Oyen${OYEN_VERSION:+ $OYEN_VERSION}…"
  curl -fL --progress-bar "$url" -o "$tmp/oyen.dmg" || die "Gagal mengunduh dari $url"

  say "Membuka paket…"
  mkdir -p "$mnt"
  hdiutil attach "$tmp/oyen.dmg" -nobrowse -readonly -noautoopen -mountpoint "$mnt" -quiet \
    || die "Gagal membuka file .dmg"
  [ -d "$mnt/$APP_NAME.app" ] || die "Aplikasi tidak ditemukan di dalam .dmg"

  local dest; dest="$(pick_dest)"
  quit_running
  say "Memasang ke $dest…"
  rm -rf "$dest/$APP_NAME.app"
  ditto "$mnt/$APP_NAME.app" "$dest/$APP_NAME.app"

  ok "Oyen terpasang di $dest/$APP_NAME.app"
  say "Membuka Oyen… izinkan kamera kalau ditanya, lalu cari ikon kucing di menu bar."
  open "$dest/$APP_NAME.app" || true
}

main() {
  case "${1:-}" in
    --uninstall|uninstall) uninstall ;;
    ""|--install|install)  install ;;
    -h|--help) sed -n '2,11p' "$0" 2>/dev/null || echo "Lihat https://github.com/$REPO" ;;
    *) die "Pilihan tidak dikenal: $1 (pakai --uninstall atau tanpa argumen)" ;;
  esac
}

# Dibungkus fungsi supaya skrip yang terunduh setengah lewat pipe tidak dijalankan.
main "$@"
