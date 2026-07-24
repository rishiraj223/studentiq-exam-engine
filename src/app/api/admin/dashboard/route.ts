import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;

    const coachingAdmin = createClient(
      process.env.COACHING_SUPABASE_URL!,
      process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!
    );
    const examAdmin = createAdminClient();

    // Run all queries in parallel for speed
    const [studentsRes, testsRes, attemptsRes, recentAttemptsRes, coachingRes] = await Promise.all([
      // Total student count from CRM (live)
      coachingAdmin
        .from('students')
        .select('id, standard', { count: 'exact' })
        .eq('coaching_center_id', coachingId),

      // Total assigned tests for this coaching
      examAdmin
        .from('mock_test_templates')
        .select('id, name, created_at', { count: 'exact' })
        .eq('coaching_id', coachingId)
        .order('created_at', { ascending: false })
        .limit(3),

      // Total test attempts by all students of this coaching
      examAdmin
        .from('test_attempts')
        .select('id, student_id, total_score, created_at, student_name', { count: 'exact' })
        .eq('coaching_id', coachingId)
        .order('created_at', { ascending: false })
        .limit(8),

      // Recent attempts for activity feed (with template name)
      examAdmin
        .from('test_attempts')
        .select('id, student_name, total_score, created_at, mock_test_templates(name, total_marks)')
        .eq('coaching_id', coachingId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Coaching details from CRM (for name verification)
      coachingAdmin
        .from('coaching_centers')
        .select('name, plan_type, account_status')
        .eq('id', coachingId)
        .single(),
    ]);

    const students = studentsRes.data || [];
    const totalStudents = studentsRes.count || 0;

    // Count students by standard
    const students11th = students.filter((s: any) => s.standard === '11th').length;
    const students12th = students.filter((s: any) => s.standard === '12th').length;

    const totalTests = testsRes.count || 0;
    const totalAttempts = attemptsRes.count || 0;
    const recentTests = testsRes.data || [];

    // Build activity feed
    const recentActivity = (recentAttemptsRes.data || []).map((att: any) => {
      const tmpl = att.mock_test_templates as any;
      return {
        studentName: att.student_name || 'Unknown Student',
        testName: tmpl?.name || 'Test',
        score: att.total_score,
        maxMarks: tmpl?.total_marks || 1,
        scorePercent: Math.round(Math.max(0, att.total_score) / (tmpl?.total_marks || 1) * 100),
        date: att.created_at,
      };
    });

    // Calculate average score across all attempts
    const attempts = attemptsRes.data || [];
    let avgScorePercent = 0;
    if (attempts.length > 0) {
      // We don't have total_marks in this query, so compute from recentActivity as approximation
      avgScorePercent = recentActivity.length > 0
        ? Math.round(recentActivity.reduce((s: number, a: any) => s + a.scorePercent, 0) / recentActivity.length)
        : 0;
    }

    const coachingInfo = coachingRes.data;

    return NextResponse.json({
      stats: {
        totalStudents,
        students11th,
        students12th,
        totalTests,
        totalAttempts,
        avgScorePercent,
        coachingId,
      },
      recentTests,
      recentActivity,
      coachingInfo,
    });
  } catch (err) {
    console.error('Dashboard Stats API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
