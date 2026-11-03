// Statischer Generator für den Redesign-Prototyp der SBBZ-Weimar-Website.
// Liest die aus dem Original extrahierten Inhalte (content/*.json) und erzeugt dist/.
// Keine Abhängigkeiten – läuft mit Node ≥ 20:  node build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { icon } from "./src/icons.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, "dist");
const ORIGIN = "https://sbbz-weimar.de";
const pages = JSON.parse(fs.readFileSync(path.join(here, "content/pages.json"), "utf8"));
const home = JSON.parse(fs.readFileSync(path.join(here, "content/home.json"), "utf8"));
const nav = JSON.parse(fs.readFileSync(path.join(here, "content/nav.json"), "utf8"));
const BUILD_ID = Date.now().toString(36);

// Seiten, die nicht in die KI-Wissensbasis aufgenommen werden (personenbezogene Listen).
// Kollegium: personenbezogene Namensliste. Übersichts-/Listen-Seiten: doppeln nur Inhalte anderer Seiten.
const KNOWLEDGE_EXCLUDE = ["/de/wir-ueber-uns/ansprechpartner/kollegium/", "/de/sitemap/", "/de/aktivitaeten/", "/de/wir-ueber-uns/aktivitaeten/",
  "/de/aktivitaeten/2024/", "/de/aktivitaeten/2025/", "/de/aktivitaeten/2026/"];

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const isExternal = (h) => /^https?:\/\//.test(h || "");
const extAttrs = (h) => (isExternal(h) ? ' target="_blank" rel="noopener noreferrer"' : "");
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// ---------------------------------------------------------------- Navigation-Helfer
function flatten(items, parents = []) {
  const out = [];
  for (const it of items) {
    out.push({ ...it, parents });
    if (it.children) out.push(...flatten(it.children, [...parents, it]));
  }
  return out;
}
const flatDe = flatten(nav.de);
const flatEn = flatten(nav.en);

/** Hauptbereich (Top-Level-Navigationspunkt), zu dem ein Pfad gehört. */
function sectionOf(p, lang) {
  const items = lang === "en" ? nav.en : nav.de;
  if (p.startsWith("/de/aktivitaeten/")) return items[0];
  if (p.startsWith("/de/termine/")) return items[3];
  let best = null;
  for (const it of items) if (p.startsWith(it.href) && (!best || it.href.length > best.href.length)) best = it;
  return best;
}
/** Pfad, der in der Navigation als „aktuell“ markiert wird. */
function navAnchor(p) {
  if (p.startsWith("/de/aktivitaeten/")) return "/de/wir-ueber-uns/aktivitaeten/";
  return p;
}

