# Phase 5 – Qualitätskontrolle

Stand: 03.11.2026 · geprüft gegen den Crawl von sbbz-weimar.de vom selben Tag.

## 1. Vollständigkeit gegenüber dem Original (`npm run check`)

| Prüfung | Ergebnis |
|---|---|
| Alle 199 Originalseiten unter derselben URL vorhanden | ✓ 199 / 199 |
| Jedes Wort des Originaltexts auf der jeweiligen neuen Seite | ✓ alle Seiten (zwei Ausnahmen siehe 3.) |
| Alle 28 PDF-Downloads + Schulvideo verlinkt | ✓ |
| Alle 33 externen Ziele (Moodle, Klassenbuch, NewsPoint, BIBB, Partner …) verlinkt | ✓ |
| Interne Links ohne Ziel | ✓ keine (Ausnahme: die im Original defekte Seite, siehe 3.) |
| URLs unverändert (keine Weiterleitungen nötig) | ✓ |

## 2. Funktionen

| Funktion im Original | Im Redesign | Getestet |
|---|---|---|
| Hauptnavigation, 3 Ebenen | Mega-Menü (Desktop), Drawer (mobil), Bereichsnavigation auf Unterseiten | ✓ Maus, Tastatur |
| Breadcrumb | im Seitenkopf | ✓ |
| Suche (`search_it`) | Dialog mit Live-Treffern (`/` oder Strg+K) + Ergebnisseite `/de/suchergebnisse/` | ✓ |
| Kontaktformular (yform) | gleiche Felder, Pflichtfeld- und E-Mail-Abgleich; im Prototyp **ohne Versand** | ✓ |
| Barrierefreiheits-Menü (Kontrast, dunkler Hintergrund, Textgröße) | gleiche drei Optionen, gespeichert pro Browser | ✓ |
| Sprunglinks | Inhalt, Navigation, Assistent | ✓ |
| E-Mail-Spamschutz | gleiche ROT13-Verschleierung, Klartext erst im Browser | ✓ |
| Bildergalerien (PhotoSwipe) | eigene Lightbox (Pfeiltasten, Esc) | ✓ |
| Bild-Slider | pausierbar, startet nicht bei reduzierter Bewegung | ✓ |
| Bildungsgang-Filter | gleiche Filter, Statusansage für Screenreader | ✓ |
| Schulvideo | natives `<video>`, kein Autoplay | ✓ |
| Sprachumschalter DE/EN | ✓ (EN-Inhalte leer wie im Original) | ✓ |
| **neu:** Schul-Assistent | Demo-Modus und KI-Modus | ✓ (KI-Modus gegen einen Test-Endpunkt: Modell, Fallback, Quellen, Entfernen personenbezogener Daten, Ratenbegrenzung, Origin-Prüfung, Größenlimit) |

## 3. Abweichungen, die eine Entscheidung der Schule brauchen

1. **`/de/aktivitaeten/2025/adventssingen/`** liefert auf der Live-Site HTTP 500. Der Inhalt ließ sich nicht auslesen. Die Seite ist als „Inhalt nicht übernommen“ gekennzeichnet → **Originaltext und Bilder bitte nachliefern.**
2. **Überreste einer Browser-Erweiterung im CMS-Inhalt:** Auf `/de/wir-ueber-uns/ansprechpartner/schuelervertretung/` und `/de/service/vertretungsplaene/` stecken Overlays der Firefox-Erweiterung „Simple Translate“ (mit den Texten „Uwt22-Aw“ bzw. „NewsPoint-Mobile“). Sie wurden beim Einpflegen versehentlich mitkopiert und **entfernt**. Bitte bestätigen. Falls „Uwt22-Aw“ die Klasse eines Schülersprechers ist, ergänzen wir sie.
3. **Defekter Link im Original:** `/index.php?article_id=81` auf „Mittelanforderung für Erasmus+ bewilligt“ führt auch live zu 404. Er bleibt unverändert und zeigt auf das Original.
4. **Zwei E-Mail-Domains:** Im Widerrufshinweis des Kontaktformulars steht `info@bbz-weimar.de`, sonst überall `info@sbbz-weimar.de`. Übernommen wie im Original, bitte prüfen.
5. **Englische Version:** 29 Seiten ohne Inhalt, Struktur unverändert übernommen.

## 4. Barrierefreiheit (Ziel: WCAG 2.2 AA / BITV 2.0)

| Test | Ergebnis |
|---|---|
| axe-core 4.10 (WCAG 2.0/2.1/2.2 A+AA), ⅓ aller Seiten mobil + ¼ desktop, mit reduzierter Bewegung | ✓ **0 Verstöße** |
| Reflow (WCAG 1.4.10): kein horizontales Scrollen bei 320 px und 390 px Breite, **alle 199 Seiten** | ✓ |
| Kontraste aller Text-Farbpaare | ✓ ≥ 4.8 : 1 (siehe DESIGNSYSTEM.md) |
| Tastatur: Tab-Reihenfolge, Mega-Menü (Enter/↓/Esc), Drawer mit Fokusfalle, Assistent (Öffnen, Starten, Senden, Esc → Fokus zurück), Suche (`/`) | ✓ |
| Sichtbarer Fokus (3 px, eigene Fokusfarbe je Modus) | ✓ |
| Zielgrößen ≥ 44 px | ✓ |
| `prefers-reduced-motion` | ✓ keine Animationen, Slider steht |
| Semantik: Landmarks, eine H1 pro Seite, `aria-current`, `<details>`-Akkordeons, Live-Regionen für Suche, Filter und Chat | ✓ |
| Links, die nur ein Bild ohne Alternativtext enthalten (aus dem Original), bekommen automatisch einen zugänglichen Namen | ✓ |

**Nicht automatisiert prüfbar:** Viele Originalbilder haben leere oder technische Alternativtexte (z. B. „image0“, „sportmix3“). Die Texte wurden nicht erfunden. Die Redaktion sollte aussagekräftige Alt-Texte im Medienpool nachtragen. Ein Test mit echten Screenreadern (NVDA, VoiceOver) steht vor dem Livegang noch aus.

## 5. Geräte

Gerendert und geprüft in Chromium bei 320, 390 (Smartphone), 1280 (Laptop) und 1440 px (Desktop). Tablet-Breiten (768–1179 px) nutzen den Drawer und eine einspaltige Bereichsnavigation. Ein Test auf echten iOS- und Android-Geräten steht noch aus.

## 6. Performance

- Startseite: 51 KB HTML, 54 KB CSS, 30 KB JS (unkomprimiert, ohne Framework), 2 vorgeladene Schriftdateien. Keine Drittanbieter-Skripte, kein Tracking.
- Bilder werden lazy geladen, das Hero-Bild mit `fetchpriority="high"`. Responsive `srcset` gibt es dort, wo das Original Bildgrößen-Varianten hat (Slider, Seitenköpfe).
- Assets im Server mit `Cache-Control: immutable`, CSS/JS mit Build-Version.
