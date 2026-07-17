import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    const admin = createAdminClient(); // Bypasses RLS

    const [testsRes, attemptsRes] = await Promise.all([
      admin.from('mock_test_templates').select('*').order('created_at', { ascending: false }),
      admin.from('test_attempts').select('*').eq('student_id', session.student_id)
    ]);

    const attempts = attemptsRes.data || [];
    const tests = testsRes.data || [];

    // --- Compute Quick Stats ---
    let totalTests = attempts.length;
    let totalScoreSum = 0;
    let totalMaxScoreSum = 0;
    let totalCorrectQs = 0;
    let totalAttemptedQs = 0;

    attempts.forEach(att => {
      // Find the template to get max marks
      const tmpl = tests.find(t => t.id === att.test_template_id);
      if (tmpl && tmpl.total_marks > 0) {
        // Only average tests where we know the max marks
        totalScoreSum += att.total_score || 0;
        totalMaxScoreSum += tmpl.total_marks;
      }
      
      const answered = (att.correct_count || 0) + (att.incorrect_count || 0);
      if (answered > 0) {
        totalCorrectQs += (att.correct_count || 0);
        totalAttemptedQs += answered;
      }
    });

    const avgScorePercent = totalMaxScoreSum > 0 ? Math.round((totalScoreSum / totalMaxScoreSum) * 100) : 0;
    const accuracyPercent = totalAttemptedQs > 0 ? Math.round((totalCorrectQs / totalAttemptedQs) * 100) : 0;

    const quickStats = {
      totalTests,
      avgScorePercent,
      accuracyPercent,
    };

    return NextResponse.json({
      tests,
      attempts,
      quickStats
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
