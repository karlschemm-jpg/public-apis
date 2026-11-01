import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Legal title="Terms of Service">
      <p>FitLook helps you digitize your clothes, plan trips and get outfit ideas. By creating an account you agree to these terms.</p>
      <h2>Your account</h2>
      <p>You need a valid email and a password. Keep your password safe. You’re responsible for what happens in your account. You must be 13 or older.</p>
      <h2>Your content</h2>
      <p>The photos you upload stay yours. You give us permission to store and process them only to run FitLook for you. Only upload photos you have the right to use.</p>
      <h2>Plans and payments</h2>
      <p>FitLook is free to start. Paid plans (Starter $5/month, Pro $9/month, Global $19/month) renew monthly until you cancel. Payments are processed by Whop through our billing partner Kwop. You can cancel anytime in Account → Billing; your plan stays active until the end of the period you paid for. Each plan has monthly limits shown on the pricing page.</p>
      <h2>AI suggestions</h2>
      <p>Outfit ideas, tags and packing lists are suggestions. Check the weather and your airline’s baggage rules before you go.</p>
      <h2>Fair use</h2>
      <p>Don’t misuse the service, try to break it, or access other people’s data. We may suspend accounts that do.</p>
      <h2>Liability</h2>
      <p>FitLook is provided “as is”. To the extent allowed by law, we aren’t liable for indirect losses, like a forgotten sweater.</p>
      <h2>Changes and contact</h2>
      <p>We may update these terms and will note the date above. Questions? Reply to any email from us.</p>
    </Legal>
  );
}
