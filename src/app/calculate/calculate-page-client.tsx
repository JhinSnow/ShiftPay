"use client";

import Link from "next/link";
// 1. เพิ่ม useEffect เข้ามาตรงนี้
import { useMemo, useState, useTransition, useEffect } from "react";
import { Calendar, Clock3, Wallet } from "lucide-react";
import { getShiftHistoryAction, saveCalculatedPayAction, type WorkLogItem } from "@/src/app/actions";
import { getWorkLogByDateAction } from "@/src/app/actions";

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

export default function CalculatePageClient() {
  const [date, setDate] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [otHours, setOtHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("50");
  const [otRate, setOtRate] = useState("75");
  const [taxPercent, setTaxPercent] = useState("3");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualTotalPay, setManualTotalPay] = useState("");
  const [history, setHistory] = useState<WorkLogItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isRefreshing, startRefreshing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const regularHoursValue = toSafeNumber(hoursWorked);
  const otHoursValue = toSafeNumber(otHours);
  const hourlyRateValue = toSafeNumber(hourlyRate);
  const otRateValue = toSafeNumber(otRate);
  const taxPercentValue = toSafeNumber(taxPercent);
  const manualTotalValue = toSafeNumber(manualTotalPay);

  const calculated = useMemo(() => {
    const gross = regularHoursValue * hourlyRateValue + otHoursValue * otRateValue;
    const taxAmount = gross * (taxPercentValue / 100);
    const net = Math.max(gross - taxAmount, 0);
    return { gross, taxAmount, net };
  }, [regularHoursValue, hourlyRateValue, otHoursValue, otRateValue, taxPercentValue]);

  const finalTotal = manualOverride ? manualTotalValue : calculated.net;

  // 2. เพิ่มระบบดึงข้อมูลอัตโนมัติเมื่อเลือกวันที่
  useEffect(() => {
    async function fetchLoggedHours() {
      if (date) {
        const loggedData = await getWorkLogByDateAction(date);
        if (loggedData) {
          setHoursWorked(String(loggedData.hours_worked));
          setOtHours(String(loggedData.ot_hours));
          setFeedback(""); // เคลียร์ข้อความแจ้งเตือนถ้าเจอข้อมูล
        } else {
          setHoursWorked("0");
          setOtHours("0");
          setFeedback("ไม่พบชั่วโมงทำงานในวันที่เลือก กรุณาบันทึกกะก่อน"); // แจ้งเตือนถ้าไม่เจอ
        }
      }
    }
    fetchLoggedHours();
  }, [date]);

  const loadHistory = () => {
    setFeedback("");
    startRefreshing(async () => {
      const result = await getShiftHistoryAction();
      if (result.success) {
        setHistory(result.data ?? []);
      } else {
        setFeedback(result.message);
      }
    });
  };

  const applyRecord = (record: WorkLogItem) => {
    setDate(record.date);
    // ไม่ต้อง set ชั่วโมงตรงนี้แล้ว เพราะเดี๋ยว useEffect ข้างบนจะจัดการดึงให้เองเมื่อ date เปลี่ยน
  };

  const saveCalculation = () => {
    if (!date) {
      setFeedback("กรุณาเลือกวันที่ต้องการคำนวณเงิน");
      return;
    }
    
    setFeedback("");
    startSaving(async () => {
      const result = await saveCalculatedPayAction({
        date,
        hoursWorked: regularHoursValue,
        otHours: otHoursValue,
        baseRate: hourlyRateValue,
        taxRate: taxPercentValue,
        isManual: manualOverride,
        totalPay: finalTotal,
      });
      setFeedback(result.message);
      if (result.success) {
        loadHistory();
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
          <p className="text-sm font-medium text-emerald-600">ShiftPay</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">คำนวณค่าแรง</h1>
          <p className="mt-2 text-sm text-zinc-600">เลือกวันที่ เพื่อดึงชั่วโมงอัตโนมัติ และคำนวณค่าแรง</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Calendar className="h-4 w-4 text-emerald-600" />
                วันที่
              </span>
              {/* 3. ปลดล็อค input วันที่ให้กดเลือกได้ และใส่ onChange */}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500 transition"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                ชั่วโมงปกติ (ดึงอัตโนมัติ)
              </span>
              <input
                type="number"
                value={hoursWorked}
                readOnly
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed px-4 py-3 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                ชั่วโมง OT (ดึงอัตโนมัติ)
              </span>
              <input
                type="number"
                value={otHours}
                readOnly
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed px-4 py-3 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <Wallet className="h-4 w-4 text-emerald-600" />
                เรตรายชั่วโมง (บาท)
              </span>
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
              <span className="mb-2 text-sm font-medium text-zinc-700">เรต OT (บาท)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otRate}
                onChange={(event) => setOtRate(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
            <label className="block">
              <span className="mb-2 text-sm font-medium text-zinc-700">ภาษี (%)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxPercent}
                onChange={(event) => setTaxPercent(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Manual Override</p>
                <p className="text-sm text-zinc-600">เปิดเพื่อกรอกยอดรวมด้วยตัวเอง</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={manualOverride}
                onClick={() => setManualOverride((value) => !value)}
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
            <label className="mt-4 block">
              <span className="mb-2 text-sm font-medium text-zinc-700">ยอดรวม (บาท)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualOverride ? manualTotalPay : finalTotal.toFixed(2)}
                onChange={(event) => setManualTotalPay(event.target.value)}
                readOnly={!manualOverride}
                className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                  manualOverride
                    ? "border-amber-300 bg-amber-50 focus:border-amber-500"
                    : "border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed"
                }`}
              />
            </label>
          </div>

          {feedback ? (
            <p className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{feedback}</p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadHistory}
              disabled={isRefreshing}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "กำลังโหลด..." : "ดึงประวัติล่าสุด"}
            </button>
            <button
              type="button"
              onClick={saveCalculation}
              disabled={isSaving || !date}
              className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกผลคำนวณ"}
            </button>
            <Link
              href="/log-shift"
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition"
            >
              ไปหน้าบันทึกชั่วโมง
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl bg-zinc-900 p-6 text-white shadow-lg shadow-black/10 h-fit sticky top-24">
          <p className="text-sm text-emerald-300">สรุปการคำนวณ</p>
          <p className="mt-3 text-4xl font-black tracking-tight">{formatTHB(finalTotal)}</p>
          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between">
              <span>รายได้ก่อนหักภาษี</span>
              <span className="font-semibold text-white">{formatTHB(calculated.gross)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>ภาษีที่หัก</span>
              <span className="font-semibold text-white">{formatTHB(calculated.taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>โหมดคำนวณ</span>
              <span className="font-semibold text-white">{manualOverride ? "กรอกเอง" : "อัตโนมัติ"}</span>
            </div>
          </div>
        </aside>
      </section>

      {/* ส่วนตารางประวัติเหมือนเดิมเป๊ะครับ... */}
      <section className="mt-8 rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
        <h2 className="text-xl font-bold text-zinc-900">ประวัติ 10 รายการล่าสุด</h2>
        <p className="mt-1 text-sm text-zinc-600">กดปุ่มดึงประวัติล่าสุด เพื่ออัปเดตข้อมูลจากฐานข้อมูล</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="px-3 py-3 font-medium">วันที่</th>
                <th className="px-3 py-3 font-medium">ชั่วโมงปกติ</th>
                <th className="px-3 py-3 font-medium">ชั่วโมง OT</th>
                <th className="px-3 py-3 font-medium">ยอดรวม</th>
                <th className="px-3 py-3 font-medium text-right">ใช้งาน</th>
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
                        onClick={() => applyRecord(item)}
                        className="rounded-xl border border-emerald-300 px-3 py-2 text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        ใช้รายการนี้
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