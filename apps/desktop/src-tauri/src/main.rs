mod commands;
mod tray;

use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .manage(commands::TrayState::default())
    .manage(commands::DesktopRuntimeState::default())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_single_instance::init(|app, _, _| {
      tray::show_main_window(app);
    }))
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
      commands::desktop_take_pending_booking,
      commands::desktop_log_event,
    ])
    .setup(|app| {
      tray::setup_tray(app)?;
      if let Some(window) = app.get_webview_window("main") {
        tray::configure_main_window(&window);
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("failed to run Dinaya Desktop");
}
