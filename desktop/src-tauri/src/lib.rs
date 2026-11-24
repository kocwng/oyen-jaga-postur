//! Oyen Jaga Postur — pembungkus desktop (Tauri 2).
//!
//! Jendela "main" menjalankan web app (kamera + deteksi postur). Saat pengguna
//! membungkuk, web app memanggil `overlay_show` dan jendela "overlay" yang
//! transparan + selalu di atas menampilkan Oyen yang marah di atas semua aplikasi.

use std::sync::Mutex;

use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, State, WebviewWindow,
    WindowEvent,
};

const MAIN: &str = "main";
const OVERLAY: &str = "overlay";
const TRAY_ID: &str = "oyen-tray";

/// Payload event "oyen-anger" (juga dikembalikan oleh `overlay_state`).
#[derive(Clone, Serialize)]
pub struct AngerPayload {
    stage: u8,
    title: String,
    text: String,
    level: u32,
}

/// Payload event "oyen-calm".
#[derive(Clone, Serialize)]
struct CalmPayload {
    text: String,
}

/// Menyimpan status marah terakhir agar halaman overlay bisa memintanya saat dimuat.
#[derive(Default)]
pub struct OverlayState {
    last_anger: Mutex<Option<AngerPayload>>,
}

fn overlay_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window(OVERLAY)
        .ok_or_else(|| "jendela overlay tidak ditemukan".to_string())
}

fn clear_state(app: &AppHandle) {
    let state = app.state::<OverlayState>();
    let lock = state.last_anger.lock();
    if let Ok(mut guard) = lock {
        *guard = None;
    }
}

/// Posisi & ukuran (fisik) monitor tempat kursor berada; cadangan: monitor utama.
fn target_monitor_rect(win: &WebviewWindow) -> Option<(PhysicalPosition<i32>, PhysicalSize<u32>)> {
    if let (Ok(cursor), Ok(monitors)) = (win.cursor_position(), win.available_monitors()) {
        for m in monitors {
            let pos = *m.position();
            let size = *m.size();
            let left = pos.x as f64;
            let top = pos.y as f64;
            let right = left + size.width as f64;
            let bottom = top + size.height as f64;
            if cursor.x >= left && cursor.x < right && cursor.y >= top && cursor.y < bottom {
                return Some((pos, size));
            }
        }
    }
    win.primary_monitor()
        .ok()
        .flatten()
        .or_else(|| win.current_monitor().ok().flatten())
        .map(|m| (*m.position(), *m.size()))
}

/// macOS: naikkan overlay di atas SEMUA jendela (termasuk Dock & menu bar), ikut ke
/// semua Space, dan boleh tampil di Space layar-penuh aplikasi lain (mis. Claude, VS Code).
/// `always_on_top` bawaan hanya memakai level "floating", yang kalah oleh app layar penuh.
#[cfg(target_os = "macos")]
fn pin_overlay_above_everything(win: &WebviewWindow) {
    use objc2::{msg_send, runtime::AnyObject};
    // NSWindowCollectionBehavior: CanJoinAllSpaces | Stationary | IgnoresCycle | FullScreenAuxiliary
    const BEHAVIOR: usize = (1 << 0) | (1 << 4) | (1 << 6) | (1 << 8);
    // NSStatusWindowLevel (25): di atas jendela biasa, floating (3), Dock (20) dan menu bar (24).
    const LEVEL: isize = 25;
    if let Ok(ptr) = win.ns_window() {
        let ns = ptr as *mut AnyObject;
        if ns.is_null() {
            return;
        }
        unsafe {
            let _: () = msg_send![ns, setCollectionBehavior: BEHAVIOR];
            let _: () = msg_send![ns, setLevel: LEVEL];
            // Panel bawaan menyembunyikan diri saat app tidak aktif — overlay justru
            // harus tampil saat app lain (mis. Claude layar penuh) yang aktif.
            let _: () = msg_send![ns, setHidesOnDeactivate: false];
        }
    }
}

