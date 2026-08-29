use axum::{
    body::Body,
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        ConnectInfo, Path, Query, State,
    },
    http::{header, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, Row, SqlitePool};
use std::{
    collections::HashMap,
    env,
    net::SocketAddr,
    path::PathBuf,
    sync::Arc,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tokio::sync::Mutex;
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::{info, warn};
use uuid::Uuid;

const BUILD_SHA: &str = match option_env!("BUILD_SHA") {
    Some(value) => value,
    None => "dev",
};
const ROOM_TTL: u64 = 4 * 60 * 60;
const TURN_SECONDS: u64 = 45;
const PRESENCE_SECONDS: u64 = 3;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    limits: Arc<Mutex<HashMap<String, LimitWindow>>>,
    writes: Arc<Mutex<()>>,
    verify_url: String,
}
struct LimitWindow {
    started: Instant,
    count: u32,
}
#[derive(Clone)]
struct Room {
    code: String,
    host_token: String,
    guest_token: Option<String>,
    phase: usize,
    total_turns: usize,
    deadline: Option<u64>,
    strokes: Vec<Stroke>,
    snapshots: Vec<Vec<Stroke>>,
    guesses: Vec<String>,
    created_at: u64,
    expires_at: u64,
    host_seen: u64,
    guest_seen: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Point {
    x: f32,
    y: f32,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Stroke {
    points: Vec<Point>,
    width: f32,
}
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
struct CreateRoom {
    #[serde(default)]
    paid: bool,
    license: Option<String>,
}
#[derive(Serialize)]
struct RoomCredentials {
    code: String,
    token: String,
    role: &'static str,
    expires_at: u64,
}
#[derive(Deserialize)]
struct JoinRoom {
    code: String,
}
#[derive(Deserialize)]
struct AuthQuery {
    token: String,
}
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
#[derive(Deserialize)]
struct LicenseResponse {
    valid: bool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();
    let db = open_database().await;
    initialize_database(&db).await;
    info!(
        config = if env::var("DATABASE_URL").is_ok() {
            "supplied DATABASE_URL; supplied PORT if set"
        } else {
            "generated persistent /data SQLite room store; supplied PORT if set"
        },
        build_sha = BUILD_SHA,
        "server configuration ready"
    );
    let state = AppState {
        db,
        limits: Arc::new(Mutex::new(HashMap::new())),
        writes: Arc::new(Mutex::new(())),
        verify_url: env::var("SOCIOBOT_VERIFY_URL").unwrap_or_else(|_| {
            "https://api.sociobot.in/api/v1/products/family-doodle-relay/verify".into()
        }),
    };
    let dist = PathBuf::from(env::var("DIST_DIR").unwrap_or_else(|_| "dist".into()));
    let index_file = dist.join("index.html");
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/rooms", post(create_room))
        .route("/api/rooms/join", post(join_room))
        .route("/api/rooms/{code}", get(get_room))
        .route("/ws/{code}", get(ws_handler))
        .route_service("/demo", ServeFile::new(&index_file))
        .route_service("/play", ServeFile::new(&index_file))
        .route_service("/privacy", ServeFile::new(&index_file))
        .route_service("/terms", ServeFile::new(&index_file))
        .route_service("/join/{code}", ServeFile::new(&index_file))
        .route_service("/room/{code}", ServeFile::new(&index_file))
        .nest_service("/assets", ServeDir::new(dist.join("assets")))
        .fallback_service(
            ServeDir::new(&dist).not_found_service(ServeFile::new(dist.join("404.html"))),
        )
        .layer(middleware::from_fn_with_state(
            state.clone(),
            security_and_rate_limit,
        ))
        .layer(TraceLayer::new_for_http())
        .with_state(state);
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(address).await.expect("bind");
    info!(%address, "listening");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("server");
}
async fn open_database() -> SqlitePool {
    let url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        std::fs::create_dir_all("/data").expect("create /data");
        "sqlite:/data/family-doodle-relay.db?mode=rwc".into()
    });
    SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .expect("open SQLite room store")
}
async fn initialize_database(db: &SqlitePool) {
    sqlx::query("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;")
        .execute(db)
        .await
        .expect("configure SQLite");
    sqlx::query("CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY NOT NULL, host_token TEXT NOT NULL, guest_token TEXT, phase INTEGER NOT NULL, total_turns INTEGER NOT NULL, deadline INTEGER, strokes TEXT NOT NULL, snapshots TEXT NOT NULL, guesses TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, host_seen INTEGER NOT NULL DEFAULT 0, guest_seen INTEGER NOT NULL DEFAULT 0)").execute(db).await.expect("create rooms table");
}
async fn shutdown_signal() {
    let ctrl_c = async { tokio::signal::ctrl_c().await.expect("ctrl-c handler") };
    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("term handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    info!("graceful shutdown requested");
}

fn trusted_client_identity(request: &Request<Body>) -> String {
    // Azure Container Apps appends the real remote address to X-Forwarded-For.
    // Taking the right-most entry means a caller cannot choose its own bucket by
    // prepending spoofed values. Direct local runs still have a socket fallback.
    request
        .headers()
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|values| values.rsplit(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .or_else(|| {
            request
                .extensions()
                .get::<ConnectInfo<SocketAddr>>()
                .map(|peer| peer.0.ip().to_string())
        })
        .unwrap_or_else(|| "unknown-peer".into())
}

async fn security_and_rate_limit(
    State(state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> Response {
    let path = request.uri().path().to_string();
    if path != "/health" {
        let client = trusted_client_identity(&request);
        let api = path.starts_with("/api/") || path.starts_with("/ws/");
        let key = format!("{client}:{}", if api { "api" } else { "page" });
        let mut limits = state.limits.lock().await;
        limits.retain(|_, window| window.started.elapsed() < Duration::from_secs(60));
        let window = limits.entry(key).or_insert(LimitWindow {
            started: Instant::now(),
            count: 0,
        });
        if window.started.elapsed() >= Duration::from_secs(1) {
            window.started = Instant::now();
            window.count = 0;
        }
        window.count += 1;
        if window.count > 20 {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                [(header::RETRY_AFTER, "1")],
                "Too many requests. Wait one second, then try again.",
            )
                .into_response();
        }
    }
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert("referrer-policy", HeaderValue::from_static("no-referrer"));
    headers.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert("content-security-policy", HeaderValue::from_static("default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self' wss: ws: https://api.sociobot.in; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://api.sociobot.in"));
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static(if path.starts_with("/assets/") {
            "public, max-age=31536000, immutable"
        } else if [".avif", ".webp", ".jpg", ".png", ".svg"]
            .iter()
            .any(|ext| path.ends_with(ext))
        {
            "public, max-age=86400"
        } else {
            "no-cache"
        }),
    );
    response
}
async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({"status":"ok", "build_sha": BUILD_SHA}))
}

