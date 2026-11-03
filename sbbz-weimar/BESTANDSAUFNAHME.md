# Phase 1 – Bestandsaufnahme sbbz-weimar.de

Stand: 03.11.2026 · Methode: automatischer Crawl aller intern verlinkten Seiten (DE + EN) plus manuelle Auswertung von Startseite, Navigation, CSS und Formularen. Rohdaten aller Texte: `crawl.json`.

## 1. Kennzahlen

| | |
|---|---|
| Erreichbare HTML-Seiten | **199** (≈ 170 DE, 29 EN) |
| Aktivitäten-Beiträge | 2024: 19 · 2025: 22 · 2026: 30 |
| Downloads | 28 PDFs + 1 Schulvideo (MP4) |
| Bilddateien | ≈ 840 (inkl. CMS-Bildgrößen-Varianten) |
| Externe Ziele | 33 (Moodle, cevex-Klassenbuch, NewsPoint-Vertretungsplan, BIBB, Partner …) |
| Fehlerhafte Seiten | `/de/aktivitaeten/2025/adventssingen/` → **HTTP 500** (bereits auf der Live-Site defekt) |

## 2. Technisches System

- **CMS: REDAXO** (erkennbar an `rex_media_type`, `rex-navi`, AddOns `search_it`, `yform`, `emailobfuscator`).
- Frontend: jQuery 3.6, GSAP + ScrollSmoother, Lenis, Splide (Slider), PhotoSwipe (Galerien).
- Webdesign/Programmierung laut Impressum: mediadee Nürnberger und Boehmer GbR.
- Mehrsprachigkeit: DE vollständig; **EN-Baum existiert, enthält aber nur Seitentitel ohne Inhalt** (Platzhalter).

**Konsequenz:** Die Inhalte werden im REDAXO-Backend gepflegt. Ein Wechsel auf Next.js würde die Pflegeprozesse der Schule ersetzen – das darf laut Briefing nicht ohne Begründung und Freigabe passieren (siehe Abschnitt 8).

## 3. Markenidentität (aus dem Live-CSS)

| Token | Wert | Verwendung |
|---|---|---|
| `--blau` | `#212E58` | Primärfarbe, Navy |
| `--mattblau` | `#DFE3F1` / `#414B6F` | Flächen, theme-color |
| `--gruen` | `#83AE02` | Akzent |
| `--hellgruen` | `#A4D803` | Akzent hell |
| `--dunkelgruen` | `#6A8C01` | Akzent dunkel, Tabellenköpfe |
| `--mattgruen` | `#E1F3AA` | Hinterlegungen |
| Schriften | Kanit, Orbitron | Headlines/Fließtext |
| Logo | `/layout/images/Logo-SBBZ-Weimar.svg` | bleibt unverändert |

Claim: „Staatliches Berufsbildungszentrum Weimar – Kompetenzzentrum für Gesundheit, Soziales und Technik – Europaschule“.

## 4. Navigation (vollständig)

- **Start**
- **Wir über uns**
  - Ansprechpartner → Schulleitung und Abteilungsleitung · Sekretariat und Schülerverwaltung · Kollegium · Vertrauenslehrer · Beratungslehrer · Pro Schulwohl · Gesundheitsbeauftragter · Schulsozialarbeit · Lehrerausbildung · Schulförderverein · Schülervertretung · Personalrat · Hausmeister · Homepage
  - Schulentwicklung → Unser Leitbild · Schulentwicklungssäulen · Erasmus +
  - Unterstützer
  - Medien → Schulvideo · Schulbroschüre
  - Aktivitäten (Archiv 2024 / 2025 / 2026)
  - Kontakt
- **Berufliche Bildung**
  - Berufsschule → Anlagenmechaniker · Umwelttechnologen · KfZ-Mechatroniker · Straßenbauer · Stuckateur · Trockenbaumonteur · Tiefbaufacharbeiter · Zahntechniker
  - Berufsfachschule → Kinderpflege · Gesundheit und Soziales (ein- und zweijährig)
  - Höhere Berufsfachschule → Pflege · Operationstechnischer Assistent · Sozialassistent
  - Fachschule → Erzieher · Erzieher (berufsbegleitend) · Heilerziehungspflege · Heilpädagogik (berufsbegleitend)
  - Alle beruflichen Bildungsgänge
- **Schulische Bildung**
  - Sprachliche Vorbereitung → Vorklasse · BVJ-Sprache
  - Hauptschulabschluss → Berufsvorbereitungsjahr Technik
  - Realschulabschluss → Berufsfachschule Gesundheit und Soziales
  - Fachhochschulreife → Erzieher · Heilerziehungspflege
  - Alle schulischen Bildungsgänge
- **Service**
  - Vertretungspläne · Klassenpläne · Turnuspläne · Nachschreibetermine · Unterrichtszeiten · Anmeldung/Fristen (Gesundheit, Technik) · Termine · Belehrungen · iPad-Klassen · Bibliothek · Bistro · Wohnheim · Moodle-Schulcloud (extern) · Klassenbuch (extern, cevex)
- **Footer:** Kontakt · Impressum · Datenschutz · Sitemap · Gender-Hinweis
- **Sprachumschalter** DE/EN

## 5. Startseite – vorhandene Bausteine

