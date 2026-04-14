import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// ไม่ต้องดักหน้าไหนเลย ให้มันผ่านไปเฉยๆ
export const config = {
  matcher: [],
}