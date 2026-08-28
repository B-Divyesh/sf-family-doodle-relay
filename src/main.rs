use axum::{
    body::Body,
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, Path, Query, State},
    http::{header, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePoolOptions;
use std::{collections::HashMap, env, net::SocketAddr, path::PathBuf, sync::Arc, time::{Duration, Instant, SystemTime, UNIX_EPOCH}};
use tokio::sync::{broadcast, Mutex};
use tower_http::{services::{ServeDir, ServeFile}, trace::TraceLayer};
use tracing::{info, warn};
use uuid::Uuid;

const BUILD_SHA: &str = match option_env!("BUILD_SHA") { Some(value) => value, None => "dev" };
const ROOM_TTL: Duration = Duration::from_secs(4 * 60 * 60);
const TURN_SECONDS: u64 = 45;

#[derive(Clone)]
struct AppState {
    rooms: Arc<Mutex<HashMap<String, Room>>>,
    limits: Arc<Mutex<HashMap<String, LimitWindow>>>,
    _db: sqlx::SqlitePool,
}

struct LimitWindow { started: Instant, count: u32 }

struct Room {
    code: String,
    host_token: String,
    guest_token: Option<String>,
    host_connected: bool,
    guest_connected: bool,
    phase: usize,
    total_turns: usize,
    deadline: Option<u64>,
    strokes: Vec<Stroke>,
    snapshots: Vec<Vec<Stroke>>,
    guesses: Vec<String>,
    created: Instant,
    tx: broadcast::Sender<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Point { x: f32, y: f32 }

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Stroke { points: Vec<Point>, width: f32 }

#[derive(Serialize)]
struct RoomView {
    kind: &'static str,
    code: String,
    role: String,
    partner_connected: bool,
    phase: usize,
    total_turns: usize,
    action: &'static str,
    active_role: &'static str,
    deadline: Option<u64>,
    prompt: &'static str,
    strokes: Vec<Stroke>,
    snapshots: Vec<Vec<Stroke>>,
    guesses: Vec<String>,
    finished: bool,
}

#[derive(Deserialize)]
struct CreateRoom { #[serde(default)] paid: bool }

#[derive(Serialize)]
struct RoomCredentials { code: String, token: String, role: &'static str, expires_at: u64 }

#[derive(Deserialize)]
struct JoinRoom { code: String }

#[derive(Deserialize)]
struct AuthQuery { token: String }

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientEvent {
    Stroke { stroke: Stroke },
    Undo,
    Clear,
    FinishTurn,
    SubmitGuess { guess: String },
    EndRoom,
    Ping,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let db = SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.expect("in-memory database");
    sqlx::query("CREATE TABLE IF NOT EXISTS boot (started_at INTEGER NOT NULL)").execute(&db).await.expect("boot table");
    sqlx::query("INSERT INTO boot (started_at) VALUES (?)").bind(now_secs() as i64).execute(&db).await.expect("boot row");
    info!(config="generated in-memory room store; supplied PORT if set", build_sha=BUILD_SHA, "server configuration ready");

    let state = AppState { rooms: Arc::new(Mutex::new(HashMap::new())), limits: Arc::new(Mutex::new(HashMap::new())), _db: db };
    let dist = PathBuf::from(env::var("DIST_DIR").unwrap_or_else(|_| "dist".into()));
    let fallback = ServeFile::new(dist.join("index.html"));
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/rooms", post(create_room))
        .route("/api/rooms/join", post(join_room))
        .route("/api/rooms/{code}", get(get_room))
        .route("/ws/{code}", get(ws_handler))
        .nest_service("/assets", ServeDir::new(dist.join("assets")))
        .fallback_service(ServeDir::new(&dist).not_found_service(fallback))
        .layer(middleware::from_fn_with_state(state.clone(), security_and_rate_limit))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port: u16 = env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8080);
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(address).await.expect("bind");
    info!(%address, "listening");
    axum::serve(listener, app).with_graceful_shutdown(shutdown_signal()).await.expect("server");
}

async fn shutdown_signal() {
    let ctrl_c = async { tokio::signal::ctrl_c().await.expect("ctrl-c handler") };
    #[cfg(unix)]
    let terminate = async { tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()).expect("term handler").recv().await; };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    info!("graceful shutdown requested");
}

async fn security_and_rate_limit(State(state): State<AppState>, request: Request<Body>, next: Next) -> Response {
    let request_path = request.uri().path().to_string();
    if request.uri().path() != "/health" {
        let key = request.headers().get("x-forwarded-for").and_then(|v| v.to_str().ok()).and_then(|v| v.split(',').next()).unwrap_or("direct").trim().to_string();
        let mut limits = state.limits.lock().await;
        let entry = limits.entry(key).or_insert(LimitWindow { started: Instant::now(), count: 0 });
        if entry.started.elapsed() >= Duration::from_secs(1) { entry.started = Instant::now(); entry.count = 0; }
        entry.count += 1;
        if entry.count > 40 {
            return (StatusCode::TOO_MANY_REQUESTS, [(header::RETRY_AFTER, "1")], "Too many requests. Wait one second, then try again.").into_response();
        }
    }
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert("x-content-type-options", HeaderValue::from_static("nosniff"));
    headers.insert("referrer-policy", HeaderValue::from_static("no-referrer"));
    headers.insert("permissions-policy", HeaderValue::from_static("camera=(), microphone=(), geolocation=()"));
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self' wss: ws: https://api.sociobot.in; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://api.sociobot.in"));
    if request_path.starts_with("/assets/") {
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("public, max-age=31536000, immutable"));
    } else if request_path.ends_with(".webp") || request_path.ends_with(".png") || request_path.ends_with(".svg") {
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("public, max-age=86400"));
    } else {
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
    }
    response
}