// ---------------------------------------------------------------- Bausteine
function header(lang, current) {
  const items = lang === "en" ? nav.en : nav.de;
  const sec = sectionOf(current, lang);
  const anchor = navAnchor(current);
  const homeHref = lang === "en" ? "/en/" : "/";
  const top = items.map((it, i) => {
    const active = sec && sec.href === it.href;
    if (!it.children) return `<li><a class="main-nav__top" href="${it.href}"${active ? ' aria-current="true"' : ""}>${esc(it.label)}</a></li>`;
    const groups = it.children.map((c) => {
      const sub = c.children ? `<ul>${c.children.map((g) => `<li><a href="${g.href}"${extAttrs(g.href)}${g.href === anchor ? ' aria-current="page"' : ""}>${esc(g.label)}</a></li>`).join("")}</ul>` : "";
      return `<div class="mega__group"><a href="${c.href}"${extAttrs(c.href)}${c.href === anchor ? ' aria-current="page"' : ""}>${esc(c.label)}${isExternal(c.href) ? ' <span class="visually-hidden">(externer Link)</span>' : ""}</a>${sub}</div>`;
    }).join("");
    return `<li>
      <button class="main-nav__top" type="button" aria-expanded="false" aria-controls="mega-${i}"${active ? ' aria-current="true"' : ""}>${esc(it.label)}${icon("chevron", "chev")}</button>
      <div class="mega" id="mega-${i}"><div class="wrap mega__grid">
        <div class="mega__intro"><h2>${esc(it.label)}</h2><a href="${it.href}">${lang === "en" ? "Overview" : "Zur Übersicht"} ${icon("arrow")}</a></div>
        <div class="mega__cols">${groups}</div>
      </div></div>
    </li>`;
  }).join("");

  return `
<div class="skip-links">
  <a href="#inhalt">Zum Inhalt springen</a>
  <a href="#hauptnavigation">Zur Navigation springen</a>
  <a href="#assistant-open">Zum Schul-Assistenten springen</a>
</div>
<header class="site-header" id="top">
  <div class="wrap site-header__inner">
    <a class="brand" href="${homeHref}" aria-label="Startseite – Staatliches Berufsbildungszentrum Weimar">
      <img src="/assets/logo-sbbz-weimar.svg" alt="Logo SBBZ – Staatliches Berufsbildungszentrum Weimar" width="118" height="55">
      <span class="brand__text">Staatliches Berufsbildungszentrum Weimar</span>
    </a>
    <nav class="main-nav" id="hauptnavigation" aria-label="Hauptnavigation"><ul>
      <li><a class="main-nav__top" href="${homeHref}"${current === homeHref ? ' aria-current="true"' : ""}>${lang === "en" ? "Home" : "Start"}</a></li>
      ${top}
    </ul></nav>
    <div class="header-tools">
      <button class="tool-btn" type="button" data-open-search aria-label="Suche öffnen">${icon("search")}<span class="label-lg">Suche</span></button>
      <button class="tool-btn" type="button" id="a11y-toggle" aria-expanded="false" aria-controls="a11y-panel" aria-label="Darstellung anpassen">${icon("a11y")}</button>
      <a class="tool-btn lang-switch" href="${lang === "en" ? "/" : "/en/"}" hreflang="${lang === "en" ? "de" : "en"}" lang="${lang === "en" ? "de" : "en"}" aria-label="${lang === "en" ? "Deutsche Version" : "English version"}">${lang === "en" ? "DE" : "EN"}</a>
      <button class="tool-btn tool-btn--assist" type="button" data-open-assistant id="assistant-open-header"><span class="dot" aria-hidden="true"></span><span class="label-assist" aria-hidden="true">Assistent</span><span class="visually-hidden">Schul-Assistent öffnen</span></button>
      <button class="tool-btn menu-toggle" type="button" id="menu-toggle" aria-expanded="false" aria-controls="drawer" aria-label="Menü öffnen">${icon("menu")}</button>
    </div>
    <div class="popover" id="a11y-panel" role="region" aria-labelledby="a11y-title" hidden>
      <h2 id="a11y-title">Darstellung</h2>
      <fieldset><legend>Kontrast</legend><div class="seg">
        <button type="button" data-pref="contrast" data-value="normal" aria-pressed="true">Normal</button>
        <button type="button" data-pref="contrast" data-value="high" aria-pressed="false">hoher Kontrast</button>
      </div></fieldset>
      <fieldset><legend>Hintergrund</legend><div class="seg">
        <button type="button" data-pref="theme" data-value="light" aria-pressed="true">hell</button>
        <button type="button" data-pref="theme" data-value="dark" aria-pressed="false">dunkler Hintergrund</button>
      </div></fieldset>
      <fieldset><legend>Text</legend><div class="seg">
        <button type="button" data-pref="text" data-value="0.9" aria-pressed="false">kleiner</button>
        <button type="button" data-pref="text" data-value="1" aria-pressed="true">normal</button>
        <button type="button" data-pref="text" data-value="1.15" aria-pressed="false">größer</button>
      </div></fieldset>
    </div>
  </div>
</header>
${drawer(lang, items, anchor, homeHref)}
<dialog class="search-dialog" id="search-dialog" aria-label="Website durchsuchen">
  <form role="search" action="/de/suchergebnisse/" method="get">
    ${icon("search")}
    <label class="visually-hidden" for="search-input">Suchbegriff</label>
    <input id="search-input" name="search" type="search" placeholder="Website durchsuchen …" autocomplete="off" aria-controls="search-results">
    <button class="tool-btn" type="button" data-close-search aria-label="Suche schließen">${icon("x")}</button>
  </form>
  <ul class="search-results" id="search-results" aria-live="polite"></ul>
  <p class="search-hint">Tipp: Enter zeigt alle Treffer. Esc schließt die Suche.</p>
</dialog>`;
}