1. Header mit Logo + H1-Claim, Hauptnavigation, Suche
2. Bild-Slider (3 Originalfotos der Schule: Außenansicht)
3. Schnellzugriff-Kacheln: Moodle-Schulcloud · Erasmus + · iPad-Klassen
4. Aktivitäten: die 4 neuesten Beiträge (Datum, Titel, Teaser, Bild) + „weitere Aktivitäten anzeigen“
5. Termine: Ferien im Schuljahr 2026/27, aktuelle Prüfungspläne, Tag der offenen Tür (13.02.2027, 9–12 Uhr), Abend der Berufe (14.09.2027, 15–19 Uhr, weimarhalle)
6. Schulvideo „Ausbildungen am SBBZ Weimar“ (MP4)
7. Partner-/Siegel-Logos: Europaschule Thüringen, EU-Erasmus, CERTQUA/AZAV, FobiZ-Schule 2025/26, Praxissemesterschule
8. „Unser Förderverein dankt seinen Unterstützern“: Marienhof Erfurt, Saalezahn Dentaltechnik, Ruben Peters Ausbau
9. Footer

## 6. Funktionen, die erhalten bleiben müssen

| Funktion | Umsetzung heute |
|---|---|
| Volltextsuche | REDAXO `search_it`, `/de/suchergebnisse/?search=…` mit Suggest |
| Kontaktformular | REDAXO `yform`: Name, E-Mail (2×, Bestätigung), Nachricht, Datenschutz-Checkbox |
| Barrierefreiheits-Menü | hoher Kontrast · dunkler Hintergrund · Text kleiner/normal/größer |
| Sprunglinks | zum Inhalt, zur Navigation, zum Mobilmenü |
| E-Mail-Verschleierung | `emailobfuscator` (`_at_`) |
| Bildgalerien | PhotoSwipe mit Bildunterschriften (Aktivitäten) |
| Vertretungsplan | externe PDFs via NewsPoint (heute / nächster Tag) + App-Hinweis (ID 102229) |
| Bildungsgang-Seiten | einheitliche Gliederung: Zugangsvoraussetzungen, Berufsziel, Einsatzbereiche, Ausbildungsverlauf, Finanzierung, BIBB-Link, Bewerbung |
| Unterstützer-Logos | auf jeder Seite unterhalb des Inhalts |

## 7. Auffälligkeiten / offene Punkte (nichts davon wird eigenmächtig geändert)

1. **HTTP 500** auf `/de/aktivitaeten/2025/adventssingen/` – Inhalt nicht auslesbar → Originaldaten benötigt.
2. **EN-Version leer** (29 Seiten nur mit Titel). Übernehmen wie sie ist, ausblenden oder später befüllen?
3. Doppelte Inhalte durch Kategorie/Startartikel (z. B. `/de/service/klassenplaene/` = `/de/service/klassenplaene/klassenplaene/`, `/de/wir-ueber-uns/` = Schulleitung). Bleibt 1:1, wird in der Navigation nur sauberer dargestellt.
4. Zwei verschiedene Mailadressen im Kontaktbereich: `info@sbbz-weimar.de` und im Widerrufshinweis `info@bbz-weimar.de` – bitte prüfen (wird nicht ohne Freigabe korrigiert).
5. Fokusfarbe ist aktuell `red`, grüne Akzente (`#83AE02` auf Weiß ≈ 2,6 : 1) erfüllen **nicht** WCAG AA für Text → im neuen Designsystem nur als Fläche/Deko, für Text Navy bzw. `#4F6A00`.
6. Bildnachweis nennt pixabay → im Redesign nur Originalfotos der Schule prominent einsetzen.
7. Kollegium-Seite enthält Namen von Lehrkräften – für den KI-Assistenten als „nicht indexieren“ vorschlagen (nur Funktionsstellen wie Sekretariat).

## 8. Empfehlung zur technischen Umsetzung

**Option A – Neues REDAXO-Theme (empfohlen).** Neues Template, neue Module-Ausgaben und neues CSS/JS innerhalb des bestehenden REDAXO. Alle Inhalte, URLs, Suche, yform-Formular und Redaktionsabläufe bleiben unverändert; der KI-Assistent kommt als eigenständiges Widget + kleiner serverseitiger Proxy (PHP-AddOn oder separater Endpunkt). Voraussetzung: Zugang zum REDAXO-Backend bzw. Export von Templates/Modulen.

**Option B – Statischer Prototyp ohne Backend-Zugang.** Ich baue das komplette Designsystem und alle Seitentypen als funktionsfähigen HTML/CSS/JS-Prototyp, befüllt mit den gecrawlten Originalinhalten, inkl. KI-Widget (RAG über die gecrawlten Texte). Der Prototyp dient als Abnahme-Grundlage und wird danach in REDAXO-Templates überführt.

**Option C – Headless/Next.js.** Nur sinnvoll, wenn die Schule ohnehin das CMS wechseln will; höchster Aufwand, Pflegeprozesse ändern sich. Nicht empfohlen.

## 9. KI-Assistent – Architekturvorschlag

- Wissensbasis: ausschließlich freigegebene Seiten (Crawl → Chunks → Embeddings), Quellen-URLs pro Chunk; Personenlisten ausgenommen.
- Serverseitiger Endpunkt (API-Schlüssel nie im Browser), Rate-Limit pro IP, keine Speicherung von Chatverläufen, keine Logs mit Inhalten.
- Antwort nur aus gefundenen Quellen, mit Links; sonst „Dazu habe ich keine gesicherte Information – bitte Sekretariat kontaktieren“.
- Aktivierung erst nach Klick (Einwilligungshinweis im Widget), Datenschutzerklärung muss um einen KI-Abschnitt ergänzt werden (Text von der Schule/dem DSB freizugeben).
- Ohne API-Zugang: Widget läuft im klar gekennzeichneten **Demo-Modus** (reine Stichwortsuche über die Website-Inhalte, keine generative KI).

