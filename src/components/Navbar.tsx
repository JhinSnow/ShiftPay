"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserEmailAction, logoutAction } from "@/src/app/actions";

export default function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register") {
      getUserEmailAction().then(setEmail);
    }
  }, [pathname]);

  if (pathname === "/login" || pathname === "/register") return null;

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* แก้ไขตรงนี้: เช็กว่าถ้าไม่ใช่หน้าหลัก (/) และไม่ใช่ (/dashboard) ถึงจะโชว์ปุ่มย้อนกลับ */}
          {pathname !== "/" && pathname !== "/dashboard" ? (
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าหลัก
            </Link>
          ) : (
            <span className="font-bold text-emerald-600 text-xl tracking-tight">ShiftPay</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-600 hidden sm:block">
            {email || "กำลังโหลด..."}
          </span>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </nav>
  );
}