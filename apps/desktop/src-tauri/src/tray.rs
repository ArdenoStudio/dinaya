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
    use std::ffi::c_void;
    use std::ptr::null_mut;

    type Hwnd = *mut c_void;

    const SW_RESTORE: i32 = 9;
    const SW_SHOW: i32 = 5;
    const SWP_NOMOVE: u32 = 0x0002;
    const SWP_NOSIZE: u32 = 0x0001;
    const SWP_NOZORDER: u32 = 0x0004;
    const SWP_SHOWWINDOW: u32 = 0x0040;

    #[repr(C)]
    struct Rect {
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
    }

    struct EnumState {
        pid: u32,
        handles: Vec<Hwnd>,
    }

    #[link(name = "user32")]
    extern "system" {
        fn EnumWindows(
            callback: unsafe extern "system" fn(Hwnd, isize) -> i32,
            lparam: isize,
        ) -> i32;
        fn GetClassNameW(hwnd: Hwnd, class_name: *mut u16, max_count: i32) -> i32;
        fn GetWindowRect(hwnd: Hwnd, rect: *mut Rect) -> i32;
        fn GetWindowTextW(hwnd: Hwnd, window_name: *mut u16, max_count: i32) -> i32;
        fn GetWindowThreadProcessId(hwnd: Hwnd, process_id: *mut u32) -> u32;
        fn IsWindowVisible(hwnd: Hwnd) -> i32;
        fn SetForegroundWindow(hwnd: *mut c_void) -> i32;
        fn SetWindowPos(
            hwnd: Hwnd,
            insert_after: Hwnd,
            x: i32,
            y: i32,
            cx: i32,
            cy: i32,
            flags: u32,
        ) -> i32;
        fn ShowWindow(hwnd: *mut c_void, n_cmd_show: i32) -> i32;
    }

    unsafe extern "system" fn collect_process_windows(hwnd: Hwnd, lparam: isize) -> i32 {
        let state = &mut *(lparam as *mut EnumState);
        let mut process_id = 0;
        GetWindowThreadProcessId(hwnd, &mut process_id);
        if process_id == state.pid {
            state.handles.push(hwnd);
        }
        1
    }

    unsafe fn read_window_class(hwnd: Hwnd) -> String {
        let mut buffer = [0u16; 256];
        let len = GetClassNameW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
        String::from_utf16_lossy(&buffer[..len.max(0) as usize])
    }

    unsafe fn read_window_title(hwnd: Hwnd) -> String {
        let mut buffer = [0u16; 256];
        let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
        String::from_utf16_lossy(&buffer[..len.max(0) as usize])
    }

    unsafe fn window_rect(hwnd: Hwnd) -> Rect {
        let mut rect = Rect {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };
        let _ = GetWindowRect(hwnd, &mut rect);
        rect
    }

    unsafe fn should_force_hwnd(hwnd: Hwnd) -> bool {
        let class_name = read_window_class(hwnd);
        let title = read_window_title(hwnd);
        let rect = window_rect(hwnd);
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        width > 100 && height > 100 && (class_name == "tray_icon_app" || title == "Dinaya")
    }

    unsafe fn describe_window(hwnd: Hwnd) -> String {
        let rect = window_rect(hwnd);
        format!(
            "hwnd=0x{:X} visible={} class={} title={} rect={}x{}@{},{}",
            hwnd as isize,
            IsWindowVisible(hwnd),
            read_window_class(hwnd),
            read_window_title(hwnd),
            rect.right - rect.left,
            rect.bottom - rect.top,
            rect.left,
            rect.top
        )
    }

    unsafe fn show_hwnd(hwnd: Hwnd) {
        if !should_force_hwnd(hwnd) {
            log_window_event(&format!("force skipped {}", describe_window(hwnd)));
            return;
        }

        log_window_event(&format!("force before {}", describe_window(hwnd)));
        let _ = ShowWindow(hwnd, SW_RESTORE);
        let _ = ShowWindow(hwnd, SW_SHOW);
        let _ = SetWindowPos(
            hwnd,
            null_mut(),
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_SHOWWINDOW,
        );
        let _ = SetForegroundWindow(hwnd);
        log_window_event(&format!("force after {}", describe_window(hwnd)));
    }

    if let Ok(visible) = window.is_visible() {
        log_window_event(&format!("tauri window visible={}", visible));
    }

    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            log_window_event("forcing tauri hwnd");
            show_hwnd(hwnd.0);
        }
    } else {
        log_window_event("tauri hwnd unavailable");
    }

    let mut state = EnumState {
        pid: std::process::id(),
        handles: Vec::new(),
    };

    unsafe {
        let state_ptr = &mut state as *mut EnumState;
        let _ = EnumWindows(collect_process_windows, state_ptr as isize);
        log_window_event(&format!(
            "process top-level hwnd count={}",
            state.handles.len()
        ));
        for hwnd in state.handles {
            show_hwnd(hwnd);
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn force_native_window_visible(_: &WebviewWindow) {}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        force_native_window_visible(&window);
    }
}

pub fn configure_main_window(window: &WebviewWindow) {
    let window_handle = window.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            if !is_quitting() {
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
