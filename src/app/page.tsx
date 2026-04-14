import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainMenuClient } from "./main-menu-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    typeof user.user_metadata?.username === "string" && user.user_metadata.username.trim()
      ? user.user_metadata.username
      : user.email ?? "ผู้ใช้งาน";

  return <MainMenuClient displayName={displayName} />;
}
