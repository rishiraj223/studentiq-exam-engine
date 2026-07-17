import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { ok: false, error: 'Phone number and PIN are required.' },
        { status: 400 }
      );
    }

    const normPhone = String(phone).trim();
    const normPin = String(pin).trim();

    // Use the Coaching Platform API Bridge to authenticate against the old database
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    
    // We cannot use createAdminClient() here because that points to the Exam DB
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

    // Find matching student — plain text PIN comparison (MVP)
    const student = students.find((s) => String(s.pin ?? '').trim() === normPin);

    if (!student) {
      return NextResponse.json(
        { ok: false, error: 'Invalid Phone Number or PIN.' },
        { status: 401 }
      );
    }

    // Build session — same structure as SSO cookie for consistency
    const session = {
      student_id: student.id,
      roll_no: student.roll_no,
      name: student.name,
      batch: student.batch,
      standard: student.standard,
      coaching_center_id: student.coaching_center_id,
    };

    const response = NextResponse.json({ ok: true, name: student.name });
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
