

let socket = null;
        let joined = false;
        let myPos = { x: null, y: null };
        const others = new Map();
        const $ = (id) => document.getElementById(id);
        const log = (msg, obj) => {
        const el = $("log");
        const line = document.createElement("div");
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
        if (obj) console.debug(msg, obj);
        };
        const renderUserList = () => {
        const ul = $("userList");
        ul.innerHTML = "";
        for (const [id, pos] of others.entries()) {
        const li = document.createElement("li");
        li.textContent = `${id} @ (${pos.x}, ${pos.y})`;
        ul.appendChild(li);
        }
        $("userCount").textContent = String(others.size);
        };
        const canvas = document.getElementById("board");
        const ctx = canvas.getContext("2d");
        const tile = 40;
        function drawGrid() {
        // === SKY with gradient ===
        let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#87ceeb"); // top
        sky.addColorStop(1, "#ccefff"); // bottom
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // === GROUND with perspective fade ===
        let ground = ctx.createLinearGradient(0, 350, 0, canvas.height);
        ground.addColorStop(0, "#2e8b57");
        ground.addColorStop(1, "#14532d");
        ctx.fillStyle = ground;
        ctx.fillRect(0, 390, canvas.width, 550);

        // === TABLE with shading ===
    function drawTable(x, y, withComputer = false) {
        ctx.fillStyle = "#8b4513"; // table top
        ctx.fillRect(x, y, 140, 10);

        ctx.fillStyle = "#5c3317"; // legs
        ctx.fillRect(x, y + 10, 10, 60);
        ctx.fillRect(x + 130, y + 10, 10, 60);

        ctx.strokeStyle = "#3e2614"; // outline
        ctx.strokeRect(x, y, 140, 10);

        if (withComputer) {
            drawComputer(x + 45, y); // put computer in center
        }
}
    function drawRoom(x, y) {
        ctx.fillStyle = "#8b4513"; // table top
        ctx.fillRect(x, y, 350, 30);
        ctx.fillStyle = "#5c3317"; // legs
        ctx.fillRect(x, y , 30, 200);
        ctx.fillRect(x, y+200, 200, 20);
        ctx.fillRect(x + 350, y, 30, 220);
        ctx.strokeStyle = "#3e2614"; // outline
    }
    function drawSofa(x, y) {
    // Sofa base
        ctx.fillStyle = "#8b0000"; // dark red
        ctx.fillRect(x, y, 120, 40);

        // Backrest
        ctx.fillStyle = "#a52a2a"; // lighter red/brown
        ctx.fillRect(x, y - 30, 120, 30);

        // Armrests
        ctx.fillStyle = "#8b0000";
        ctx.fillRect(x - 20, y - 10, 20, 50);
        ctx.fillRect(x + 120, y - 10, 20, 50);

        // Cushion lines
        ctx.strokeStyle = "#5c1a1a";
        ctx.beginPath();
        ctx.moveTo(x + 60, y - 30);
        ctx.lineTo(x + 60, y + 40);
        ctx.stroke();
}
        drawRoom(10, 10);
        drawRoom(10, 300);
        drawRoom(850, 300);
        drawRoom(850, 10);
        function drawComputer(x, y) {
    // Monitor
    ctx.fillStyle = "#333333";
    ctx.fillRect(x, y - 30, 50, 30); // screen body
    ctx.fillStyle = "#87cefa"; // screen color
    ctx.fillRect(x + 5, y - 25, 40, 20); // screen display

    // Stand
    ctx.fillStyle = "#333333";
    ctx.fillRect(x + 20, y, 10, 10);

    // Keyboard
    ctx.fillStyle = "#555555";
    ctx.fillRect(x - 10, y + 15, 70, 10);
}

    function drawChair(x, y) {
        ctx.fillStyle = "#654321"; // seat
        ctx.fillRect(x, y, 40, 10);

        ctx.fillStyle = "#3b2416"; // legs
        ctx.fillRect(x, y + 10, 10, 40);
        ctx.fillRect(x + 30, y + 10, 10, 40);

        ctx.fillStyle = "#654321"; // backrest
        ctx.fillRect(x, y - 40, 40, 40);
    }
        drawTable(45, 70, true);
        drawChair(90, 140);
        // drawChair(350, 300);
        drawSofa(210, 80);

        drawTable(400, 35, true);
        drawChair(420, 110);
        drawChair(480, 110);
        drawTable(550, 35, true);
        drawChair(570, 110);
        drawChair(620, 110);
        drawTable(700, 35, true);
        drawChair(720, 110);
        drawChair(770, 110);
        // 3rd room
        drawTable(1055, 70, true);
        drawChair(1075, 140);
        drawChair(1135, 140);
        // 4th room 
        drawTable(1055, 350, true);
        drawChair(1075, 420);
        drawChair(1135, 420)

        drawSofa(910, 370);
        
        drawTable(50, 350, true);
        drawChair(70, 430);
        drawChair(120, 430);
        drawTable(200, 350, true);
        drawChair(220, 430);
        drawChair(270, 430);
        drawSofa(910, 80);
        for (const [, pos] of others.entries()) {
        if (pos.x == null) continue;
        drawDot(pos.x, pos.y, false);
        }
        if (myPos.x != null) 
            drawDot(myPos.x, myPos.y, true);
            
        }
        function drawDot(gridX, gridY, me = false) {
        const cx = gridX * tile + tile / 2;
        const cy = gridY * tile + tile / 2;
        const scale = tile * 0.5; // bigger avatar

        // Thicker outline for limbs
        ctx.lineWidth = 4;
        
        // === Head with gradient ===
        const headGradient = ctx.createRadialGradient(cx, cy - scale * 0.9, scale * 0.1, cx, cy - scale * 0.9, scale * 0.5);
        headGradient.addColorStop(0, "#ffe0bd"); // light center
        headGradient.addColorStop(1, "#ffcc99"); // darker edges
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(cx, cy - scale * 0.9, scale * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(cx - scale * 0.2, cy - scale * 0.95, scale * 0.08, 0, Math.PI * 2);
        ctx.arc(cx + scale * 0.2, cy - scale * 0.95, scale * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (simple smile)
        ctx.beginPath();
        ctx.arc(cx, cy - scale * 0.7, scale * 0.2, 0, Math.PI);
        ctx.stroke();

        // === Body with gradient ===
        const bodyGradient = ctx.createLinearGradient(cx, cy - scale * 0.4, cx, cy + scale * 0.6);
        bodyGradient.addColorStop(0, me ? "#4a90e2" : "#ff6347");
        bodyGradient.addColorStop(1, me ? "#003366" : "#8b0000");
        ctx.strokeStyle = bodyGradient;

        // Body line
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

        drawGrid();
        $("connectBtn")?.addEventListener("click", () => {
        const url = $("wsUrl").value.trim();
        const spaceId = $("spaceId").value.trim();
        const token = $("token").value.trim();
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
        socket.send(JSON.stringify({ type: "join", payload: { spaceId, token } }));
        };
        socket.onmessage = (ev) => {
        let msg = null;
        try { 
            msg = JSON.parse(ev.data); 
        } catch (e) 
        { 
            log("Non-JSON message", ev.data);
            return;
        }
        log(`<= ${msg.type}`);
        alert(msg.type)
        switch (msg.type) {
        case "space-joined": {
        myPos.x = msg.payload && msg.payload.spawn ? msg.payload.spawn.x : 0;
        myPos.y = msg.payload && msg.payload.spawn ? msg.payload.spawn.y : 0;
        joined = true;
        others.clear();
        const list = (msg.payload && msg.payload.users) ? msg.payload.users : [];
        for (const u of list) {
        const uid = u.userId || u.id;
        if (!uid) continue;
        others.set(uid, { x: u.x ?? null, y: u.y ?? null });
        }
        renderUserList();
        drawGrid();
        break;
        }
        
        case "user-joined": {
        const p = msg.payload || {};
        const uid = p.userId || p.id;
        if (uid) {
        others.set(uid, { x: p.x, y: p.y });
        renderUserList();
        // drawGrid();
        }
        break;
        }
        
        case "movement": {
        const p = msg.payload || {};
            alert(p.x);
            alert(p.y);
        const uid = p.userId || p.id;
        if (uid && others.has(uid)) {
        others.set(uid, { x: p.x, y: p.y });
        drawGrid();
        }
        break;
        }
        case "movement-rejected": {
        myPos.x = msg.payload.x;
        myPos.y = msg.payload.y;
        drawGrid();
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
        }
        };
        socket.onclose = () => { log("WS closed"); joined = false; };
        socket.onerror = (e) => log("WS error", e);
        });
        document.addEventListener("keydown", (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
        if (["input","textarea","select"].includes(tag)) return;
        let handled = false;
        if (e.key === "ArrowUp") 
            { handled = true; 
            if (joined && socket && socket.readyState === WebSocket.OPEN && myPos.x != null &&myPos.y>0&&myPos.x>0&&myPos.x<30) { 
                const nx = myPos.x;
                const ny = myPos.y - 1;
                socket.send(JSON.stringify({ 
                    type: "move", 
                    payload: 
                    {
                        x: nx, y: ny 
                    }
                })); 
                myPos.x = nx; 
                myPos.y = ny; 
                drawGrid(); 
            } 
        }
        else if (e.key === "ArrowDown") 
        { handled = true; 
            if (joined && socket && socket.readyState === WebSocket.OPEN && myPos.x != null && myPos.y<16&&myPos.x>0&&myPos.x<30) 
            { 
                const nx = myPos.x; 
                const ny = myPos.y + 1; 
                socket.send(JSON.stringify({ type: "move", payload: { x: nx, y: ny } })); 
                myPos.x = nx; myPos.y = ny; 
                drawGrid(); 
            } }
        else if (e.key === "ArrowLeft") 
        { handled = true; 
            if (joined && socket && socket.readyState === WebSocket.OPEN && myPos.x != null && myPos.x>0&&myPos.y>0&&myPos.y<16) 
            { const nx = myPos.x - 1;
                const ny = myPos.y; socket.send(JSON.stringify({ type: "move", payload: { x: nx, y: ny } })); 
                myPos.x = nx; myPos.y = ny; drawGrid(); } }
        else if (e.key === "ArrowRight") 
        { handled = true; 
            if (joined && socket && socket.readyState === WebSocket.OPEN && myPos.x != null && myPos.x<30 &&myPos.y>0&&myPos.y<16) 
            { const nx = myPos.x + 1; 
                const ny = myPos.y;
               
                socket.send(JSON.stringify({ type: "move", payload: { x: nx, y: ny } })); 
                myPos.x = nx; 
                myPos.y = ny; 
                drawGrid(); } }
        if (handled) 
        e.preventDefault();
        });
