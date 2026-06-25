#![allow(non_snake_case)]

use keyring::Entry;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use reqwest::Client;
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::Write;
use std::process::Command;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;
use tauri::menu::MenuItem;
use tauri::{AppHandle, Emitter, Manager, State, Wry};
use tauri_plugin_notification::NotificationExt;

const TRAY_ID: &str = "main_tray";
const DESKTOP_KEY_SERVICE: &str = "DinayaDesktop";
const DESKTOP_KEY_USERNAME: &str = "desktop_api_key";
const DEFAULT_API_BASE_URL: &str = "https://dinaya.lk";

fn write_startup_log(message: &str) {
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

#[derive(Default)]
pub struct TrayState {
  pub count: AtomicU32,
  pub offline: AtomicBool,
  pub today_menu_item: Mutex<Option<MenuItem<Wry>>>,
  pub latest_booking_menu_item: Mutex<Option<MenuItem<Wry>>>,
  pub latest_notification_booking_id: Mutex<Option<String>>,
}

impl TrayState {
  pub fn set_menu_item(&self, menu_item: MenuItem<Wry>) {
    if let Ok(mut lock) = self.today_menu_item.lock() {
      *lock = Some(menu_item);
    }
  }

  pub fn set_latest_booking_menu_item(&self, menu_item: MenuItem<Wry>) {
    if let Ok(mut lock) = self.latest_booking_menu_item.lock() {
      *lock = Some(menu_item);
    }
  }
}

#[derive(Default)]
pub struct DesktopRuntimeState {
  pub active_business: Mutex<Option<String>>,
  pub auth_status: Mutex<String>,
  pub desktop_key: Mutex<Option<String>>,
  pub unread_count: AtomicU32,
  pub last_sync_timestamp: Mutex<Option<String>>,
  pub pending_open_booking_id: Mutex<Option<String>>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingNotificationPayload {
  pub booking_id: String,
  pub client_name: String,
  pub service_name: String,
  pub starts_at: String,
}

fn current_tray_label(count: u32, offline: bool) -> String {
  if offline {
    "Offline".to_string()
  } else {
    format!("Today: {} bookings", count)
  }
}

fn update_tray_visuals(app: &AppHandle, state: &TrayState) {
  let count = state.count.load(Ordering::Relaxed);
  let offline = state.offline.load(Ordering::Relaxed);
  let label = current_tray_label(count, offline);

  if let Ok(lock) = state.today_menu_item.lock() {
    if let Some(item) = lock.as_ref() {
      let _ = item.set_text(label.clone());
    }
  }

  if let Some(tray) = app.tray_by_id(TRAY_ID) {
    let tooltip = if offline {
      "Dinaya Desktop (offline)".to_string()
    } else {
      format!("Dinaya Desktop ({})", label)
    };
    let _ = tray.set_tooltip(Some(tooltip));
  }
}

fn remember_notification_booking(app: &AppHandle, state: &TrayState, booking_id: &str) {
  if let Ok(mut lock) = state.latest_notification_booking_id.lock() {
    *lock = Some(booking_id.to_string());
  }

  if let Ok(lock) = state.latest_booking_menu_item.lock() {
    if let Some(item) = lock.as_ref() {
      let _ = item.set_enabled(true);
    }
  }

  if let Some(tray) = app.tray_by_id(TRAY_ID) {
    let _ = tray.set_tooltip(Some("Dinaya Desktop (new booking ready)"));
  }
}

#[tauri::command]
pub fn updateTrayCount(
  app: AppHandle,
  state: State<'_, TrayState>,
  count: u32,
  offline: bool,
) -> Result<(), String> {
  state.count.store(count, Ordering::Relaxed);
  state.offline.store(offline, Ordering::Relaxed);
  update_tray_visuals(&app, &state);
  Ok(())
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopLogPayload {
  pub level: String,
  pub message: String,
}

#[derive(serde::Deserialize)]
pub struct DesktopStructuredLogPayload {
  pub level: String,
  pub category: String,
  pub message: String,
  pub meta: Option<serde_json::Value>,
}

#[derive(Default, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopSyncRequest {
  pub tab: Option<String>,
  pub limit: Option<u32>,
  pub cursor: Option<String>,
  pub since: Option<String>,
  pub status: Option<String>,
  pub staff_id: Option<String>,
  pub q: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct DesktopStatusUpdateRequest {
  pub id: String,
  pub status: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopLoginRequest {
  pub device_name: String,
  pub email: String,
  pub password: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopRegisterRequest {
  pub business_name: String,
  pub business_type: String,
  pub device_name: String,
  pub email: String,
  pub language: String,
  pub name: String,
  pub password: String,
  pub slug: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopApiRequest {
  pub body: Option<serde_json::Value>,
  pub method: String,
  pub path: String,
}

fn keyring_entry() -> Result<Entry, String> {
  Entry::new(DESKTOP_KEY_SERVICE, DESKTOP_KEY_USERNAME).map_err(|err| err.to_string())
}

fn persist_desktop_key(key: &str) -> Result<(), String> {
  let entry = keyring_entry()?;
  entry.set_password(key).map_err(|err| err.to_string())
}

fn load_desktop_key_from_keyring() -> Result<String, String> {
  let entry = keyring_entry()?;
  entry.get_password().map_err(|_| "Desktop key not configured.".to_string())
}

fn load_desktop_key(state: &DesktopRuntimeState) -> Result<String, String> {
  if let Ok(lock) = state.desktop_key.lock() {
    if let Some(key) = lock.as_ref() {
      return Ok(key.clone());
    }
  }

  let key = load_desktop_key_from_keyring()?;
  if let Ok(mut lock) = state.desktop_key.lock() {
    *lock = Some(key.clone());
  }
  Ok(key)
}

fn clear_desktop_key() -> Result<(), String> {
  let entry = keyring_entry()?;
  match entry.delete_credential() {
    Ok(_) => Ok(()),
    Err(_) => Ok(()),
  }
}

fn api_base_url() -> String {
  std::env::var("DINAYA_API_BASE_URL")
    .ok()
    .filter(|value| !value.trim().is_empty())
    .unwrap_or_else(|| DEFAULT_API_BASE_URL.to_string())
    .trim_end_matches('/')
    .to_string()
}

fn desktop_api_url(path: &str) -> String {
  format!("{}{}", api_base_url(), path)
}

fn ensure_desktop_api_path(path: &str) -> Result<(), String> {
  if !path.starts_with("/api/v1/desktop/") {
    return Err("Desktop API bridge only allows /api/v1/desktop/* paths.".to_string());
  }

  if path.contains("://") || path.contains("\\") || path.contains("..") {
    return Err("Desktop API bridge received an invalid path.".to_string());
  }

  Ok(())
}

async fn parse_desktop_api_response(response: reqwest::Response) -> Result<serde_json::Value, String> {
  let status = response.status();
  let text = response.text().await.map_err(|err| err.to_string())?;
  let body = serde_json::from_str::<serde_json::Value>(&text).map_err(|_| {
    let preview = text.trim().chars().take(180).collect::<String>();
    if preview.is_empty() {
      format!("Desktop API returned an empty response (HTTP {}).", status.as_u16())
    } else {
      format!(
        "Desktop API returned a non-JSON response (HTTP {}). The endpoint may not be deployed yet.",
        status.as_u16()
      )
    }
  })?;

  if !status.is_success() {
    return Err(body
      .get("error")
      .and_then(|value| value.as_str())
      .map(|message| format!("{} (HTTP {})", message, status.as_u16()))
      .unwrap_or_else(|| format!("Desktop API request failed (HTTP {}).", status.as_u16())));
  }

  Ok(body)
}

async fn desktop_api_get(path: &str, token: &str) -> Result<serde_json::Value, String> {
  ensure_desktop_api_path(path)?;

  let client = Client::new();
  let response = client
    .get(desktop_api_url(path))
    .header(AUTHORIZATION, format!("Bearer {}", token))
    .header("X-Dinaya-Desktop", "1")
    .send()
    .await
    .map_err(|err| err.to_string())?;

  parse_desktop_api_response(response).await
}

async fn desktop_api_post(
  path: &str,
  payload: serde_json::Value,
  token: Option<String>,
) -> Result<serde_json::Value, String> {
  ensure_desktop_api_path(path)?;

  let client = Client::new();
  let mut request = client
    .post(desktop_api_url(path))
    .header("X-Dinaya-Desktop", "1")
    .header(CONTENT_TYPE, "application/json")
    .body(payload.to_string());

  if let Some(token) = token {
    request = request.header(AUTHORIZATION, format!("Bearer {}", token));
  }

  let response = request.send().await.map_err(|err| err.to_string())?;
  parse_desktop_api_response(response).await
}

async fn desktop_api_patch(
  path: &str,
  payload: serde_json::Value,
  token: &str,
) -> Result<serde_json::Value, String> {
  ensure_desktop_api_path(path)?;

  let client = Client::new();
  let response = client
    .patch(desktop_api_url(path))
    .header(AUTHORIZATION, format!("Bearer {}", token))
    .header("X-Dinaya-Desktop", "1")
    .header(CONTENT_TYPE, "application/json")
    .body(payload.to_string())
    .send()
    .await
    .map_err(|err| err.to_string())?;

  parse_desktop_api_response(response).await
}

async fn desktop_api_request_with_method(
  method: &str,
  path: &str,
  payload: Option<serde_json::Value>,
  token: &str,
) -> Result<serde_json::Value, String> {
  ensure_desktop_api_path(path)?;

  let client = Client::new();
  let method = method.trim().to_ascii_uppercase();
  let mut request = (match method.as_str() {
    "DELETE" => client.delete(desktop_api_url(path)),
    "GET" => client.get(desktop_api_url(path)),
    "PATCH" => client.patch(desktop_api_url(path)),
    "POST" => client.post(desktop_api_url(path)),
    _ => return Err("Unsupported desktop API method.".to_string()),
  })
    .header(AUTHORIZATION, format!("Bearer {}", token))
    .header("X-Dinaya-Desktop", "1");

  if method != "GET" {
    request = request
      .header(CONTENT_TYPE, "application/json")
      .body(payload.unwrap_or_else(|| serde_json::json!({})).to_string());
  }

  let response = request.send().await.map_err(|err| err.to_string())?;
  parse_desktop_api_response(response).await
}

#[tauri::command]
pub fn logDesktopEvent(payload: DesktopLogPayload) -> Result<(), String> {
  eprintln!("[dinaya-desktop][{}] {}", payload.level, payload.message);
  Ok(())
}

#[tauri::command]
pub fn notifyNewBooking(
  app: AppHandle,
  state: State<'_, TrayState>,
  payload: BookingNotificationPayload,
) -> Result<(), String> {
  remember_notification_booking(&app, &state, &payload.booking_id);
  let body = format!(
    "{} · {}",
    payload.service_name,
    payload.starts_at
  );

  app
    .notification()
    .builder()
    .title(format!("New Booking — {}", payload.client_name))
    .body(body)
    .show()
    .map_err(|err| {
      eprintln!("[dinaya-desktop][error] notifyNewBooking failed: {}", err);
      err.to_string()
    })
}

#[tauri::command]
pub fn notifyUpcoming(
  app: AppHandle,
  state: State<'_, TrayState>,
  payload: BookingNotificationPayload,
) -> Result<(), String> {
  remember_notification_booking(&app, &state, &payload.booking_id);
  let body = format!(
    "{} · {}",
    payload.service_name,
    payload.client_name
  );

  app
    .notification()
    .builder()
    .title("Starting in 15 minutes")
    .body(body)
    .show()
    .map_err(|err| {
      eprintln!("[dinaya-desktop][error] notifyUpcoming failed: {}", err);
      err.to_string()
    })
}

#[tauri::command]
pub fn desktop_auth_set_key(
  state: State<'_, DesktopRuntimeState>,
  key: String,
) -> Result<(), String> {
  let trimmed = key.trim();
  if trimmed.is_empty() {
    return Err("Desktop key cannot be empty.".to_string());
  }

  persist_desktop_key(trimmed)?;
  if let Ok(mut desktop_key) = state.desktop_key.lock() {
    *desktop_key = Some(trimmed.to_string());
  }
  if let Ok(mut auth_status) = state.auth_status.lock() {
    *auth_status = "authenticated".to_string();
  }
  Ok(())
}

#[tauri::command]
pub fn desktop_auth_has_key(state: State<'_, DesktopRuntimeState>) -> Result<bool, String> {
  Ok(load_desktop_key(&state).is_ok())
}

#[tauri::command]
pub async fn desktop_auth_login(
  state: State<'_, DesktopRuntimeState>,
  payload: DesktopLoginRequest,
) -> Result<serde_json::Value, String> {
  let mut response = desktop_api_post(
    "/api/v1/desktop/auth/login",
    serde_json::to_value(payload).map_err(|err| err.to_string())?,
    None,
  )
  .await?;

  let key = response
    .get("desktopKey")
    .and_then(|value| value.as_str())
    .ok_or_else(|| "Desktop login did not return a key.".to_string())?
    .to_string();
  persist_desktop_key(&key)?;
  if let Ok(mut desktop_key) = state.desktop_key.lock() {
    *desktop_key = Some(key);
  }

  if let Some(object) = response.as_object_mut() {
    object.remove("desktopKey");
  }

  if let Ok(mut auth_status) = state.auth_status.lock() {
    *auth_status = "authenticated".to_string();
  }
  if let Ok(mut active_business) = state.active_business.lock() {
    *active_business = response
      .get("business")
      .and_then(|value| value.get("id"))
      .and_then(|value| value.as_str())
      .map(|value| value.to_string());
  }

  Ok(response)
}

#[tauri::command]
pub async fn desktop_auth_register(
  state: State<'_, DesktopRuntimeState>,
  payload: DesktopRegisterRequest,
) -> Result<serde_json::Value, String> {
  let mut response = desktop_api_post(
    "/api/v1/desktop/auth/register",
    serde_json::to_value(payload).map_err(|err| err.to_string())?,
    None,
  )
  .await?;

  let key = response
    .get("desktopKey")
    .and_then(|value| value.as_str())
    .ok_or_else(|| "Desktop registration did not return a key.".to_string())?
    .to_string();
  persist_desktop_key(&key)?;
  if let Ok(mut desktop_key) = state.desktop_key.lock() {
    *desktop_key = Some(key);
  }

  if let Some(object) = response.as_object_mut() {
    object.remove("desktopKey");
  }

  if let Ok(mut auth_status) = state.auth_status.lock() {
    *auth_status = "authenticated".to_string();
  }
  if let Ok(mut active_business) = state.active_business.lock() {
    *active_business = response
      .get("business")
      .and_then(|value| value.get("id"))
      .and_then(|value| value.as_str())
      .map(|value| value.to_string());
  }

  Ok(response)
}

#[tauri::command]
pub async fn desktop_logout(state: State<'_, DesktopRuntimeState>) -> Result<(), String> {
  if let Ok(token) = load_desktop_key(&state) {
    let _ = desktop_api_post("/api/v1/desktop/auth/logout", serde_json::json!({}), Some(token)).await;
  }
  clear_desktop_key()?;
  if let Ok(mut desktop_key) = state.desktop_key.lock() {
    *desktop_key = None;
  }
  if let Ok(mut auth_status) = state.auth_status.lock() {
    *auth_status = "signed_out".to_string();
  }
  if let Ok(mut active_business) = state.active_business.lock() {
    *active_business = None;
  }
  Ok(())
}

#[tauri::command]
pub async fn desktop_api_request(
  state: State<'_, DesktopRuntimeState>,
  request: DesktopApiRequest,
) -> Result<serde_json::Value, String> {
  let token = load_desktop_key(&state)?;
  desktop_api_request_with_method(&request.method, &request.path, request.body, &token).await
}

#[tauri::command]
pub async fn desktop_sync_run(
  state: State<'_, DesktopRuntimeState>,
  request: Option<DesktopSyncRequest>,
) -> Result<serde_json::Value, String> {
  let request = request.unwrap_or_default();
  let mut params = HashMap::new();
  params.insert("tab".to_string(), request.tab.unwrap_or_else(|| "today".to_string()));
  params.insert("limit".to_string(), request.limit.unwrap_or(40).to_string());
  if let Some(cursor) = request.cursor {
    params.insert("cursor".to_string(), cursor);
  }
  if let Some(since) = request.since {
    params.insert("since".to_string(), since);
  }
  if let Some(status) = request.status {
    params.insert("status".to_string(), status);
  }
  if let Some(staff_id) = request.staff_id {
    params.insert("staffId".to_string(), staff_id);
  }
  if let Some(q) = request.q {
    params.insert("q".to_string(), q);
  }

  let query = params
    .iter()
    .map(|(key, value)| format!("{}={}", key, urlencoding::encode(value)))
    .collect::<Vec<String>>()
    .join("&");

  let token = load_desktop_key(&state)?;
  let bootstrap_request = desktop_api_get("/api/v1/desktop/bootstrap", &token);
  let bookings_request = desktop_api_get(&format!("/api/v1/desktop/bookings?{}", query), &token);
  let (bootstrap, bookings) = tokio::join!(bootstrap_request, bookings_request);
  let bootstrap = bootstrap?;
  let bookings = bookings?;

  if let Ok(mut active_business) = state.active_business.lock() {
    *active_business = bootstrap
      .get("business")
      .and_then(|value| value.get("id"))
      .and_then(|value| value.as_str())
      .map(|value| value.to_string());
  }
  if let Ok(mut auth_status) = state.auth_status.lock() {
    *auth_status = "authenticated".to_string();
  }
  if let Ok(mut last_sync) = state.last_sync_timestamp.lock() {
    *last_sync = Some(chrono::Utc::now().to_rfc3339());
  }
  if let Some(rows) = bookings.get("rows").and_then(|value| value.as_array()) {
    state.unread_count.store(rows.len() as u32, Ordering::Relaxed);
  }

  Ok(serde_json::json!({
    "bootstrap": bootstrap,
    "bookings": bookings,
  }))
}

#[tauri::command]
pub async fn desktop_fetch_booking_detail(
  state: State<'_, DesktopRuntimeState>,
  id: String,
) -> Result<serde_json::Value, String> {
  let token = load_desktop_key(&state)?;
  desktop_api_get(&format!("/api/v1/desktop/bookings/{}", id), &token).await
}

#[tauri::command]
pub async fn desktop_set_booking_status(
  state: State<'_, DesktopRuntimeState>,
  payload: DesktopStatusUpdateRequest,
) -> Result<serde_json::Value, String> {
  let token = load_desktop_key(&state)?;
  desktop_api_patch(
    &format!("/api/v1/desktop/bookings/{}/status", payload.id),
    serde_json::json!({ "status": payload.status }),
    &token,
  )
  .await
}

pub fn open_booking_native_first(app: &AppHandle, id: String) -> Result<(), String> {
  if let Some(state) = app.try_state::<DesktopRuntimeState>() {
    if let Ok(mut pending) = state.pending_open_booking_id.lock() {
      *pending = Some(id.clone());
    }
  }

  crate::tray::show_main_window(app);
  app
    .emit("desktop-open-booking", serde_json::json!({ "id": id }))
    .map_err(|err| err.to_string())
}

pub fn open_booking_in_web(app: &AppHandle, id: String) -> Result<(), String> {
  open_web_dashboard(app, Some(&format!("/dashboard/bookings/{}", id)))
}

fn open_url_in_default_browser(target: &str) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  let result = Command::new("rundll32")
    .args(["url.dll,FileProtocolHandler", target])
    .spawn();

  #[cfg(target_os = "macos")]
  let result = Command::new("open").arg(target).spawn();

  #[cfg(all(unix, not(target_os = "macos")))]
  let result = Command::new("xdg-open").arg(target).spawn();

  result
    .map(|_| ())
    .map_err(|err| format!("Could not open web dashboard in the default browser: {}", err))
}

pub fn open_web_dashboard(app: &AppHandle, path: Option<&str>) -> Result<(), String> {
  let target = format!("{}{}", api_base_url(), path.unwrap_or("/dashboard"));
  let _ = app;
  // Desktop login uses a bearer key, while the web dashboard uses browser cookies.
  // Opening the fallback in the default browser keeps those auth models separate.
  open_url_in_default_browser(&target)
}

pub fn open_latest_notification_booking(app: &AppHandle) -> Result<(), String> {
  let state = app.state::<TrayState>();
  let booking_id = state
    .latest_notification_booking_id
    .lock()
    .map_err(|_| "Latest booking state is unavailable.".to_string())?
    .clone()
    .ok_or_else(|| "No latest booking notification yet.".to_string())?;

  open_booking_native_first(app, booking_id)
}

#[tauri::command]
pub fn desktop_open_booking(app: AppHandle, id: String) -> Result<(), String> {
  open_booking_native_first(&app, id)
}

#[tauri::command]
pub fn desktop_open_booking_web(app: AppHandle, id: String) -> Result<(), String> {
  open_booking_in_web(&app, id)
}

#[tauri::command]
pub fn desktop_open_dashboard(app: AppHandle) -> Result<(), String> {
  open_web_dashboard(&app, None)
}

#[tauri::command]
pub fn desktop_open_dashboard_path(app: AppHandle, path: String) -> Result<(), String> {
  if !path.starts_with("/dashboard") {
    return Err("Dashboard fallback path must start with /dashboard.".to_string());
  }

  if path.contains("://") || path.contains("\\") || path.contains("..") || path.starts_with("//") {
    return Err("Dashboard fallback path is invalid.".to_string());
  }

  open_web_dashboard(&app, Some(&path))
}

#[tauri::command]
pub fn desktop_open_app_path(app: AppHandle, path: String) -> Result<(), String> {
  let allowed = ["/auth/signin", "/forgot-password", "/register", "/dashboard"];
  if !allowed.iter().any(|prefix| path == *prefix || path.starts_with(&format!("{}/", prefix))) {
    return Err("App browser path is not allowed.".to_string());
  }

  if path.contains("://") || path.contains("\\") || path.contains("..") || path.starts_with("//") {
    return Err("App browser path is invalid.".to_string());
  }

  open_web_dashboard(&app, Some(&path))
}

#[tauri::command]
pub fn desktop_take_pending_booking(
  state: State<'_, DesktopRuntimeState>,
) -> Result<Option<String>, String> {
  state
    .pending_open_booking_id
    .lock()
    .map(|mut lock| lock.take())
    .map_err(|_| "Pending booking state is unavailable.".to_string())
}

#[tauri::command]
pub fn desktop_log_event(payload: DesktopStructuredLogPayload) -> Result<(), String> {
  let meta = payload.meta.unwrap_or(serde_json::json!({}));
  write_startup_log(&format!(
    "frontend log [{}][{}] {} | {}",
    payload.level, payload.category, payload.message, meta
  ));
  eprintln!(
    "[dinaya-desktop][{}][{}] {} | {}",
    payload.level,
    payload.category,
    payload.message,
    meta
  );
  Ok(())
}
