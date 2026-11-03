# SBBZ Weimar – Redesign-Prototyp 2026

Neues Erscheinungsbild für die Website des **Staatlichen Berufsbildungszentrums Weimar** (https://sbbz-weimar.de) mit integriertem, datenschutzfreundlichem **Schul-Assistenten**.

Das ist ein **Redesign, keine Neuerstellung von Inhalten**: Alle Texte, Bilder, Downloads, Links und Funktionen werden automatisch aus der bestehenden Website übernommen. Nichts wurde umformuliert oder erfunden. Die automatische Prüfung `npm run check` vergleicht dafür jede Seite Wort für Wort mit dem Original.

| Dokument | Inhalt |
|---|---|
| [`BESTANDSAUFNAHME.md`](BESTANDSAUFNAHME.md) | Phase 1: Analyse aller 199 Seiten, Navigation, Funktionen, offene Punkte |
| [`DESIGNSYSTEM.md`](DESIGNSYSTEM.md) | Phase 2: Farben, Typografie, Abstände, Komponenten, responsive Regeln |
| [`QUALITAETSKONTROLLE.md`](QUALITAETSKONTROLLE.md) | Phase 5: Abgleich mit dem Original, Barrierefreiheits- und Gerätetests |

## Schnellstart

```bash
cd sbbz-weimar
npm run build      # erzeugt dist/ aus content/*.json (keine Abhängigkeiten nötig)
npm start          # http://localhost:8080 – Assistent läuft im Demo-Modus
npm run check      # Vollständigkeitsprüfung gegen das Original
```

KI-Modus aktivieren (optional):

```bash
npm install                                # installiert @anthropic-ai/sdk
ANTHROPIC_API_KEY=… npm start              # Schlüssel nur serverseitig, nie im Browser
```

Voraussetzung: Node.js ≥ 20. `dist/` lässt sich auch ohne Server statisch hosten. Der Assistent schaltet dann automatisch in den Demo-Modus.

## Aufbau

```
content/            Aus dem Original extrahierte Inhalte (Quelle der Wahrheit für den Prototyp)
  crawl.json        Roh-Crawl: Texte, Links, Assets aller Seiten
  pages.json        aufbereitete Seiteninhalte (HTML ohne CMS-Layout, Module semantisch gemappt)
  home.json         Startseiten-Bausteine (Slider, Schnellzugriffe, Video, Logos)
  nav.json          vollständige Navigation DE/EN, 1:1 aus dem Original
tools/extract.py    Crawl → pages.json (fetch/build), bildet REDAXO-Module auf semantisches Markup ab
tools/check.mjs     Qualitätskontrolle: Seiten, Wörter, Downloads, interne und externe Links
build.mjs           Statischer Generator (Templates für Startseite, Unterseiten, Navigation, Suche)
src/assets/         CSS, JS, Schriften (lokal, keine Google-Fonts-Verbindung), Logo, Icons
server/server.mjs   Auslieferung + Assistent-API (/api/assistant) mit Ratenbegrenzung
```

Inhalte neu übernehmen, wenn sich die Live-Site geändert hat:

```bash
python3 tools/extract.py fetch /tmp/sbbz-raw          # lädt alle Seiten aus crawl.json
python3 tools/extract.py build /tmp/sbbz-raw content  # → content/pages.json, home.json
npm run build && npm run check
```

## Schul-Assistent

**Architektur (Retrieval-Augmented Generation):**

1. Beim Build werden die freigegebenen Seiten in Abschnitte zerlegt (`dist/assistant/knowledge.json`, jeweils mit Quellen-URL).
2. Zu jeder Frage sucht der Server per BM25 die 6 passendsten Abschnitte (`src/assets/js/retrieval.mjs`, dieselbe Logik wie im Browser).
3. Nur diese Auszüge gehen zusammen mit der Frage an das Sprachmodell. Der System-Prompt verbietet erfundene Termine, Kontaktdaten und Regeln, verlangt Quellenmarker `[1]` und verweist bei persönlichen Anliegen auf die offiziellen Ansprechpartner.
4. Die Antwort enthält nur die tatsächlich zitierten Quellen als Links.

**Modi:**

| Modus | Wann | Verhalten |
|---|---|---|
| **KI** | Server läuft mit `ANTHROPIC_API_KEY` | Antworten in verständlichem Deutsch mit Quellen. Modell `claude-opus-5-5` (über `ASSISTANT_MODEL` änderbar), `effort: low`, serverseitiger Fallback bei Ablehnungen |
| **Demo** | kein Schlüssel oder rein statisches Hosting | **keine KI**: Stichwortsuche im Browser, zeigt passende Seiten mit Auszug. Im Widget deutlich als „Demo – Keine KI“ gekennzeichnet |

**Datenschutz:**

- Der Assistent startet erst, nachdem der Hinweis aktiv bestätigt wurde (keine personenbezogenen Daten eingeben, keine Speicherung, KI-Einsatz offengelegt, Link zur Datenschutzerklärung).
- Chatverläufe werden nicht gespeichert, weder im Browser (kein `localStorage`, keine Cookies) noch auf dem Server. Inhalte und IP-Adressen werden nicht geloggt.
- E-Mail-Adressen, Telefonnummern und IBANs werden im Browser abgefangen und serverseitig zusätzlich entfernt, bevor eine Anfrage weitergeht.
- Der API-Schlüssel liegt nur auf dem Server. Es gibt eine Ratenbegrenzung pro IP (gesalzener Hash, nur im Arbeitsspeicher, 10 Minuten), ein Tageslimit, eine Origin-Prüfung, ein Größenlimit (16 KB) und eine CSP.
- Die Kollegium-Liste (Namen und dienstliche E-Mail-Adressen von Lehrkräften) ist aus der Wissensbasis ausgeschlossen.
- **Vor dem Live-Betrieb nötig:** ein Abschnitt zum KI-Assistenten in der Datenschutzerklärung (Text von Schule bzw. Datenschutzbeauftragtem), ein Auftragsverarbeitungsvertrag mit dem KI-Anbieter und eine Prüfung der Datenverarbeitung in Drittländern. Bis dahin sollte der Assistent nur im Demo-Modus laufen.

## Überführung in REDAXO (empfohlener nächster Schritt)

Die Live-Site läuft auf **REDAXO**. Damit Redaktionsabläufe, URLs, die `search_it`-Suche und das `yform`-Kontaktformular erhalten bleiben, wird der Prototyp als **neues Theme** eingebaut. Ein Systemwechsel ist nicht nötig.

| Prototyp | REDAXO |
|---|---|
| `layout()` / `header()` / `footer()` in `build.mjs` | Template „Standard“ (Header, Mega-Navigation über `rex_navigation`, Footer) |
| `subpage()` (Hero, Breadcrumb, Bereichsnavigation) | Template „Unterseite“ |
| Module-Mapping in `extract.py` (Akkordeon → `<details>`, Galerie, Team-Box, Teaser, Termin) | Ausgabe-Teil der bestehenden Module anpassen. Die Eingabe bleibt gleich, die Redaktion merkt keinen Unterschied |
| Bildungsgang-Filter | bestehendes Filtermodul, neues Markup + `site.js` |
| Kontaktformular-Markup | yform-Template (Felder unverändert) |
| clientseitige Suche | weiterhin `search_it`, nur neues Ergebnis-Layout |
| `site.css`, `assistant.css`, `site.js`, `assistant.js`, Fonts | `/assets/` bzw. `theme`-AddOn |
| `server/server.mjs` `/api/assistant` | kleiner PHP-Endpunkt (REDAXO-AddOn) oder separater Dienst. Wissensbasis per Cronjob aus den Artikeln erzeugen |

Benötigt wird dafür ein Export der Templates und Module oder ein Zugang zum REDAXO-Backend.

## Hinweise zum Prototyp

- Bilder, PDFs und das Schulvideo werden direkt von `sbbz-weimar.de` geladen, nicht kopiert. In REDAXO kommen sie wie bisher aus dem Medienpool.
- Das Kontaktformular prüft die Eingaben im Prototyp, **sendet aber nichts ab** (auf der Seite gekennzeichnet).
- Die englische Version hat wie im Original nur Seitentitel ohne Inhalt. Die Struktur bleibt erhalten, Inhalte wurden nicht ergänzt.
