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

// ลบฟังก์ชัน saveLogShiftAction และ saveCalculatedPayAction เดิมทิ้ง แล้ววางโค้ดนี้แทน

export async function saveLogShiftAction(input: SaveLogShiftInput): Promise<ActionResult> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();
  if (!user) {
    console.error("AUTH ERROR: No user");
    return { success: false, message: errorMessage };
  }

  const safeDate = (input.date ?? "").trim();
  if (!safeDate) {
    return { success: false, message: "กรุณาเลือกวันที่ทำงาน" };
  }

  const payload = {
    user_id: user.id,
    date: safeDate,
    hours_worked: toSafeNumber(input.hoursWorked),
    ot_hours: toSafeNumber(input.otHours),
    total_pay: 0,
  };

  try {
    // ใช้ upsert เพื่อให้บันทึกวันเดิมแล้วไม่ออกมาเบิ้ล (ต้องอิงจาก unique constraint ที่เราสร้าง)
    const { error } = await supabase.from("work_logs").upsert(payload, {
      onConflict: 'user_id, date'
    });

    if (error) {
      console.error("SUPABASE ERROR (Log Shift):", error);
      return { success: false, message: "บันทึกชั่วโมงทำงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }
  } catch (error) {
    console.error("SUPABASE CATCH ERROR:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }

  revalidatePath("/log-shift");
  revalidatePath("/calculate-pay");
  
  return { success: true, message: "บันทึกเวลาทำงานเรียบร้อยแล้ว" };
}

export async function saveCalculatedPayAction(input: SaveCalculatedPayInput): Promise<ActionResult> {
  const { supabase, user, errorMessage } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, message: errorMessage };
  }

  const safeDate = (input.date ?? "").trim();
  if (!safeDate) {
    return { success: false, message: "ไม่พบวันที่ของชั่วโมงที่เลือก" };
  }

  const payload = {
    base_rate: toSafeNumber(input.baseRate),
    tax_rate: toSafeNumber(input.taxRate),
    ot_rate: toSafeNumber(input.otRate), // เพิ่ม ot_rate ให้ตรงกับ Database
    is_manual: Boolean(input.isManual),
    total_pay: toSafeNumber(input.totalPay),
  };

  try {
    // ใช้ UPDATE เพื่อแก้ไขเงินเข้าไปในบรรทัดเดิมที่มีชั่วโมงอยู่แล้ว
    const { error } = await supabase
      .from("work_logs")
      .update(payload)
      .eq('user_id', user.id)
      .eq('date', safeDate);

    if (error) {
      console.error("SUPABASE ERROR (Calc Pay):", error);
      return { success: false, message: "บันทึกผลคำนวณไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }
  } catch (error) {
    console.error("SUPABASE CATCH ERROR:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกผลคำนวณ" };
  }

  revalidatePath("/log-shift");
  revalidatePath("/calculate-pay");

  return { success: true, message: "บันทึกผลคำนวณเรียบร้อยแล้ว" };
}

export async function deleteLogAction(id: number): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  try {
    const { error } = await supabase
      .from("work_logs")
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // ปลอดภัยไว้ก่อน ต้องเป็นเจ้าของเท่านั้นที่ลบได้

    if (error) throw error;
    
    revalidatePath("/log-shift");
    revalidatePath("/calculate-pay");
    return { success: true, message: "ลบข้อมูลเรียบร้อยแล้ว" };
  } catch (error) {
    return { success: false, message: "ไม่สามารถลบข้อมูลได้" };
  }
}