import { NextRequest, NextResponse } from 'next/server';

// Lightweight JWT verification using Web Crypto API — no extra deps
async function verify(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const encoder = new TextEncoder();
    const data = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBase64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    const sigBuffer = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(data));
    if (!valid) return null;

    const payload = JSON.parse(atob(body)) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const secret = process.env.JWT_SECRET!;
  const payload = await verify(token, secret);

  if (!payload || payload.type !== 'admin_sso') {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const session = {
    coaching_id: payload.coaching_center_id,
    coaching_name: payload.coaching_name,
    email: payload.email,
  };

  const response = NextResponse.redirect(new URL('/admin/dashboard', req.url));
  response.cookies.set('exam_coaching_session', JSON.stringify(session), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
