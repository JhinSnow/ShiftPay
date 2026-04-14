"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { Calendar, Clock3 } from "lucide-react";
import { 
  saveLogShiftAction, 
  getShiftHistoryAction, 
  deleteLogAction, 
  type WorkLogItem 
} from "@/src/app/actions";

function toSafeNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function formatTHB(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function LogShiftPage() {
  const [date, setDate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [otHours, setOtHours] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState<WorkLogItem[]>([]);
  
  const [isSaving, startSaving] = useTransition();
  const [isRefreshing, startRefreshing] = useTransition();

  // ฟังก์ชันดึงประวัติ
  const loadHistory = () => {
    startRefreshing(async () => {
      const result = await getShiftHistoryAction();
      if (result.success) {
        setHistory(result.data ?? []);
      }
    });
  };

  // ดึงประวัติทันทีที่เปิดหน้านี้
  useEffect(() => {
    loadHistory();
  }, []);

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
        loadHistory(); // บันทึกเสร็จให้โหลดประวัติใหม่ทันที
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("คุณต้องการลบข้อมูลของวันนี้ใช่หรือไม่?")) return;
    
    startRefreshing(async () => {
      const result = await deleteLogAction(Number(id));
      if (result.success) {
        loadHistory(); // ลบเสร็จให้โหลดประวัติใหม่
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8">
      {/* ส่วนบน: ฟอร์มบันทึกเวลา */}
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

      {/* ส่วนล่าง: ตารางประวัติ */}
      <section className="mt-8 rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">ประวัติการทำงาน</h2>
            <p className="mt-1 text-sm text-zinc-600">ตรวจสอบ แก้ไข หรือลบข้อมูลเวลาทำงานของคุณ</p>
          </div>
          {isRefreshing && <span className="text-sm text-emerald-600 animate-pulse">กำลังอัปเดต...</span>}
        </div>
        
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="px-3 py-3 font-medium">วันที่</th>
                <th className="px-3 py-3 font-medium">ชั่วโมงปกติ</th>
                <th className="px-3 py-3 font-medium">ชั่วโมง OT</th>
                <th className="px-3 py-3 font-medium">ยอดรวม</th>
                <th className="px-3 py-3 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {history.length ? (
                history.map((item) => (
                  <tr key={item.id} className="text-zinc-700">
                    <td className="px-3 py-3">{formatDate(item.date)}</td>
                    <td className="px-3 py-3">{Number(item.hours_worked).toFixed(2)}</td>
                    <td className="px-3 py-3">{Number(item.ot_hours).toFixed(2)}</td>
                    <td className="px-3 py-3">{formatTHB(Number(item.total_pay))}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={isRefreshing}
                        className="rounded-xl border border-red-200 text-red-600 px-3 py-2 hover:bg-red-50 hover:border-red-300 transition disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-zinc-500" colSpan={5}>
                    ยังไม่มีข้อมูลประวัติ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}