## Anhang A – Alle erfassten Seiten (Pfad · Titel · Textumfang)


### `/` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/` | Start | 2361 | 14 |

### `/de/aktivitaeten` (75 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/aktivitaeten/` | Aktivitäten | 17051 | 82 |
| `/de/aktivitaeten/2024/` | 2024 | 2199 | 29 |
| `/de/aktivitaeten/2024/achterbahn-drunter-und-drueber-wettbewerb-der-ingenieurkammer-thueringen/` | "Achterbahn – drunter und drüber" - Wettbewerb der Ingenieurkammer Thüringen | 1322 | 13 |
| `/de/aktivitaeten/2024/bemuehen-um-erasmus-akkreditierung/` | Bemühen um Erasmus+ Akkreditierung | 1779 | 11 |
| `/de/aktivitaeten/2024/besichtigung-des-neubaus-der-spektakulaeren-saalebruecke-bei-bad-koesen/` | Besichtigung des Neubaus der spektakulären Saalebrücke bei Bad Kösen | 1286 | 19 |
| `/de/aktivitaeten/2024/besuch-der-klasse-e23-1-im-thueringer-landtag-am-6-august-2024/` | Besuch der Klasse E23-1 im Thüringer Landtag am 6. August 2024 | 1782 | 12 |
| `/de/aktivitaeten/2024/eine-reise-in-duestere-zeiten/` | Eine Reise in düstere Zeiten | 4565 | 13 |
| `/de/aktivitaeten/2024/eine-wunderbare-mittagspause-unser-erster-grill-tag-am-sbbz-weimar/` | Eine wunderbare Mittagspause - unser erster Grill-Tag am SBBZ Weimar | 532 | 11 |
| `/de/aktivitaeten/2024/einmal-unter-der-autobahn-a4-naehe-hermsdorfer-kreuz-durch/` | Einmal unter der Autobahn A4 Nähe Hermsdorfer Kreuz durch … | 1983 | 16 |
| `/de/aktivitaeten/2024/erste-mobilitaeten-in-den-sommerferien/` | Erste Mobilitäten in den Sommerferien | 1976 | 13 |
| `/de/aktivitaeten/2024/exkursion-der-ota-22-zum-141-dck-2024-in-leipzig/` | Exkursion der OTA 22 zum 141. DCK 2024 in Leipzig  | 4722 | 11 |
| `/de/aktivitaeten/2024/faszinierende-einblicke-durch-die-deutsche-gesellschaft-fuer-gewebetransplantation/` | Faszinierende Einblicke durch die Deutsche Gesellschaft für Gewebetransplantation | 878 | 11 |
| `/de/aktivitaeten/2024/jeder-hinterlaesst-spuren/` | Jeder hinterlässt Spuren! | 952 | 12 |
| `/de/aktivitaeten/2024/kampfrichtereinsatz-unserer-schueler-bei-den-weimarer-grundschulspielen/` | Kampfrichtereinsatz unserer Schüler bei den Weimarer Grundschulspielen | 1697 | 12 |
| `/de/aktivitaeten/2024/klasse-e23-3-besucht-radio-lotte-fuer-medienprojekt-zur-landtagswahl/` | Klasse E23-3 besucht Radio Lotte für Medienprojekt zur Landtagswahl | 1575 | 11 |
| `/de/aktivitaeten/2024/mittelanforderung-fuer-erasmus-bewilligt/` | Mittelanforderung für Erasmus+ bewilligt | 678 | 11 |
| `/de/aktivitaeten/2024/staatssekretaer-speithkamp-fuehrt-lebhafte-diskussion-ueber-europa-am-sbbz-weimar/` | Staatssekretär Speithkamp führt lebhafte Diskussion über Europa am SBBZ Weimar | 2393 | 19 |
| `/de/aktivitaeten/2024/tag-der-offenen-tuer-am-samstag-03022024/` | Tag der offenen Tür, am Samstag, 03.02.2024 | 1892 | 10 |
| `/de/aktivitaeten/2024/uebergabe-des-beeren-park-im-wohngebiet-weimar-nord/` | Übergabe des Beeren-Park im Wohngebiet Weimar-Nord | 1070 | 13 |
| `/de/aktivitaeten/2024/vom-extremismus-zur-aufklaerung-axel-reitz-eindringlicher-bericht-am-sbbz/` | Vom Extremismus zur Aufklärung: Axel Reitz' eindringlicher Bericht am SBBZ | 2146 | 12 |
| `/de/aktivitaeten/2024/wir-suchen-dich-schuelerband-am-sbbz-weimar/` | Wir suchen Dich! - Schülerband am SBBZ Weimar | 430 | 11 |
| `/de/aktivitaeten/2025/` | 2025 | 6600 | 35 |
| `/de/aktivitaeten/2025/besuch-der-firma-ospelt-food-est-am-sbbz-weimar/` | Besuch der Firma Ospelt Food Est. am SBBZ Weimar | 1628 | 15 |
| `/de/aktivitaeten/2025/casino-nachmittag-im-azurit-seniorenzentrum/` | Casino-Nachmittag im Azurit Seniorenzentrum | 748 | 10 |
| `/de/aktivitaeten/2025/cleanup-day-2025/` | CleanUp Day 2025 | 994 | 11 |
| `/de/aktivitaeten/2025/erlebnispaedagogische-woche/` | Erlebnispädagogische Woche | 1953 | 19 |
| `/de/aktivitaeten/2025/exkursion-zum-ankerwerk-in-rudolstadt/` | Exkursion zum Ankerwerk in Rudolstadt | 1185 | 17 |
| `/de/aktivitaeten/2025/gesundheitstag-der-erzieherklasse-e24-1-und-e24-2/` | Gesundheitstag der Erzieherklasse E24-1 und E24-2 | 1115 | 12 |
| `/de/aktivitaeten/2025/halloween-ein-projekt-der-erzieher-innen-in-der-grundschule-buttstaedt/` | Halloween - Ein Projekt der Erzieher/innen in der Grundschule Buttstädt   | 1031 | 13 |
| `/de/aktivitaeten/2025/inklusion-herausforderungen-fuer-die-heilpaedagogik-barrierefreies-weimar/` | Inklusion – Herausforderungen für die Heilpädagogik – Barrierefreies Weimar | 2847 | 11 |
| `/de/aktivitaeten/2025/jmb-ontour-next-stop-sbbz-weimar/` | JMB on.tour - Next Stop – SBBZ WEIMAR | 1846 | 17 |
| `/de/aktivitaeten/2025/knochenzement-wissen-das-haelt/` | Knochenzement: Wissen, das hält. | 1941 | 18 |
| `/de/aktivitaeten/2025/midsommar-nacht-am-sbbz-eine-schuluebernachtung-die-in-erinnerung-bleibt/` | Midsommar-Nacht am SBBZ – Eine Schulübernachtung, die in Erinnerung bleibt  | 1654 | 15 |
| `/de/aktivitaeten/2025/preisuebergabe-bestenwettbewerb-berlin/` | Preisübergabe Bestenwettbewerb Berlin | 1771 | 15 |
| `/de/aktivitaeten/2025/projekttag-tag-des-sehens-ein-besonderer-lerntag-der-klasse-e23-3/` | Projekttag „Tag des Sehens“ – Ein besonderer Lerntag der Klasse E23-3 | 1589 | 16 |
| `/de/aktivitaeten/2025/schuelerbesuch-des-mellinger-gymnasiums/` | Schülerbesuch des Mellinger Gymnasiums | 1454 | 15 |
| `/de/aktivitaeten/2025/spannender-vortrag-zum-thema-gewebespende/` | Spannender Vortrag zum Thema Gewebespende | 1035 | 11 |
| `/de/aktivitaeten/2025/sportmix-2025-gemeinsam-aktiv-in-weimar/` | Sportmix 2025 – Gemeinsam aktiv in Weimar | 1673 | 12 |
| `/de/aktivitaeten/2025/unsere-reise-mit-erasmus/` | Unsere Reise mit ERASMUS | 1562 | 15 |
| `/de/aktivitaeten/2025/verleihung-des-titels-europaschule/` | Verleihung des Titels EUROPASCHULE | 2667 | 22 |
| `/de/aktivitaeten/2025/was-hats-denn-mit-den-gelben-tonnen-auf-sich/` | Was hat`s denn mit den gelben Tonnen auf sich? | 1580 | 11 |
| `/de/aktivitaeten/2025/weihnachtliches-projekt-der-heilerziehungspflegerinnen-im-2-ausbildungsjahr-am-sbbz-weimar/` | Weihnachtliches Projekt der Heilerziehungspflegerinnen im 2. Ausbildungsjahr am SBBZ Weimar | 1150 | 15 |
| `/de/aktivitaeten/2025/wer-wird-deutschlands-beliebtester-pflegeprofi/` | Wer wird Deutschlands beliebtester Pflegeprofi? | 703 | 11 |
| `/de/aktivitaeten/2025/wir-sind-beste-ausbildungsschule-im-beruf-trockenbaumonteur/` | Wir sind „Beste Ausbildungsschule im Beruf Trockenbaumonteur“ | 890 | 11 |
| `/de/aktivitaeten/2025/zu-besuch-im-seniorenheim-azurit-in-tannroda/` | Zu Besuch im Seniorenheim Azurit in Tannroda | 1102 | 13 |
| `/de/aktivitaeten/2025/zweifelderball-turnier/` | Zweifelderball-Turnier | 659 | 12 |
| `/de/aktivitaeten/2026/` | 2026 | 181 | 10 |
| `/de/aktivitaeten/2026/ausschreibung-zum-thueringer-schulbudget-im-schuljahr-2025-2026/` | Ausschreibung zum Thüringer Schulbudget im Schuljahr 2025/2026 | 1259 | 10 |
| `/de/aktivitaeten/2026/besuch-der-berufsmesse-erfurt/` | Besuch der Berufsmesse Erfurt | 664 | 14 |
| `/de/aktivitaeten/2026/besuch-der-zahntechnik-plus-in-leipzig/` | Besuch der Zahntechnik Plus in Leipzig | 2105 | 19 |
| `/de/aktivitaeten/2026/besuch-unserer-partnerschule-fuer-kfz-technik-in-murcia-spanien/` | Besuch unserer Partnerschule für Kfz-Technik in Murcia, Spanien | 1081 | 14 |
| `/de/aktivitaeten/2026/bildungsreise-nach-paris/` | Bildungsreise nach Paris | 1547 | 11 |
| `/de/aktivitaeten/2026/build-it-circular/` | „Build it circular!“  | 1758 | 14 |
| `/de/aktivitaeten/2026/ein-besonderer-abschied-zeugnisuebergabe-der-ota-23/` | Ein besonderer Abschied – Zeugnisübergabe der OtA 23 | 2111 | 24 |
| `/de/aktivitaeten/2026/ein-sandarium-fuer-bienen/` | Ein Sandarium für Bienen | 751 | 17 |
| `/de/aktivitaeten/2026/ein-tag-voller-natur-teamgeist-und-erlebnispaedagogik/` | Ein Tag voller Natur, Teamgeist und Erlebnispädagogik | 1218 | 14 |
| `/de/aktivitaeten/2026/entrepreneure-challange/` | Entrepreneure - Challange | 1090 | 10 |
| `/de/aktivitaeten/2026/erasmus-aufenthalt-auf-teneriffa/` | Erasmus-Aufenthalt auf Teneriffa | 2474 | 16 |
| `/de/aktivitaeten/2026/erlebnispaedagogik/` | Erlebnispädagogik | 566 | 26 |
| `/de/aktivitaeten/2026/exkursion-der-vorklasse-zur-deutschen-tafel-in-weimar/` | Exkursion der Vorklasse zur deutschen Tafel in Weimar  | 1038 | 11 |
| `/de/aktivitaeten/2026/fitnessstudio-exkursion/` | Fitnessstudio Exkursion | 642 | 15 |
| `/de/aktivitaeten/2026/franzoesiche-berufsschueler-zu-gast-an-unserer-schule/` | Französiche Berufsschüler zu Gast an unserer Schule | 2430 | 15 |
| `/de/aktivitaeten/2026/hello-spring-fruehlingsgefuehle-am-sbbz/` | Hello Spring – Frühlingsgefühle am SBBZ | 1347 | 14 |
| `/de/aktivitaeten/2026/impressionen-vom-europatag-an-unserem-sbbz/` | Impressionen vom Europatag an unserem SBBZ | 224 | 32 |
| `/de/aktivitaeten/2026/markt-der-moeglichkeiten-ein-erfolgreiches-konzept/` | Markt der Möglichkeiten – ein erfolgreiches Konzept | 1068 | 15 |
| `/de/aktivitaeten/2026/modulabschluss-kinder-und-jugendarbeit/` | Modulabschluss Kinder- und Jugendarbeit | 221 | 10 |
| `/de/aktivitaeten/2026/ohne-lehrerinnen-laeufts-nicht-sbbz-weimar-beim-unternehmenslauf/` | „Ohne Lehrer:innen läufts nicht“  SBBZ Weimar beim Unternehmenslauf | 1063 | 11 |
| `/de/aktivitaeten/2026/podiumsdiskussion-klimaschutz-und-demokratie/` | Podiumsdiskussion Klimaschutz und Demokratie | 740 | 11 |
| `/de/aktivitaeten/2026/projekttag-zahngesundheit-an-der-albert-schweitzer-grundschule-ein-unvergesslicher-tag-fuer-gross-und-klein/` | Projekttag Zahngesundheit an der Albert-Schweitzer-Grundschule – ein unvergesslicher Tag für Groß und Klein | 2052 | 11 |
| `/de/aktivitaeten/2026/sbbz-weimar-stellt-sich-auf-berufsmesse-in-buttelstedt-vor/` | SBBZ Weimar stellt sich auf Berufsmesse in Buttelstedt vor | 1333 | 11 |
| `/de/aktivitaeten/2026/spendenlauf-helauf-lauf-der-narren-2026/` | Spendenlauf „Helauf – Lauf der Narren“ 2026 | 791 | 13 |
| `/de/aktivitaeten/2026/sportmix-2026/` | Sportmix 2026 | 1345 | 15 |
| `/de/aktivitaeten/2026/stadtradeln-2026/` | Stadtradeln 2026 | 1099 | 12 |
| `/de/aktivitaeten/2026/tag-der-berufe-an-der-jenaplanschule-weimar/` | Tag der Berufe an der Jenaplanschule Weimar | 1285 | 11 |
| `/de/aktivitaeten/2026/theorie-trifft-praxis/` | Theorie trifft Praxis | 1583 | 15 |

### `/de/berufliche-bildung` (23 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/berufliche-bildung/` | Berufliche Bildung | 666 | 27 |
| `/de/berufliche-bildung/alle-beruflichen-bildungsgaenge/` | Berufliche Bildung | 666 | 27 |
| `/de/berufliche-bildung/berufsfachschule/` | Berufsfachschule | 316 | 12 |
| `/de/berufliche-bildung/berufsfachschule/gesundheit-und-soziales-ein-und-zweijaehrig/` | ein- und zweijährige Berufsfachschule, Gesundheit und Soziales | 1899 | 11 |
| `/de/berufliche-bildung/berufsfachschule/kinderpflege/` | Kinderpflege | 1948 | 11 |
| `/de/berufliche-bildung/berufsschule/` | Berufsschule | 362 | 18 |
| `/de/berufliche-bildung/berufsschule/anlagenmechaniker/` | Anlagenmechaniker | 1606 | 9 |
| `/de/berufliche-bildung/berufsschule/kfz-mechatroniker/` | KfZ-Mechatroniker | 1504 | 9 |
| `/de/berufliche-bildung/berufsschule/strassenbauer/` | Straßenbauer | 1873 | 11 |
| `/de/berufliche-bildung/berufsschule/stuckateur/` | Stuckateur | 1901 | 11 |
| `/de/berufliche-bildung/berufsschule/tiefbaufacharbeiter/` | Tiefbaufacharbeiter | 2010 | 11 |
| `/de/berufliche-bildung/berufsschule/trockenbaumonteur/` | Trockenbaumonteur | 2023 | 11 |
| `/de/berufliche-bildung/berufsschule/umwelttechnologen/` | Umwelttechnologen | 3017 | 9 |
| `/de/berufliche-bildung/berufsschule/zahntechniker/` | Zahntechniker | 1399 | 9 |
| `/de/berufliche-bildung/fachschule/` | Fachschule | 319 | 14 |
| `/de/berufliche-bildung/fachschule/erzieher-berufsbegleitend/` | Erzieher (berufsbegleitend) | 1941 | 11 |
| `/de/berufliche-bildung/fachschule/erzieher/` | Erzieher | 2635 | 11 |
| `/de/berufliche-bildung/fachschule/heilerziehungspflege/` | Heilerziehungspflege | 2389 | 11 |
| `/de/berufliche-bildung/fachschule/heilpaedagogik-berufsbegleitend/` | Heilpädagogik (berufsbegleitend) | 1993 | 11 |
| `/de/berufliche-bildung/hoehere-berufsfachschule/` | Höhere Berufsfachschule | 309 | 13 |
| `/de/berufliche-bildung/hoehere-berufsfachschule/operationstechnischer-assistent/` | Operationstechnischer Assistent | 1810 | 11 |
| `/de/berufliche-bildung/hoehere-berufsfachschule/pflege/` | Pflege | 2531 | 11 |
| `/de/berufliche-bildung/hoehere-berufsfachschule/sozialassistent/` | Sozialassistent | 1300 | 11 |

