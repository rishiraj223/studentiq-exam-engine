import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    if (!session?.student_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // ✅ FIX: Only fetch THIS student's own templates (created_by filter)
    // Also fetch templates with no created_by for backwards compatibility (old tests)
    const [testsRes, attemptsRes] = await Promise.all([
      admin
        .from('mock_test_templates')
        .select('id, name, exam_type, duration_minutes, total_marks, created_at, created_by')
        .eq('created_by', session.student_id)
        .order('created_at', { ascending: false }),
      admin
        .from('test_attempts')
        .select('id, test_template_id, total_score, correct_count, incorrect_count, unanswered_count, time_taken_seconds, created_at')
        .eq('student_id', session.student_id)
        .order('created_at', { ascending: false }),
    ]);

    const attempts = attemptsRes.data || [];
    const tests = testsRes.data || [];

    // --- Compute Quick Stats from COMPLETED tests only ---
    let totalTests = attempts.length;
    let totalScoreSum = 0;
    let totalMaxScoreSum = 0;
    let totalCorrectQs = 0;
    let totalAttemptedQs = 0;

    attempts.forEach(att => {
      const tmpl = tests.find(t => t.id === att.test_template_id);
      if (tmpl && tmpl.total_marks > 0) {
        // ✅ FIX: Floor the score at 0 for percentage calculation (don't let negatives drag avg below 0)
        const clampedScore = Math.max(0, att.total_score || 0);
        totalScoreSum += clampedScore;
        totalMaxScoreSum += tmpl.total_marks;
      }

      const answered = (att.correct_count || 0) + (att.incorrect_count || 0);
      if (answered > 0) {
        totalCorrectQs += att.correct_count || 0;
        totalAttemptedQs += answered;
      }
    });

    const avgScorePercent = totalMaxScoreSum > 0 ? Math.round((totalScoreSum / totalMaxScoreSum) * 100) : 0;
    const accuracyPercent = totalAttemptedQs > 0 ? Math.round((totalCorrectQs / totalAttemptedQs) * 100) : 0;

    const quickStats = { totalTests, avgScorePercent, accuracyPercent };

    return NextResponse.json({ tests, attempts, quickStats });
  } catch (error) {
    console.error('dashboard-data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
