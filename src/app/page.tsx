import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShiftHistoryAction } from "./actions";
import { ShiftPayDashboard } from "./shiftpay-dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const historyResult = await getShiftHistoryAction();

  return (
    <ShiftPayDashboard
      initialHistory={historyResult.data ?? []}
      initialHistoryError={historyResult.success ? "" : historyResult.message}
    />
  );
}
