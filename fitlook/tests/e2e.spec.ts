import { test, expect } from "@playwright/test";

// The blueprint's whole funnel as a brand-new visitor (never pays):
// landing → first action → the work → capsule locked → sign-up → paywall → checkout sheet opens → close → account.
test("try-first funnel", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && !/whop|stripe|hcaptcha|cloudflare|kwop\.io|Failed to load resource|Permissions policy violation/i.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && !/whop|stripe|hcaptcha|cloudflare|kwop\.io|google/i.test(u)) errors.push(`${r.status()} ${u}`);
  });
  page.on("dialog", (d) => d.accept());
  const shot = (n: string) => page.screenshot({ path: `screenshots/e2e-${info.project.name}-${n}.png` });

  // the daily try limit (3 per device and IP) is skipped only for this test, with the server's secret E2E_KEY,
  // sent to FitLook's own /api/try and nowhere else
  if (process.env.E2E_KEY) {
    await page.route("**/api/try", (route) => route.continue({ headers: { ...route.request().headers(), "x-e2e-key": process.env.E2E_KEY! } }));
  }

  // 1. landing: the RESULT, no price anywhere
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One");
  await expect(page.locator("main")).not.toContainText(/\$\d|per month|\/ ?month|Pricing/i);

  // 2. first action: the one-tap example
  await page.getByRole("button", { name: /try it with our striped tee/i }).click();
  await expect(page.getByText("Lifting your piece off the background")).toBeVisible();
  await shot("1-work");

  // 3. the work → the capsule, locked
  await expect(page.getByText("Your carry-on capsule is ready.")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Shows up in \d+ of your 14 looks/)).toBeVisible();
  await shot("2-locked");

  // 4. unlock → sign-up sheet, a new email
  await page.getByRole("button", { name: "See my full capsule" }).last().click();
  await expect(page.getByRole("heading", { name: "Save your capsule" })).toBeVisible();
  const email = `e2e+${Date.now()}-${info.project.name}@fitlook.app`;
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder(/Password/).fill("Travel-light-2026");
  await shot("3-signup");
  await page.getByRole("button", { name: "Save my capsule" }).click();

  // 5. paywall over their own capsule, prices per day
  await page.waitForURL(/\/r\/[0-9a-f-]{36}\?unlock=1/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: /capsule is ready\./ }).last()).toBeVisible();
  await expect(page.getByText("Choose your plan.")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Pro/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("/ day").first()).toBeVisible();
  await shot("4-paywall");

  // 6. checkout inside the page (never pay)
  await page.getByRole("button", { name: /^Continue with Pro/ }).first().click();
  await expect(page.getByText("Secure checkout", { exact: true })).toBeVisible();
  await expect(page.locator("#whop-checkout iframe").or(page.getByText("Payments open in a moment"))).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot("5-checkout");

  // 7. close the checkout, then the paywall → the locked capsule with its sticky unlock bar
  await page.getByRole("dialog").last().getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Secure checkout", { exact: true })).toBeHidden();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: /See my full capsule · \$/ })).toBeVisible();
  await shot("6-locked-bar");

  // 8. account
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Plan & billing" })).toBeVisible();
  await shot("7-account");

  // clean up the test account
  await page.fill('input[name="confirm"]', "DELETE");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.waitForURL(/\?deleted=1/);
  expect(errors, errors.join("\n")).toHaveLength(0);
});
