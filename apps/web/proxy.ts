import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hexclaveServerApp } from '@/hexclave/server';

export async function proxy(request: NextRequest) {
  const user = await hexclaveServerApp.getUser();

  if (!user) {
    if (request.nextUrl.pathname.startsWith('/health')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.redirect(new URL('/handler/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/private/:path*', '/health', '/health/:path*'],
};