### `/de/datenschutz` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/datenschutz/` | Datenschutz | 5144 | 10 |

### `/de/gender-hinweis` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/gender-hinweis/` | Gender-Hinweis | 414 | 10 |

### `/de/impressum` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/impressum/` | Impressum | 1192 | 11 |

### `/de/schulische-bildung` (12 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/schulische-bildung/` | Schulische Bildung | 478 | 16 |
| `/de/schulische-bildung/alle-schulischen-bildungsgaenge/` | Schulische Bildung | 478 | 16 |
| `/de/schulische-bildung/fachhochschulreife/` | Fachhochschulreife | 274 | 12 |
| `/de/schulische-bildung/fachhochschulreife/erzieher/` | Erzieher | 2360 | 11 |
| `/de/schulische-bildung/fachhochschulreife/heilerziehungspflege/` | Heilerziehungspflege | 2253 | 11 |
| `/de/schulische-bildung/hauptschulabschluss/` | Hauptschulabschluss | 278 | 11 |
| `/de/schulische-bildung/hauptschulabschluss/berufsvorbereitungsjahr-technik/` | Berufsvorbereitungsjahr Technik | 1418 | 11 |
| `/de/schulische-bildung/realschulabschluss/` | Realschulabschluss | 295 | 11 |
| `/de/schulische-bildung/realschulabschluss/berufsfachschule-gesundheit-und-soziales/` | Berufsfachschule Gesundheit und Soziales, ein- und zweijährige Ausbildung | 1912 | 11 |
| `/de/schulische-bildung/sprachliche-vorbereitung/` | Sprachliche Vorbereitung | 278 | 12 |
| `/de/schulische-bildung/sprachliche-vorbereitung/bvj-sprache/` | Bvj-Sprache | 1057 | 11 |
| `/de/schulische-bildung/sprachliche-vorbereitung/vorklasse/` | Vorklasse | 844 | 11 |

