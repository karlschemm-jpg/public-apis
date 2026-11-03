// Schul-Assistent SBBZ Weimar – Chat-Widget.
// Modi:  "ai"    → Server-Endpunkt /api/assistant mit Sprachmodell (RAG über Website-Inhalte)
//        "demo"  → keine KI: Stichwortsuche über dieselben Inhalte, deutlich als Demo gekennzeichnet
// Datenschutz: kein Speichern von Chatverläufen (nur im Arbeitsspeicher dieser Seite),
// keine Cookies, keine Drittanbieter-Skripte; Start erst nach aktiver Bestätigung.
import { buildIndex, retrieve, looksPersonal } from "./retrieval.mjs";

const SUGGESTIONS = [
  "Wie kann ich die Schule kontaktieren?",
  "Welche Angebote gibt es?",
  "Wo finde ich wichtige Dokumente?",
  "Gibt es aktuelle Termine?",
  "Wie finde ich bestimmte Informationen?",
  "Wo befindet sich die Schule?",
];
const MAX_LEN = 500;

const root = document.getElementById("assistant");
const fab = document.getElementById("assistant-open");
let panel, log, input, sendBtn, mode = null, busy = false, history = [], localIndex = null, lastFocus = null, started = false;

function el(tag, attrs = {}, html = "") {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (html) e.innerHTML = html;
  return e;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const svg = (p) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
const I = {
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  send: svg('<path d="M4 12 20 4l-4 16-4-7-8-1Z"/><path d="m12 13 8-9"/>'),
  reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  shield: svg('<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>'),
};

async function detectMode() {
  try {
    if (location.protocol === "file:") return "demo"; // Offline-Version: kein Server
    const r = await fetch("/api/assistant/status", { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.mode === "ai" ? "ai" : "demo";
  } catch {
    return "demo";
  }
}

function buildPanel() {
  panel = el("div", { class: "assistant__panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "as-title", id: "assistant-panel", hidden: "" });
  panel.innerHTML = `
    <div class="assistant__head">
      <div class="assistant__avatar" aria-hidden="true">${svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>')}</div>
      <div class="assistant__titles">
        <h2 id="as-title">Schul-Assistent</h2>
        <p class="assistant__mode" id="as-mode">wird geladen …</p>
      </div>
      <button class="assistant__icon-btn" type="button" data-reset aria-label="Unterhaltung neu beginnen" hidden>${I.reset}</button>
      <button class="assistant__icon-btn" type="button" data-close aria-label="Assistent schließen">${I.x}</button>
    </div>
    <div class="assistant__body">
      <section class="assistant__consent" aria-labelledby="as-consent-title">
        <div class="assistant__shield" aria-hidden="true">${I.shield}</div>
        <h3 id="as-consent-title">Bevor es losgeht</h3>
        <ul>
          <li>Der Assistent beantwortet Fragen <strong>nur auf Grundlage der Inhalte dieser Website</strong> und nennt die Quellen.</li>
          <li>Bitte geben Sie <strong>keine persönlichen Daten</strong> ein – keine Namen, Noten, Gesundheits- oder Schülerdaten.</li>
          <li>Ihre Unterhaltung wird <strong>nicht gespeichert</strong> und ist nach dem Schließen der Seite weg.</li>
          <li id="as-consent-mode"></li>
          <li>Bei persönlichen Anliegen wenden Sie sich bitte an das <a href="/de/wir-ueber-uns/ansprechpartner/sekretariat-und-schuelerverwaltung/">Sekretariat</a>.</li>
        </ul>
        <p class="assistant__fine">Mehr dazu in der <a href="/de/datenschutz/">Datenschutzerklärung</a>.</p>
        <button class="btn" type="button" data-start>Verstanden – Assistent starten</button>
      </section>
      <div class="assistant__log" id="as-log" role="log" aria-live="polite" aria-relevant="additions" hidden></div>
    </div>
    <form class="assistant__form" hidden>
      <label class="visually-hidden" for="as-input">Ihre Frage an den Schul-Assistenten</label>
      <textarea id="as-input" rows="1" maxlength="${MAX_LEN}" placeholder="Frage stellen …" autocomplete="off" aria-describedby="as-hint"></textarea>
      <button class="assistant__send" type="submit" aria-label="Frage senden">${I.send}</button>
      <p class="assistant__hint" id="as-hint">Enter sendet · Umschalt+Enter neue Zeile · keine persönlichen Daten</p>
    </form>`;
  root.appendChild(panel);
  log = panel.querySelector("#as-log");
  input = panel.querySelector("#as-input");
  sendBtn = panel.querySelector(".assistant__send");

  panel.querySelector("[data-close]").addEventListener("click", close);
  panel.querySelector("[data-start]").addEventListener("click", start);
  panel.querySelector("[data-reset]").addEventListener("click", reset);
  panel.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; });
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab" && window.matchMedia("(max-width: 600px)").matches && window.SBBZ) window.SBBZ.trapFocus(e, panel);
  });
}

function setModeLabel() {
  const m = panel.querySelector("#as-mode"), c = panel.querySelector("#as-consent-mode");
  if (mode === "ai") {
    m.innerHTML = `<span class="assistant__badge">KI</span> Antworten mit Quellen von dieser Website`;
    c.innerHTML = "Ihre Frage wird zur Beantwortung an einen KI-Dienst übermittelt (ohne Speicherung). Antworten können Fehler enthalten – maßgeblich sind die verlinkten Seiten.";
  } else {
    m.innerHTML = `<span class="assistant__badge assistant__badge--demo">Demo</span> Keine KI – Stichwortsuche`;
    c.innerHTML = "<strong>Demo-Modus:</strong> Es ist keine KI angebunden. Der Assistent durchsucht nur die Website-Inhalte in Ihrem Browser und zeigt passende Seiten an. Es werden keine Daten übertragen.";
  }
}

async function open(e) {
  if (e) e.preventDefault();
  lastFocus = document.activeElement;
  if (!panel) buildPanel();
  panel.hidden = false;
  root.classList.add("is-open");
  fab.setAttribute("aria-expanded", "true");
  document.body.classList.add("assistant-open");
  if (!mode) { mode = await detectMode(); setModeLabel(); }
  (started ? input : panel.querySelector("[data-start]")).focus();
}
function close() {
  if (!panel) return;
  panel.hidden = true;
  root.classList.remove("is-open");
  fab.setAttribute("aria-expanded", "false");
  document.body.classList.remove("assistant-open");
  (lastFocus && lastFocus !== document.body ? lastFocus : fab).focus();
}
function start() {
  started = true;
  panel.querySelector(".assistant__consent").hidden = true;
  log.hidden = false;
  panel.querySelector("form").hidden = false;
  panel.querySelector("[data-reset]").hidden = false;
  greet();
  input.focus();
}
function reset() {
  history = [];
  log.innerHTML = "";
  greet();
  input.focus();
}
function greet() {
  addBot(`<p>Hallo! Ich bin der Schul-Assistent des <strong>SBBZ Weimar</strong>. Ich helfe Ihnen, Informationen auf dieser Website zu finden.${mode === "demo" ? " <em>(Demo ohne KI)</em>" : ""}</p><p>Womit kann ich helfen?</p>`, [], true);
}

function addUser(text) {
  const b = el("div", { class: "msg msg--user" });
  b.innerHTML = `<span class="visually-hidden">Sie: </span><p>${esc(text)}</p>`;
  log.appendChild(b);
  scroll();
}
function addBot(html, sources = [], withSuggestions = false) {
  const b = el("div", { class: "msg msg--bot" });
  let s = `<span class="visually-hidden">Assistent: </span>${html}`;
  if (sources.length) {
    s += `<div class="msg__sources"><p>Quellen</p><ul>${sources.map((q) => `<li><a href="${esc(q.url)}">${esc(q.title)}</a></li>`).join("")}</ul></div>`;
  }
  b.innerHTML = s;
  log.appendChild(b);
  // Anfang der neuen Antwort sichtbar machen (statt ans Ende zu springen)
  requestAnimationFrame(() => { log.scrollTop = Math.max(0, b.offsetTop - 12); });
  if (withSuggestions) {
    const wrap = el("div", { class: "suggestions", role: "group", "aria-label": "Vorschläge für häufige Fragen" });
    SUGGESTIONS.forEach((q) => {
      const btn = el("button", { type: "button" }, esc(q));
      btn.addEventListener("click", () => ask(q));
      wrap.appendChild(btn);
    });
    log.appendChild(wrap);
  }
}
function addTyping() {
  const t = el("div", { class: "msg msg--bot msg--typing", "aria-label": "Antwort wird erstellt" });
  t.innerHTML = '<span></span><span></span><span></span><span class="visually-hidden">Antwort wird erstellt …</span>';
  log.appendChild(t);
  scroll();
  return t;
}
function scroll() { log.scrollTop = log.scrollHeight; }

// sehr kleines, sicheres Markdown: Absätze, Listen, **fett**, [Text](/pfad), Quellenmarker [1]
function md(text, sources) {
  const lines = esc(text).split(/\n/);
  let html = "", inList = false;
  for (let l of lines) {
    l = l.trim();
    l = l.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, (m, t, u) => `<a href="${u}">${t}</a>`)
      .replace(/\[(\d+)\]/g, (m, n) => { const s = sources[Number(n) - 1]; return s ? `<a class="cite" href="${esc(s.url)}" aria-label="Quelle ${n}: ${esc(s.title)}">${n}</a>` : ""; });
    if (/^[-•*] /.test(l)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${l.slice(2)}</li>`; continue; }
    if (inList) { html += "</ul>"; inList = false; }
    if (l) html += `<p>${l}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
}

async function ask(raw) {
  const q = (raw || "").trim().slice(0, MAX_LEN);
  if (!q || busy) return;
  if (looksPersonal(q)) {
    addBot("<p>Ihre Nachricht scheint persönliche Daten (z. B. E-Mail-Adresse, Telefonnummer oder Kontoverbindung) zu enthalten. Bitte entfernen Sie diese – ich brauche sie nicht, um Ihre Frage zu beantworten.</p>");
    return;
  }
  input.value = ""; input.style.height = "auto";
  addUser(q);
  busy = true; sendBtn.disabled = true;
  const typing = addTyping();
  try {
    const res = mode === "ai" ? await askServer(q) : await askLocal(q);
    typing.remove();
    addBot(res.html, res.sources);
    history.push({ role: "user", content: q }, { role: "assistant", content: res.plain || "" });
    history = history.slice(-6); // nur die letzten 3 Wortwechsel, nur im Arbeitsspeicher
  } catch (err) {
    typing.remove();
    addBot(`<p>${esc(err.message || "Das hat leider nicht geklappt.")}</p><p>Sie können die <a href="/de/suchergebnisse/?search=${encodeURIComponent(q)}">Website-Suche</a> nutzen oder das <a href="/de/wir-ueber-uns/kontakt/">Sekretariat kontaktieren</a>.</p>`);
  } finally {
    busy = false; sendBtn.disabled = false; input.focus();
  }
}

async function askServer(q) {
  const r = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ message: q, history }),
  });
  if (r.status === 429) throw new Error("Es kommen gerade sehr viele Anfragen. Bitte versuchen Sie es in ein paar Minuten noch einmal.");
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Der Assistent ist gerade nicht erreichbar.");
  return { html: md(d.answer, d.sources || []), sources: d.sources || [], plain: d.answer };
}

