"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่านให้ครบ");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });
    setIsLoading(false);

    if (error) {
      setErrorMessage("สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setSuccessMessage("สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบ");
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <section className="w-full rounded-2xl border border-black/5 bg-white p-7 shadow-lg shadow-black/5">
        <p className="text-sm font-medium text-emerald-600">ShiftPay</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">สมัครสมาชิก</h1>
        <p className="mt-2 text-sm text-zinc-600">สร้างบัญชีเพื่อเริ่มบันทึกชั่วโมงและคำนวณรายได้</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-zinc-800">
              ชื่อผู้ใช้
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              required
            />
          </div>

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
          {successMessage ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </section>
    </main>
  );
}
