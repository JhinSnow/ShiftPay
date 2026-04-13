"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ShiftHistoryItem = {
  id: string;
  shift_date: string;
  hours_worked: number;
  manual_amount_flag: boolean;
  tax_rate: number;
  break_deduction: number;
  hourly_rate?: number;
  ot_rate?: number;
  ot_pay?: number;
  total_pay: number;
  created_at: string | null;
};

export type SaveShiftInput = {
  shiftDate: string;
  hoursWorked: number;
  manualAmountFlag: boolean;
  hourlyRate: number;
  otRate: number;
  otPay: number;
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

export async function getShiftHistoryAction(): Promise<ActionResult<ShiftHistoryItem[]>> {
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
    .select(
      "id, shift_date, hours_worked, manual_amount_flag, tax_rate, break_deduction, hourly_rate, ot_rate, ot_pay, total_pay, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    const fallback = await supabase
      .from("work_logs")
      .select("id, shift_date, hours_worked, manual_amount_flag, tax_rate, break_deduction, total_pay, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (fallback.error) {
      return {
        success: false,
        message: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        data: [],
      };
    }

    const mapped = (fallback.data ?? []).map((item) => ({
      ...item,
      hourly_rate: item.tax_rate,
      ot_rate: item.break_deduction,
      ot_pay: 0,
    })) as ShiftHistoryItem[];

    return {
      success: true,
      message: "",
      data: mapped,
    };
  }

  return {
    success: true,
    message: "",
    data: (data ?? []) as ShiftHistoryItem[],
  };
}

export async function saveShiftAction(input: SaveShiftInput): Promise<ActionResult> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: errorMessage };
  }

  if (!input.shiftDate) {
    return { success: false, message: "กรุณาเลือกวันที่ทำงาน" };
  }

  const payload = {
    user_id: user.id,
    shift_date: input.shiftDate,
    hours_worked: toSafeNumber(input.hoursWorked),
    manual_amount_flag: input.manualAmountFlag,
    tax_rate: toSafeNumber(input.hourlyRate),
    break_deduction: toSafeNumber(input.otRate),
    hourly_rate: toSafeNumber(input.hourlyRate),
    ot_rate: toSafeNumber(input.otRate),
    ot_pay: toSafeNumber(input.otPay),
    total_pay: toSafeNumber(input.totalPay),
  };

  let { error } = await supabase.from("work_logs").insert(payload);

  if (error) {
    const fallbackPayload = {
      user_id: user.id,
      shift_date: input.shiftDate,
      hours_worked: toSafeNumber(input.hoursWorked),
      manual_amount_flag: input.manualAmountFlag,
      tax_rate: toSafeNumber(input.hourlyRate),
      break_deduction: toSafeNumber(input.otRate),
      total_pay: toSafeNumber(input.totalPay),
    };

    const fallbackInsert = await supabase.from("work_logs").insert(fallbackPayload);
    error = fallbackInsert.error;
  }

  if (error) {
    return {
      success: false,
      message: "บันทึกข้อมูลไม่สำเร็จ เนื่องจากเชื่อมต่อฐานข้อมูลไม่ได้",
    };
  }

  revalidatePath("/");

  return {
    success: true,
    message: "บันทึกข้อมูลกะงานเรียบร้อยแล้ว",
  };
}

export async function deleteShiftAction(recordId: string): Promise<ActionResult> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: errorMessage };
  }

  const { error } = await supabase
    .from("work_logs")
    .delete()
    .eq("id", recordId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      message: "ลบข้อมูลไม่สำเร็จ เนื่องจากเชื่อมต่อฐานข้อมูลไม่ได้",
    };
  }

  revalidatePath("/");

  return {
    success: true,
    message: "ลบข้อมูลเรียบร้อยแล้ว",
  };
}
