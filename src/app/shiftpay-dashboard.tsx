"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock3, Trash2, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculatePay } from "@/lib/shiftpay/calculatePay";
import {
  deleteShiftAction,
  getShiftHistoryAction,
  saveShiftAction,
  type ShiftHistoryItem,
} from "./actions";

type ShiftPayDashboardProps = {
  initialHistory: ShiftHistoryItem[];
  initialHistoryError: string;
};

function toSafeNumberFromInput(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatTHB(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function ShiftPayDashboard({
  initialHistory,
  initialHistoryError,
}: ShiftPayDashboardProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [hourlyRate, setHourlyRate] = useState("50");
  const [otRate, setOtRate] = useState("75");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualOtPay, setManualOtPay] = useState("");
  const [manualTotal, setManualTotal] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [feedback, setFeedback] = useState(initialHistoryError);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isRefreshingHistory, startRefreshingHistory] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const hoursValue = toSafeNumberFromInput(hoursWorked);
  const hourlyRateValue = toSafeNumberFromInput(hourlyRate);
  const otRateValue = toSafeNumberFromInput(otRate);
  const manualOtPayValue = toSafeNumberFromInput(manualOtPay);
  const manualTotalValue = toSafeNumberFromInput(manualTotal);
  const pay = useMemo(
    () => calculatePay(hoursValue, hourlyRateValue, otRateValue),
    [hoursValue, hourlyRateValue, otRateValue],
  );
  const finalOtPay = manualOverride ? manualOtPayValue : pay.overtimePay;
  const finalTotal = manualOverride ? manualTotalValue : pay.totalPay;

  const refreshHistory = () => {
    startRefreshingHistory(async () => {
      const result = await getShiftHistoryAction();
      if (result.success) {
        setHistory(result.data ?? []);
      } else {
        setFeedback(result.message);
      }
    });
  };

  const handleSave = () => {
    setFeedback("");

    startSaving(async () => {
      const result = await saveShiftAction({
        shiftDate: date,
        hoursWorked: hoursValue,
        manualAmountFlag: manualOverride,
        hourlyRate: hourlyRateValue,
        otRate: otRateValue,
        otPay: finalOtPay,
        totalPay: finalTotal,
      });

      setFeedback(result.message);

      if (result.success) {
        refreshHistory();
      }
    });
  };

  const handleDelete = (recordId: string) => {
    if (!window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่")) {
      return;
    }

    setFeedback("");

    startDeleting(async () => {
      const result = await deleteShiftAction(recordId);
      setFeedback(result.message);

      if (result.success) {
        setHistory((current) => current.filter((item) => item.id !== recordId));
      }
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">ShiftPay</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">คำนวณค่าแรงพาร์ตไทม์</h1>
          <p className="mt-2 text-sm text-zinc-600">
            ปรับเรตได้เอง สลับโหมดกรอกเองได้ และบันทึกประวัติได้ในหน้าเดียว
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
        </button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Calendar className="h-4 w-4 text-emerald-600" />
                วันที่ทำงาน
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
                ชั่วโมงทำงาน
              </span>
              <input
                type="number"
                min="0"
                step="0.25"
                value={hoursWorked}
                onChange={(event) => setHoursWorked(event.target.value)}
                placeholder="เช่น 8.5"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 text-sm font-medium text-zinc-700">เรตรายชั่วโมง (บาท/ชม.)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 text-sm font-medium text-zinc-700">เรต OT (บาท/ชม.)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otRate}
                onChange={(event) => setOtRate(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">โหมดกรอกเอง (Manual Mode)</p>
                <p className="text-sm text-zinc-600">เมื่อเปิด จะกรอกค่า OT และยอดรวมได้ด้วยตัวเอง</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={manualOverride}
                onClick={() => setManualOverride((current) => !current)}
                className={`relative h-8 w-14 rounded-full transition ${
                  manualOverride ? "bg-emerald-600" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                    manualOverride ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 text-sm font-medium text-zinc-700">ค่า OT (บาท)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualOverride ? manualOtPay : finalOtPay.toFixed(2)}
                  onChange={(event) => setManualOtPay(event.target.value)}
                  readOnly={!manualOverride}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                    manualOverride
                      ? "border-amber-300 bg-amber-50 focus:border-amber-500"
                      : "border-zinc-200 bg-zinc-100 text-zinc-500"
                  }`}
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  ยอดรวมทั้งหมด (บาท)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualOverride ? manualTotal : finalTotal.toFixed(2)}
                  onChange={(event) => setManualTotal(event.target.value)}
                  readOnly={!manualOverride}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                    manualOverride
                      ? "border-amber-300 bg-amber-50 focus:border-amber-500"
                      : "border-zinc-200 bg-zinc-100 text-zinc-500"
                  }`}
                />
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <span>ค่าแรงปกติ</span>
              <span className="font-semibold">{formatTHB(pay.regularPay)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>ค่าล่วงเวลา</span>
              <span className="font-semibold">{formatTHB(finalOtPay)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>เรตรายชั่วโมง</span>
              <span className="font-semibold">{hourlyRateValue.toFixed(2)} บาท/ชม.</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>เรต OT</span>
              <span className="font-semibold">{otRateValue.toFixed(2)} บาท/ชม.</span>
            </div>
          </div>

          {feedback ? (
            <p className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{feedback}</p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isRefreshingHistory}
              className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกกะงาน"}
            </button>

            <button
              type="button"
              onClick={refreshHistory}
              disabled={isRefreshingHistory || isSaving}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshingHistory ? "กำลังโหลด..." : "รีเฟรชประวัติ"}
            </button>
          </div>
        </div>

        <aside className="rounded-3xl bg-zinc-900 p-6 text-white shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <Wallet className="h-4 w-4" />
            ยอดสุทธิ
          </div>
          <p className="mt-4 text-5xl font-black tracking-tight">{formatTHB(finalTotal)}</p>
          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-4">
              <span>โหมดการคิดยอด</span>
              <span className="font-semibold text-white">{manualOverride ? "กรอกเอง" : "อัตโนมัติ"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>ชั่วโมงรวม</span>
              <span className="font-semibold text-white">{hoursValue.toFixed(2)} ชม.</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>วันทำงาน</span>
              <span className="font-semibold text-white">{date ? formatDate(date) : "-"}</span>
            </div>
          </div>
          <p className="mt-6 text-xs leading-6 text-zinc-400">
            เมื่อปิดโหมดกรอกเอง ระบบจะคำนวณจากชั่วโมงทำงาน + เรตชั่วโมง + เรต OT อัตโนมัติ
          </p>
        </aside>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">ประวัติ 10 รายการล่าสุด</h2>
            <p className="mt-1 text-sm text-zinc-600">แสดงข้อมูลล่าสุดจากตาราง `work_logs`</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="px-3 py-3 font-medium">วันที่</th>
                <th className="px-3 py-3 font-medium">ชั่วโมง</th>
                <th className="px-3 py-3 font-medium">โหมด</th>
                <th className="px-3 py-3 font-medium">เรตชั่วโมง</th>
                <th className="px-3 py-3 font-medium">เรต OT</th>
                <th className="px-3 py-3 font-medium">ยอดรวม</th>
                <th className="px-3 py-3 font-medium text-right">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {history.length ? (
                history.map((item) => (
                  <tr key={item.id} className="text-zinc-700">
                    <td className="px-3 py-3">{formatDate(item.shift_date)}</td>
                    <td className="px-3 py-3">{Number(item.hours_worked).toFixed(2)}</td>
                    <td className="px-3 py-3">{item.manual_amount_flag ? "กรอกเอง" : "อัตโนมัติ"}</td>
                    <td className="px-3 py-3">
                      {Number(item.hourly_rate ?? item.tax_rate).toFixed(2)} บาท/ชม.
                    </td>
                    <td className="px-3 py-3">
                      {Number(item.ot_rate ?? item.break_deduction).toFixed(2)} บาท/ชม.
                    </td>
                    <td className="px-3 py-3 font-semibold">{formatTHB(Number(item.total_pay))}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-zinc-500" colSpan={7}>
                    ยังไม่มีประวัติการบันทึก
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
