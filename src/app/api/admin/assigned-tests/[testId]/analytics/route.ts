import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingId = session.coaching_id;
    if (!coachingId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // Fetch test template
    const { data: testTemplate, error: testErr } = await admin
      .from('mock_test_templates')
      .select('id, name, exam_type, total_marks, duration_minutes, due_date')
      .eq('id', testId)
      .eq('coaching_id', coachingId)
      .single();

    if (testErr || !testTemplate) {
      return NextResponse.json({ error: 'Test not found or access denied' }, { status: 404 });
    }

    // Fetch all test attempts for this test & coaching center
    const { data: attempts, error: attemptsErr } = await admin
      .from('test_attempts')
      .select('id, student_id, student_name, total_score, correct_count, incorrect_count, unanswered_count, time_taken_seconds, created_at')
      .eq('test_template_id', testId)
      .eq('coaching_id', coachingId)
      .order('total_score', { ascending: false })
      .order('time_taken_seconds', { ascending: true });

    if (attemptsErr) {
      console.error('Analytics fetch error:', attemptsErr);
      return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
    }

    // Calculate aggregations
    const totalStudents = attempts.length;
    let avgScore = 0;
    let avgAccuracy = 0;
    let avgTimeSeconds = 0;

    if (totalStudents > 0) {
      let sumScore = 0;
      let sumAccuracy = 0;
      let sumTime = 0;

      attempts.forEach(att => {
        sumScore += att.total_score;
        sumTime += att.time_taken_seconds;
        const totalAttempted = att.correct_count + att.incorrect_count;
        if (totalAttempted > 0) {
          sumAccuracy += (att.correct_count / totalAttempted) * 100;
        }
      });

      avgScore = Math.round(sumScore / totalStudents);
      avgAccuracy = Math.round(sumAccuracy / totalStudents);
      avgTimeSeconds = Math.round(sumTime / totalStudents);
    }

    return NextResponse.json({
      test: testTemplate,
      metrics: {
        totalStudents,
        avgScore,
        avgAccuracy,
        avgTimeSeconds,
      },
      leaderboard: attempts
    });

  } catch (error) {
    console.error('Admin Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
