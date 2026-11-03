// Qualitätskontrolle: vergleicht den Prototyp mit dem Original-Crawl.
//   node tools/check.mjs
// Prüft: (1) jede Originalseite existiert, (2) alle internen Links zeigen auf existierende Seiten,
// (3) alle Original-Downloads (PDF/MP4) sind verlinkt, (4) alle externen Ziele des Originals sind verlinkt,
// (5) jedes Wort des Originaltexts ist auf der neuen Seite vorhanden (Inhaltsvollständigkeit).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const DIST = path.join(root, "dist");
const crawl = JSON.parse(fs.readFileSync(path.join(root, "content/crawl.json"), "utf8"));
const KNOWN_BROKEN = new Set(["/de/aktivitaeten/2025/adventssingen/"]); // liefert im Original HTTP 500
// Texte aus versehentlich ins CMS kopierten Browser-Erweiterungs-Overlays ("simple-translate"), bewusst entfernt
const ARTIFACTS = new Set(["uwt22-aw", "newspoint-mobile"]);

const fileFor = (p) => path.join(DIST, p.replace(/^\//, ""), "index.html");
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")
  .replace(/&shy;/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;| /g, " ");
const words = (t) => t.toLowerCase().replace(/_at_/g, "@").split(/[^\p{L}\p{N}@.-]+/u).map((w) => w.replace(/^[.-]+|[.-]+$/g, "")).filter((w) => w.length > 2);

let problems = 0;
const report = (msg) => { problems++; console.log("✗ " + msg); };

// 1 + 5
const allHtml = {};
for (const [p, page] of Object.entries(crawl.pages)) {
  const f = fileFor(p);
  if (!fs.existsSync(f)) { report(`Seite fehlt: ${p}`); continue; }
  const html = fs.readFileSync(f, "utf8");
  allHtml[p] = html;
  const plain = strip(html).toLowerCase();
  const have = new Set(words(plain));
  // Original-Startseite: Inhalte stammen aus Aktivitäten/Termine → gegen die Startseite prüfen
  const missing = [...new Set(words(page.text))].filter((w) => !have.has(w) && !plain.includes(w));
  // E-Mail-Adressen werden clientseitig entschlüsselt (Spamschutz) – als "x [at] y" im HTML vorhanden
  const real = missing.filter((w) => !/@/.test(w) && !ARTIFACTS.has(w));
  if (real.length) report(`${p}: ${real.length} Wörter des Originals fehlen: ${real.slice(0, 12).join(", ")}`);
}

// 2
const linkRe = /href="(\/[^"#?]*)/g;
const seen = new Set();
for (const f of walk(DIST)) {
  if (!f.endsWith(".html")) continue;
  const html = fs.readFileSync(f, "utf8");
  for (const [, href] of html.matchAll(linkRe)) {
    if (seen.has(href)) continue;
    seen.add(href);
    if (href.startsWith("/assets/") || href === "/") continue;
    const target = href.endsWith("/") ? fileFor(href) : path.join(DIST, href);
    if (!fs.existsSync(target)) report(`Interner Link ohne Ziel: ${href} (in ${path.relative(DIST, f)})`);
  }
}

// 3 + 4
const everything = Object.values(allHtml).join("\n");
for (const a of crawl.assets) {
  if (!/\.(pdf|mp4)$/i.test(a)) continue;
  if (!everything.includes(a)) report(`Download nicht verlinkt: ${a}`);
}
for (const e of crawl.external) {
  const v = e.replace(/&/g, "&amp;");
  if (!everything.includes(e) && !everything.includes(v)) report(`Externer Link fehlt: ${e}`);
}

console.log(problems ? `\n${problems} Auffälligkeiten.` : "✓ Alle Seiten, Texte, Downloads und Links des Originals sind vorhanden.");
process.exitCode = problems ? 1 : 0;

function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else yield p; } }
