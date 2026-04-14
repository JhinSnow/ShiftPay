import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
        <p className="text-sm font-medium text-emerald-600">ShiftPay</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          สวัสดีคุณ {displayName}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          เลือกงานที่ต้องการ: บันทึกเวลาทำงาน หรือคำนวณค่าแรงจากชั่วโมงที่บันทึกไว้
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/log-shift"
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-emerald-400 hover:bg-emerald-50"
          >
            <h2 className="text-lg font-bold text-zinc-900">บันทึกเวลาทำงาน</h2>
            <p className="mt-2 text-sm text-zinc-600">บันทึกวันที่ ชั่วโมงปกติ และชั่วโมง OT ประจำวัน</p>
          </Link>
          <Link
            href="/calculate-pay"
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-emerald-400 hover:bg-emerald-50"
          >
            <h2 className="text-lg font-bold text-zinc-900">คำนวณค่าแรง</h2>
            <p className="mt-2 text-sm text-zinc-600">
              กำหนดเรตชั่วโมง/เรต OT/ภาษี และบันทึกผลคำนวณพร้อม Manual Override
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