async fn health() -> Json<serde_json::Value> { Json(serde_json::json!({"status":"ok", "build_sha": BUILD_SHA})) }

async fn create_room(State(state): State<AppState>, Json(input): Json<CreateRoom>) -> impl IntoResponse {
    prune_rooms(&state).await;
    let alphabet = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let (code, host_token) = {
        let rooms = state.rooms.lock().await;
        let mut rng = rand::rng();
        let code = loop {
            let value: String = (0..12).map(|_| alphabet[rng.random_range(0..alphabet.len())] as char).collect();
            if !rooms.contains_key(&value) { break value; }
        };
        (code, Uuid::new_v4().to_string())
    };
    let (tx, _) = broadcast::channel(128);
    let room = Room { code: code.clone(), host_token: host_token.clone(), guest_token: None, host_connected: false, guest_connected: false, phase: 0, total_turns: if input.paid { 8 } else { 4 }, deadline: None, strokes: vec![], snapshots: vec![], guesses: vec![], created: Instant::now(), tx };
    state.rooms.lock().await.insert(code.clone(), room);
    (StatusCode::CREATED, Json(RoomCredentials { code, token: host_token, role: "host", expires_at: now_secs() + ROOM_TTL.as_secs() }))
}

async fn join_room(State(state): State<AppState>, Json(input): Json<JoinRoom>) -> Response {
    let code = normalize_code(&input.code);
    let mut rooms = state.rooms.lock().await;
    let Some(room) = rooms.get_mut(&code) else { return error(StatusCode::NOT_FOUND, "Room not found. Check the code and ask the host to keep the room open."); };
    if room.guest_token.is_some() { return error(StatusCode::CONFLICT, "This room already has two players. Ask the host to make a new room."); }
    let token = Uuid::new_v4().to_string();
    room.guest_token = Some(token.clone());
    room.deadline = Some(now_secs() + TURN_SECONDS);
    let expires_at = now_secs() + room_ttl_remaining(room);
    broadcast_views(room);
    drop(rooms);
    spawn_timer(state.clone(), code.clone());
    (StatusCode::OK, Json(RoomCredentials { code, token, role: "guest", expires_at })).into_response()
}

async fn get_room(State(state): State<AppState>, Path(code): Path<String>, Query(auth): Query<AuthQuery>) -> Response {
    let rooms = state.rooms.lock().await;
    let Some(room) = rooms.get(&normalize_code(&code)) else { return error(StatusCode::NOT_FOUND, "Room not found. Ask the host to make a new room."); };
    let Some(role) = role_for(room, &auth.token) else { return error(StatusCode::UNAUTHORIZED, "This private room link is not valid. Open your latest invite link."); };
    Json(view(room, role)).into_response()
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>, Path(code): Path<String>, Query(auth): Query<AuthQuery>) -> Response {
    let code = normalize_code(&code);
    let role = {
        let rooms = state.rooms.lock().await;
        rooms.get(&code).and_then(|room| role_for(room, &auth.token)).map(str::to_string)
    };
    let Some(role) = role else { return error(StatusCode::UNAUTHORIZED, "This private room link is not valid."); };
    ws.on_upgrade(move |socket| room_socket(socket, state, code, auth.token, role))
}

async fn room_socket(socket: WebSocket, state: AppState, code: String, token: String, role: String) {
    let mut rx = {
        let mut rooms = state.rooms.lock().await;
        let Some(room) = rooms.get_mut(&code) else { return; };
        if role == "host" { room.host_connected = true } else { room.guest_connected = true }
        let rx = room.tx.subscribe();
        broadcast_views(room);
        rx
    };
    let (mut sender, mut receiver) = socket.split();
    let send_task = tokio::spawn(async move {
        while let Ok(message) = rx.recv().await {
            if sender.send(Message::Text(message.into())).await.is_err() { break; }
        }
    });
    while let Some(Ok(message)) = receiver.next().await {
        if let Message::Text(text) = message {
            match serde_json::from_str::<ClientEvent>(&text) {
                Ok(event) => handle_event(&state, &code, &token, event).await,
                Err(_) => warn!(room=%code, "invalid websocket message"),
            }
        }
    }
    send_task.abort();
    let mut rooms = state.rooms.lock().await;
    if let Some(room) = rooms.get_mut(&code) {
        if role == "host" { room.host_connected = false } else { room.guest_connected = false }
        broadcast_views(room);
    }
}

