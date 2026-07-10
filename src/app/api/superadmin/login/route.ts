import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { secretKey } = await request.json();
    
    // Check against env var — uses SUPER_ADMIN_SECURITY_CODE from .env
    const validKey = process.env.SUPER_ADMIN_SECURITY_CODE || process.env.SUPERADMIN_SECRET_KEY || 'superadmin123';
    
    if (secretKey === validKey) {
      // Set a secure cookie
      const cookieStore = await cookies();
      cookieStore.set('superadmin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/superadmin',
        maxAge: 60 * 60 * 24 // 1 day
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
