const BASE_RATE = 50;
const OT_RATE = 75;
const REGULAR_HOURS_LIMIT = 8;

export type PayBreakdown = {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
};

export function calculatePay(
  hoursWorked: number,
  hourlyRate: number = BASE_RATE,
  otRate: number = OT_RATE,
): PayBreakdown {
  const safeHours = Number.isFinite(hoursWorked) ? Math.max(0, hoursWorked) : 0;
  const safeHourlyRate = Number.isFinite(hourlyRate) ? Math.max(0, hourlyRate) : BASE_RATE;
  const safeOtRate = Number.isFinite(otRate) ? Math.max(0, otRate) : OT_RATE;
  const regularHours = Math.min(safeHours, REGULAR_HOURS_LIMIT);
  const overtimeHours = Math.max(safeHours - REGULAR_HOURS_LIMIT, 0);
  const regularPay = regularHours * safeHourlyRate;
  const overtimePay = overtimeHours * safeOtRate;

  return {
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    totalPay: regularPay + overtimePay,
  };
}