/// macOS: ubah jendela overlay menjadi NSPanel non-aktif (cara Spotlight/Raycast).
/// Hanya panel jenis ini yang boleh mengambang di atas Space layar penuh milik
/// aplikasi lain tanpa membuat macOS pindah Space. Dipanggil sekali saat setup.
#[cfg(target_os = "macos")]
fn make_overlay_panel(win: &WebviewWindow) {
    use objc2::{
        ffi::object_setClass,
        msg_send,
        runtime::{AnyClass, AnyObject},
    };
    // NSWindowStyleMaskNonactivatingPanel
    const NONACTIVATING_PANEL: usize = 1 << 7;
    let Ok(ptr) = win.ns_window() else { return };
    let ns = ptr as *mut AnyObject;
    if ns.is_null() {
        return;
    }
    let Some(panel_class) = AnyClass::get(c"NSPanel") else { return };
    unsafe {
        object_setClass(ns, panel_class);
        let mask: usize = msg_send![ns, styleMask];
        let _: () = msg_send![ns, setStyleMask: mask | NONACTIVATING_PANEL];
        let _: () = msg_send![ns, setFloatingPanel: true];
        let _: () = msg_send![ns, setBecomesKeyOnlyIfNeeded: true];
    }
    pin_overlay_above_everything(win);
}

