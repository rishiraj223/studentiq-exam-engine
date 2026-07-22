import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Fetch active sessions
export async function GET(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingId = session.coaching_id;
    if (!coachingId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // Active means last_ping was within the last 2 minutes and status != submitted
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: activeSessions, error } = await admin
      .from('live_test_sessions')
      .select('*')
      .eq('test_template_id', testId)
      .eq('coaching_id', coachingId)
      .neq('status', 'submitted')
      .gte('last_ping', twoMinsAgo)
      .order('last_ping', { ascending: false });

    if (error) {
      console.error('Live Monitor GET Error:', error);
      return NextResponse.json({ error: 'Failed to fetch active sessions' }, { status: 500 });
    }

    return NextResponse.json({ activeSessions: activeSessions || [] });
  } catch (error) {
    console.error('Live Monitor GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Force Submit All Action
export async function POST(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingId = session.coaching_id;
    if (!coachingId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // Update all active sessions for this test/coaching to 'force_submit'
    const { error: updateErr } = await admin
      .from('live_test_sessions')
      .update({ status: 'force_submit' })
      .eq('test_template_id', testId)
      .eq('coaching_id', coachingId)
      .eq('status', 'active');

    if (updateErr) {
      console.error('Live Monitor POST Error:', updateErr);
      return NextResponse.json({ error: 'Failed to force submit' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Live Monitor POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
