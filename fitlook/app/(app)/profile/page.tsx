import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { PageTitle } from "@/components/empty";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireUser();
  return (
    <div className="max-w-xl">
      <PageTitle title="Profile" sub="Your style answers shape every look we put together." />
      <ProfileForm email={user.email!} profile={profile} />
    </div>
  );
}
