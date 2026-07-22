import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, error: 'Phone number and Student PIN are required.' },
        { status: 400 }
      );
    }

    const normPhone = String(phone).trim();
    const normPin = String(pin).trim();

    // Use the Coaching Platform API Bridge to authenticate against the old database
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    
    const { createClient } = await import('@supabase/supabase-js');
    const coachingAdmin = createClient(coachingUrl, coachingKey);

    const { data: students, error } = await coachingAdmin
      .from('students')
      .select('id, name, roll_no, parent_phone, batch, standard, coaching_center_id, pin')
      .eq('parent_phone', normPhone);

    if (error) {
      return NextResponse.json({ ok: false, error: 'Database error.' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid Phone Number or PIN.' },
        { status: 401 }
      );
    }

    // Authenticate if ANY child matches the provided PIN
    const isValid = students.some((s) => String(s.pin ?? '').trim() === normPin);

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid Phone Number or PIN.' },
        { status: 401 }
      );
    }

    // Build session
    const session = {
      phone: normPhone,
      coaching_center_id: students[0].coaching_center_id, // assuming all siblings are in same coaching for MVP
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        batch: s.batch,
        standard: s.standard,
        roll_no: s.roll_no
      }))
    };

    const response = NextResponse.json({ ok: true });
    response.cookies.set('exam_parent_session', JSON.stringify(session), {
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