async fn create_room(State(state): State<AppState>, Json(input): Json<CreateRoom>) -> Response {
    // The client-side boolean is intentionally not authorization. Only the Sociobot verdict permits eight turns.
    let premium =
        match input
            .license
            .as_deref()
            .filter(|token| !token.trim().is_empty())
        {
            Some(token) => match valid_license(&state, token).await {
                Ok(valid) => valid,
                Err(_) => return error(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "The family-edition license could not be checked. Try again when connected.",
                ),
            },
            None => false,
        };
    if input.paid && !premium {
        warn!("ignored unverified paid room request");
    }
    let code = {
        let alphabet = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let mut rng = rand::rng();
        (0..12)
            .map(|_| alphabet[rng.random_range(0..alphabet.len())] as char)
            .collect::<String>()
    };
    let _write = state.writes.lock().await;
    prune_rooms(&state.db).await;
    let now = now_secs();
    let host_token = Uuid::new_v4().to_string();
    let room = Room {
        code: code.clone(),
        host_token: host_token.clone(),
        guest_token: None,
        phase: 0,
        total_turns: turns_for(premium),
        deadline: None,
        strokes: vec![],
        snapshots: vec![],
        guesses: vec![],
        created_at: now,
        expires_at: now + ROOM_TTL,
        host_seen: 0,
        guest_seen: 0,
    };
    if let Err(err) = save_room(&state.db, &room).await {
        warn!(?err, "could not save room");
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            "The room could not be made. Try again.",
        );
    };
    (
        StatusCode::CREATED,
        Json(RoomCredentials {
            code,
            token: host_token,
            role: "host",
            expires_at: room.expires_at,
        }),
    )
        .into_response()
}
async fn valid_license(state: &AppState, token: &str) -> Result<bool, reqwest::Error> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .expect("HTTP client");
    let mut request = client.get(&state.verify_url).query(&[("license", token)]);
    if let Ok(key) = env::var("FACTORY_SOCIOBOT_KEY") {
        request = request.bearer_auth(key);
    }
    Ok(request
        .send()
        .await?
        .error_for_status()?
        .json::<LicenseResponse>()
        .await?
        .valid)
}
async fn join_room(State(state): State<AppState>, Json(input): Json<JoinRoom>) -> Response {
    let _write = state.writes.lock().await;
    let code = normalize_code(&input.code);
    let Some(mut room) = fetch_active_room(&state.db, &code).await else {
        return error(
            StatusCode::NOT_FOUND,
            "Room not found. Check the code and ask the host to keep the room open.",
        );
    };
    if room.guest_token.is_some() {
        return error(
            StatusCode::CONFLICT,
            "This room already has two players. Ask the host to make a new room.",
        );
    }
    let token = Uuid::new_v4().to_string();
    room.guest_token = Some(token.clone());
    room.deadline = Some(now_secs() + TURN_SECONDS);
    if save_room(&state.db, &room).await.is_err() {
        return error(
            StatusCode::SERVICE_UNAVAILABLE,
            "The room could not be joined. Try again.",
        );
    }
    (
        StatusCode::OK,
        Json(RoomCredentials {
            code,
            token,
            role: "guest",
            expires_at: room.expires_at,
        }),
    )
        .into_response()
}
async fn get_room(
    State(state): State<AppState>,
    Path(code): Path<String>,
    Query(auth): Query<AuthQuery>,
) -> Response {
    match authorized_room(&state, &normalize_code(&code), &auth.token).await {
        Some((room, role)) => Json(view(&room, &role)).into_response(),
        None => error(
            StatusCode::NOT_FOUND,
            "Room not found or expired. Ask the host to make a new room.",
        ),
    }
}
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(code): Path<String>,
    Query(auth): Query<AuthQuery>,
) -> Response {
    let code = normalize_code(&code);
    let Some((_, role)) = authorized_room(&state, &code, &auth.token).await else {
        return error(
            StatusCode::UNAUTHORIZED,
            "This private room link is not valid or has expired.",
        );
    };
    ws.on_upgrade(move |socket| room_socket(socket, state, code, auth.token, role))
}
async fn room_socket(
    socket: WebSocket,
    state: AppState,
    code: String,
    token: String,
    role: String,
) {
    let (mut sender, mut receiver) = socket.split();
    let mut tick = tokio::time::interval(Duration::from_millis(400));
    loop {
        tokio::select! { _ = tick.tick() => { let Some((_, verified_role)) = authorized_room(&state, &code, &token).await else { let _ = sender.send(Message::Text(serde_json::json!({"kind":"ended"}).to_string().into())).await; break; }; if verified_role != role { break; } set_presence(&state, &code, &role).await; let Some(room) = fetch_active_room(&state.db, &code).await else { break; }; if sender.send(Message::Text(serde_json::to_string(&view(&room, &role)).unwrap().into())).await.is_err() { break; } }, incoming = receiver.next() => match incoming { Some(Ok(Message::Text(text))) => match serde_json::from_str::<ClientEvent>(&text) { Ok(event) => handle_event(&state, &code, &token, event).await, Err(_) => warn!(room=%code, "invalid websocket message") }, Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break, _ => {} } }
    }
}
async fn handle_event(state: &AppState, code: &str, token: &str, event: ClientEvent) {
    let _write = state.writes.lock().await;
    let Some(mut room) = fetch_active_room(&state.db, code).await else {
        return;
    };
    let Some(role) = role_for(&room, token).map(str::to_string) else {
        return;
    };
    settle_clock(&mut room);
    let active = active_role(room.phase);
    match event {
        ClientEvent::Stroke { stroke }
            if action_for(room.phase) == "draw"
                && role == active
                && stroke.points.len() <= 1000
                && stroke.width >= 1.0
                && stroke.width <= 18.0 =>
        {
            room.strokes.push(stroke)
        }
        ClientEvent::Undo if action_for(room.phase) == "draw" && role == active => {
            room.strokes.pop();
        }
        ClientEvent::Clear if action_for(room.phase) == "draw" && role == active => {
            room.strokes.clear()
        }
        ClientEvent::FinishTurn if action_for(room.phase) == "draw" && role == active => {
            advance(&mut room)
        }
        ClientEvent::SubmitGuess { guess }
            if action_for(room.phase) == "guess" && role == active =>
        {
            let clean: String = guess.trim().chars().take(80).collect();
            if !clean.is_empty() {
                room.guesses.push(clean);
                advance(&mut room);
            }
        }
        ClientEvent::EndRoom if role == "host" => {
            let _ = sqlx::query("DELETE FROM rooms WHERE code = ?")
                .bind(code)
                .execute(&state.db)
                .await;
            return;
        }
        _ => {}
    }
    let _ = save_room(&state.db, &room).await;
}
async fn authorized_room(state: &AppState, code: &str, token: &str) -> Option<(Room, String)> {
    let mut room = fetch_active_room(&state.db, code).await?;
    let before = (room.phase, room.deadline);
    settle_clock(&mut room);
    let role = role_for(&room, token)?.to_string();
    if before != (room.phase, room.deadline) {
        let _ = save_room(&state.db, &room).await;
    }
    Some((room, role))
}
async fn fetch_active_room(db: &SqlitePool, code: &str) -> Option<Room> {
    let row = sqlx::query("SELECT code, host_token, guest_token, phase, total_turns, deadline, strokes, snapshots, guesses, created_at, expires_at, host_seen, guest_seen FROM rooms WHERE code = ?").bind(code).fetch_optional(db).await.ok()??;
    let room = room_from_row(row);
    if room.expires_at <= now_secs() {
        let _ = sqlx::query("DELETE FROM rooms WHERE code = ?")
            .bind(code)
            .execute(db)
            .await;
        None
    } else {
        Some(room)
    }
}
fn room_from_row(row: sqlx::sqlite::SqliteRow) -> Room {
    Room {
        code: row.get("code"),
        host_token: row.get("host_token"),
        guest_token: row.get("guest_token"),
        phase: row.get::<i64, _>("phase") as usize,
        total_turns: row.get::<i64, _>("total_turns") as usize,
        deadline: row.get::<Option<i64>, _>("deadline").map(|v| v as u64),
        strokes: serde_json::from_str(&row.get::<String, _>("strokes")).unwrap_or_default(),
        snapshots: serde_json::from_str(&row.get::<String, _>("snapshots")).unwrap_or_default(),
        guesses: serde_json::from_str(&row.get::<String, _>("guesses")).unwrap_or_default(),
        created_at: row.get::<i64, _>("created_at") as u64,
        expires_at: row.get::<i64, _>("expires_at") as u64,
        host_seen: row.get::<i64, _>("host_seen") as u64,
        guest_seen: row.get::<i64, _>("guest_seen") as u64,
    }
}
async fn save_room(db: &SqlitePool, room: &Room) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO rooms (code,host_token,guest_token,phase,total_turns,deadline,strokes,snapshots,guesses,created_at,expires_at,host_seen,guest_seen) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET host_token=excluded.host_token,guest_token=excluded.guest_token,phase=excluded.phase,total_turns=excluded.total_turns,deadline=excluded.deadline,strokes=excluded.strokes,snapshots=excluded.snapshots,guesses=excluded.guesses,created_at=excluded.created_at,expires_at=excluded.expires_at,host_seen=excluded.host_seen,guest_seen=excluded.guest_seen").bind(&room.code).bind(&room.host_token).bind(&room.guest_token).bind(room.phase as i64).bind(room.total_turns as i64).bind(room.deadline.map(|v| v as i64)).bind(serde_json::to_string(&room.strokes).unwrap()).bind(serde_json::to_string(&room.snapshots).unwrap()).bind(serde_json::to_string(&room.guesses).unwrap()).bind(room.created_at as i64).bind(room.expires_at as i64).bind(room.host_seen as i64).bind(room.guest_seen as i64).execute(db).await.map(|_| ())
}
async fn set_presence(state: &AppState, code: &str, role: &str) {
    let _write = state.writes.lock().await;
    let column = if role == "host" {
        "host_seen"
    } else {
        "guest_seen"
    };
    let statement = format!("UPDATE rooms SET {column} = ? WHERE code = ?");
    let _ = sqlx::query(&statement)
        .bind(now_secs() as i64)
        .bind(code)
        .execute(&state.db)
        .await;
}
async fn prune_rooms(db: &SqlitePool) {
    let _ = sqlx::query("DELETE FROM rooms WHERE expires_at <= ?")
        .bind(now_secs() as i64)
        .execute(db)
        .await;
}
fn settle_clock(room: &mut Room) {
    while room.phase < room.total_turns
        && room.deadline.is_some_and(|deadline| deadline <= now_secs())
    {
        advance(room);
    }
}
fn advance(room: &mut Room) {
    if action_for(room.phase) == "draw" {
        room.snapshots.push(room.strokes.clone());
    }
    room.phase += 1;
    room.deadline = (room.phase < room.total_turns).then(|| now_secs() + TURN_SECONDS);
}
fn view(room: &Room, role: &str) -> RoomView {
    let partner_seen = if role == "host" {
        room.guest_seen
    } else {
        room.host_seen
    };
    RoomView {
        kind: "state",
        code: room.code.clone(),
        role: role.into(),
        partner_connected: partner_seen.saturating_add(PRESENCE_SECONDS) >= now_secs(),
        phase: room.phase,
        total_turns: room.total_turns,
        action: action_for(room.phase),
        active_role: active_role(room.phase),
        deadline: room.deadline,
        prompt: "A tiny house takes a surprising trip",
        strokes: room.strokes.clone(),
        snapshots: room.snapshots.clone(),
        guesses: room.guesses.clone(),
        finished: room.phase >= room.total_turns,
    }
}
fn action_for(phase: usize) -> &'static str {
    ["draw", "guess", "draw", "guess"][phase % 4]
}
fn active_role(phase: usize) -> &'static str {
    ["host", "guest", "guest", "host"][phase % 4]
}
fn turns_for(verified_license: bool) -> usize {
    if verified_license {
        8
    } else {
        4
    }
}
fn role_for<'a>(room: &'a Room, token: &str) -> Option<&'a str> {
    if token == room.host_token {
        Some("host")
    } else if room.guest_token.as_deref() == Some(token) {
        Some("guest")
    } else {
        None
    }
}
fn normalize_code(code: &str) -> String {
    code.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .flat_map(char::to_uppercase)
        .take(12)
        .collect()
}
fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
fn error(status: StatusCode, message: &str) -> Response {
    (status, Json(serde_json::json!({"error": message}))).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn codes_are_normalized() {
        assert_eq!(normalize_code("abcd-2345 efgh"), "ABCD2345EFGH");
    }
    #[test]
    fn turns_alternate_actions_and_players() {
        assert_eq!((action_for(0), active_role(0)), ("draw", "host"));
        assert_eq!((action_for(1), active_role(1)), ("guess", "guest"));
        assert_eq!((action_for(2), active_role(2)), ("draw", "guest"));
        assert_eq!((action_for(3), active_role(3)), ("guess", "host"));
    }
    #[test]
    fn unverified_paid_flag_is_never_a_license() {
        let request: CreateRoom = serde_json::from_str(r#"{"paid":true}"#).unwrap();
        assert!(request.paid);
        assert!(request.license.is_none());
        assert_eq!(turns_for(false), 4);
        assert_eq!(turns_for(true), 8);
    }
    #[tokio::test]
    async fn expired_room_is_deleted_on_read() {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        initialize_database(&db).await;
        let now = now_secs();
        let room = Room {
            code: "EXPIRED".into(),
            host_token: "host".into(),
            guest_token: None,
            phase: 0,
            total_turns: 4,
            deadline: None,
            strokes: vec![],
            snapshots: vec![],
            guesses: vec![],
            created_at: now - ROOM_TTL,
            expires_at: now,
            host_seen: 0,
            guest_seen: 0,
        };
        save_room(&db, &room).await.unwrap();
        assert!(fetch_active_room(&db, "EXPIRED").await.is_none());
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM rooms WHERE code = 'EXPIRED'")
            .fetch_one(&db)
            .await
            .unwrap();
        assert_eq!(count, 0);
    }
}
