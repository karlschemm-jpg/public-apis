// Retrieval über die freigegebenen Website-Inhalte (BM25, deutschsprachige Normalisierung).
// Wird vom Server (RAG-Kontext für das Sprachmodell) und im Browser (Demo-Modus) genutzt.

const STOP = new Set(("aber alle allem allen aller alles als also am an ander andere anderem anderen anderer anderes auch auf aus bei bin bis bist da damit dann das dass dein deine dem den der des dessen dich dir du durch ein eine einem einen einer eines er es etwas euch euer für gegen gibt hab habe haben hat hatte ich ihm ihn ihnen ihr ihre im in ist ja jede jedem jeden jeder jedes kann kein keine können man mein meine mich mir mit muss nach nicht nichts noch nun nur ob oder ohne sehr sein seine sich sie sind so solche soll sollte sondern über um und uns unser unsere unter viel vom von vor wann war waren warum was weil welche welchem welchen welcher welches wenn wer werde werden wie wieder will wir wird wo wurde zu zum zur zwischen bitte gibt's gibts finde finden ich's möchte würde").split(" "));

const SYN = {
  telefon: ["telefon", "anrufen", "telefonnummer", "nummer"],
  kontakt: ["kontakt", "kontaktieren", "erreichen", "sekretariat", "email", "mail"],
  adresse: ["adresse", "anfahrt", "befindet", "wo", "liegt", "lutzendorfer"],
  dokument: ["dokument", "dokumente", "formular", "formulare", "pdf", "download", "antrag", "belehrung"],
  termin: ["termin", "termine", "ferien", "datum", "wann", "veranstaltung", "tag der offenen tur", "abend der berufe"],
  angebot: ["angebot", "angebote", "ausbildung", "ausbildungen", "bildungsgang", "bildungsgange", "beruf", "berufe", "schulform"],
  vertretung: ["vertretung", "vertretungsplan", "vertretungsplane", "stundenplan"],
  anmeldung: ["anmeldung", "anmelden", "bewerbung", "bewerben", "fristen", "frist"],
};

export function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
}
function stem(t) {
  // sehr leichter Stemmer für Deutsch: häufige Endungen kappen
  return t.length > 5 ? t.replace(/(ungen|innen|ern|en|er|es|e|n|s)$/, "") : t;
}
export function tokenize(s) {
  return normalize(s).split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
}
function expand(tokens) {
  const out = new Set(tokens);
  for (const list of Object.values(SYN)) {
    const stems = list.map((w) => stem(normalize(w)));
    if (tokens.some((t) => stems.includes(t))) stems.forEach((s) => out.add(s));
  }
  return [...out];
}

export function buildIndex(chunks) {
  const docs = chunks.map((c, i) => {
    const toks = tokenize(`${c.title} ${c.title} ${c.section} ${c.text}`);
    const tf = new Map();
    toks.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    return { i, len: toks.length, tf };
  });
  const df = new Map();
  docs.forEach((d) => d.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
  const avg = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length);
  return { chunks, docs, df, avg, N: docs.length };
}

export function retrieve(index, query, k = 6) {
  const q = expand(tokenize(query));
  if (!q.length) return [];
  const k1 = 1.4, b = 0.75;
  const scored = index.docs.map((d) => {
    let s = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = index.df.get(t) || 0;
      const idf = Math.log(1 + (index.N - n + 0.5) / (n + 0.5));
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / index.avg)));
    }
    return { d, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  // höchstens 2 Abschnitte pro Seite, damit mehrere Quellen erscheinen
  const perUrl = new Map(), out = [];
  for (const { d, s } of scored) {
    const c = index.chunks[d.i];
    const n = perUrl.get(c.url) || 0;
    if (n >= 2) continue;
    perUrl.set(c.url, n + 1);
    out.push({ ...c, score: s });
    if (out.length >= k) break;
  }
  return out;
}

// Personenbezogene Angaben aus Nutzereingaben entfernen, bevor sie verarbeitet werden.
export function redactPII(s) {
  return (s || "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[E-Mail entfernt]")
    .replace(/(\+49|0)[\d\s/()-]{6,}\d/g, "[Telefonnummer entfernt]")
    .replace(/\b[A-Z]{2}\d{2}[ ]?(\d{4}[ ]?){4}\d{0,2}\b/g, "[IBAN entfernt]");
}
export function looksPersonal(s) {
  return /[\w.+-]+@[\w-]+\.[\w.-]+/.test(s) || /(\+49|0)[\d\s/()-]{6,}\d/.test(s) || /\b[A-Z]{2}\d{2}[ ]?(\d{4}[ ]?){4}/.test(s);
}
