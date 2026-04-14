import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, response } = await updateSession(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginRoute = path === "/login";
  const isRegisterRoute = path === "/register";
  const isRootDashboardRoute = path === "/";
  const isDashboardRoute = path.startsWith("/dashboard");
  const isLogShiftRoute = path.startsWith("/log-shift");
  const isCalculateRoute = path.startsWith("/calculate");
  const isCalculatePayRoute = path.startsWith("/calculate-pay");
  const isProtectedRoute =
    isRootDashboardRoute || isDashboardRoute || isLogShiftRoute || isCalculateRoute || isCalculatePayRoute;

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if ((isLoginRoute || isRegisterRoute) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