async function askLocal(q) {
  if (!localIndex) {
    const data = window.SBBZ_KNOWLEDGE || (await (await fetch("/assistant/knowledge.json")).json());
    localIndex = buildIndex(data);
  }
  await new Promise((r) => setTimeout(r, 350)); // kurze Pause, damit der Ladeindikator wahrnehmbar ist
  const hits = retrieve(localIndex, q, 4);
  if (!hits.length) {
    return { html: "<p><strong>Demo-Modus (keine KI):</strong> Dazu habe ich auf der Website nichts Passendes gefunden.</p><p>Bitte formulieren Sie die Frage mit anderen Stichworten oder wenden Sie sich an das <a href=\"/de/wir-ueber-uns/kontakt/\">Sekretariat</a>.</p>", sources: [] };
  }
  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const snip = (t) => {
    const low = t.toLowerCase();
    let i = -1;
    for (const tok of tokens) { i = low.indexOf(tok.slice(0, 6)); if (i >= 0) break; }
    const s = Math.max(0, i - 80);
    return (s ? "… " : "") + t.slice(s, s + 220).trim() + " …";
  };
  const seen = new Set(), sources = [];
  const items = hits.filter((h) => !seen.has(h.url) && seen.add(h.url)).slice(0, 3).map((h) => {
    sources.push({ title: h.title, url: h.url });
    return `<li><a href="${esc(h.url)}"><strong>${esc(h.title)}</strong></a><br><span class="msg__snip">${esc(snip(h.text))}</span></li>`;
  });
  return {
    html: `<p><strong>Demo-Modus (keine KI):</strong> Diese Seiten passen am besten zu Ihrer Frage:</p><ul class="msg__hits">${items.join("")}</ul><p class="msg__note">Bitte prüfen Sie die Angaben auf der jeweiligen Seite.</p>`,
    sources: [],
  };
}

if (root && fab) {
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "assistant-panel");
  fab.setAttribute("role", "button");
  document.querySelectorAll("[data-open-assistant]").forEach((b) => b.addEventListener("click", (e) => {
    const d = document.getElementById("drawer");
    if (d && d.classList.contains("is-open")) d.querySelector("[data-close-drawer]").click();
    root.classList.contains("is-open") && b === fab ? close() : open(e);
  }));
  fab.addEventListener("keydown", (e) => { if (e.key === " ") { e.preventDefault(); fab.click(); } });
}
