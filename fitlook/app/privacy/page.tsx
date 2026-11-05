import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy">
      <p>Short version: we keep only what we need to run FitLook, we never sell your data, and you can delete everything anytime.</p>
      <h2>What we keep</h2>
      <ul className="list-disc pl-5">
        <li>Your email and password (the password is stored hashed by our auth provider).</li>
        <li>Your clothing photos, trips, outfits and onboarding answers.</li>
        <li>Photos you try on the home page before signing up: stored privately in the US (Supabase), kept with the capsule they made, and deletable with “Delete my photo”. To limit abuse we keep a random device id and a one-way hash of your IP address for 24 hours of try counts.</li>
        <li>Usage counts (scans, trips, outfit plans) to apply your plan’s limits, and simple funnel events (sign-up, first result, plan views).</li>
      </ul>
      <h2>Who helps us</h2>
      <ul className="list-disc pl-5">
        <li><b>Supabase</b> — database, login and photo storage.</li>
        <li><b>Vercel</b> — hosting.</li>
        <li><b>Google Gemini</b> — when enabled, reads a clothing photo to name and tag it, and writes styling tips.</li>
        <li><b>Kwop and Whop</b> — payments and subscription status. Checkout runs inside FitLook, processed by Whop. We never see or store your card details.</li>
        <li><b>Kwop</b> — visit analytics by Kwop on our public pages (home, sign-up, log-in, shared capsules), so we know which pages bring visitors. Not used inside your account.</li>
      </ul>
      <h2>Background removal</h2>
      <p>The background of your photos is removed right in your browser before upload.</p>
      <h2>Your choices</h2>
      <p>You can edit or delete any item, trip or look, and delete your whole account in Account → Delete my account. Deleting removes your data from our database and storage.</p>
      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you logged in and remember the plan you picked. No ad trackers.</p>
      <h2>Contact</h2>
      <p>Questions about your data? Reply to any email from us.</p>
    </Legal>
  );
}
