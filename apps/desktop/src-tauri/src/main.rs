mod commands;
mod tray;

use tauri::{Emitter, Manager};
use tauri_plugin_window_state::StateFlags;

use std::fs::OpenOptions;
use std::io::Write;
#[cfg(target_os = "windows")]
use std::ptr::null_mut;
use std::time::Duration;
use tauri::RunEvent;

fn window_state_flags() -> StateFlags {
    StateFlags::all() & !StateFlags::VISIBLE
}

fn show_main_window_after_startup(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        for attempt in 1..=6 {
            std::thread::sleep(Duration::from_millis(700));
            let app_for_task = app.clone();
            let _ = app.run_on_main_thread(move || {
                log_startup(&format!("delayed show_main_window attempt {}", attempt));
                tray::show_main_window(&app_for_task);
            });
        }
    });
}

#[cfg(target_os = "windows")]
fn register_command_palette_shortcut(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        const HOTKEY_ID: i32 = 0xD1A;
        const MOD_CONTROL: u32 = 0x0002;
        const MOD_SHIFT: u32 = 0x0004;
        const MOD_NOREPEAT: u32 = 0x4000;
        const VK_K: u32 = 0x4B;
        const WM_HOTKEY: u32 = 0x0312;

        #[repr(C)]
        struct Point {
            x: i32,
            y: i32,
        }

        #[repr(C)]
        struct Msg {
            hwnd: *mut std::ffi::c_void,
            message: u32,
            w_param: usize,
            l_param: isize,
            time: u32,
            pt: Point,
        }

        #[link(name = "user32")]
        extern "system" {
            fn GetMessageW(
                lp_msg: *mut Msg,
                hwnd: *mut std::ffi::c_void,
                msg_filter_min: u32,
                msg_filter_max: u32,
            ) -> i32;
            fn RegisterHotKey(
                hwnd: *mut std::ffi::c_void,
                id: i32,
                modifiers: u32,
                virtual_key: u32,
            ) -> i32;
            fn UnregisterHotKey(hwnd: *mut std::ffi::c_void, id: i32) -> i32;
        }

        unsafe {
            let registered = RegisterHotKey(
                null_mut(),
                HOTKEY_ID,
                MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT,
                VK_K,
            );

            if registered == 0 {
                log_startup("global shortcut registration failed");
                return;
            }
            log_startup("global shortcut registered: Ctrl+Shift+K");

            loop {
                let mut message = Msg {
                    hwnd: null_mut(),
                    message: 0,
                    w_param: 0,
                    l_param: 0,
                    time: 0,
                    pt: Point { x: 0, y: 0 },
                };
                let result = GetMessageW(&mut message, null_mut(), 0, 0);
                if result <= 0 {
                    break;
                }

                if message.message == WM_HOTKEY && message.w_param == HOTKEY_ID as usize {
                    let app_for_task = app.clone();
                    let _ = app.run_on_main_thread(move || {
                        tray::show_main_window(&app_for_task);
                        let _ = app_for_task.emit("desktop-open-command-palette", ());
                    });
                }
            }

            let _ = UnregisterHotKey(null_mut(), HOTKEY_ID);
            log_startup("global shortcut unregistered");
        }
    });
}

#[cfg(not(target_os = "windows"))]
fn register_command_palette_shortcut(_: tauri::AppHandle) {
    log_startup("global shortcut skipped on non-Windows target");
}

fn log_startup(message: &str) {
    if std::env::var("DINAYA_DESKTOP_STARTUP_LOG").ok().as_deref() != Some("1") {
        return;
    }

    if let Ok(mut file) = OpenOptions::new()
        .append(true)
        .create(true)
        .open(std::env::temp_dir().join("dinaya-desktop-startup.log"))
    {
        let _ = writeln!(file, "{}", message);
    }
}

fn main() {
    std::panic::set_hook(Box::new(|info| {
        log_startup(&format!("panic: {}", info));
    }));
    log_startup("main entered");

    let builder = tauri::Builder::default();
    log_startup("builder created");
    let builder = builder
        .manage(commands::TrayState::default())
        .manage(commands::DesktopRuntimeState::default());
    log_startup("state managed");
    let builder = builder.plugin(tauri_plugin_notification::init());
    log_startup("notification plugin configured");
    let builder = builder.plugin(
        tauri_plugin_window_state::Builder::default()
            .with_state_flags(window_state_flags())
            .skip_initial_state("main")
            .build(),
    );
    log_startup("window state plugin configured");
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
        tray::show_main_window(app);
    }));
    log_startup("single instance plugin configured");
    let app = builder
        .invoke_handler(tauri::generate_handler![
            commands::updateTrayCount,
            commands::logDesktopEvent,
            commands::notifyNewBooking,
            commands::notifyUpcoming,
            commands::desktop_auth_set_key,
            commands::desktop_auth_has_key,
            commands::desktop_auth_login,
            commands::desktop_logout,
            commands::desktop_api_request,
            commands::desktop_sync_run,
            commands::desktop_fetch_booking_detail,
            commands::desktop_set_booking_status,
            commands::desktop_open_booking,
            commands::desktop_open_booking_web,
            commands::desktop_open_dashboard,
            commands::desktop_open_dashboard_path,
            commands::desktop_open_app_path,
            commands::desktop_take_pending_booking,
            commands::desktop_log_event,
        ])
        .setup(|app| {
            log_startup("setup entered");
            tray::setup_tray(app)?;
            log_startup("tray setup complete");
            if let Some(window) = app.get_webview_window("main") {
                log_startup("main webview found");
                tray::configure_main_window(&window);
                tray::show_main_window(app.handle());
                show_main_window_after_startup(app.handle().clone());
                register_command_palette_shortcut(app.handle().clone());
            } else {
                log_startup("main webview missing");
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .map_err(|err| {
            log_startup(&format!("build failed: {}", err));
            err
        })
        .expect("failed to build Dinaya Desktop");

    log_startup("build complete");
    app.run(|_, event| match event {
        RunEvent::Ready => log_startup("run event ready"),
        RunEvent::Resumed => log_startup("run event resumed"),
        RunEvent::MainEventsCleared => {}
        RunEvent::Exit => log_startup("run event exit"),
        RunEvent::ExitRequested { api, code, .. } => {
            log_startup(&format!("exit requested code={:?}", code));
            if !tray::is_quitting() {
                log_startup("exit requested prevented");
                api.prevent_exit();
            }
        }
        RunEvent::WindowEvent { label, event, .. } => {
            log_startup(&format!("window event {} {:?}", label, event));
        }
        RunEvent::WebviewEvent { label, event, .. } => {
            log_startup(&format!("webview event {} {:?}", label, event));
        }
        #[cfg(desktop)]
        RunEvent::MenuEvent(_) => {}
        #[cfg(desktop)]
        RunEvent::TrayIconEvent(_) => {}
        _ => {}
    });
    log_startup("run returned");
}
