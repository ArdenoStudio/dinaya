use std::fs::OpenOptions;
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, AppHandle, Manager, WebviewWindow, WindowEvent};

use crate::commands::TrayState;

const QUIT_MENU_ID: &str = "quit";
const OPEN_DASHBOARD_MENU_ID: &str = "open_dashboard";
const OPEN_BOOKINGS_INBOX_MENU_ID: &str = "open_bookings_inbox";
const OPEN_LATEST_BOOKING_MENU_ID: &str = "open_latest_booking";
const NEW_BOOKING_MENU_ID: &str = "new_booking";

static IS_QUITTING: AtomicBool = AtomicBool::new(false);

pub fn is_quitting() -> bool {
    IS_QUITTING.load(Ordering::Relaxed)
}

fn set_quitting(value: bool) {
    IS_QUITTING.store(value, Ordering::Relaxed);
}

fn log_window_event(message: &str) {
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

#[cfg(target_os = "windows")]
fn force_native_window_visible(window: &WebviewWindow) {
    if let Ok(visible) = window.is_visible() {
        log_window_event(&format!("tauri window visible={}", visible));
    }
    log_window_event("native force skipped; using Tauri visibility");
}

#[cfg(not(target_os = "windows"))]
fn force_native_window_visible(_: &WebviewWindow) {}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        match window.is_visible() {
            Ok(visible) => log_window_event(&format!("show_main_window before visible={}", visible)),
            Err(err) => log_window_event(&format!("show_main_window before visible error={}", err)),
        }
        if let Err(err) = window.show() {
            log_window_event(&format!("show_main_window show error={}", err));
        }
        if let Err(err) = window.unminimize() {
            log_window_event(&format!("show_main_window unminimize error={}", err));
        }
        if let Err(err) = window.set_focus() {
            log_window_event(&format!("show_main_window focus error={}", err));
        }
        match window.is_visible() {
            Ok(visible) => log_window_event(&format!("show_main_window after visible={}", visible)),
            Err(err) => log_window_event(&format!("show_main_window after visible error={}", err)),
        }
        force_native_window_visible(&window);
    }
}

pub fn configure_main_window(window: &WebviewWindow) {
    let window_handle = window.clone();
    window.on_window_event(move |event| {
        log_window_event(&format!("main window event {:?}", event));
        if let WindowEvent::CloseRequested { api, .. } = event {
            if !is_quitting() {
                log_window_event("main window close prevented; hiding to tray");
                api.prevent_close();
                let _ = window_handle.hide();
            }
        }
    });
}

pub fn setup_tray(app: &mut App) -> tauri::Result<()> {
    let brand = MenuItem::with_id(app, "brand", "Dinaya", false, None::<&str>)?;
    let today = MenuItem::with_id(app, "today_count", "Today: 0 bookings", false, None::<&str>)?;
    let open_dashboard = MenuItem::with_id(
        app,
        OPEN_DASHBOARD_MENU_ID,
        "Open Web Dashboard in Browser",
        true,
        None::<&str>,
    )?;
    let open_bookings_inbox = MenuItem::with_id(
        app,
        OPEN_BOOKINGS_INBOX_MENU_ID,
        "Open Bookings Inbox",
        true,
        None::<&str>,
    )?;
    let open_latest_booking = MenuItem::with_id(
        app,
        OPEN_LATEST_BOOKING_MENU_ID,
        "Open Latest Booking",
        false,
        None::<&str>,
    )?;
    let new_booking = MenuItem::with_id(
        app,
        NEW_BOOKING_MENU_ID,
        "New Booking in Browser",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, QUIT_MENU_ID, "Quit", true, None::<&str>)?;
    let separator_1 = PredefinedMenuItem::separator(app)?;
    let separator_2 = PredefinedMenuItem::separator(app)?;
    let separator_3 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &brand,
            &separator_1,
            &today,
            &separator_2,
            &open_bookings_inbox,
            &open_latest_booking,
            &open_dashboard,
            &new_booking,
            &separator_3,
            &quit,
        ],
    )?;

    app.state::<TrayState>().set_menu_item(today);
    app.state::<TrayState>()
        .set_latest_booking_menu_item(open_latest_booking);

    let mut tray_builder = TrayIconBuilder::with_id("main_tray")
        .tooltip("Dinaya Desktop")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            OPEN_BOOKINGS_INBOX_MENU_ID => {
                show_main_window(app);
            }
            OPEN_LATEST_BOOKING_MENU_ID => {
                let _ = crate::commands::open_latest_notification_booking(app);
            }
            OPEN_DASHBOARD_MENU_ID => {
                let _ = crate::commands::open_web_dashboard(app, None);
            }
            NEW_BOOKING_MENU_ID => {
                let _ = crate::commands::open_web_dashboard(app, Some("/dashboard/bookings/new"));
            }
            QUIT_MENU_ID => {
                set_quitting(true);
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(&tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        tray_builder = tray_builder.icon(icon);
    }

    tray_builder.build(app)?;
    Ok(())
}