### `/de/service` (22 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/service/` | Service | 370 | 10 |
| `/de/service/anmeldung-fristen/` | Anmeldungen / Fristen | 745 | 10 |
| `/de/service/anmeldung-fristen/schulanmeldung-gesundheit/` | Schulanmeldung - Gesundheit | 370 | 10 |
| `/de/service/anmeldung-fristen/schulanmeldung-technik/` | Schulanmeldung - Technik | 349 | 10 |
| `/de/service/belehrungen/` | Belehrungen | 843 | 10 |
| `/de/service/bibliothek/` | Bibliothek | 376 | 11 |
| `/de/service/bistro/` | Bistro | 253 | 10 |
| `/de/service/ipad-klassen/` | iPad-Klassen | 10475 | 10 |
| `/de/service/klassenbuch/` | Klassenbuch | 230 | 10 |
| `/de/service/klassenplaene/` | Klassenpläne | 295 | 10 |
| `/de/service/klassenplaene/klassenplaene/` | Klassenpläne | 295 | 10 |
| `/de/service/moodle-schulcloud/` | Moodle-Schulcloud | 227 | 10 |
| `/de/service/nachschreibetermine/` | Nachschreibetermine im Schuljahr | 329 | 10 |
| `/de/service/nachschreibetermine/nachschreibetermine-im-schuljahr/` | Nachschreibetermine im Schuljahr | 329 | 10 |
| `/de/service/termine/` | Termine | 180 | 10 |
| `/de/service/turnusplaene/` | Turnuspläne | 385 | 10 |
| `/de/service/turnusplaene/turnusplaene/` | Turnuspläne | 385 | 10 |
| `/de/service/unterrichtszeiten/` | Unterrichtszeiten im Schuljahr | 1935 | 10 |
| `/de/service/unterrichtszeiten/unterrichtszeiten-im-schuljahr/` | Unterrichtszeiten im Schuljahr | 1935 | 10 |
| `/de/service/vertretungsplaene/` | aktuelle Vertretungspläne | 514 | 13 |
| `/de/service/vertretungsplaene/aktuelle-vertretungsplaene/` | aktuelle Vertretungspläne | 514 | 13 |
| `/de/service/wohnheim/` | Wohnheim | 245 | 11 |