function drawer(lang, items, anchor, homeHref) {
  let n = 0;
  const list = (arr, depth) => `<ul>${arr.map((it) => {
    const id = `dsub-${n++}`;
    const cur = it.href === anchor ? ' aria-current="page"' : "";
    if (it.children) {
      const open = anchor.startsWith(it.href);
      return `<li><div class="drawer__row"><a href="${it.href}"${cur}>${esc(it.label)}</a><button type="button" aria-expanded="${open}" aria-controls="${id}" aria-label="Unterpunkte von ${esc(it.label)}">${icon("chevron")}</button></div><div class="drawer__sub" id="${id}"${open ? "" : " hidden"}>${list(it.children, depth + 1)}</div></li>`;
    }
    return depth === 0
      ? `<li><div class="drawer__row"><a href="${it.href}"${extAttrs(it.href)}${cur}>${esc(it.label)}</a></div></li>`
      : `<li><a href="${it.href}"${extAttrs(it.href)}${cur}>${esc(it.label)}</a></li>`;
  }).join("")}</ul>`;
  return `<div class="drawer" id="drawer" aria-hidden="true">
  <div class="drawer__backdrop" data-close-drawer></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menü">
    <div class="drawer__head"><img src="/assets/logo-sbbz-weimar.svg" alt="SBBZ Weimar" width="96" height="45"><button class="tool-btn" type="button" data-close-drawer aria-label="Menü schließen">${icon("x")}</button></div>
    <nav class="drawer__nav" aria-label="Mobile Navigation">${list([{ label: lang === "en" ? "Home" : "Start", href: homeHref }, ...items], 0)}</nav>
    <div class="drawer__foot">
      <button class="btn" type="button" data-open-assistant>${icon("chat")} Schul-Assistent</button>
      <button class="btn btn--ghost" type="button" data-open-search>${icon("search")} Suche</button>
      <div class="drawer__small">
        <button class="btn btn--ghost" type="button" data-open-a11y>${icon("a11y")} Darstellung</button>
        <a class="btn btn--ghost" href="${lang === "en" ? "/" : "/en/"}" hreflang="${lang === "en" ? "de" : "en"}">${lang === "en" ? "Deutsch" : "English"}</a>
      </div>
    </div>
  </div>
</div>`;
}

function seals(list, cls = "logo-strip") {
  return `<div class="${cls}">${list.map((s) => {
    const img = `<img src="${s.img}" alt="${esc(cleanAlt(s.name))}" loading="lazy">`;
    return s.href ? `<a href="${s.href}"${extAttrs(s.href)} aria-label="zur Webseite ${esc(cleanAlt(s.name))}">${img}</a>` : `<span>${img}</span>`;
  }).join("")}</div>`;
}
function cleanAlt(n) {
  if (/fobiz/i.test(n)) return "FobiZ-Schule 2025/2026";
  return n;
}

function supporters(list, heading) {
  if (!list || !list.length) return "";
  return `<section class="supporters" aria-labelledby="sup-h"><div class="wrap">
    <h2 id="sup-h">${esc(heading || "Unser Förderverein dankt seinen Unterstützern")}</h2>
    <div class="logo-strip">${list.map((s) => `<figure style="margin:0"><a href="${s.href}"${extAttrs(s.href)} aria-label="zur Webseite ${esc(s.name)}"><img src="${s.img}" alt="${esc(s.name)}" loading="lazy"></a><figcaption>zur Webseite<br>${esc(s.name)}</figcaption></figure>`).join("")}</div>
  </div></section>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <img src="/assets/logo-sbbz-weimar.svg" alt="Logo SBBZ Weimar" width="150" height="70" loading="lazy">
        <p class="footer__claim">Staatliches Berufsbildungszentrum Weimar<br>Kompetenzzentrum für Gesundheit, Soziales und Technik<br><span>– Europaschule –</span></p>
      </div>
      <div>
        <h2>Kontakt</h2>
        <address>
          Staatliches Berufsbildungszentrum Weimar<br>Lützendorfer Str. 10<br>99427 Weimar<br>
          <a href="tel:0364348420">03643–48 42-0</a><br>
          Fax 03643–48 42-60<br>
          <a href="#" class="js-mail" data-mail="vasb|foom-jrvzne.qr">info [at] sbbz-weimar.de</a>
        </address>
      </div>
      <div>
        <h2>Schnellzugriff</h2>
        <ul>
          <li><a href="/de/service/vertretungsplaene/aktuelle-vertretungsplaene/">Vertretungspläne</a></li>
          <li><a href="/de/termine/">Termine</a></li>
          <li><a href="/de/service/anmeldung-fristen/">Anmeldung/Fristen</a></li>
          <li><a href="https://sbbz.moodle-weimar.de/login/" target="_blank" rel="noopener noreferrer">Moodle-Schulcloud</a></li>
          <li><a href="https://mein.cevex.de/bbz-weimar/Tenant/Login" target="_blank" rel="noopener noreferrer">Klassenbuch</a></li>
        </ul>
      </div>
      <div>
        <h2>Rechtliches</h2>
        <ul>${nav.footer.map((f) => `<li><a href="${f.href}">${esc(f.label)}</a></li>`).join("")}</ul>
      </div>
    </div>
    ${seals(home.seals, "footer__seals")}
    <div class="footer__bottom">
      <span>© SBBZ Weimar</span>
      <span>Redesign-Prototyp · Inhalte: sbbz-weimar.de</span>
    </div>
  </div>
</footer>
<button class="to-top" type="button" id="to-top" aria-label="Nach oben">${icon("up")}</button>`;
}

function assistantShell() {
  // Container, den assistant.js befüllt. Der Button ist auch ohne JS sichtbar und führt dann zur Kontaktseite.
  return `<div class="assistant" id="assistant">
  <a class="assistant__fab" id="assistant-open" href="/de/wir-ueber-uns/kontakt/" data-open-assistant aria-haspopup="dialog" aria-label="Schul-Assistent öffnen">
    ${icon("chat")}<span class="assistant__fab-label">Fragen? <span>Schul-Assistent</span></span>
  </a>
</div>`;
}

