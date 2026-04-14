"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WorkLogItem = {
  id: string;
  date: string;
  hours_worked: number;
  ot_hours: number;
  base_rate: number;
  tax_rate: number;
  is_manual: boolean;
  total_pay: number;
  created_at: string | null;
};

export type SaveLogShiftInput = {
  date: string;
  hoursWorked: number;
  otHours: number;
};

export type SaveCalculatedPayInput = {
  date: string;
  hoursWorked: number;
  otHours: number;
  baseRate: number;
  taxRate: number;
  isManual: boolean;
  totalPay: number;
};

export type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

function toSafeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      errorMessage: "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
    };
  }

  return { supabase, user, errorMessage: "" };
}

export async function getShiftHistoryAction(): Promise<ActionResult<WorkLogItem[]>> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      message: errorMessage,
      data: [],
    };
  }

  const { data, error } = await supabase
    .from("work_logs")
    .select("id, date, hours_worked, ot_hours, base_rate, tax_rate, is_manual, total_pay, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return {
      success: false,
      message: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      data: [],
    };
  }

  return {
    success: true,
    message: "",
    data: (data ?? []) as WorkLogItem[],
  };
}

export async function saveLogShiftAction(input: SaveLogShiftInput): Promise<ActionResult> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: errorMessage };
  }

  if (!input.date) {
    return { success: false, message: "กรุณาเลือกวันที่ทำงาน" };
  }

  const payload = {
    user_id: user.id,
    date: input.date,
    hours_worked: toSafeNumber(input.hoursWorked),
    ot_hours: toSafeNumber(input.otHours),
    base_rate: 0,
    tax_rate: 0,
    is_manual: false,
    total_pay: 0,
  };

  const { error } = await supabase.from("work_logs").insert(payload);

  if (error) {
    console.error(error);
    return {
      success: false,
      message: "บันทึกชั่วโมงทำงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }

  revalidatePath("/log-shift");
  revalidatePath("/calculate-pay");
  revalidatePath("/");

  return {
    success: true,
    message: "บันทึกเวลาทำงานเรียบร้อยแล้ว",
  };
}

export async function saveCalculatedPayAction(input: SaveCalculatedPayInput): Promise<ActionResult> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: errorMessage };
  }

  if (!input.date) {
    return { success: false, message: "ไม่พบวันที่ของชั่วโมงที่เลือก" };
  }

  const payload = {
    user_id: user.id,
    date: input.date,
    hours_worked: toSafeNumber(input.hoursWorked),
    ot_hours: toSafeNumber(input.otHours),
    base_rate: toSafeNumber(input.baseRate),
    tax_rate: toSafeNumber(input.taxRate),
    is_manual: input.isManual,
    total_pay: toSafeNumber(input.totalPay),
  };

  const { error } = await supabase.from("work_logs").insert(payload);

  if (error) {
    console.error(error);
    return {
      success: false,
      message: "บันทึกผลคำนวณไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }

  revalidatePath("/calculate-pay");
  revalidatePath("/");

  return {
    success: true,
    message: "บันทึกผลคำนวณเรียบร้อยแล้ว",
  };
}
