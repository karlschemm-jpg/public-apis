// V.A.U.L.T. HUD — vanilla JS, no build step. Talks to /api/* and the /api/events SSE stream.
(() => {
  const $ = (id) => document.getElementById(id);
  let state = null;
  let forcedSkill = null;
  let level = 0;          // current audio level 0..1 drives the orb
  let ttsQueue = [];      // TTS loudness envelope frames
  let mode = "standby";

  // ── boot ─────────────────────────────────────────────────────────────
  async function load() {
    try {
      state = await (await fetch("/api/state")).json();
      render();
      setPill("pillLink", true, "link");
    } catch {
      setPill("pillLink", false, "offline");
    }
  }

  function render() {
    const b = state.brand;
    const root = document.documentElement.style;
    if (b.accent) root.setProperty("--accent", b.accent);
    if (b.accent_2) root.setProperty("--accent-2", b.accent_2);
    $("logo").textContent = b.logo_text || "VAULT";
    $("brandName").textContent = b.name;
    $("brandSub").textContent = b.expansion || "";
    document.title = `${b.name} Command Center`;
    $("pillModel").textContent = state.brain.model;
    renderSkills();
    renderMetrics();
    renderReports();
    if (!$("feed").childElementCount) state.history.forEach(onEvent);
  }

  function renderSkills() {
    const tree = $("skillTree");
    tree.innerHTML = "";
    for (const [branch, skills] of Object.entries(state.skills)) {
      const d = document.createElement("details");
      d.open = true;
      d.innerHTML = `<summary>${esc(branch)} <span>(${skills.length})</span></summary>`;
      for (const s of skills) {
        const btn = document.createElement("button");
        btn.className = "skill" + (forcedSkill === s.id ? " active" : "");
        btn.innerHTML = `<b>${esc(s.id)}</b><em>${esc(s.description)}</em>`;
        btn.title = "Force the next command to this skill (click again to clear)";
        btn.onclick = () => {
          forcedSkill = forcedSkill === s.id ? null : s.id;
          renderSkills();
          $("cmdInput").placeholder = forcedSkill ? `Command for ${forcedSkill}…` : "Type a command, or speak after the wake word…";
          $("cmdInput").focus();
        };
        d.appendChild(btn);
      }
      tree.appendChild(d);
    }
  }

  function renderMetrics() {
    const m = state.metrics, c = m.counters || {}, t = m.tokens || {};
    const routed = ["regex", "local", "haiku"].map((k) => [k, c[`route.${k}`] || 0]);
    const total = routed.reduce((a, [, n]) => a + n, 0) + (c["route.default"] || 0) + (c["route.manual"] || 0);
    const tiles = [
      ["Commands", total],
      ["Avg reply", m.avg_ms.reply_ms != null ? `${m.avg_ms.reply_ms}ms` : "—"],
      ["Notes", state.vault.notes],
      ["Reports", state.vault.reports],
      ["Tokens out", fmt(t.output_tokens || 0)],
      ["Uptime", dur(m.uptime_s)],
    ];
    $("tiles").innerHTML = tiles.map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
    const max = Math.max(1, ...routed.map(([, n]) => n));
    $("tiers").innerHTML = routed
      .map(([k, n]) => `<div class="tier"><span>${k}</span><div class="track"><div class="fill" style="width:${(n / max) * 100}%"></div></div><span>${n}</span></div>`)
      .join("");
  }

  function renderReports() {
    $("reports").innerHTML = state.reports.length
      ? state.reports.map((r) => `<li>${esc(r.title)}<small>${esc(r.skill || "")} · ${esc(r.path)}</small></li>`).join("")
      : `<li><small>No reports yet — they land in vault/Reports as you work.</small></li>`;
  }

  // ── feed ─────────────────────────────────────────────────────────────
  function say(who, text, meta = "", cls = "") {
    if (!text) return;
    const div = document.createElement("div");
    div.className = `msg ${cls}`;
    div.innerHTML = `<span class="who">${esc(who)}</span><span class="txt">${esc(text)}${meta ? `<span class="meta">${esc(meta)}</span>` : ""}</span>`;
    $("feed").appendChild(div);
    $("feed").scrollTop = $("feed").scrollHeight;
  }

  function onEvent(ev) {
    switch (ev.kind) {
      case "heard": say("you", ev.text, ev.source, "you"); break;
      case "routed":
        $("routeLine").innerHTML = `route → <b>${esc(ev.target)}</b> via ${esc(ev.tier)} · ${ev.ms}ms`;
        break;
      case "thinking": mode = "thinking"; break;
      case "reply": {
        const notes = ev.notes_used?.length ? ` · memory: ${ev.notes_used.join(", ")}` : "";
        const rep = ev.report ? ` · saved ${ev.report.split("/").pop()}` : "";
        say(state?.brand.assistant || "ai", ev.text, `${ev.ms}ms${notes}${rep}`, "ai");
        mode = "standby";
        refreshSoon();
        break;
      }
      case "error": say("error", ev.message, "", "err"); mode = "standby"; break;
      case "audio_level": level = Math.max(level, ev.level); break;
      case "tts_envelope": ttsQueue.push(...ev.levels); break;
      case "speaking": mode = ev.state === "start" ? "speaking" : "standby"; if (ev.state === "end") ttsQueue = []; break;
      case "listening": mode = ev.state === "armed" ? "listening" : ev.state; break;
      case "voice": setPill("pillVoice", true, `voice · ${ev.stt}`); break;
      case "transcript": break;
    }
  }

  let refreshTimer;
  function refreshSoon() { clearTimeout(refreshTimer); refreshTimer = setTimeout(async () => { await load(); drawGraph(); }, 400); }

  function connect() {
    const es = new EventSource("/api/events");
    es.onopen = () => setPill("pillLink", true, "link");
    es.onmessage = (m) => onEvent(JSON.parse(m.data));
    es.onerror = () => setPill("pillLink", false, "reconnecting");
  }

  // ── command bar ──────────────────────────────────────────────────────
  $("cmdForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("cmdInput").value.trim();
    if (!text) return;
    $("cmdInput").value = "";
    mode = "thinking";
    try {
      const r = await fetch("/api/command", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, skill: forcedSkill, speak: $("speakToggle").checked }),
      });
      if (!r.ok) say("error", (await r.json()).error || r.statusText, "", "err");
    } catch (err) { say("error", String(err), "", "err"); }
    forcedSkill = null; renderSkills();
  });
  $("stopBtn").onclick = () => fetch("/api/stop", { method: "POST" });
  $("syncBtn").onclick = async () => {
    const r = await (await fetch("/api/skills/sync", { method: "POST" })).json();
    say("system", `Linked ${r.synced} skills into .claude/skills and refreshed the Skill Map note.`);
    load();
  };

  // ── orb visualiser ───────────────────────────────────────────────────
  const orb = $("orb"), ctx = orb.getContext("2d");
  let phase = 0, smooth = 0, lastTts = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function drawOrb(now) {
    const W = orb.width, H = orb.height, cx = W / 2, cy = H / 2;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const accent2 = getComputedStyle(document.documentElement).getPropertyValue("--accent-2").trim();
    if (ttsQueue.length && now - lastTts > 1000 / 15) { level = Math.max(level, ttsQueue.shift()); lastTts = now; }
    const idle = mode === "thinking" ? 0.25 + 0.15 * Math.sin(now / 180) : 0.05;
    smooth += (Math.max(level, idle) - smooth) * 0.2;
    level *= 0.85;
    phase += reduced ? 0 : 0.01 + smooth * 0.05;
    ctx.clearRect(0, 0, W, H);
    const R = W * 0.26;
    // rings
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.strokeStyle = i === 1 ? accent2 : accent;
      ctx.globalAlpha = 0.25 + 0.15 * i;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(i === 2 ? [4, 10] : []);
      ctx.arc(cx, cy, R * (1.25 + i * 0.22), phase * (i % 2 ? -1 : 1), phase * (i % 2 ? -1 : 1) + Math.PI * (1.2 + 0.25 * i));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // reactive waveform circle
    ctx.beginPath();
    const N = 96;
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * Math.PI * 2;
      const wob = Math.sin(a * 6 + phase * 4) * 0.5 + Math.sin(a * 11 - phase * 3) * 0.5;
      const r = R * (1 + smooth * 0.35 * wob + smooth * 0.15);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 24 + smooth * 40;
    ctx.stroke();
    ctx.shadowBlur = 0;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, accent + "55");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fill();
    $("orbState").textContent = mode;
    requestAnimationFrame(drawOrb);
  }

  // ── vault graph (tiny force layout) ──────────────────────────────────
  async function drawGraph() {
    const data = await (await fetch("/api/graph")).json();
    const cv = $("graph"), g = cv.getContext("2d"), W = cv.width, H = cv.height;
    const nodes = data.nodes.map((n, i) => ({ ...n, x: W / 2 + Math.cos(i) * 60 + Math.random() * 20, y: H / 2 + Math.sin(i) * 50, vx: 0, vy: 0 }));
    const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
    const edges = data.edges.filter((e) => e.source in idx && e.target in idx);
    for (let it = 0; it < 220; it++) {
      for (const a of nodes) for (const b of nodes) {
        if (a === b) continue;
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
        a.vx += (dx / d2) * 60; a.vy += (dy / d2) * 60;
      }
      for (const e of edges) {
        const a = nodes[idx[e.source]], b = nodes[idx[e.target]];
        const dx = b.x - a.x, dy = b.y - a.y;
        a.vx += dx * 0.004; a.vy += dy * 0.004; b.vx -= dx * 0.004; b.vy -= dy * 0.004;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.002; n.vy += (H / 2 - n.y) * 0.002;
        n.x = Math.min(W - 8, Math.max(8, n.x + n.vx)); n.y = Math.min(H - 8, Math.max(8, n.y + n.vy));
        n.vx *= 0.6; n.vy *= 0.6;
      }
    }
    const cs = getComputedStyle(document.documentElement);
    g.clearRect(0, 0, W, H);
    g.strokeStyle = cs.getPropertyValue("--line"); g.lineWidth = 1;
    for (const e of edges) { const a = nodes[idx[e.source]], b = nodes[idx[e.target]]; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    const deg = {}; edges.forEach((e) => { deg[e.source] = (deg[e.source] || 0) + 1; deg[e.target] = (deg[e.target] || 0) + 1; });
    for (const n of nodes) {
      const isReport = n.path.startsWith("Reports/");
      g.fillStyle = isReport ? cs.getPropertyValue("--accent-2") : cs.getPropertyValue("--accent");
      g.beginPath(); g.arc(n.x, n.y, 2.5 + Math.min(deg[n.id] || 0, 8) * 0.6, 0, Math.PI * 2); g.fill();
      if ((deg[n.id] || 0) >= 3) { g.fillStyle = cs.getPropertyValue("--muted"); g.font = "10px ui-monospace, monospace"; g.fillText(n.id.slice(0, 22), n.x + 6, n.y - 4); }
    }
  }

  // ── utils ────────────────────────────────────────────────────────────
  function setPill(id, on, label) { const p = $(id); p.className = `pill ${on ? "on" : "off"}`; p.innerHTML = `<i class="dot"></i>${esc(label)}`; }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function fmt(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n); }
  function dur(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; }
  const tick = () => { $("clock").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  tick(); setInterval(tick, 1000);
  setInterval(async () => { if (state) { try { state.metrics = (await (await fetch("/api/state")).json()).metrics; renderMetrics(); } catch {} } }, 10000);

  load().then(drawGraph);
  connect();
  requestAnimationFrame(drawOrb);
})();