function layout({ title, description, lang = "de", current, body, canonical, noindex = false }) {
  const fullTitle = title ? `${title} | SBBZ Weimar` : "SBBZ Weimar";
  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || "Staatliches Berufsbildungszentrum Weimar – Kompetenzzentrum für Gesundheit, Soziales und Technik – Europaschule")}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${ORIGIN}${canonical || current}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${ORIGIN}${canonical || current}">
<meta property="og:image" content="${ORIGIN}/media/sliderbild1920/schulaussenansicht-sbbz-weimar.webp">
<meta name="theme-color" content="#212E58">
<link rel="icon" href="/assets/favicon.ico">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/kanit-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=${BUILD_ID}">
<link rel="stylesheet" href="/assets/css/assistant.css?v=${BUILD_ID}">
<script>
(function(){var d=document.documentElement;d.classList.remove("no-js");try{var p=JSON.parse(localStorage.getItem("sbbz-prefs")||"{}");if(p.theme==="dark")d.dataset.theme="dark";if(p.contrast==="high")d.dataset.contrast="high";if(p.text)d.style.setProperty("--text-scale",p.text);}catch(e){}})();
</script>
</head>
<body>
${header(lang, current)}
<main id="inhalt" tabindex="-1">
${body}
</main>
${footer()}
${assistantShell()}
<script src="/assets/js/site.js?v=${BUILD_ID}" defer></script>
<script type="module" src="/assets/js/assistant.js?v=${BUILD_ID}"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------- Termine
function parseDate(ev) {
  if (!ev.datetime) return null;
  const [y, m, d] = ev.datetime.split("-").map(Number);
  return { y, m, d };
}
function holidayList(html) {
  const text = html.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "");
  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).replace(/\s+/g, " ").trim()] : [l, ""];
  });
  return `<ul class="holidays">${rows.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join("")}</ul>`;
}
function eventCard(ev, headingLevel = 3) {
  const h = `h${headingLevel}`;
  const dt = parseDate(ev);
  const weekday = ev.date ? ev.date.split(" ")[0] : "";
  const isHolidays = /Ferien/i.test(ev.title) && !ev.href;
  let badge;
  if (dt) badge = `<div class="event__date" aria-hidden="true"><span class="d">${String(dt.d).padStart(2, "0")}</span><span class="m">${MONTHS[dt.m - 1]}</span><span class="y">${dt.y}</span></div>`;
  else badge = `<div class="event__date event__date--icon" aria-hidden="true">${icon(isHolidays ? "sun" : ev.icon === "pruefungstermine" ? "file" : "calendar")}</div>`;
  const title = ev.href ? `<a href="${ev.href}">${esc(ev.title)}</a>` : esc(ev.title);
  const body = isHolidays ? holidayList(ev.html) : `<div class="event__text">${ev.html}</div>`;
  return `<article class="event${ev.href ? " event--link" : ""}${isHolidays ? " event--holidays" : ""}">
    ${badge}
    <div>
      ${dt ? `<p class="event__weekday"><time datetime="${ev.datetime}">${esc(weekday)}, ${String(dt.d).padStart(2, "0")}.${String(dt.m).padStart(2, "0")}.${dt.y}</time></p>` : ""}
      <${h}>${title}</${h}>
      ${body}
    </div>
  </article>`;
}

// ---------------------------------------------------------------- News
function newsCard(n, headingLevel = 3) {
  const [d, m, y] = (n.date || "").split(".");
  return `<article class="news-card">
    <div class="news-card__img">${n.img ? `<img src="${n.img}" alt="" loading="lazy">` : ""}</div>
    <div class="news-card__body">
      ${n.date ? `<time datetime="${y}-${m}-${d}">${esc(n.date)}</time>` : ""}
      <h${headingLevel}><a href="${n.href}">${esc(n.title)}</a></h${headingLevel}>
      <p>${esc(n.text)}</p>
    </div>
  </article>`;
}

