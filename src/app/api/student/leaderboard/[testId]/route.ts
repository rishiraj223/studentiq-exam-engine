import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingId = session.coaching_center_id;
    if (!coachingId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // Verify the test actually belongs to this coaching (assigned test)
    // or if it's a generic test, at least verify existence
    const { data: testTemplate, error: testErr } = await admin
      .from('mock_test_templates')
      .select('id, test_mode, coaching_id')
      .eq('id', testId)
      .single();

    if (testErr || !testTemplate) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Only return leaderboards for assigned tests for the specific coaching center
    if (testTemplate.test_mode !== 'assigned' || testTemplate.coaching_id !== coachingId) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Fetch attempts for this coaching center only
    const { data: attempts, error: attemptsErr } = await admin
      .from('test_attempts')
      .select('id, student_id, student_name, total_score, correct_count, incorrect_count, time_taken_seconds, created_at')
      .eq('test_template_id', testId)
      .eq('coaching_id', coachingId)
      .order('total_score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(50); // Top 50

    if (attemptsErr) {
      console.error('Leaderboard fetch error:', attemptsErr);
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
    }

    return NextResponse.json({ leaderboard: attempts });

  } catch (error) {
    console.error('Student Leaderboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
