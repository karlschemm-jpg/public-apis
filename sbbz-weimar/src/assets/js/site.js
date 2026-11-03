/* SBBZ Weimar – Interaktionen. Ohne Framework, progressive enhancement:
   alle Inhalte und Links funktionieren auch ohne JavaScript. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- E-Mail-Adressen (Spamschutz wie im Original: ROT13, | = @) ---------- */
  function rot13(s) { return s.replace(/[a-z]/gi, function (c) { var b = c <= "Z" ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); }
  $$("a.js-mail").forEach(function (a) {
    var addr = rot13(a.getAttribute("data-mail") || "").replace("|", "@");
    a.href = "mailto:" + addr;
    a.textContent = addr;
  });

  /* ---------- Mega-Menü ---------- */
  var tops = $$(".main-nav button.main-nav__top");
  function closeMega(except) {
    tops.forEach(function (b) {
      if (b === except) return;
      b.setAttribute("aria-expanded", "false");
      var m = document.getElementById(b.getAttribute("aria-controls"));
      if (m) m.classList.remove("is-open");
    });
  }
  tops.forEach(function (b) {
    var menu = document.getElementById(b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") === "true";
      closeMega(b);
      b.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
      if (!open) { var f = menu.querySelector("a"); if (f && document.activeElement === b && b.dataset.kbd) f.focus(); }
    });
    b.addEventListener("keydown", function (e) { if (e.key === "ArrowDown") { e.preventDefault(); b.dataset.kbd = "1"; if (b.getAttribute("aria-expanded") !== "true") b.click(); var f = menu.querySelector("a"); if (f) f.focus(); } });
    menu.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMega(); b.focus(); } });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".main-nav")) closeMega(); });
  document.addEventListener("focusin", function (e) { if (!e.target.closest(".main-nav")) closeMega(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMega(); });

  /* ---------- Mobiles Menü ---------- */
  var drawer = $("#drawer"), toggle = $("#menu-toggle"), lastFocus;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden";
    var c = drawer.querySelector("[aria-current='page']") || drawer.querySelector("[data-close-drawer].tool-btn");
    setTimeout(function () { (c || drawer.querySelector("a")).focus(); }, 30);
  }
  function closeDrawer() {
    drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (toggle) toggle.addEventListener("click", openDrawer);
  $$("[data-close-drawer]").forEach(function (b) { b.addEventListener("click", closeDrawer); });
  if (drawer) {
    drawer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab") trapFocus(e, drawer.querySelector(".drawer__panel"));
    });
    $$(".drawer__row button", drawer).forEach(function (b) {
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!open));
        document.getElementById(b.getAttribute("aria-controls")).hidden = open;
      });
    });
  }
  function trapFocus(e, box) {
    var f = $$("a[href], button:not([disabled]), input, textarea, [tabindex='0']", box).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  window.SBBZ = { trapFocus: trapFocus };

  /* ---------- Barrierefreiheit: Kontrast, Hintergrund, Textgröße ---------- */
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem("sbbz-prefs") || "{}"); } catch (e) {}
  var a11yBtn = $("#a11y-toggle"), a11yPanel = $("#a11y-panel");
  function applyPrefs() {
    if (prefs.theme === "dark") root.dataset.theme = "dark"; else delete root.dataset.theme;
    if (prefs.contrast === "high") root.dataset.contrast = "high"; else delete root.dataset.contrast;
    root.style.setProperty("--text-scale", prefs.text || 1);
    $$("[data-pref]").forEach(function (b) {
      var k = b.dataset.pref, v = b.dataset.value;
      var cur = k === "theme" ? (prefs.theme || "light") : k === "contrast" ? (prefs.contrast || "normal") : String(prefs.text || 1);
      b.setAttribute("aria-pressed", String(cur === v));
    });
    try { localStorage.setItem("sbbz-prefs", JSON.stringify(prefs)); } catch (e) {}
  }
  $$("[data-pref]").forEach(function (b) {
    b.addEventListener("click", function () { prefs[b.dataset.pref] = b.dataset.pref === "text" ? Number(b.dataset.value) : b.dataset.value; applyPrefs(); });
  });
  applyPrefs();
  if (a11yBtn) {
    a11yBtn.addEventListener("click", function () {
      var open = !a11yPanel.hidden;
      a11yPanel.hidden = open; a11yBtn.setAttribute("aria-expanded", String(!open));
      if (!open) a11yPanel.querySelector("button").focus();
    });
    $$("[data-open-a11y]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation(); closeDrawerIfOpen();
        a11yPanel.hidden = false; a11yBtn.setAttribute("aria-expanded", "true");
        a11yPanel.querySelector("button").focus();
      });
    });
    document.addEventListener("click", function (e) { if (!a11yPanel.hidden && !e.target.closest("#a11y-panel, #a11y-toggle, [data-open-a11y]")) { a11yPanel.hidden = true; a11yBtn.setAttribute("aria-expanded", "false"); } });
    a11yPanel.addEventListener("keydown", function (e) { if (e.key === "Escape") { a11yPanel.hidden = true; a11yBtn.setAttribute("aria-expanded", "false"); a11yBtn.focus(); } });
  }

  /* ---------- Suche (clientseitig, ersetzt im Prototyp search_it) ---------- */
  var index = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch("/search-index.json").then(function (r) { return r.json(); }).then(function (d) {
      index = d.map(function (e) { e.n = norm(e.t + " " + e.s + " " + e.x); e.nt = norm(e.t); return e; });
      return index;
    });
  }
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss"); }
  function search(q) {
    var terms = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return [];
    return index.map(function (e) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (e.n.indexOf(t) < 0) return null;
        if (e.nt.indexOf(t) >= 0) score += 10;
        score += Math.min(5, e.n.split(t).length - 1);
      }
      return { e: e, s: score };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).map(function (r) { return r.e; });
  }
  function snippet(e, q) {
    var t = norm(q).split(/\s+/)[0], i = norm(e.x).indexOf(t);
    var start = Math.max(0, i - 60);
    return (start ? "… " : "") + e.x.slice(start, start + 160) + " …";
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var dlg = $("#search-dialog"), input = $("#search-input"), results = $("#search-results");
  function openSearch() {
    closeDrawerIfOpen();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    input.focus(); loadIndex();
  }
  function closeDrawerIfOpen() { if (drawer && drawer.classList.contains("is-open")) closeDrawer(); }
  $$("[data-open-search]").forEach(function (b) { b.addEventListener("click", openSearch); });
  $$("[data-close-search]").forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
  if (dlg) dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName))) { e.preventDefault(); openSearch(); }
  });
  var tmr;
  if (input) input.addEventListener("input", function () {
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      loadIndex().then(function () {
        var q = input.value.trim();
        var r = q.length > 1 ? search(q).slice(0, 8) : [];
        results.innerHTML = r.map(function (e) { return '<li><a href="' + e.u + '"><strong>' + escapeHtml(e.t) + "</strong>" + (e.s ? "<small>" + escapeHtml(e.s) + "</small>" : "") + "</a></li>"; }).join("") ||
          (q.length > 1 ? '<li class="search-hint">Keine Treffer für „' + escapeHtml(q) + '“.</li>' : "");
      });
    }, 120);
  });
  var spr = $("#search-page-results");
  if (spr) {
    var q = new URLSearchParams(location.search).get("search") || "";
    $("#sp-q").value = q;
    if (q) loadIndex().then(function () {
      var r = search(q);
      spr.innerHTML = "<p><strong>" + r.length + "</strong> Treffer für „" + escapeHtml(q) + "“</p>" +
        '<ul class="link-list">' + r.map(function (e) { return '<li><a href="' + e.u + '" style="display:block"><span style="display:block">' + escapeHtml(e.t) + '</span><small style="font-family:var(--font-body);font-weight:400;color:var(--text-muted)">' + escapeHtml(snippet(e, q)) + "</small></a></li>"; }).join("") + "</ul>";
    });
  }

  /* ---------- Hero-Bildwechsel (pausierbar, WCAG 2.2.2) ---------- */
  var slider = $("#hero-slider");
  if (slider) {
    var imgs = $$("img", slider), dots = $$(".slide-dots span", slider), cur = 0, timer = null;
    var toggleBtn = slider.querySelector("[data-slide='toggle']");
    function show(i) {
      imgs[cur].classList.remove("is-active"); imgs[cur].setAttribute("aria-hidden", "true"); dots[cur].classList.remove("is-active");
      cur = (i + imgs.length) % imgs.length;
      imgs[cur].classList.add("is-active"); imgs[cur].removeAttribute("aria-hidden"); dots[cur].classList.add("is-active");
    }
    function play() { stop(); timer = setInterval(function () { show(cur + 1); }, 6500); toggleBtn.setAttribute("aria-label", "Automatischen Bildwechsel pausieren"); toggleBtn.innerHTML = icon("pause"); }
    function stop() { clearInterval(timer); timer = null; toggleBtn.setAttribute("aria-label", "Automatischen Bildwechsel starten"); toggleBtn.innerHTML = icon("play"); }
    slider.querySelector("[data-slide='prev']").addEventListener("click", function () { show(cur - 1); stop(); });
    slider.querySelector("[data-slide='next']").addEventListener("click", function () { show(cur + 1); stop(); });
    toggleBtn.addEventListener("click", function () { timer ? stop() : play(); });
    if (!reduced && imgs.length > 1) play(); else stop();
  }
  function icon(n) {
    var p = { pause: '<path d="M9 5v14M15 5v14"/>', play: '<path d="M7 5v14l12-7z"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', prev: '<path d="m15 6-6 6 6 6"/>', next: '<path d="m9 6 6 6-6 6"/>' }[n];
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + "</svg>";
  }

  /* ---------- Bildungsgang-Filter (wie im Original: Alle / Schulform) ---------- */
  $$(".course-filter").forEach(function (box) {
    var btns = $$("[data-filter]", box), items = $$(".course-grid li", box), status = $(".course-filter__status", box);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.dataset.filter, n = 0;
        btns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        items.forEach(function (li) { var show = v === "0" || li.dataset.type === v; li.hidden = !show; if (show) n++; });
        status.textContent = n + " Bildungsgänge angezeigt";
      });
    });
  });

  /* ---------- Galerie-Lightbox ---------- */
  var galleries = $$(".gallery");
  if (galleries.length) {
    var lb = document.createElement("dialog");
    lb.className = "lightbox"; lb.setAttribute("aria-label", "Bildansicht");
    lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Schließen">' + icon("x") + "</button>" +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Vorheriges Bild">' + icon("prev") + "</button>" +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Nächstes Bild">' + icon("next") + "</button>";
    document.body.appendChild(lb);
    var set = [], idx = 0, lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
    function showLb(i) { idx = (i + set.length) % set.length; var a = set[idx]; lbImg.src = a.href; lbImg.alt = a.querySelector("img").alt; lbCap.textContent = "Bild " + (idx + 1) + " von " + set.length; }
    galleries.forEach(function (g) {
      var links = $$("a.gallery__item", g);
      links.forEach(function (a, i) {
        a.addEventListener("click", function (e) { if (!lb.showModal) return; e.preventDefault(); set = links; showLb(i); lb.showModal(); lb.querySelector(".lightbox__close").focus(); });
      });
    });
    lb.querySelector(".lightbox__close").addEventListener("click", function () { lb.close(); });
    lb.querySelector(".lightbox__prev").addEventListener("click", function () { showLb(idx - 1); });
    lb.querySelector(".lightbox__next").addEventListener("click", function () { showLb(idx + 1); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") showLb(idx - 1); if (e.key === "ArrowRight") showLb(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
  }

  /* ---------- Kontaktformular (Prototyp: clientseitige Prüfung, kein Versand) ---------- */
  var form = $("[data-prototype-form]");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var st = $(".form-status", form), errs = [];
    $$("[required]", form).forEach(function (f) { var bad = f.type === "checkbox" ? !f.checked : !f.value.trim(); f.setAttribute("aria-invalid", String(bad)); if (bad) errs.push(f); });
    var m1 = form.email.value.trim(), m2 = form.email_confirm.value.trim();
    if (m1 && m2 && m1 !== m2) { form.email_confirm.setAttribute("aria-invalid", "true"); errs.push(form.email_confirm); }
    if (errs.length) { st.textContent = "Bitte prüfen Sie die markierten Pflichtfelder" + (m1 !== m2 ? " – die E-Mail-Adressen stimmen nicht überein." : "."); errs[0].focus(); return; }
    st.textContent = "Prototyp: Die Eingaben sind vollständig. Im Live-Betrieb würde die Nachricht jetzt über das bestehende Formular versendet.";
  });

  /* ---------- Einblenden beim Scrollen + Nach-oben ---------- */
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  var tt = $("#to-top");
  if (tt) {
    window.addEventListener("scroll", function () { tt.classList.toggle("is-visible", window.scrollY > 900); }, { passive: true });
    tt.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); $("#inhalt").focus({ preventScroll: true }); });
  }
})();