// ---------------------------------------------------------------- Bildungsgang-Filter
function courseFilter(cf, id) {
  const label = Object.fromEntries(cf.filters.map(([v, l]) => [v, l]));
  return `<section class="course-filter" aria-labelledby="cf-${id}">
    ${cf.heading ? `<h2 id="cf-${id}">${esc(cf.heading)}</h2>` : `<h2 class="visually-hidden" id="cf-${id}">Bildungsgänge</h2>`}
    <div class="course-filter__bar" role="group" aria-label="Nach Schulform filtern">
      ${cf.filters.map(([v, l]) => `<button type="button" data-filter="${esc(v)}" aria-pressed="${v === "0"}">${esc(l)}</button>`).join("")}
    </div>
    <p class="course-filter__status" aria-live="polite"></p>
    <ul class="course-grid">
      ${cf.cards.map((c) => `<li data-type="${esc(c.type)}"><a class="course-card" href="${c.href}">
        <div class="course-card__img">${c.img ? `<img src="${c.img}" alt="" loading="lazy">` : ""}</div>
        <div class="course-card__body"><span class="course-card__type">${esc(label[c.type] || c.type || "")}</span><span class="course-card__title">${esc(c.title)}</span></div>
      </a></li>`).join("")}
    </ul>
  </section>`;
}

// ---------------------------------------------------------------- Kontaktformular
function contactForm() {
  // Felder und Texte 1:1 aus dem bestehenden yform-Formular. Im REDAXO-Theme rendert das yform-Modul dieses Markup.
  return `<form class="form" id="kontaktformular" action="${ORIGIN}/de/wir-ueber-uns/kontakt/#rex-yform" method="post" novalidate data-prototype-form>
    <h2>Kontaktformular</h2>
    <p class="form-note">* Pflichtfelder bitte ausfüllen</p>
    <div class="field"><label for="cf-name">Ihr Name *</label><input id="cf-name" name="name" type="text" autocomplete="name" required></div>
    <div class="field"><label for="cf-mail">Ihre Email-Adresse *</label><input id="cf-mail" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="cf-mail2">Ihre Email-Adresse * <span class="form-note">(Wiederholung)</span></label><input id="cf-mail2" name="email_confirm" type="email" autocomplete="email" required></div>
    <div class="field"><label for="cf-msg">Ihre Nachricht *</label><textarea id="cf-msg" name="message" required></textarea></div>
    <label class="check"><input type="checkbox" name="consent" required><span>* Ich habe die <a href="/de/datenschutz/">Datenschutzerklärung</a> zur Kenntnis genommen. Ich stimme zu, dass meine Angaben und Daten zur Beantwortung meiner Anfrage elektronisch erhoben und gespeichert werden.</span></label>
    <p class="form-note"><strong>Hinweis</strong>: Sie können Ihre Einwilligung jederzeit für die Zukunft per E-Mail an <a href="#" class="js-mail" data-mail="vasb|ooom-jrvzne.qr">info [at] bbz-weimar.de</a> widerrufen.</p>
    <div class="notice" role="note"><strong>Prototyp:</strong> Dieses Formular sendet hier nichts ab. Im Live-Betrieb übernimmt das bestehende REDAXO-yform-Modul den Versand.</div>
    <div><button class="btn" type="submit">Absenden ${icon("send")}</button></div>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>`;
}

