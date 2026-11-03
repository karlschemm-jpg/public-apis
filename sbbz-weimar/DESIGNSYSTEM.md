# Designsystem SBBZ Weimar 2026

Leitidee: **„Navy & Lime“**. Die Navy- und Grüntöne aus dem Logo werden ruhiger und editorialer eingesetzt. Ein wiederkehrendes Element ist die **grüne „Schiene“**, ein Balken in Anlehnung an die Logoform: in Kickern, am Rand der Seitenköpfe und im Hero. Alle Tokens stehen in `src/assets/css/site.css` unter `:root`.

## Farben

| Token | Wert | Herkunft | Einsatz | Kontrast auf Weiß |
|---|---|---|---|---|
| `--navy` | `#212E58` | Original `--blau` | Überschriften, Primär-Buttons, Seitenköpfe | 13.2 : 1 |
| `--navy-900` | `#141D3B` | abgeleitet | Footer, Text auf Lime | – |
| `--navy-100` | `#DFE3F1` | Original `--mattblau` | Flächen | – |
| `--lime` | `#A4D803` | Original `--hellgruen` | **nur Flächen** und Akzente auf Navy | 1.8 : 1 (kein Text!) |
| `--lime-600` | `#83AE02` | Original `--gruen` | Linien, Aktiv-Markierungen | 2.6 : 1 (kein Text!) |
| `--lime-text` | `#4F6A00` | abgeleitet | grüner Text (Kicker, Datum) | 6.2 : 1 ✓ |
| `--text` | `#1B2240` | – | Fließtext | 15 : 1 ✓ |
| `--text-muted` | `#4A5170` | – | Sekundärtext | 7.8 : 1 ✓ |
| `--bg` | `#FBFBF8` | – | warmes Papierweiß statt reinem Weiß | – |

Die Schnellzugriffs-Kacheln übernehmen die Farben der Original-Kacheln (Grün, Orange, Hellblau, Dunkelgrün), aber so abgedunkelt, dass weiße Icons darauf ausreichend Kontrast haben.

**Modi:** `data-theme="dark"` („dunkler Hintergrund“) und `data-contrast="high"` („hoher Kontrast“) entsprechen den Optionen im Barrierefreiheits-Menü des Originals. Sie werden pro Browser gespeichert.

## Typografie

| Rolle | Schrift | Hinweis |
|---|---|---|
| Überschriften, Navigation, Buttons | **Kanit** 500/600 | Hausschrift des bestehenden Auftritts |
| Fließtext | **Atkinson Hyperlegible** 400/700 | für Leseschwäche und Sehbeeinträchtigung entwickelt |

Beide Schriften liegen lokal im Projekt (SIL OFL), es gibt keine Verbindung zu Google Fonts (DSGVO). Die Schriftgrößen skalieren fließend (`--step--1` … `--step-4`, `clamp()`), der Fließtext ist 17–18 px groß und hat eine Zeilenhöhe von 1.65. Die Zeilenlänge ist auf 70 Zeichen begrenzt. Die Textgröße lässt sich über `--text-scale` (kleiner/normal/größer) und den Browser-Zoom anpassen.

## Abstände, Radien, Schatten

- Abstände: `--space-1` (4 px) bis `--space-9` (104 px), Sektionen nutzen `--space-8`.
- Radien: 8 / 14 / 22 px, Buttons als Pille.
- Schatten: drei Stufen, Hover hebt Karten um 3–4 px an.
- Inhaltsbreite: 1240 px. Seitenabstand 16 px (mobil) bzw. 32 px.

## Komponenten

| Komponente | Klasse | Hinweis |
|---|---|---|
| Header (sticky, Glas-Effekt) | `.site-header` | Mega-Menü ab 1180 px, darunter Drawer |
| Mega-Menü | `.mega` | alle Ebenen der Navigation sichtbar, Tastatur (↓, Esc) |
| Mobiles Menü | `.drawer` | eigenständig: aufklappbare Ebenen, Fokusfalle, Assistent und Suche unten |
| Seitenkopf | `.page-hero` | Originalbild der Seite, abgedunkelt, Breadcrumb, H1, grüne Schiene |
| Bereichsnavigation | `.subnav` | Desktop sticky links, mobil als aufklappbares Element |
| Karten | `.news-card`, `.course-card`, `.event`, `.person`, `.quick__item` | ganze Karte klickbar, Fokus auf der Karte sichtbar |
| Akkordeon | `details.accordion` | natives `<details>`, ohne JavaScript bedienbar |
| Downloads | `a.doc-link` | PDF-Badge |
| Tabellen | `.table-wrap` | horizontal scrollbar, per Tastatur fokussierbar |
| Galerie + Lightbox | `.gallery`, `dialog.lightbox` | Pfeiltasten, Esc |
| Assistent | `.assistant__*` | siehe README |

## Bewegung

Einblenden beim Scrollen (18 px, 0.8 s), Hover-Anhebung und Bild-Zoom auf Karten, Überblendung im Hero-Slider. Der Slider lässt sich pausieren (WCAG 2.2.2). Bei `prefers-reduced-motion: reduce` sind alle Animationen aus und der Slider startet nicht automatisch.

## Responsive Regeln

| Breite | Verhalten |
|---|---|
| < 420 px | Darstellung und Sprache wandern ins Menü |
| < 480 px | Header nur mit Icons, Schnellzugriffe 2-spaltig, Assistent im Vollbild |
| < 900 px | einspaltige Karten, Termine untereinander |
| < 1000 px | Bereichsnavigation über dem Inhalt (aufklappbar) |
| < 1180 px | Drawer statt Mega-Menü |
| ≥ 1640 px | zusätzlich Schulname neben dem Logo |

Alle Bedienelemente sind mindestens 44 × 44 px groß (WCAG 2.5.8).
