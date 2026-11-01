import type { Metadata } from "next";
import { ResetForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "New password" };
export default function Page() {
  return <ResetForm />;
}
