# FitLook — project brief for every session

**Pack smarter, travel in style.** Your AI virtual stylist for every trip you take.
For US travelers who want to pack light and stylish. Language: English (US). Currency: USD. Temperatures in °F.
Sales angle (landing headline + first screen): "How I packed 2 weeks of stylish outfits in one carry-on bag".

The app lives in this folder (`fitlook/`) inside the `karlschemm-jpg/public-apis` repo, branch
`claude/fitlook-saas-kwop-rxviuw`. On Vercel, set **Root Directory = `fitlook`**.

## PREMIUM BUILD (Kwop Builder, 2026-11-05) — these rules REPLACE older rules on the same topics below

**THE RESULT: "Carry-on capsule"** — from one photo of a piece they'd pack, FitLook builds a 14-day carry-on capsule
around it: the pieces to bring and a look for every day. Paywall title pattern: "Your 14-day city-break capsule is ready."

### Kwop's selling rules (follow literally)
1. Landing sells the RESULT, never the price: no plans, prices, pricing section or "Pricing" link on "/".
2. One action everywhere: **"Pack my carry-on"** (main CTA). Unlock words: **"See my full capsule"**.
3. Try first: the hero IS the product (photo → real analysis) without an account.
4. Sign-up in one tap when they want to keep the result: "Continue with Google" first (hidden until Google is configured),
   email + password under it, no confirmation, no card. Sheet title: **"Save your capsule"**. The try is never lost.
