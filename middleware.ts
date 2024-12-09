import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Verificar si hay una sesión en las cookies
  const session = req.cookies.get('userSession')?.value;

  // Si no hay sesión y la ruta es protegida, redirigir al login
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/admin')
  )) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}; 