### `/de/sitemap` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/sitemap/` | Sitemap | 1672 | 10 |

### `/de/termine` (7 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/termine/` | Termine | 1133 | 11 |
| `/de/termine/abend-der-berufe/` | Abend der Berufe | 206 | 10 |
| `/de/termine/abend-der-berufe/abend-der-berufe-2027/` | Abend der Berufe 2027 | 475 | 10 |
| `/de/termine/pruefungstermine/` | Prüfungstermine | 188 | 10 |
| `/de/termine/pruefungstermine/aktuelle-pruefungsplaene/` | aktuelle Prüfungspläne | 225 | 10 |
| `/de/termine/tag-der-offenen-tuer/` | Tag der offenen Tür | 192 | 10 |
| `/de/termine/tag-der-offenen-tuer/tag-der-offenen-tuer-2027/` | Tag der offenen Tür - 2027 | 676 | 11 |

### `/de/wir-ueber-uns` (26 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/de/wir-ueber-uns/` | Schulleitung und Abteilungsleitung | 922 | 13 |
| `/de/wir-ueber-uns/aktivitaeten/` | Aktivitäten | 17040 | 82 |
| `/de/wir-ueber-uns/ansprechpartner/` | Schulleitung und Abteilungsleitung | 922 | 13 |
| `/de/wir-ueber-uns/ansprechpartner/beratungslehrer/` | Beratungslehrer | 399 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/gesundheitsbeauftragter/` | Gesundheitsbeauftragter | 321 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/hausmeister/` | Hausmeister | 427 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/homepage/` | Homepage | 312 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/kollegium/` | Kollegium | 5795 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/lehrerausbildung/` | Lehrerausbildung | 829 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/personalrat/` | Personalrat | 420 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/pro-schulwohl/` | Pro Schulwohl | 1933 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/schuelervertretung/` | Schülervertretung | 478 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/schulfoerderverein/` | Schulförderverein | 718 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/schulleitung-und-abteilungsleitung/` | Schulleitung und Abteilungsleitung | 922 | 13 |
| `/de/wir-ueber-uns/ansprechpartner/schulsozialarbeit/` | Schulsozialarbeit | 589 | 10 |
| `/de/wir-ueber-uns/ansprechpartner/sekretariat-und-schuelerverwaltung/` | Sekretariat und Schülerverwaltung | 1031 | 13 |
| `/de/wir-ueber-uns/ansprechpartner/vertrauenslehrer/` | Vertrauenslehrer | 474 | 10 |
| `/de/wir-ueber-uns/kontakt/` | Kontakt | 744 | 10 |
| `/de/wir-ueber-uns/medien/` | Schulvideo | 195 | 10 |
| `/de/wir-ueber-uns/medien/schulbroschuere/` | Schulbroschüre | 341 | 10 |
| `/de/wir-ueber-uns/medien/schulvideo/` | Schulvideo | 195 | 10 |
| `/de/wir-ueber-uns/schulentwicklung/` | Unser Leitbild | 812 | 10 |
| `/de/wir-ueber-uns/schulentwicklung/erasmus/` | Erasmus + | 10699 | 17 |
| `/de/wir-ueber-uns/schulentwicklung/schulentwicklungssaeulen/` | Schulentwicklungssäulen | 1205 | 10 |
| `/de/wir-ueber-uns/schulentwicklung/unser-leitbild/` | Unser Leitbild | 812 | 10 |
| `/de/wir-ueber-uns/unterstuetzer/` | Unterstützer | 190 | 10 |