// ---------------------------------------------------------------- Seiteninhalt nachbearbeiten
function enhanceHtml(page) {
  let html = page.html || "";
  html = html.replace(/<table>/g, '<div class="table-wrap" tabindex="0" role="region" aria-label="Tabelle"><table>').replace(/<\/table>/g, "</table></div>");
  html = html.replace(/href="\/index\.php\?/g, `href="${ORIGIN}/index.php?`);
  if (page.courseFilter) html = html.replace('<div class="course-filter"></div>', courseFilter(page.courseFilter, "main"));
  if (page.news) html = html.replace('<div class="news-grid"></div>', `<div class="news-grid">${page.news.map((n) => newsCard(n, 2)).join("")}</div>`);
  if (page.events) html = html.replace('<div class="events"></div>', `<div class="events">${page.events.map((e) => eventCard(e, 2)).join("")}</div>`);
  if (page.hasContactForm) html = html.replace('<div class="contact-form-slot"></div>', contactForm());
  // Links, die nur ein Bild ohne Alternativtext enthalten (aus dem Original), bekommen einen zugänglichen Namen
  html = html.replace(/<a ([^>]*?)href="([^"]+)"([^>]*)>\s*(<img [^>]*alt=""[^>]*\/?>)\s*<\/a>/g, (m, pre, href, post, img) => {
    if (/aria-label=|gallery__item/.test(pre + post)) return m;
    const target = pages[href];
    const label = target ? `Zur Seite ${target.h1 || target.title}` : /^https:\/\/sbbz-weimar\.de\/media\/.+\.(png|jpe?g|webp)$/i.test(href) ? "Bild in voller Größe öffnen" : /\.pdf$/i.test(href) ? "PDF öffnen" : isExternal(href) ? `Externer Link: ${new URL(href).host}` : `Link öffnen`;
    return `<a ${pre.replace(/title=""\s*/, "")}href="${href}"${post.replace(/\s*title=""/, "")} aria-label="${esc(label)}">${img}</a>`;
  });
  // Galerie-Bilder: Vollbild-Link bekommt zugänglichen Namen
  html = html.replace(/<a class="gallery__item"([^>]*)><img alt="([^"]*)"/g, (m, a, alt) => `<a class="gallery__item"${a} aria-label="Bild vergrößern${alt ? ": " + alt : ""}"><img alt="${alt}"`);
  return html;
}

function subnav(p, lang) {
  const sec = sectionOf(p, lang);
  if (!sec || !sec.children) return "";
  const anchor = navAnchor(p);
  const list = (arr) => `<ul>${arr.map((it) => {
    const cur = it.href === anchor;
    const inPath = anchor.startsWith(it.href) && it.children;
    return `<li><a href="${it.href}"${extAttrs(it.href)}${cur ? ' aria-current="page"' : ""}${inPath && !cur ? ' class="subnav__parent"' : ""}>${esc(it.label)}</a>${it.children && (inPath || cur) ? list(it.children) : ""}</li>`;
  }).join("")}</ul>`;
  return `<aside class="subnav" aria-label="Bereichsnavigation ${esc(sec.label)}">
    <details open><summary>${esc(sec.label)}</summary>
      <ul><li><a href="${sec.href}"${sec.href === anchor ? ' aria-current="page"' : ""}>Übersicht</a></li></ul>
      ${list(sec.children)}
    </details>
  </aside>`;
}

function breadcrumb(page) {
  const crumbs = page.breadcrumb && page.breadcrumb.length ? page.breadcrumb : [{ label: "Start", href: "/" }, { label: page.title, href: page.path }];
  return `<nav class="breadcrumb" aria-label="Brotkrümelnavigation"><ol>${crumbs.map((c, i) => {
    const last = i === crumbs.length - 1;
    return `<li>${last ? `<span aria-current="page">${esc(c.label)}</span>` : `<a href="${c.href}">${esc(c.label)}</a>`}</li>`;
  }).join("")}</ol></nav>`;
}

function subpage(page) {
  const lang = page.lang;
  const sn = subnav(page.path, lang);
  const hero = page.headerImage || { src: `${ORIGIN}/media/headerbild1920/aussen-24_1.jpg`, srcset: "", alt: "" };
  const wide = page.courseFilter || page.news || page.events || /gallery|person-grid/.test(page.html);
  const content = enhanceHtml(page);
  const body = `
<div class="page-hero">
  <div class="page-hero__img" aria-hidden="true"><img src="${hero.src}"${hero.srcset ? ` srcset="${hero.srcset}" sizes="100vw"` : ""} alt="" fetchpriority="high"></div>
  <div class="wrap page-hero__inner">
    ${breadcrumb(page)}
    <h1>${esc(page.h1 || page.title)}</h1>
  </div>
  <span class="page-hero__rail" aria-hidden="true"></span>
</div>
<div class="page"><div class="wrap ${sn ? "page__grid" : ""}">
  ${sn}
  <div class="prose${wide || !sn ? " prose--wide" : ""}">
    ${content || ""}
  </div>
</div></div>
${supporters(page.supporters, page.supportersHeading)}`;
  return layout({ title: page.title, lang, current: page.path, body, description: (page.text || "").slice(0, 155) });
}

// ---------------------------------------------------------------- Startseite
function homepage() {
  const news = pages["/de/aktivitaeten/"].news.slice(0, 4);
  const events = pages["/de/termine/"].events;
  const [claim1, claim2] = home.claim;
  const tints = ["#4f6a00", "#b45309", "#1d6f8f", "#14532d"]; // abgedunkelte Varianten der Originalfarben (#83ae02, orange, #6bbad3, darkgreen)
  const quick = home.quickLinks.map((q, i) => {
    const inner = `<span class="quick__icon" style="--tint:${tints[i % 4]}"><i style="--mask:url('/assets/icons/${path.basename(q.icon)}')"></i></span>
      <span class="quick__title">${esc(q.title)}${q.href ? icon("arrow") : ""}</span>`;
    return q.href ? `<a class="quick__item" href="${q.href}"${extAttrs(q.href)}>${inner}</a>` : `<div class="quick__item">${inner}</div>`;
  }).join("");
  const bb = nav.de[1], sb = nav.de[2];
  const chips = (it) => it.children.filter((c) => !/^Alle/.test(c.label)).map((c) => `<li>${esc(c.label)}</li>`).join("");
  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero__grid">
    <div class="reveal">
      <span class="kicker">Europaschule · Weimar</span>
      <h1 id="hero-title">${esc(claim1).replace("Berufsbildungszentrum", "Berufsbildungs&shy;zentrum")}<span class="sub">${esc(claim2)}</span></h1>
      <p class="hero__lead">${esc(pages["/de/wir-ueber-uns/schulentwicklung/unser-leitbild/"].text.match(/In unserer berufsbildenden Schule[^.]*\./)?.[0] || "")}</p>
      <div class="hero__actions">
        <a class="btn" href="/de/berufliche-bildung/">Bildungsangebote entdecken ${icon("arrow")}</a>
        <a class="btn btn--ghost" href="/de/wir-ueber-uns/kontakt/">Kontakt</a>
      </div>
    </div>
    <div class="hero__media reveal">
      <div class="hero__frame" id="hero-slider" aria-roledescription="Karussell" aria-label="Ansichten des Schulgebäudes des SBBZ Weimar">
        ${home.slides.map((s, i) => `<img src="${s.src}" srcset="${s.srcset}" sizes="(min-width: 980px) 50vw, 100vw" alt="${esc(s.alt)}"${i === 0 ? ' class="is-active" fetchpriority="high"' : ' loading="lazy"'}${i ? ' aria-hidden="true"' : ""}>`).join("")}
        <div class="slide-controls">
          <button type="button" data-slide="prev" aria-label="Vorheriges Bild">${icon("prev")}</button>
          <div class="slide-dots" aria-hidden="true">${home.slides.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ""}></span>`).join("")}</div>
          <button type="button" data-slide="toggle" aria-label="Automatischen Bildwechsel pausieren">${icon("pause")}</button>
          <button type="button" data-slide="next" aria-label="Nächstes Bild">${icon("next")}</button>
        </div>
      </div>
      <span class="hero__rail" aria-hidden="true"></span><span class="hero__rail hero__rail--2" aria-hidden="true"></span>
    </div>
  </div>
