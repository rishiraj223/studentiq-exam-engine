import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const body = await req.json();
    const { testId, currentQuestion, timeLeft, tabSwitches, fullscreenExits } = body;

    if (!testId) return NextResponse.json({ error: 'Missing testId' }, { status: 400 });

    const admin = createAdminClient();

    // Upsert live session
    const { data: sessionData, error: upsertErr } = await admin
      .from('live_test_sessions')
      .upsert({
        student_id: session.student_id,
        test_template_id: testId,
        coaching_id: session.coaching_center_id,
        student_name: session.name,
        batch_name: session.batch || 'Unknown Batch',
        current_question: currentQuestion || 0,
        time_left: timeLeft || 0,
        tab_switches: tabSwitches || 0,
        fullscreen_exits: fullscreenExits || 0,
        last_ping: new Date().toISOString()
      }, { onConflict: 'student_id, test_template_id' })
      .select('status')
      .single();

    if (upsertErr) {
      console.error('Live Ping Upsert Error:', upsertErr);
      return NextResponse.json({ error: 'Failed to update live session' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      forceSubmit: sessionData?.status === 'force_submit'
    });
  } catch (error) {
    console.error('Live Ping Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
