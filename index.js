let socket = null;
let joined = false;
let myPos = { x: null, y: null };
const others = new Map();

const $ = (id) => document.getElementById(id);
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const tile = 40;

// ===== Logging =====
const log = (msg, obj) => {
  const el = $("log");
  if (!el) {
    console.debug("[log-missing-el]", msg, obj || "");
    return;
  }
  const line = document.createElement("div");
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  if (obj) console.debug(msg, obj);
};

// ===== User list render =====
const renderUserList = () => {
  const ul = $("userList");
  if (!ul) return;
  ul.innerHTML = "";
  for (const [id, pos] of others.entries()) {
    const li = document.createElement("li");
    li.textContent = `${id} @ (${pos.x}, ${pos.y})`;
    ul.appendChild(li);
  }
  const cnt = $("userCount");
  if (cnt) cnt.textContent = String(others.size);
};

// ===== Helpers: bounds & WS send =====
const maxCols = Math.floor(canvas.width / tile);
const maxRows = Math.floor(canvas.height / tile);

function clampPos(x, y) {
  return {
    x: Math.max(0, Math.min(maxCols - 1, x)),
    y: Math.max(0, Math.min(maxRows - 1, y)),
  };
}

function safeSend(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(data));
    } catch (err) {
      log("WS send failed", err);
    }
  } else {
    log("WS not open; skip send", data);
  }
}

// ===== Collision system (simple AABB in pixels) =====
const obstacles = []; // {x, y, w, h} in pixels

function addObstacle(x, y, w, h) {
  obstacles.push({ x, y, w, h });
}

function collidesGrid(nx, ny) {
  // Treat avatar as a tile-sized square at the grid cell
  const px = nx * tile;
  const py = ny * tile;
  const size = tile;

  for (const o of obstacles) {
    if (
      px < o.x + o.w &&
      px + size > o.x &&
      py < o.y + o.h &&
      py + size > o.y
    ) {
      return true;
    }
  }
  return false;
}

// ===== Drawing helpers =====
function drawComputer(x, y) {
  // Monitor
  ctx.fillStyle = "#333333";
  ctx.fillRect(x, y - 30, 50, 30);
  ctx.fillStyle = "#87cefa";
  ctx.fillRect(x + 5, y - 25, 40, 20);
  // Stand
  ctx.fillStyle = "#333333";
  ctx.fillRect(x + 20, y, 10, 10);
  // Keyboard
  ctx.fillStyle = "#555555";
  ctx.fillRect(x - 10, y + 15, 70, 10);
}

function drawTable(x, y, withComputer = false) {
  ctx.fillStyle = "#8b4513"; // table top
  ctx.fillRect(x, y, 140, 10);

  ctx.fillStyle = "#5c3317"; // legs
  ctx.fillRect(x, y + 10, 10, 60);
  ctx.fillRect(x + 130, y + 10, 10, 60);

  ctx.strokeStyle = "#3e2614"; // outline
  ctx.strokeRect(x, y, 140, 10);

  if (withComputer) drawComputer(x + 45, y);

  // ---- Collision approx: table top + legs as a single block
//   addObstacle(x, y, 140, 70);
}

function drawRoom(x, y) {
  // top bar
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(x, y, 350, 30);
  // left wall
  ctx.fillStyle = "#5c3317";
  ctx.fillRect(x, y, 30, 200);
  // bottom short wall
  ctx.fillRect(x, y + 200, 200, 20);
  // right wall
  ctx.fillRect(x + 350, y, 30, 220);

  ctx.strokeStyle = "#3e2614";

  // ---- Collision: each wall segment
  addObstacle(x, y, 350, 30);          // top
  addObstacle(x, y, 30, 200);          // left
  addObstacle(x, y + 200, 200, 20);    // bottom (partial)
  addObstacle(x + 350, y, 30, 220);    // right
}

function drawSofa(x, y) {
  // Sofa base
  ctx.fillStyle = "#8b0000";
  ctx.fillRect(x, y, 120, 40);
  // Backrest
  ctx.fillStyle = "#a52a2a";
  ctx.fillRect(x, y - 30, 120, 30);
  // Armrests
  ctx.fillStyle = "#8b0000";
  ctx.fillRect(x - 20, y - 10, 20, 50);
  ctx.fillRect(x + 120, y - 10, 20, 50);
  // Cushion line
  ctx.strokeStyle = "#5c1a1a";
  ctx.beginPath();
  ctx.moveTo(x + 60, y - 30);
  ctx.lineTo(x + 60, y + 40);
  ctx.stroke();

  // 🟢 Removed collision — sofa is now walkable
  // addObstacle(x - 20, y - 30, 160, 90);
}