</section>

<section class="quick" aria-label="Schnellzugriff"><div class="wrap"><div class="quick__grid">${quick}</div></div></section>

<section class="section" aria-labelledby="bw-title"><div class="wrap">
  <div class="section__head reveal"><div><span class="kicker">Bildungsangebote</span><h2 id="bw-title">Ihr Weg am SBBZ Weimar</h2></div>
    <a class="link-arrow" href="/de/berufliche-bildung/alle-beruflichen-bildungsgaenge/">Alle Bildungsgänge ${icon("arrow")}</a></div>
  <div class="paths">
    <article class="path reveal"><h3><a href="${bb.href}">${esc(bb.label)}</a></h3><ul>${chips(bb)}</ul></article>
    <article class="path path--light reveal"><h3><a href="${sb.href}">${esc(sb.label)}</a></h3><ul>${chips(sb)}</ul></article>
  </div>
</div></section>

<section class="section section--tint" aria-labelledby="akt-title"><div class="wrap">
  <div class="section__head reveal"><div><span class="kicker">Schulalltag</span><h2 id="akt-title">Aktivitäten</h2></div>
    <a class="link-arrow" href="/de/wir-ueber-uns/aktivitaeten/">weitere Aktivitäten anzeigen ${icon("arrow")}</a></div>
  <div class="news-grid news-grid--feature">${news.map((n) => newsCard(n)).join("")}</div>
</div></section>

<section class="section" aria-labelledby="ter-title"><div class="wrap">
  <div class="section__head reveal"><div><span class="kicker">Kalender</span><h2 id="ter-title">Termine</h2></div>
    <a class="link-arrow" href="/de/termine/">Alle Termine ${icon("arrow")}</a></div>
  <div class="events events--home">${events.map((e) => eventCard(e)).join("")}</div>
</div></section>

<section class="section section--tint" aria-labelledby="med-title"><div class="wrap media-split">
  <div class="video-frame reveal"><video controls preload="none" poster="${home.video.poster}"><source src="${home.video.src}" type="video/mp4">${esc(home.video.fallback)}</video></div>
  <div class="reveal">
    <span class="kicker">Medien</span><h2 id="med-title">Ausbildungen am SBBZ Weimar</h2>
    <ul class="link-list">${home.videoLinks.map((l) => `<li><a href="${l.href}">${esc(l.title.replace(/^zur Seite /, ""))} ${icon("arrow")}</a></li>`).join("")}</ul>
  </div>
</div></section>

<section class="section" aria-label="Auszeichnungen und Partner"><div class="wrap">${seals(home.seals)}</div></section>
${supporters(home.supporters, home.supportersHeading)}`;
  return layout({ title: "Start", current: "/", body });
}

function enHome() {
  const p = pages["/en/"];
  const body = `
<div class="page-hero"><div class="page-hero__img" aria-hidden="true"><img src="${home.slides[0].src}" alt=""></div>
<div class="wrap page-hero__inner"><h1>${esc(home.claim[0])}</h1></div><span class="page-hero__rail" aria-hidden="true"></span></div>
<div class="page"><div class="wrap"><div class="prose prose--wide"></div></div></div>
${supporters(p.supporters, p.supportersHeading)}`;
  return layout({ title: "Home", lang: "en", current: "/en/", body });
}

function searchPage() {
  const body = `