### `/en/` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/en/` | Home | 145 | 8 |

### `/en/all-about-us` (5 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/en/all-about-us/` | All about us | 164 | 10 |
| `/en/all-about-us/anspechpartner/` | Anspechpartner | 179 | 10 |
| `/en/all-about-us/kontakt/` | Kontakt | 172 | 10 |
| `/en/all-about-us/medien/` | Medien | 171 | 10 |
| `/en/all-about-us/schulentwicklung/` | Schulentwicklung | 181 | 10 |

### `/en/school-education` (5 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/en/school-education/` | School education | 168 | 10 |
| `/en/school-education/fachhochschulreife/` | Fachhochschulreife | 187 | 10 |
| `/en/school-education/ziel-hauptschulabschluss/` | Ziel: Hauptschulabschluss | 194 | 10 |
| `/en/school-education/ziel-realschulabschluss/` | Ziel: Realschulabschluss | 193 | 10 |
| `/en/school-education/ziel-sprachliche-vorbereitung/` | Ziel: sprachliche Vorbereitung | 199 | 10 |

### `/en/service` (12 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/en/service/` | Service | 159 | 10 |
| `/en/service/anmeldungen-fristen/` | Anmeldungen / Fristen | 181 | 10 |
| `/en/service/bibliothek/` | Bibliothek | 170 | 10 |
| `/en/service/bistro/` | Bistro | 166 | 10 |
| `/en/service/dokumente/` | Dokumente | 169 | 10 |
| `/en/service/ipad-klassen/` | iPad-Klassen | 172 | 10 |
| `/en/service/nachschreibetermine/` | Nachschreibetermine | 179 | 10 |
| `/en/service/reinigung-raucherbereich/` | Reinigung Raucherbereich | 184 | 10 |
| `/en/service/turnusplaene/` | Turnuspläne | 171 | 10 |
| `/en/service/unterrichtszeiten/` | Unterrichtszeiten | 177 | 10 |
| `/en/service/vertretungsplan/` | Vertretungsplan | 175 | 10 |
| `/en/service/wohnheim/` | Wohnheim | 168 | 10 |

### `/en/termine` (1 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/en/termine/` | Termine | 159 | 10 |

### `/en/vocational-education` (5 Seiten)

| Pfad | Titel | Zeichen | Bilder |
|---|---|---:|---:|
| `/en/vocational-education/` | Vocational education | 172 | 10 |
| `/en/vocational-education/berufsfachschule/` | Berufsfachschule | 189 | 10 |
| `/en/vocational-education/berufsschule/` | Berufsschule | 185 | 10 |
| `/en/vocational-education/fachschule/` | Fachschule | 183 | 10 |
| `/en/vocational-education/hoehere-berufsfachschule/` | Höhere Berufsfachschule | 196 | 10 |