function drawChair(x, y) {
  // seat
    ctx.fillStyle = "#654321";
    ctx.fillRect(x, y, 40, 10);
    // legs
    ctx.fillStyle = "#3b2416";
    ctx.fillRect(x, y + 10, 10, 40);
    ctx.fillRect(x + 30, y + 10, 10, 40);
    // backrest
    ctx.fillStyle = "#654321";
    ctx.fillRect(x, y - 40, 40, 40);

  // 🟢 Removed collision — chair is now walkable
  // addObstacle(x, y - 40, 40, 60);
}
function drawDot(gridX, gridY, me = false) {
  const cx = gridX * tile + tile / 2;
  const cy = gridY * tile + tile / 2;
  const scale = tile * 0.5; // bigger avatar
    ctx.lineWidth = 4;

    // Head with gradient
    const headGradient = ctx.createRadialGradient(
        cx, cy - scale * 0.9, scale * 0.1,
        cx, cy - scale * 0.9, scale * 0.5
    );
    headGradient.addColorStop(0, "#ffe0bd");
    headGradient.addColorStop(1, "#ffcc99");
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(cx, cy - scale * 0.9, scale * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(cx - scale * 0.2, cy - scale * 0.95, scale * 0.08, 0, Math.PI * 2);
    ctx.arc(cx + scale * 0.2, cy - scale * 0.95, scale * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(cx, cy - scale * 0.7, scale * 0.2, 0, Math.PI);
    ctx.stroke();

    // Body gradient
    const bodyGradient = ctx.createLinearGradient(
        cx, cy - scale * 0.4, cx, cy + scale * 0.6
    );
    bodyGradient.addColorStop(0, me ? "#4a90e2" : "#ff6347");
    bodyGradient.addColorStop(1, me ? "#003366" : "#8b0000");
    ctx.strokeStyle = bodyGradient;

    // Body
    ctx.beginPath();
    ctx.moveTo(cx, cy - scale * 0.4);
    ctx.lineTo(cx, cy + scale * 0.6);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(cx, cy - scale * 0.2);
    ctx.lineTo(cx - scale * 0.6, cy + scale * 0.2);
    ctx.moveTo(cx, cy - scale * 0.2);
    ctx.lineTo(cx + scale * 0.6, cy + scale * 0.2);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(cx, cy + scale * 0.6);
    ctx.lineTo(cx - scale * 0.4, cy + scale * 1.3);
    ctx.moveTo(cx, cy + scale * 0.6);
    ctx.lineTo(cx + scale * 0.4, cy + scale * 1.3);
    ctx.stroke();
}

// ===== Main draw =====
function drawGrid() {
  // clear obstacles each frame
    obstacles.length = 0;

  // SKY
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#87ceeb");
    sky.addColorStop(1, "#ccefff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  // GROUND
    const ground = ctx.createLinearGradient(0, 350, 0, canvas.height);
    ground.addColorStop(0, "#2e8b57");
    ground.addColorStop(1, "#14532d");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 390, canvas.width, 550);

  // Rooms
    drawRoom(10, 10);
    drawRoom(10, 300);
    drawRoom(850, 300);
    drawRoom(850, 10);

  // Furniture (room 1)
    drawTable(45, 70, true);
    drawChair(90, 140);
    drawSofa(210, 80);

  // Furniture (top middle)
    drawTable(400, 35, true);
    drawChair(420, 110);
    drawChair(480, 110);
    drawTable(550, 35, true);
    drawChair(570, 110);
    drawChair(620, 110);
    drawTable(700, 35, true);
    drawChair(720, 110);
    drawChair(770, 110);

  // 3rd room furniture
    drawTable(1055, 70, true);
    drawChair(1075, 140);
    drawChair(1135, 140);

    // 4th room furniture
    drawTable(1055, 350, true);
    drawChair(1075, 420);
    drawChair(1135, 420);

    drawSofa(910, 370);

    drawTable(50, 350, true);
    drawChair(70, 430);
    drawChair(120, 430);
    drawTable(200, 350, true);
    drawChair(220, 430);
    drawChair(270, 430);

    drawSofa(910, 80);

    // Others
    for (const [, pos] of others.entries()) {
        if (pos.x == null || pos.y == null) continue;
        drawDot(pos.x, pos.y, false);
    }
    // Me
    if (myPos.x != null && myPos.y != null) drawDot(myPos.x, myPos.y, true);
}

// Initial render
drawGrid();

// ===== WebSocket connect =====
$("connectBtn")?.addEventListener("click", () => {
    const url = $("wsUrl")?.value.trim();
    const spaceId = $("spaceId")?.value.trim();
    const token = $("token")?.value.trim();
    if (!url || !spaceId || !token) {
        alert("Please fill WS URL, spaceId, and token");
        return;
    }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        try { socket.close(); } catch {}
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
        log("WS connected. Sending join...");
        safeSend({ type: "join", payload: { spaceId, token } });
    };

    socket.onmessage = (ev) => {
        let msg = null;
        try {
        msg = JSON.parse(ev.data);
        } catch (e) {
        log("Non-JSON message", ev.data);
        return;
        }

        if (!msg || !msg.type) {
        log("Malformed message", msg);
        return;
        }

        log(`<= ${msg.type}`, msg);

        switch (msg.type) {
        case "space-joined": {
        const spawn = msg.payload && msg.payload.spawn;
        myPos.x = (spawn && typeof spawn.x === "number") ? spawn.x : 0;
        myPos.y = (spawn && typeof spawn.y === "number") ? spawn.y : 0;
        // clamp just in case
        ({ x: myPos.x, y: myPos.y } = clampPos(myPos.x, myPos.y));

        joined = true;
        others.clear();
        const list = (msg.payload && Array.isArray(msg.payload.users)) ? msg.payload.users : [];
        for (const u of list) {
            const uid = u.userId || u.id;
            if (!uid) continue;
            const x = (typeof u.x === "number") ? u.x : null;
            const y = (typeof u.y === "number") ? u.y : null;
            others.set(uid, { x, y });
        }
        renderUserList();
        drawGrid();
        break;
    }

    case "user-joined": {
        const p = msg.payload || {};
        const uid = p.userId || p.id;
        if (uid != null) {
        const x = (typeof p.x === "number") ? p.x : null;
        const y = (typeof p.y === "number") ? p.y : null;
        others.set(uid, { x, y });
        renderUserList();
          // no full redraw needed unless you want instant avatar show
        }
        break;
        }

        case "movement": {
            const p = msg.payload || {};
            const uid = p.userId || p.id;
            if (uid && others.has(uid) && typeof p.x === "number" && typeof p.y === "number") {
            const clamped = clampPos(p.x, p.y);
            others.set(uid, clamped);
            drawGrid();
            }
            break;
        }

        case "movement-rejected": {
            // server authoritative position
            const p = msg.payload || {};
            if (typeof p.x === "number" && typeof p.y === "number") {
            const clamped = clampPos(p.x, p.y);
            myPos.x = clamped.x;
            myPos.y = clamped.y;
            drawGrid();
            }
            break;
        }

        case "user-left": {
            const p = msg.payload || {};
            const uid = p.userId || p.id;
            if (uid) {
            others.delete(uid);
            renderUserList();
            drawGrid();
            }
            break;
        }

        default:
            // ignore unknown types but log them
            // log("Unknown message type", msg.type);
            break;
        }
    };

    socket.onclose = () => { log("WS closed"); joined = false; };
    socket.onerror = (e) => log("WS error", e);
    });

    // ===== Movement =====
    function canMoveTo(nx, ny) {
    // bounds
    if (nx < 0 || ny < 0 || nx >= maxCols || ny >= maxRows) return false;
    // collision
    if (collidesGrid(nx, ny)) return false;
    return true;
    }

    function tryMove(dx, dy) {
    if (!joined || !socket || socket.readyState !== WebSocket.OPEN) return;
    if (myPos.x == null || myPos.y == null) return;

    const target = clampPos(myPos.x + dx, myPos.y + dy);
    if (!canMoveTo(target.x, target.y)) {
        // Optionally, you can notify server you bumped into something (client-side)
        // or just ignore.
        return;
    }

    safeSend({ type: "move", payload: { x: target.x, y: target.y } });
    myPos.x = target.x;
    myPos.y = target.y;
    drawGrid();
    }

    document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    if (["input", "textarea", "select"].includes(tag)) return;

    switch (e.key) {
        case "ArrowUp":    tryMove(0, -1); break;
        case "ArrowDown":  tryMove(0, +1); break;
        case "ArrowLeft":  tryMove(-1, 0); break;
        case "ArrowRight": tryMove(+1, 0); break;
        default: return; // not handled
    }
    e.preventDefault();
    });