async fn handle_event(state: &AppState, code: &str, token: &str, event: ClientEvent) {
    let mut rooms = state.rooms.lock().await;
    let mut remove = false;
    if let Some(room) = rooms.get_mut(code) {
        let Some(role) = role_for(room, token) else { return; };
        let role = role.to_string();
        let active = active_role(room.phase);
        match event {
            ClientEvent::Stroke { stroke } if action_for(room.phase) == "draw" && role == active && stroke.points.len() <= 1000 && stroke.width >= 1.0 && stroke.width <= 18.0 => room.strokes.push(stroke),
            ClientEvent::Undo if action_for(room.phase) == "draw" && role == active => { room.strokes.pop(); },
            ClientEvent::Clear if action_for(room.phase) == "draw" && role == active => room.strokes.clear(),
            ClientEvent::FinishTurn if action_for(room.phase) == "draw" && role == active => advance(room),
            ClientEvent::SubmitGuess { guess } if action_for(room.phase) == "guess" && role == active => {
                let clean: String = guess.trim().chars().take(80).collect();
                if !clean.is_empty() { room.guesses.push(clean); advance(room); }
            },
            ClientEvent::EndRoom if role == "host" => { let _ = room.tx.send(serde_json::json!({"kind":"ended"}).to_string()); remove = true; },
            ClientEvent::Ping => {},
            _ => {}
        }
        if !remove { broadcast_views(room); }
    }
    if remove { rooms.remove(code); }
}

fn advance(room: &mut Room) {
    if action_for(room.phase) == "draw" { room.snapshots.push(room.strokes.clone()); }
    room.phase += 1;
    room.deadline = if room.phase < room.total_turns { Some(now_secs() + TURN_SECONDS) } else { None };
}

fn broadcast_views(room: &Room) {
    let _ = room.tx.send(serde_json::to_string(&view(room, "host")).unwrap());
    let _ = room.tx.send(serde_json::to_string(&view(room, "guest")).unwrap());
}

fn view(room: &Room, role: &str) -> RoomView {
    RoomView { kind: "state", code: room.code.clone(), role: role.into(), partner_connected: if role == "host" { room.guest_connected } else { room.host_connected }, phase: room.phase, total_turns: room.total_turns, action: action_for(room.phase), active_role: active_role(room.phase), deadline: room.deadline, prompt: "A tiny house takes a surprising trip", strokes: room.strokes.clone(), snapshots: room.snapshots.clone(), guesses: room.guesses.clone(), finished: room.phase >= room.total_turns }
}

fn action_for(phase: usize) -> &'static str { if phase >= 4 && phase % 4 == 0 { "draw" } else { ["draw", "guess", "draw", "guess"][phase % 4] } }
fn active_role(phase: usize) -> &'static str { ["host", "guest", "guest", "host"][phase % 4] }
fn role_for<'a>(room: &'a Room, token: &str) -> Option<&'a str> { if token == room.host_token { Some("host") } else if room.guest_token.as_deref() == Some(token) { Some("guest") } else { None } }
fn normalize_code(code: &str) -> String { code.chars().filter(|c| c.is_ascii_alphanumeric()).flat_map(char::to_uppercase).take(12).collect() }
fn now_secs() -> u64 { SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() }
fn room_ttl_remaining(room: &Room) -> u64 { ROOM_TTL.saturating_sub(room.created.elapsed()).as_secs() }

fn spawn_timer(state: AppState, code: String) {
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(1)).await;
            let mut rooms = state.rooms.lock().await;
            let Some(room) = rooms.get_mut(&code) else { break; };
            if room.phase >= room.total_turns { break; }
            if room.deadline.is_some_and(|d| d <= now_secs()) { advance(room); broadcast_views(room); }
        }
    });
}

async fn prune_rooms(state: &AppState) {
    state.rooms.lock().await.retain(|_, room| room.created.elapsed() < ROOM_TTL);
}

fn error(status: StatusCode, message: &str) -> Response { (status, Json(serde_json::json!({"error": message}))).into_response() }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn codes_are_normalized() { assert_eq!(normalize_code("abcd-2345 efgh"), "ABCD2345EFGH"); }
    #[test]
    fn turns_alternate_actions_and_players() {
        assert_eq!((action_for(0), active_role(0)), ("draw", "host"));
        assert_eq!((action_for(1), active_role(1)), ("guess", "guest"));
        assert_eq!((action_for(2), active_role(2)), ("draw", "guest"));
        assert_eq!((action_for(3), active_role(3)), ("guess", "host"));
    }
}