5. Aha = watching THEIR capsule being made: named steps, % counting to 99, then "Your carry-on capsule is ready."
6. Paywall at the peak, over their own result: their piece + one insight + Day 1 in clear, the rest blurred.
7. Prices per day: "$0.30 / day" big, "$9 / month" small (Kwop's `per_day`).
8. Checkout inside the page (Whop Elements embed in a sheet via POST KWOP_API/checkout), never another site.
9. Three plans that climb; a finished quota or locked part shows the next plan (upgrade sheet).
10. Phones first (390 px), then beautiful at 1440 px.
11. Everything real: real upload, real background removal (in the browser), real Gemini tagging, real capsule engine
    (`lib/matcher.ts`), real checkout. No fake data.
12. No dead ends: a returning unpaid visitor lands on their locked capsule (`/start` decides), a payer in the app.
13. Honest: no fake reviews, counts, logos or countdowns. Only true product facts ("Ready in about 10 seconds").

### Kwop API (server only, `lib/kwop.ts`)
`GET KWOP_API` → `{ name, checkout, plans:[{ id, name, price_cents, interval, per_day, yearly:{price_cents, per_day}|null }] }`
(`getKwopPlans()`, cached 10 min) · `POST /checkout {plan, period, email}` → `{ embed, ref, fallback_url }` or 409
`payments_off` · `POST /confirm {ref}` → `{ ok, paid }` · `GET /plan?email=` (`getPlan`, cached 60 s on globalThis) ·
`POST /cancel {email, except_ref?}` · `POST /event` (fire-and-forget) · `POST /connect {url}`.
Visit tracking only on public pages: `<script src="https://kwop.io/flow.js" data-site="s_ff5952e9df" defer>` (landing,
signup, login, shared results). /privacy says "visit analytics by Kwop".

### Blueprint — FitLook's own funnel (TRY FIRST)
Why try first: the core feature (background removal + capsule) runs in seconds from ONE photo, so the visitor can see
their own result before any form — exactly how Acloset/Whering hook people (first item digitized = aha), but on the web.

1. **Hero (first 10 s), "/"**: title (Bodoni Moda) **"Two weeks of outfits. One carry-on."**; one line "Snap one piece
   you'd pack. FitLook builds the **whole capsule** and a **look for every day**." Under it the **drop zone**, a big card
   with crop marks: "Drop a piece you'd pack" · "Take a photo" (opens the camera on phones) · "or try our striped tee"
   (one-tap example). Trip chips (luggage-tag style): City break (default) · Beach · Cold & snowy · Work trip.
   Facts line: "Free to try · No card · Ready in about 10 seconds". Photos stay private, deletable.
2. **The work (in place, ≥ 3 s, holds at 99 % until the server answers)**: their photo in a scan frame (crop marks, a
   sweeping scan line, measurement points, a progress ring with %). Steps tick one by one:
   "Lifting your piece off the background" (real, browser) → "Reading fabric, color & warmth" (real, Gemini) →
   "Matching it to a 14-day capsule" → "Styling every day" → "Packing the carry-on" (real, `lib/matcher.ts`).
   Then **"Your carry-on capsule is ready."** (short success animation).
3. **Locked result (in place, saved in `tries`)**: CLEAR — their cut-out piece on white, its tags ("Navy & white striped
   tee · light · casual") and one insight ("Shows up in 6 of your 14 looks"), and **Day 1** look. BLURRED — the big number
   ("11 pieces · 14 looks"), days 2–14 lookbook grid, the packing list. Lock + **"See my full capsule"**.
4. **Sign-up sheet** (no account yet): "Save your capsule" · "Continue with Google" · or · email · password (show/hide) ·
   "Save my capsule" · "Already have an account? Log in" · Terms/Privacy line. The try is attached to the new account
   (cookie `fl_try`), its piece is imported into the wardrobe and its capsule becomes a real trip with 14 looks.
5. **Paywall sheet over the result** (`/r/[id]?unlock=1`): ✕ · **"Your 14-day city-break capsule is ready."** · personal
   line "Built around your navy striped tee: 11 pieces, 14 looks, one carry-on." · "Choose your plan." + Monthly/Yearly
   (−20%) · 3 radio rows (Pro pre-selected, "Most popular") with the price per day big · "Continue with Pro" ·
   "$9.00 due today, then every month · Cancel anytime" · "Secure payment, processed by Whop" (chips Whop · Card) ·
   "What you unlock with Pro" (quotas in capsule units) · 3 questions · small print (renews until canceled, USD).
   Below, for Free users who never trialed: "or try Pro free for 7 days, no card" (the no-card trial, see below).
6. **Checkout sheet** (bottom sheet with grab handle on phones, centered card on computers): "<Plan> · $9.00 / month",
   Whop Elements embedded (`components/checkout-sheet.tsx`), "Secure payment by Whop · Cancel in 1 click".
   409 payments_off → "Payments open in a moment. Your capsule is saved."
7. **Unlock film** (4–6 s, skippable): "You're on Pro" → 3 icons of what's unlocked → "Let's go" → the capsule unblurs.
   Fallback buyers land on `/dashboard?paid=1&ref=…` → same confirm + film.
8. Sticky bottom bar when the paywall is closed: "See my full capsule · $0.30 / day". Tapping any blurred part reopens it.

**Plans in capsule units** (quotas per calendar month, server-side):
| Plan | Tag | Capsules (trips) / mo | Pieces in closet | Looks styled / mo | Extras |
|---|---|---|---|---|---|
| Starter $5 ($0.17/day) | Weekend getaways | 2 | 50 | 10 plans | basic styling |
| Pro $9 ($0.30/day) — Most popular | Regular travelers | 10 | 200 | 50 plans | advanced matching, weather tweaks, AI stylist notes |
| Global $19 ($0.63/day) | Frequent flyers & creators | 30 | 500 | 150 plans | priority AI, PDF packing lists |
Yearly: $48 / $86 / $182 (−20%). Free: 3 piece scans, 1 capsule, 1 look plan a month; capsules stay blurred past Day 1.
Anonymous tries: 3 a day per device (cookie `fl_dev`) and per IP (hashed), counted on the server.

**Visual direction — editorial lookbook.** White `#FFFFFF` / ink `#0A0A0A`, greys `#F4F4F2` `#E6E6E2` `#6B6B66`, one
seasonal accent: FitLook lime `#C8FF3D` (highlights, the main button, progress). Dark mode: `#0B0B0A` / `#F5F5F2`.
Fonts (next/font): **Bodoni Moda** (headings, numbers in the lookbook, italics for captions) + **Schibsted Grotesk** (UI,
body). Radius 16 px, 1 px hairlines, soft shadows. Signature elements: (1) the **scan frame** — crop marks + sweeping scan
line + measurement dots + progress ring over the garment; (2) the **lookbook grid** — "Day 03" Bodoni numerals over
cut-out looks on paper-white tiles; (3) **luggage tags** — chips and badges shaped like paper tags with a punched hole.

**Landing order**: sticky top bar (logo · Log in · small "Pack my carry-on") → try-first hero → motion VSL (HTML/CSS/JS,
7 scenes, ~60 s, muted autoplay, replay button; `VSL.md` has the voice-over; `public/vsl.mp4` replaces it if present) →
How it works (3 steps in animated phone frames) → The product in action (4 short feature loops) → The usual way vs
FitLook (comparison) → Questions (6) → Final block "Tonight: pack once, wear it all trip." + CTA → footer
(logo, Terms, Privacy, Log in, ©). Sticky "Pack my carry-on" bar on phones. No prices anywhere on "/".

**Share-ready results**: `/r/[id]` is shareable (public view = teaser + "Make yours"), with a next/og image of the
capsule and a Share button (Web Share API, copy-link fallback).

**Existing users**: keep accounts, data, plans, grace periods and trials. Users with `onboarding_done` skip any new flow.
The no-card 7-day trial stays (secondary link in the paywall), real Kwop plans stay the primary path.

### Audit against the premium rules (2026-11-05) — gaps and how they were closed
- [x] Landing showed plans + prices + "Pricing" link → removed everywhere public; /pricing is only for signed-in users.
- [x] Hero was a static mock → try-first drop zone (`components/capsule/try-hero.tsx`): real background removal in the
      browser, real Gemini tagging, real capsule engine (`lib/capsule.ts` → `lib/matcher.ts`), saved in `tries`.
- [x] CTA wording → "Pack my carry-on" (top bar, hero, VSL, final block, sticky phone bar); unlock = "See my full capsule".
- [x] Locked result + blur + `/r/[id]` (owner locked/unlocked, same-browser anonymous owner, public share view).
- [x] Sign-up sheet "Save your capsule" over the result (`components/signup-sheet.tsx`); Google first when
      `NEXT_PUBLIC_GOOGLE_AUTH=1` (hidden until the owner sends the OAuth keys); `/claim` attaches the try after Google.
- [x] Paywall rewritten (`components/paywall.tsx`): title over THEIR capsule, Monthly/Yearly, radio rows with the price per
      day big (Kwop's `per_day`), "Continue with <Plan>", due-today line, Whop · Card chips, "What you unlock", 3 questions,
      small print, floating button when the real one scrolls away; the no-card 7-day trial is a small link under it.
- [x] Checkout inside the page: `/api/checkout` → Kwop `/checkout` → Whop Elements in a bottom sheet
      (`components/checkout-sheet.tsx`); 409 → "Payments open in a moment. Your capsule is saved."; 15 s → fallback_url.
- [x] Unlock film (`components/unlock-film.tsx`, 3 scenes ~5 s, skippable) → unblur in place; fallback buyers confirmed on
      `/dashboard?paid=1&ref=…` (`ConfirmReturn`). `/api/checkout/confirm` retries Kwop `/confirm` 4× (Whop can lag).
- [x] Upgrade sheet for paid users (next plan only, what it adds, price a day) + `cancel {except_ref}` after an upgrade;
      Billing has "Change plan".
- [x] Editorial design system: Bodoni Moda (h1–h3, numerals) + Schibsted Grotesk, white/ink + lime, scan frame, lookbook
      grid, luggage-tag chips; emoji icons replaced by lucide icons.
- [x] Motion VSL (`components/landing/vsl.tsx`, `VSL.md`), feature loops in phone frames, comparison, count-ups,
      framer-motion reveals and spring sheets, reduced motion respected (MotionConfig via useReducedMotion everywhere).
- [x] Share: next/og image per capsule (`app/r/[id]/opengraph-image.tsx`) + Share button; site OG image.
- [x] Kwop flow.js on landing, signup, login and public shared capsules; `/privacy` mentions it; `profiles.source` from
      `utm_source`/`ref` (cookie `fl_src`, first touch, 30 days).
- [x] `/start` sends a returning unpaid user to their locked capsule, a payer to the app.
- [x] `tests/e2e.spec.ts` (Playwright, phone 390 + desktop 1440) + `scripts/shot.mjs`. The daily try limit is skipped
      only when the request carries the server's secret `E2E_KEY` (env, never in the browser bundle).
- Known third-party noise: Whop's embedded payment frame logs "Permissions policy violation: accelerometer"; the e2e
  test ignores that message only.
- Not done yet: Google sign-in (needs the owner's Google OAuth client — steps were sent), a recorded `public/vsl.mp4`.

## Owner rules (non-negotiable)
- The owner is not a developer. Never ask product/design questions: decide the simplest option that fits, write it here, keep going.
- The owner only approves commands and signs in (Supabase, Vercel) when asked.
- Work until it is online, tested and connected to Kwop. If a command fails, fix it and continue.
- `KWOP_API` and the Supabase service key are **server-only**. Never in browser code, never committed.

## Product
Problems: overpacking useless clothes · hours matching outfits in hotel rooms · forgetting what you brought.
Outcomes: AI capsule wardrobe per destination · daily visual outfit planner · digital suitcase inventory.

Features (most important first) → route:
1. **Closet Digitizer** (core, aha moment) → `/wardrobe`. Upload garment photo → background removed instantly
   (in the browser, `lib/bg-remove.ts`, no AI key needed) → saved as a transparent PNG. Gemini (if a key is set)
   auto-tags name/category/color/warmth; without a key the user picks the category (smart default).
2. **Trip Planner** → `/trips`, `/trips/[id]`. Destination, dates, days, low/high °F, rain → tailored packing list (capsule).
3. **AI Matcher** → `/outfits`. One outfit per day (top+bottom or dress, layer, shoes, accessory). Rule engine in
   `lib/matcher.ts`; Pro/Global add weather adjustments and (with a Gemini key) AI stylist notes.
4. **Suitcase View** → `/suitcase`. Swipeable list of everything packed for a trip, by category, with "packed" checkboxes.
5. **User Stats** → `/stats` (added 2026-11-03). Computed on the server in `lib/stats.ts` from the user's own rows (no new
   table, RLS-scoped client, one parallel query round). Cards: items digitized, trips planned, daily looks styled, luggage
   space saved (+ trend icon: this month vs last month), most-styled pieces (how often a garment appears in planned outfits —
   FitLook has no "worn" tracking, so "most worn" = most styled), closet mix by category + top colors, travel trends.
   Luggage saved = Σ over real (non-example) trips with a packed suitcase of (days × 3 pieces − pieces in suitcase), × 1.8 L
   per piece (`NAIVE_PIECES_PER_DAY`, `LITERS_PER_PIECE`). Example items/trips are excluded from the headline numbers; a user
   with only examples sees "Your numbers start with your first real piece" + Snap a piece. Free for every plan (no quota,
   no AI); Kwop event `feature_used` {"detail":"Stats"} on each visit.
Menu: Wardrobe, Trips, Outfits, Suitcase, Stats, Profile, Account (sidebar on desktop; bottom tab bar on phone has 6 tabs:
Wardrobe, Trips, Outfits, Suitcase, Stats, Account — Profile is reached from Account on phone).

How it works: 1. Snap clothes · 2. Add trip details · 3. Get looks.

## Step 0 — competitors (research done 2026-11-01, via web search; their sites were blocked from the build container, so some points are from store listings/reviews)
**1. Acloset (AI Fashion Assistant) — chosen model.**
- Landing/store: headline about an AI fashion assistant for your closet; sections: digitize closet (auto background removal) → AI outfit recommendations by weather → plan outfits on a calendar / plan vacation outfits → style analytics → download CTA.
- Sign-up: app account (email / Apple / Google), short style questions, then "add your first item" with a photo; background removed automatically = first result in ~3 steps.
- Paywall: freemium. Everything free up to **100 items**; the paywall appears when you hit the item limit or open premium features (more storage, advanced AI, no ads).
- Plans (US App Store, 2026): **Basic $3.99/mo** ($27.99/yr), **Premium $9.99/mo** ($59.99/yr), **Expert $24.99/mo** ($147.99/yr): each tier adds item capacity and AI features.
**2. Whering (digital closet & stylist).**
- Landing: "your digital wardrobe" headline → upload clothes (bulk, background removal) → outfit shuffle/planner → packing lists via "events" in the Planner → social → download CTA.
- Sign-up: account → upload items → shuffle an outfit. Paywall: essentially free; optional "contribution" membership for perks/early features (no hard paywall), so it does NOT model a paid flow well.
**3. Indyx (digital wardrobe) — replaces Whering as a paid model reference.**
- Landing: headline about unlocking what you already own → digitize items → outfits → calendar → **packing lists** → stylist service.
- Free: unlimited items/outfits/packing lists; paid: "Insider" ~$9/mo and human stylist service ($25+/mo).
(Stylebook: iOS, one-time $4.99, has packing lists. Not a SaaS model.)

**What FitLook copies (structure/flow only, nothing else):** Acloset's flow: short style quiz → first item with
automatic background removal (first result in 3 steps) → freemium cap on items → 3 paid tiers where each adds capacity + AI depth.
Landing section order (changed 2026-11-03 at the owner's request "show the plans higher, right under the headline"):
result headline + product working → **plans** (`#pricing`, directly under the hero in the DOM and on screen) → problem →
solution → how it works (3 steps) → FAQ → final CTA. The plans block moved unchanged (same heading, cards, prices, benefits,
"Start with <plan>" buttons → `/signup?plan=<Plan>` → plan kept in the `fl_plan` cookie → `profiles.intended_plan` → paywall
with that plan highlighted right after the first result → Kwop checkout). Hero bottom padding reduced (pb-16 → pb-10) and the
plans section uses pt-6/lg:pt-8 so it reads as the continuation of the headline. Cards: 3 columns from md, stacked on phone.
Conflict to settle with the owner: the request template's "funnel rules" (no prices on the landing page, price per day,
yearly plans) are not in this file and were not applied; moving priced cards higher makes the conflict more visible.

## Kwop = payments, plans, owner dashboard (no Whop code here)
- `KWOP_API` (server only) = `https://kwop.io/api/v2/app/<key>` — in `.env.local` and Vercel env.
- `GET KWOP_API` → `{ name, plans:[{ id, name, price_cents, currency, interval, pay_url }] }`
- `GET KWOP_API/plan?email=` → `{ paid, plan:{id,name}|null, status, until }` → `getPlan(email)` in `lib/kwop.ts`
  (cache 60 s per email; `/dashboard?paid=1` skips the cache; if Kwop fails, keep last known plan from `profiles.last_plan_*` and log).
- `POST KWOP_API/cancel {email}` → show `message`, or the `manage_url` link if returned.
- **7-day free trial** (2026-11-03, owner: "make a 7 day free trial"). Kwop's API (`GET KWOP_API`, now also returning
  per_day, yearly and `checkout:"embedded"`) has no trial field, and FitLook cannot stop Whop from charging a card. So the
  trial is run by FitLook **without a card**: "No charge today, cancel anytime" is literally true and nothing can be billed.
  When Kwop/Whop expose a trial (card on file, first charge on day 8), switch the "Start 7 Days Free" buttons to Kwop's
  trial checkout and keep the same screens.
  - Table `trials` (migration `20261103010000_trials.sql`): one row per account (primary key = user_id → one trial per
    account, enforced by the database), plan_id, plan_name, started_at, ends_at (+7 days), canceled_at. RLS select-own;
    written only by the server.
  - Logic: `applyTrial()` in `lib/grace.ts` (unit-tested), applied in `getPlan()` after the subscription/grace logic: a real
    subscription always wins; an unexpired, uncancelled trial gives its plan with status "trialing" and `until` = ends_at.
    Trials are never stored as `profiles.last_plan_*` (that is for real payers during a Kwop outage).
  - Where: every plan card for a signed-in Free user who never trialed (paywall + /pricing) shows "Start 7 Days Free" +
    "No charge today, cancel anytime" + a small "or subscribe now" (the Kwop pay link). Visitors on /pricing get
    "Start 7 Days Free" → `/signup?plan=<Plan>&trial=1` (cookie `fl_trial`) → the trial starts at signup. The landing page
    is unchanged.
  - Checkout modal (beige `--warm` + deep slate `--slate`): plan, benefits, "Today: $0 / <date>: trial ends", full-width
    "Start 7 Days Free" → confirmation "You're on Pro — free for 7 days … until <date>" → "Start packing" (full reload).
  - During the trial: beige banner under the header ("Pro trial · N days left · ends <date> · Subscribe"); Account →
    Plan & billing shows "Trial · N days left", a days-used progress bar, "Subscribe to Pro" (paywall with pay links) and
    "Cancel trial" (ends it immediately, back to Free; nothing to bill). After 7 days → Free automatically, banner
    "Your Pro trial ended. Your closet, trips and looks are safe. Keep Pro". Quotas during the trial = the plan's quotas.
  - Kwop event `feature_used` {"detail":"Free trial"} when a trial starts.
  - The plan cache in `lib/kwop.ts` lives on `globalThis`: Next bundles pages and server actions separately, so a module
    Map existed twice and invalidating it from an action (trial start, cancel) did not reach the pages for up to 60 s.
- **Cancellation grace period** (2026-11-03, owner: "when subscription is cancelled set the account to free after the paid
  month is over"). Kwop reports `paid:false` right after a cancel, so FitLook keeps its own record: table `subscriptions`
  (one row per user: plan_id, plan_name, status active|canceling|expired, paid_since, current_period_end, canceled_at;
  migration `20261103000000_subscriptions.sql`; RLS select-own, written only by the server). Logic is pure and unit-tested
  in `lib/grace.ts` (`resolvePlan`), applied inside `getPlan()` so every paid check in the app follows it:
  - Kwop paid → row active; period end = Kwop `until` if given, else the next monthly anniversary of `paid_since`
    (Jan 31 → Feb 28, like card billing).
  - Kwop not paid (cancelled in the app, in Whop or on Kwop) but `current_period_end` is in the future → the plan stays fully
    active, status "canceling", until that date. After it → Free, row "expired" (never grants access again). Nothing is deleted;
    Free limits apply again (e.g. 1 outfit plan a month, 3 scans).
  - Cancel in Account → Plan & billing → dialog states the exact last day ("You'll keep everything in Pro until December 3,
    2026") → POST KWOP_API/cancel → row "canceling" → "Subscription canceled · You keep Pro until …". The card then shows a
    neutral "Active until Dec 3" badge, "Canceled · won't renew" and a muted callout with the date in bold. No red.
  - Known limits: a refund or chargeback also keeps access until the period end; a user who paid before 2026-11-03 has no
    `paid_since` yet, so their period is counted from the first time FitLook sees them as paid.
- `POST KWOP_API/event {type,email,detail?}` fire-and-forget (via `after()`): `signup`, `onboarding_done`, `aha`
  (first real Closet Digitizer result), `paywall_view` (each paywall open), `feature_used` (detail = feature name).
- `POST KWOP_API/connect {url}` once online (production https URL, no trailing slash). Then https://kwop.io/fitlook/app must open the app.
- Kwop page https://kwop.io/fitlook sends visitors to `<app>/signup?plan=<plan name>`. After paying Kwop returns to
  `/dashboard?paid=1`; on cancel to `/pricing`.

### Plans & quotas (counted on the server, period = calendar month UTC, table `usage`)
| Plan | Price | Kwop id | Wardrobe items | Digitizer uses / mo | Trips / mo | Outfit generations / mo | Extras |
|---|---|---|---|---|---|---|---|
| Free | $0 | — | 3 | 3 total (`profiles.free_uses`) | 1 | 1 | basic matching |
| Starter | $5/mo | 1064 | 50 | 50 | 2 | 10 | basic outfit generation |
| Pro (recommended) | $9/mo | 1065 | 200 | 200 | 10 | 50 | advanced style matching, weather-based adjustments |
| Global | $19/mo | 1066 | 500 | 500 | 30 | 150 | priority AI, export packing list to PDF |
Example items don't count. Pay link: `https://kwop.io/fitlook/pay/<id>?email=<urlencoded email>` (`payLink()` in `lib/kwop.ts`).
When a quota is hit → paywall showing the next plan and what it adds.

## User journey
1. `/signup?plan=X` → plan kept in cookie `fl_plan` → `profiles.intended_plan`.
2. `/` landing for visitors (logged in → `/dashboard`). One CTA everywhere: **Start free** → `/signup`.
3. Signup: email + password, no confirmation, no card. `/login`, `/forgot-password` → `/reset-password`. Log out in Account.
4. `/onboarding`: 4 questions (trip style, packing struggle, style vibe, trip length), cards, progress bar, Back/Skip, each answer saved at once.
   End → 3 Example garments created from the answers (marked "Example", deletable) → `/wardrobe?first=1` with a guided
   first action ("Use a sample photo" or snap your own) → success moment = `aha`.
5. Paywall (`components/paywall.tsx`, same content on `/pricing`): after 3 free digitizer uses, on a paid feature, from the
   always-visible Upgrade button for free users, and right after the aha moment if the user came with `?plan=`.
6. `/dashboard?paid=1` re-checks the plan (no cache) → "You're on <plan>" + what is unlocked. Free users keep their data.

## Stack
Next.js 15 App Router + TypeScript + Tailwind v4 + shadcn/ui-style components (`components/ui`, written by hand because the
shadcn registry was unreachable from the build container) · Supabase (Postgres, Auth email+password, confirmation OFF, RLS on every
table, Storage bucket `garments` private + signed URLs) · Vercel free · AI via `lib/ai.ts` only (Gemini, `GEMINI_MODEL`
default `gemini-3.8-flash` = newest Flash, thinking level "low"). Without `GEMINI_API_KEY`, AI parts show "Coming soon".
PWA: `app/manifest.ts` + `public/icon-192.png`, `public/icon-512.png`.

Security model: users can read their own rows; inserts that consume quota (garments, trips, outfits) and all counters
(`profiles.free_uses`, `usage`, `last_plan_*`) are written only by the server with the service role after `getPlan()`.
Column-level grants stop users from editing counters on `profiles`.

## Design
Bold, clean, modern. Main color `#C8FF3D` (lime) on near-black ink. Light + dark mode (system default + toggle). Mobile first.
Loading / empty (one sentence + one button) / error states on every screen. Friendly, short US English copy.
Stats page accents (requested 2026-11-03): frosted glass cards (`bg-card/75 backdrop-blur-md`, white/60 border) on a warm
neutral backdrop (`--warm`) with soft terracotta / sage / lime blurs. Tokens `--terracotta` (#a8492a light, #ec9a77 dark) and
`--sage` (#47634a light, #a3c4a0 dark) are used for trend icons (sage = up, terracotta = down), bars and the trophy only; lime
stays the brand color. All text ≥ 5.1:1 contrast (WCAG AA) in both modes, worst case measured on glass over a terracotta blur.
**Motion system** (2026-11-03, all in `app/globals.css`; one timing: 200 ms, `--ease` = cubic-bezier(0.4,0,0.2,1)).
Only `scale`/`translate`/opacity/colors animate, never width/height/margins, so there is no layout shift (measured CLS 0.000).
- `.tap` — every button and button-like link (built into `components/ui/button.tsx`): hover scale 1.05 (only on devices that
  can hover, so phones don't get "stuck" hovers), press scale 0.97 in 80 ms. Use it on any new CTA.
- `.lift` — clickable cards (trip cards, garments, plan cards, onboarding answers, packing/suitcase tiles, dashboard steps):
  hover scale 1.02 + soft shadow (1.05 is too big for large cards).
- `.reveal` — scroll fade-up (16 px) via CSS scroll-driven animation (`animation-timeline: view()`), no JavaScript: content is
  visible by default and in browsers without support, and anything on screen at load is already past its entry range, so
  nothing ever renders late. Used on landing headings/cards/FAQ/final CTA, plan cards, trip cards, garment cards, day looks.
- `.page-in` — 220 ms fade-up of the page content on every in-app navigation (`app/(app)/template.tsx`).
- Dialogs: `.dialog-overlay` fades, `.dialog-content` fades + scales from 0.96, the full-screen paywall `.dialog-sheet` slides
  up 24 px; all animate out on close (Radix waits for the exit animation). FAQ answers fade in when opened.
  FitLook has no custom dropdown menus: selects are native (OS-animated).
- `.animate-fade-up` (Stats cards, 70 ms stagger) and `.animate-pop` (success moment) are unchanged.
- `prefers-reduced-motion: reduce`: every animation and transition is cut to 0.01 ms, hover/press scaling is off, reveals
  are off. Colors still change instantly so feedback stays visible.
Note: the owner's 2026-11-03 request referred to a "verification loop", "funnel rules" (no prices on the landing page, price per
day, yearly plans) and terracotta/sage as "signature" colors; none of these were in this file. They were not applied to the rest
of the app. The landing page still shows monthly prices.

## Build status (keep updated)
- [x] Step 0 research, CLAUDE.md, .env.example
- [x] App code (all routes above). `npm run build` and `npm run lint`: zero errors.
- [x] Migration tested on a local Postgres 16 with Supabase-like roles: applies cleanly; RLS checked (user A cannot read,
      update or delete user B's rows, cannot change counters, cannot insert quota rows, cannot put B's garment in a suitcase).
- [x] Local journey tested with Playwright against a local Supabase stand-in (Kwop unreachable → plan falls back to Free):
      signup?plan=Pro → onboarding (4 cards) → 3 Example items → sample photo → background removed + saved (aha, ~0.3 s)
      → paywall with Pro highlighted → 2 more scans → paywall after the 3rd → 4th refused by the server (402) → pay links
      `kwop.io/fitlook/pay/1064|1065|1066?email=…` → trip → 14 daily looks → PDF gated (Global) → suitcase packed toggle →
      2nd trip refused (Free = 1) → /pricing → /dashboard?paid=1 → log out / log in → delete account. No page errors.
- [x] Security: KWOP_API / service key absent from `.next/static` and from git; zod validation on every action and API route;
      error.tsx, global-error.tsx, not-found.tsx.
- [x] Supabase: org "FitLook" (zyabqsfgpsfwcankiiah), project "fitlook" ref `zwdnzhhwwzfjswllgdkd`, us-east-1. Migration
      applied through the Management API (`POST /v1/projects/<ref>/database/query`, the CLI login needs a TTY here),
      mailer_autoconfirm on, keys + DB password in `.env.local`. RLS re-checked on the real project (cross-user read/update fail,
      counters and direct inserts denied, anon denied).
- [x] Local test against the real Supabase + Kwop: full journey passes; aha ~6 s incl. Gemini tagging.
- Gemini: gemini-3.8-flash / 3.7 / flash-latest answered 503 "high demand" on 2026-11-01 → `lib/ai.ts` tries GEMINI_MODEL
  then falls back to `gemini-3.5-flash`; tagging capped at 9 s so it never blocks the aha moment.
- Kwop pay link `https://kwop.io/fitlook/pay/<id>` answered 502 from Kwop's side on 2026-11-01 (app link format is right).
- [x] Vercel: account `karlschemm-jpg`, project "fitlook" (prj_YKMavygWqP9hDbxPIiHX2KssgKu8), deployed with `vercel deploy --prod`
      from the `fitlook/` folder (Git auto-deploy not connected: Vercel's GitHub app has no access to the repo yet).
      **Production: https://fitlook-beta.vercel.app** (fitlook.vercel.app was taken). Production env: KWOP_API,
      NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (type config, public by design), SUPABASE_SERVICE_ROLE_KEY,
      GEMINI_API_KEY, GEMINI_MODEL, NEXT_PUBLIC_SITE_URL. Supabase site_url + uri_allow_list set to the production URL.
- [x] Live test 2026-11-01 with test+1793571776908@fitlook.app (kept): full journey passes, aha ~5.7 s, Gemini tagging works live.
- [x] `POST KWOP_API/connect {"url":"https://fitlook-beta.vercel.app"}` → `{"ok":true,"message":"Connected to Kwop."}`;
      https://kwop.io/fitlook/app → 302 to the app; the Kwop page buttons now link to `<app>/signup?plan=…`.
- [x] 2026-11-03 User Stats page: verified 3 passes (390 px + 1280 px, light + dark, reduced motion, new user, zero console
      errors), end-to-end journey green with a Stats step, deployed.
- [x] 2026-11-03 Motion system: verified 3 passes (390 px + 1280 px, normal + reduced motion: CLS 0, hover 1.05 without moving
      neighbors, dialogs in/out, page fade, zero console errors), end-to-end journey green, deployed.
- [x] 2026-11-03 Plans moved under the hero: verified 3 passes (390 px + 1280 px: DOM + visual order, 3-column vs stacked,
      all 3 CTAs → signup with the plan kept, content identical to the previous live version, zero console errors),
      end-to-end journey green, deployed.
- [x] 2026-11-03 Cancellation grace period: 10 unit tests (lib/grace.ts) + 3 UI passes on 390/1280 px with a local stand-in Kwop
      (paid → cancel dialog with date → still Pro, AI Matcher works → period end → Free, AI Matcher behind the paywall, closet
      kept; zero console errors) + RLS check (users cannot insert or read others' subscriptions) + e2e journey green with the
      real Kwop, deployed.
- [x] 2026-11-03 7-day free trial: 7 unit tests + 3 UI passes (390/1280 px; visitor /pricing → signup → trial running →
      Subscribe paywall → Cancel trial → Free; signed-in Free user → paywall → modal → confirmation → banner → 7 days later
      → "trial ended" + Free, no second trial; zero console errors), RLS check, e2e journey green, deployed.
- [x] 2026-11-05 PREMIUM BUILD live on https://fitlook-beta.vercel.app: try-first funnel, editorial design, per-day paywall,
      Whop checkout embedded (verified live: "Subscribe to FitLook $9.00 per month" renders in the sheet, Card only — no
      Apple Pay shown), unlock film + unblur (verified via the no-card trial path), upgrade sheet, VSL, share images.
      `tests/e2e.spec.ts` green 3× on 390 px and 1440 px, locally and live. Lighthouse mobile live: performance 83–93
      (varies run to run; LCP 1.7–3.4 s, CLS 0), accessibility 100, best practices 100, SEO 100. Existing users kept
      (2 real accounts, data and onboarding intact). Kwop /connect re-sent → "Connected to Kwop.".
      Pending: Google sign-in (owner's OAuth client ID/secret → Supabase PATCH config/auth external_google_* + Vercel env
      NEXT_PUBLIC_GOOGLE_AUTH=1 + redeploy), optional recorded public/vsl.mp4, a real paid checkout end to end.
- [x] Kwop checkout fixed on Kwop's side (2026-11-03): `https://kwop.io/fitlook/pay/1064|1065|1066?email=…` → 302 to a Whop
      checkout (`whop.com/checkout/ch_…`). A real payment → /dashboard?paid=1 round trip is still untested (needs a real card).
      2026-11-03: the owner reports a real payment went through. No FitLook account had a paid plan recorded yet at that
      time (`profiles.last_plan_*` is filled the first time the paying user opens the app), so the in-app unlock is unconfirmed.
      Owner then said the plan worked in the app and that they cancelled it on 2026-11-02. On 2026-11-03 Kwop answers
      `paid:false, status:"free"` for that email, i.e. Kwop ends access right after a cancel. Mismatch to settle:
      /terms says "your plan stays active until the end of the period you paid for" → now true (grace period, 2026-11-03).
- [x] Gemini key received 2026-11-01, in `.env.local` (add it to Vercel as GEMINI_API_KEY). Key verified (models list 200).
      `gemini-2.5-flash` is closed to new users → default model `gemini-3.8-flash`.
- [x] Gemini key re-sent 2026-11-01 (new session; `.env.local` is never committed, so it must be re-added in each fresh
      container and in Vercel). Real tagging tested on `public/sample/striped-tee.jpg` → `{"name":"Striped T-Shirt",
      "category":"top","color":"navy blue","warmth":"light","formality":"casual"}`. 3.8/3.7-flash were overloaded (503),
      so `lib/ai.ts` now falls back on 503/429 to 3.7 → 3.6 → 3.5-flash within the 40 s budget.

### Remaining steps, in order (from a machine/environment that can reach Supabase, Vercel and Kwop)
1. `npx supabase login` → `npx supabase projects create fitlook --region us-east-1 --db-password <generated>` →
   `npx supabase link --project-ref <ref>` → `npx supabase db push`. Auth settings (Management API
   `PATCH /v1/projects/<ref>/config/auth`): `mailer_autoconfirm: true`, `site_url`, `uri_allow_list` incl. `<url>/auth/callback`.
   Put URL, anon key, service-role key and DB password in `.env.local`.
2. `npx vercel login` → `npx vercel link --project fitlook` (Root Directory `fitlook`) → add every `.env.example` variable for
   production (`NEXT_PUBLIC_SITE_URL` = production URL) → `npx vercel --prod`.
3. Live test with a new email (same journey as above).
4. `curl -X POST "$KWOP_API/connect" -H 'content-type: application/json' -d '{"url":"https://<project>.vercel.app"}'`, then open https://kwop.io/fitlook/app.

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npx supabase link --project-ref <ref>` · `npx supabase db push` · `npx vercel --prod`
