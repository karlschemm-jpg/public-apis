"use client";
// Closet Digitizer: removes the background of a garment photo in the browser (instant, private, no AI cost).
// Works best on a plain background (bed, floor, wall). Edge flood-fill from the photo border + feathered alpha.

export type BgResult = { blob: Blob; url: string; clean: boolean; coverage: number };

const MAX = 900;

function dist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt((2 * dr * dr + 4 * dg * dg + 3 * db * db) / 3);
}

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function removeBackground(file: Blob): Promise<BgResult> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const px = imgData.data;
  const N = w * h;

  // 1. background reference = median of border pixels
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  const ch = (c: number) => border.map((i) => px[i * 4 + c]).sort((a, b) => a - b)[border.length >> 1];
  const mr = ch(0), mg = ch(1), mb = ch(2);
  let spread = 0;
  for (const i of border) spread += dist(px[i * 4], px[i * 4 + 1], px[i * 4 + 2], mr, mg, mb);
  spread /= border.length;
  const tol = Math.min(70, Math.max(24, spread * 2.5 + 18));

  // 2. flood fill from the border
  const bg = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  for (const i of border) {
    if (!bg[i] && dist(px[i * 4], px[i * 4 + 1], px[i * 4 + 2], mr, mg, mb) < tol * 1.3) {
      bg[i] = 1;
      queue[tail++] = i;
    }
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % w, y = (i / w) | 0;
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (const j of nb) {
      if (j < 0 || bg[j]) continue;
      const jr = px[j * 4], jg = px[j * 4 + 1], jb = px[j * 4 + 2];
      const dRef = dist(jr, jg, jb, mr, mg, mb);
      if (dRef < tol || (dist(jr, jg, jb, r, g, b) < 9 && dRef < tol * 1.7)) {
        bg[j] = 1;
        queue[tail++] = j;
      }
    }
  }

  // 3. keep the main subject: drop small foreground specks
  const label = new Int32Array(N).fill(-1);
  const sizes: number[] = [];
  for (let s = 0; s < N; s++) {
    if (bg[s] || label[s] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    head = tail = 0;
    queue[tail++] = s;
    label[s] = id;
    while (head < tail) {
      const i = queue[head++];
      size++;
      const x = i % w, y = (i / w) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of nb) if (j >= 0 && !bg[j] && label[j] < 0) { label[j] = id; queue[tail++] = j; }
    }
    sizes.push(size);
  }
  const biggest = Math.max(0, ...sizes);
  const fg = new Uint8Array(N);
  let count = 0, minX = w, minY = h, maxX = 0, maxY = 0;
  for (let i = 0; i < N; i++) {
    if (label[i] >= 0 && sizes[label[i]] >= biggest * 0.02) {
      fg[i] = 1;
      count++;
      const x = i % w, y = (i / w) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const coverage = count / N;
  const clean = coverage > 0.03 && coverage < 0.95;

  // 4. feathered alpha (3x3 average of the mask)
  if (clean) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) { s += fg[yy * w + xx]; n++; }
        }
        px[(y * w + x) * 4 + 3] = Math.round((s / n) * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    minX = 0; minY = 0; maxX = w - 1; maxY = h - 1;
  }

  // 5. crop to the garment with a little padding
  const pad = Math.round(Math.max(w, h) * 0.04);
  const cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad + 1) - cx, chh = Math.min(h, maxY + pad + 1) - cy;
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = chh;
  out.getContext("2d")!.drawImage(canvas, cx, cy, cw, chh, 0, 0, cw, chh);
  const blob: Blob = await new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("Could not export image"))), "image/png"));
  return { blob, url: URL.createObjectURL(blob), clean, coverage };
}
