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

    // Restore base64url to standard base64
    const sigBase64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    const sigBuffer = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(data));
    if (!valid) return null;

    const payload = JSON.parse(atob(body)) as Record<string, unknown>;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: 'No token provided.' }, { status: 400 });
    }

    const secret = process.env.JWT_SECRET!;
    const payload = await verify(token, secret);

    if (!payload || payload.type !== 'student_sso') {
      return NextResponse.json({ ok: false, error: 'Invalid or expired SSO link.' }, { status: 401 });
    }

    // Build the student session object to store in cookie
    const session = {
      student_id: payload.student_id,
      roll_no: payload.roll_no,
      name: payload.name,
      batch: payload.batch,
      standard: payload.standard,
      coaching_center_id: payload.coaching_center_id,
    };

    const response = NextResponse.json({ ok: true });
    response.cookies.set('exam_student_session', JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
}
