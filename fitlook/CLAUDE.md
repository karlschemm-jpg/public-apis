# FitLook — project brief for every session

**Pack smarter, travel in style.** Your AI virtual stylist for every trip you take.
For US travelers who want to pack light and stylish. Language: English (US). Currency: USD. Temperatures in °F.
Sales angle (landing headline + first screen): "How I packed 2 weeks of stylish outfits in one carry-on bag".

The app lives in this folder (`fitlook/`) inside the `karlschemm-jpg/public-apis` repo, branch
`claude/fitlook-saas-kwop-rxviuw`. On Vercel, set **Root Directory = `fitlook`**.

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
Menu: Wardrobe, Trips, Outfits, Suitcase, Profile, Account (sidebar on desktop, bottom tab bar on phone — Profile is
reached from Account on phone).

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
Landing section order: result headline + product working → problem → solution → how it works (3 steps) → plans → FAQ → final CTA.

## Kwop = payments, plans, owner dashboard (no Whop code here)
- `KWOP_API` (server only) = `https://kwop.io/api/v2/app/<key>` — in `.env.local` and Vercel env.
- `GET KWOP_API` → `{ name, plans:[{ id, name, price_cents, currency, interval, pay_url }] }`
- `GET KWOP_API/plan?email=` → `{ paid, plan:{id,name}|null, status, until }` → `getPlan(email)` in `lib/kwop.ts`
  (cache 60 s per email; `/dashboard?paid=1` skips the cache; if Kwop fails, keep last known plan from `profiles.last_plan_*` and log).
- `POST KWOP_API/cancel {email}` → show `message`, or the `manage_url` link if returned.
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
- [ ] Kwop checkout `https://kwop.io/fitlook/pay/<id>` returns Cloudflare 502 "Host Error" from Kwop's server (all 3 plans,
      before and after connect). The app's pay links are correct; re-test the pay → /dashboard?paid=1 and cancel → /pricing
      round trip once Kwop fixes it.
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
