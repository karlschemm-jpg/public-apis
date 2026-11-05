// Full-page screenshots at phone and computer size: node scripts/shot.mjs <url> [name] [outDir]
import { chromium } from "playwright";

const [url = "http://localhost:3000/", name = "page", out = "screenshots"] = process.argv.slice(2);
const sizes = [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1440, height: 900 }],
];
const browser = await chromium.launch();
const errors = [];
for (const [tag, viewport] of sizes) {
  const page = await browser.newPage({ viewport });
  page.on("console", (m) => m.type() === "error" && errors.push(`${tag}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${tag}: ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle" });
  // scroll through once so scroll-driven reveals have played
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log(errors.length ? "console errors:\n" + errors.join("\n") : "zero console errors");
