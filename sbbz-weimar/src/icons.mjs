// Schlanker Icon-Satz (Strich-Icons im Stil von Lucide, 24×24, currentColor).
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  prev: '<path d="m15 6-6 6 6 6"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M7 5v14l12-7z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
  send: '<path d="M4 12 20 4l-4 16-4-7-8-1Z"/><path d="m12 13 8-9"/>',
  a11y: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5c4 1 10 1 14 0M12 9.5v4.5M12 14l-3.5 6.5M12 14l3.5 6.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  link: '<path d="M7 17 17 7M8 7h9v9"/>',
};
export function icon(name, cls = "") {
  return `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name] || ""}</svg>`;
}
export const ICON_PATHS = P;
