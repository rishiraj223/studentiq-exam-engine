import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and Password are required.' }, { status: 400 });
    }

    // Connect to the Coaching Database
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    
    const { createClient } = await import('@supabase/supabase-js');
    const coachingAdmin = createClient(coachingUrl, coachingKey);

    // Authenticate the user against the old coaching DB
    const { data: authData, error: authError } = await coachingAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: 'Invalid Email or Password.' }, { status: 401 });
    }

    const coachingId = authData.user.id;

    // Fetch the coaching name for the UI
    const { data: coachingData } = await coachingAdmin
      .from('coaching_centers')
      .select('name')
      .eq('id', coachingId)
      .single();

    const coachingName = coachingData?.name || 'Coaching Admin';

    // Create session cookie
    const response = NextResponse.json({ ok: true, coachingId, coachingName });
    
    const sessionData = JSON.stringify({
      coaching_id: coachingId,
      coaching_name: coachingName,
      email: authData.user.email
    });

    response.cookies.set('exam_coaching_session', sessionData, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
