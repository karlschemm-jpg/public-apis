// Offline-Version: macht aus dist/ eine Kopie, die ohne Server per Doppelklick im Browser läuft (file://).
//   npm run portable   → dist-portable/  (Startdatei: dist-portable/index.html)
// - wurzelrelative Links (/de/…/) werden zu relativen Pfaden auf index.html
// - JSON-Daten (Suche, Wissensbasis) werden als Skripte eingebunden (fetch ist unter file:// gesperrt)
// - ES-Module werden zu einem klassischen Skript zusammengefügt (Module sind unter file:// gesperrt)
// - der Assistent läuft hier immer im Demo-Modus (keine KI, kein Server)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "dist");
const OUT = path.join(root, "dist-portable");

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });

// Daten als JS
fs.writeFileSync(path.join(OUT, "assets/js/search-data.js"), "window.SBBZ_SEARCH=" + fs.readFileSync(path.join(SRC, "search-index.json"), "utf8") + ";");
fs.writeFileSync(path.join(OUT, "assets/js/knowledge-data.js"), "window.SBBZ_KNOWLEDGE=" + fs.readFileSync(path.join(SRC, "assistant/knowledge.json"), "utf8") + ";");

// Assistent + Retrieval zu einem klassischen Skript bündeln
const retrieval = fs.readFileSync(path.join(SRC, "assets/js/retrieval.mjs"), "utf8").replace(/^export /gm, "");
const assistant = fs.readFileSync(path.join(SRC, "assets/js/assistant.js"), "utf8").replace(/^import .*$/m, "");
fs.writeFileSync(path.join(OUT, "assets/js/assistant-bundle.js"), `(function(){\n${retrieval}\n${assistant}\n})();`);

// Links in dynamisch erzeugtem Inhalt (Suche, Assistent) zur Laufzeit relativ auflösen
const linkFix = (prefix) => `<script>window.SBBZ_BASE=${JSON.stringify(prefix)};document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href^='/']");if(!a)return;var h=a.getAttribute("href"),q="";var i=h.search(/[?#]/);if(i>=0){q=h.slice(i);h=h.slice(0,i);}if(h.endsWith("/"))h+="index.html";e.preventDefault();location.href=window.SBBZ_BASE+h.slice(1)+q;},true);</script>`;

function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else yield p; } }

let n = 0;
for (const file of walk(OUT)) {
  if (!file.endsWith(".html")) continue;
  const rel = path.relative(OUT, path.dirname(file));
  const depth = rel ? rel.split(path.sep).length : 0;
  const prefix = depth ? "../".repeat(depth) : "./";
  let html = fs.readFileSync(file, "utf8");
  const fix = (u) => {
    let [p, q = ""] = u.split(/(?=[?#])/);
    if (p.endsWith("/")) p += "index.html";
    return prefix + p.slice(1) + q;
  };
  html = html.replace(/\b(href|src|action|poster)="(\/(?!\/)[^"]*)"/g, (m, a, u) => `${a}="${fix(u)}"`);
  // Icon-Masken als data:-URI (CSS-Masken aus Dateien sind unter file:// gesperrt)
  html = html.replace(/url\('\/(assets\/icons\/[^']+\.svg)'\)/g, (m, f) => `url('data:image/svg+xml;base64,${fs.readFileSync(path.join(OUT, f)).toString("base64")}')`);
  html = html.replace(/<link rel="preload"[^>]*>\n?/g, "");
  html = html.replace(/<script type="module" src="[^"]*assistant\.js[^"]*"><\/script>/,
    `<script src="${prefix}assets/js/search-data.js"></script><script src="${prefix}assets/js/knowledge-data.js"></script><script src="${prefix}assets/js/assistant-bundle.js" defer></script>`);
  html = html.replace("</head>", linkFix(prefix) + "\n</head>");
  // Suchformular: GET-Formular auf index.html funktioniert auch unter file://
  fs.writeFileSync(file, html);
  n++;
}
fs.rmSync(path.join(OUT, "search-index.json"));
console.log(`✓ Offline-Version: ${n} Seiten in dist-portable/ – Startdatei: dist-portable/index.html`);