<div class="page-hero"><div class="wrap page-hero__inner">${breadcrumb({ breadcrumb: [{ label: "Start", href: "/" }, { label: "Suchergebnisse" }] })}<h1>Suchergebnisse</h1></div><span class="page-hero__rail" aria-hidden="true"></span></div>
<div class="page"><div class="wrap"><div class="prose">
  <form role="search" class="form" style="margin-top:0" action="/de/suchergebnisse/" method="get">
    <div class="field"><label for="sp-q">Suchbegriff</label><input id="sp-q" name="search" type="search"></div>
    <div><button class="btn" type="submit">Suchen ${icon("search")}</button></div>
  </form>
  <div id="search-page-results" aria-live="polite"></div>
</div></div></div>`;
  return layout({ title: "Suchergebnisse", current: "/de/suchergebnisse/", body, noindex: true });
}

function errorPage(p, note) {
  const body = `<div class="page-hero"><div class="wrap page-hero__inner"><h1>${esc(note.title)}</h1></div><span class="page-hero__rail" aria-hidden="true"></span></div>
<div class="page"><div class="wrap"><div class="prose"><div class="empty-note">${note.html}</div></div></div></div>`;
  return layout({ title: note.title, current: p, body, noindex: true });
}

// ---------------------------------------------------------------- Schreiben
function write(p, html) {
  const file = path.join(DIST, p.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
copyDir(path.join(here, "src/assets"), path.join(DIST, "assets"));

let count = 0;
for (const p of Object.values(pages)) {
  if (p.path === "/") { write("/", homepage()); count++; continue; }
  if (p.path === "/en/") { write("/en/", enHome()); count++; continue; }
  write(p.path, subpage(p));
  count++;
}
write("/de/suchergebnisse/", searchPage());
write("/de/aktivitaeten/2025/adventssingen/", errorPage("/de/aktivitaeten/2025/adventssingen/", {
  title: "Adventssingen",
  html: "<p><strong>Inhalt nicht übernommen.</strong> Die Originalseite <code>/de/aktivitaeten/2025/adventssingen/</code> liefert auf sbbz-weimar.de derzeit einen Serverfehler (HTTP 500). Der Inhalt muss von der Schule nachgeliefert werden.</p>",
}));
fs.writeFileSync(path.join(DIST, "404.html"), errorPage("/404", { title: "Seite nicht gefunden", html: '<p>Diese Seite gibt es nicht. Zur <a href="/">Startseite</a> oder zur <a href="/de/sitemap/">Sitemap</a>.</p>' }));

// Suchindex (clientseitige Volltextsuche, ersetzt im Prototyp search_it)
const searchIndex = Object.values(pages).filter((p) => p.text || p.path === "/").map((p) => ({
  u: p.path, t: p.h1 || p.title, s: (p.breadcrumb || []).slice(1, -1).map((b) => b.label).join(" › "), x: (p.text || "").slice(0, 2400),
}));
fs.writeFileSync(path.join(DIST, "search-index.json"), JSON.stringify(searchIndex));

// Wissensbasis für den Assistenten: Abschnitte (Chunks) mit Quellen-URL
function chunks(p) {
  const out = [];
  const text = p.text || "";
  if (!text) return out;
  const size = 900, overlap = 150;
  for (let i = 0; i < text.length; i += size - overlap) {
    out.push({ url: p.path, title: p.h1 || p.title, section: (p.breadcrumb || []).slice(1, -1).map((b) => b.label).join(" › "), text: text.slice(i, i + size) });
    if (i + size >= text.length) break;
  }
  return out;
}
const knowledge = Object.values(pages)
  .filter((p) => p.lang === "de" && !KNOWLEDGE_EXCLUDE.includes(p.path))
  .flatMap(chunks);
// Termine aus der Startseite strukturiert ergänzen
knowledge.push({ url: "/", title: "Startseite", section: "", text: `Staatliches Berufsbildungszentrum Weimar, Kompetenzzentrum für Gesundheit, Soziales und Technik, Europaschule. Adresse: Lützendorfer Str. 10, 99427 Weimar. Telefon 03643–48 42-0, Fax 03643–48 42-60, E-Mail info@sbbz-weimar.de. Schnellzugriff: Moodle-Schulcloud, Erasmus +, iPad-Klassen.` });
fs.mkdirSync(path.join(DIST, "assistant"), { recursive: true });
fs.writeFileSync(path.join(DIST, "assistant/knowledge.json"), JSON.stringify(knowledge));

// Sitemap + robots
const urls = ["/", ...Object.keys(pages).filter((p) => p !== "/")];
fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`✓ ${count} Seiten + Suche + 404 erzeugt · ${searchIndex.length} Einträge im Suchindex · ${knowledge.length} Wissens-Abschnitte`);