## Anhang B – Downloads (PDF / Video)

- `https://sbbz-weimar.de/media/2025-09-22-schuelersprecherversammlung.pdf`
- `https://sbbz-weimar.de/media/adv_sbbz-weimar.pdf`
- `https://sbbz-weimar.de/media/anforderungen_an_die_facharbeit_20250128.pdf`
- `https://sbbz-weimar.de/media/anmeldung_zum_theoretischen_unterricht-gesundheit.pdf`
- `https://sbbz-weimar.de/media/anmeldung_zum_theoretischen_unterricht-technik-abt-3.pdf`
- `https://sbbz-weimar.de/media/anmeldung_zum_theoretischen_unterricht-technik.pdf`
- `https://sbbz-weimar.de/media/antrag_facharbeitsthema_2025-12-03.pdf`
- `https://sbbz-weimar.de/media/bbz_weimar_1.pdf`
- `https://sbbz-weimar.de/media/belehrung_von_eltern_und_schuelern_zum_nachschreiben_von_leistungsnachweisen.pdf`
- `https://sbbz-weimar.de/media/belehrung_zur_gesetzliche_unfallversicherung_und_haftung.pdf`
- `https://sbbz-weimar.de/media/datenschutzinformationen-einwilligung-apple_-_2023-08-29-.pdf`
- `https://sbbz-weimar.de/media/erklaerung_teilnahme_deutschpruefung_2.pdf`
- `https://sbbz-weimar.de/media/gewaehrung_von_nachteilsausgleich_nach_s_58_abs-_5_thuerschulo.pdf`
- `https://sbbz-weimar.de/media/grundsaetzliches_zur_benutzung_der_ipads_-_2023-09-10.pdf`
- `https://sbbz-weimar.de/media/hausordnung_sbbz.pdf`
- `https://sbbz-weimar.de/media/hygieneplan.pdf`
- `https://sbbz-weimar.de/media/infektionsschutzgesetz.pdf`
- `https://sbbz-weimar.de/media/merkblatt_zur_erhebung_von_personenbezogenen_daten.pdf`
- `https://sbbz-weimar.de/media/mitgliedsantrag_foerderverein_03_1.pdf`
- `https://sbbz-weimar.de/media/nachschreibetermine_fuer_schueler.pdf`
- `https://sbbz-weimar.de/media/satzung_foerderverein_2023_1.pdf`
- `https://sbbz-weimar.de/media/schueler-klassenplan_44-kw_1.pdf`
- `https://sbbz-weimar.de/media/schueler-klassenplan_45-kw_1.pdf`
- `https://sbbz-weimar.de/media/schueler-klassenplan_alle_wochen_1.pdf`
- `https://sbbz-weimar.de/media/schuelerband_poster_1.pdf`
- `https://sbbz-weimar.de/media/turnusplan_abteilung_1_-_gesundheit_-_sj26-27_4.pdf`
- `https://sbbz-weimar.de/media/turnusplan_abteilung_2_-_soziales_-_sj26-27_3.pdf`
- `https://sbbz-weimar.de/media/turnusplan_abteilung_3_-_technik_-_sj26-27_4.pdf`

## Anhang C – Externe Links

- http://www.newspointweb.de/download.aspx?client=102229&uniquename=S_Vertretungsplan&date=next&mode=pdf
- http://www.newspointweb.de/download.aspx?client=102229&uniquename=S_Vertretungsplan&date=today&mode=pdf
- https://bildung.thueringen.de/international/schulen/europa
- https://geo.itunes.apple.com/de/app/newspoint-mobile/id731343868?mt=8
- https://landesverwaltungsamt.thueringen.de/soziales/gesundheitswesen/berufe-gesundheitswesen/gesundheitsfachberufe/operationstechnische-assistenz
- https://landesverwaltungsamt.thueringen.de/soziales/gesundheitswesen/berufe-gesundheitswesen/gesundheitsfachberufe/pflege/abschluss-in-thueringen
- https://marienhof-erfurt.de/
- https://mein.cevex.de/bbz-weimar/Tenant/Login
- https://play.google.com/store/apps/details?id=de.rhcsoftware.np.app
- https://projekte.uni-erfurt.de/pace/
- https://sbbz.moodle-weimar.de/login/
- https://sbbz.moodle-weimar.de/login/index.php
- https://stadt.weimar.de/de/wohnheim.html
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/474lo4
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/595959
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/78opl
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/fkabw23
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/jjj555
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/nh324578
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/vcx111
- https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/zahnt22
- https://www.certqua.de/
- https://www.deutschlands-pflegeprofis.de/
- https://www.deutschlands-pflegeprofis.de/p/team-herzzentrum-zentralklinik-bad-berka-10745
- https://www.erasmusplus.de/erasmus/berufsbildung
- https://www.jmberlin.de/on-tour
- https://www.mediadee.de
- https://www.ruben-peter.de/
- https://www.saalezahn.de/
- https://www.schulportal-thueringen.de/budget/schulbudget
- https://www.stadtradeln.de/index.php?id=171&L=0&team_preselect=14064
- https://www.weimarhalle.de/
- https://www.zlb.uni-jena.de/3905/praxissemester

## Anhang D – Bildbestand

841 Bilddateien (inkl. CMS-Mediatypen-Varianten), überwiegend in Aktivitäten-Galerien. Vollständige Liste in `crawl.json`.