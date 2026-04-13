"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setErrorMessage("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      setErrorMessage("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <section className="w-full rounded-2xl border border-black/5 bg-white p-7 shadow-lg shadow-black/5">
        <p className="text-sm font-medium text-emerald-600">ShiftPay</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-zinc-600">ลงชื่อเข้าใช้เพื่อบันทึกและดูประวัติการทำงาน</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-800">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-800">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </section>
    </main>
  );
}
