"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Calendar, Clock3 } from "lucide-react";
import { saveLogShiftAction } from "@/src/app/actions";

function toSafeNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export default function LogShiftPage() {
  const [date, setDate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [otHours, setOtHours] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSaving, startSaving] = useTransition();

  const handleSave = () => {
    setFeedback("");
    startSaving(async () => {
      const result = await saveLogShiftAction({
        date,
        hoursWorked: toSafeNumber(regularHours),
        otHours: toSafeNumber(otHours),
      });
      setFeedback(result.message);
      if (result.success) {
        setDate("");
        setRegularHours("");
        setOtHours("");
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
        <p className="text-sm font-medium text-emerald-600">ShiftPay</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">บันทึกเวลาทำงาน</h1>
        <p className="mt-2 text-sm text-zinc-600">หน้านี้ใช้สำหรับบันทึกวันที่ ชั่วโมงปกติ และ OT เท่านั้น</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Calendar className="h-4 w-4 text-emerald-600" />
              วันที่
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Clock3 className="h-4 w-4 text-emerald-600" />
              ชั่วโมงปกติ
            </span>
            <input
              type="number"
              min="0"
              step="0.25"
              value={regularHours}
              onChange={(event) => setRegularHours(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              placeholder="เช่น 8"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Clock3 className="h-4 w-4 text-emerald-600" />
              ชั่วโมง OT
            </span>
            <input
              type="number"
              min="0"
              step="0.25"
              value={otHours}
              onChange={(event) => setOtHours(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              placeholder="เช่น 2"
            />
          </label>
        </div>

        {feedback ? (
          <p className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{feedback}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกเวลาทำงาน"}
          </button>
          <Link
            href="/calculate-pay"
            className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800"
          >
            ไปหน้าคำนวณค่าแรง
          </Link>
        </div>
      </section>
    </main>
  );
}