/// Taruh overlay paling depan tanpa mengaktifkan app (tidak memicu pindah Space).
#[cfg(target_os = "macos")]
fn order_front_regardless(win: &WebviewWindow) {
    use objc2::{msg_send, runtime::AnyObject};
    if let Ok(ptr) = win.ns_window() {
        let ns = ptr as *mut AnyObject;
        if !ns.is_null() {
            unsafe {
                let _: () = msg_send![ns, orderFrontRegardless];
            }
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn pin_overlay_above_everything(win: &WebviewWindow) {
    let _ = win.set_always_on_top(true);
}

/// Tampilkan overlay di monitor tempat kursor berada, tanpa merebut fokus
/// (merebut fokus bisa membuat macOS pindah keluar dari Space layar penuh).
fn show_overlay(app: &AppHandle, payload: AngerPayload) -> Result<(), String> {
    let win = overlay_window(app)?;

    if let Some((pos, size)) = target_monitor_rect(&win) {
        let _ = win.set_size(size);
        let _ = win.set_position(pos);
    }

    {
        let state = app.state::<OverlayState>();
        let lock = state.last_anger.lock();
        if let Ok(mut guard) = lock {
            *guard = Some(payload.clone());
        }
    }

    let _ = win.set_ignore_cursor_events(false);
    pin_overlay_above_everything(&win);
    win.show().map_err(|e| e.to_string())?;
    // `show()` bisa mengembalikan level default; pasang lagi setelahnya.
    pin_overlay_above_everything(&win);
    #[cfg(target_os = "macos")]
    order_front_regardless(&win);

    app.emit_to(OVERLAY, "oyen-anger", payload)
        .map_err(|e| e.to_string())
}

fn hide_overlay_window(app: &AppHandle) -> Result<(), String> {
    let win = overlay_window(app)?;
    let _ = win.set_ignore_cursor_events(true);
    win.hide().map_err(|e| e.to_string())
}

fn show_main_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(MAIN) {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

// ---------------------------------------------------------------------------
// Perintah (dipanggil dari JS lewat window.__TAURI__.core.invoke)
// ---------------------------------------------------------------------------

#[tauri::command]
fn overlay_show(
    app: AppHandle,
    stage: u8,
    title: String,
    text: String,
    level: u32,
) -> Result<(), String> {
    show_overlay(
        &app,
        AngerPayload {
            stage,
            title,
            text,
            level,
        },
    )
}

#[tauri::command]
fn overlay_calm(app: AppHandle, text: String) -> Result<(), String> {
    clear_state(&app);
    app.emit_to(OVERLAY, "oyen-calm", CalmPayload { text })
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn overlay_hide(app: AppHandle) -> Result<(), String> {
    hide_overlay_window(&app)
}

#[tauri::command]
fn overlay_snooze(app: AppHandle) -> Result<(), String> {
    let hidden = hide_overlay_window(&app);
    clear_state(&app);
    app.emit_to(MAIN, "oyen-snooze", ())
        .map_err(|e| e.to_string())?;
    hidden
}

#[tauri::command]
fn overlay_state(state: State<'_, OverlayState>) -> Option<AngerPayload> {
    let current = match state.last_anger.lock() {
        Ok(guard) => (*guard).clone(),
        Err(_) => None,
    };
    current
}

#[tauri::command]
fn show_main(app: AppHandle) {
    show_main_window(&app);
}

// ---------------------------------------------------------------------------
// Tray
// ---------------------------------------------------------------------------

fn handle_menu(app: &AppHandle, id: &str) {
    match id {
        "buka" => show_main_window(app),
        "sembunyikan" => {
            if let Some(w) = app.get_webview_window(MAIN) {
                let _ = w.hide();
            }
        }
        "tes-marah" => {
            let _ = show_overlay(
                app,
                AngerPayload {
                    stage: 3,
                    title: "Tes: Oyen marah! 😾".into(),
                    text: "Begini Oyen kalau kamu bungkuk kelamaan. Klik tombol di bawah buat nutup.".into(),
                    level: 1,
                },
            );
        }
        "keluar" => app.exit(0),
        _ => {}
    }
}

fn handle_tray_event(app: &AppHandle, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        show_main_window(app);
    }
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let buka = MenuItem::with_id(app, "buka", "Buka Oyen", true, None::<&str>)?;
    let sembunyikan =
        MenuItem::with_id(app, "sembunyikan", "Sembunyikan jendela", true, None::<&str>)?;
    let tes = MenuItem::with_id(app, "tes-marah", "Tes Oyen marah 😾", true, None::<&str>)?;
    let pemisah = PredefinedMenuItem::separator(app)?;
    let keluar = MenuItem::with_id(app, "keluar", "Keluar", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&buka, &sembunyikan, &tes, &pemisah, &keluar])?;

    // Tray dibuat otomatis dari `app.trayIcon` di tauri.conf.json (id "oyen-tray");
    // di sini kita pasang menu & handler-nya. Cadangan: buat sendiri bila tidak ada.
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu))?;
        tray.on_menu_event(|app, event| handle_menu(app, event.id().as_ref()));
        tray.on_tray_icon_event(|tray, event| handle_tray_event(tray.app_handle(), event));
    } else {
        let mut builder = TrayIconBuilder::with_id(TRAY_ID)
            .tooltip("Oyen Jaga Postur")
            .menu(&menu)
            .show_menu_on_left_click(false)
            .on_menu_event(|app, event| handle_menu(app, event.id().as_ref()))
            .on_tray_icon_event(|tray, event| handle_tray_event(tray.app_handle(), event));
        if let Some(icon) = app.default_window_icon().cloned() {
            builder = builder.icon(icon);
        }
        builder.build(app)?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(OverlayState::default())
        .invoke_handler(tauri::generate_handler![
            overlay_show,
            overlay_calm,
            overlay_hide,
            overlay_snooze,
            overlay_state,
            show_main
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // macOS: jadikan Oyen "menu bar app" (tanpa ikon Dock). Hanya app jenis ini
            // yang jendelanya boleh muncul di Space layar penuh milik aplikasi lain.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            if let Some(overlay) = app.get_webview_window(OVERLAY) {
                // Overlay tersembunyi tidak boleh menghalangi klik.
                let _ = overlay.set_ignore_cursor_events(true);
                #[cfg(target_os = "macos")]
                make_overlay_panel(&overlay);
                #[cfg(not(target_os = "macos"))]
                pin_overlay_above_everything(&overlay);
            }

            setup_tray(&handle)?;
            // App menu bar tidak otomatis maju ke depan saat dibuka.
            show_main_window(&handle);
            Ok(())
        })
        .on_window_event(|window, event| {
            // Tutup jendela = sembunyikan, supaya pemantauan postur jalan terus dari tray.
            if let WindowEvent::CloseRequested { api, .. } = event {
                let label = window.label();
                if label == MAIN || label == OVERLAY {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("gagal membangun aplikasi Oyen Jaga Postur");

    app.run(|_app, _event| {
        // macOS: klik ikon Dock saat jendela tersembunyi -> tampilkan lagi.
        #[cfg(target_os = "macos")]
        {
            if let tauri::RunEvent::Reopen { .. } = _event {
                show_main_window(_app);
            }
        }
    });
}
