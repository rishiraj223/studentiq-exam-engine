import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    if (!session?.student_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Fetch all attempts for this student with template info
    const { data: attempts, error } = await admin
      .from('test_attempts')
      .select(`
        id,
        test_template_id,
        total_score,
        correct_count,
        incorrect_count,
        unanswered_count,
        time_taken_seconds,
        created_at,
        mock_test_templates (
          id,
          name,
          exam_type,
          test_mode,
          total_marks,
          duration_minutes
        )
      `)
      .eq('student_id', session.student_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute rank for each test (how many students scored lower)
    const enriched = await Promise.all((attempts || []).map(async (att) => {
      const tmpl = att.mock_test_templates as any;
      const maxMarks = tmpl?.total_marks || 1;
      const scorePercent = Math.round(Math.max(0, att.total_score) / maxMarks * 100);
      const accuracy = (att.correct_count + att.incorrect_count) > 0
        ? Math.round(att.correct_count / (att.correct_count + att.incorrect_count) * 100)
        : 0;
      const isAssigned = tmpl?.test_mode === 'assigned';

      // Compute rank only if it's an assigned test where students compete
      let rank = 0;
      let totalParticipants = 1;
      
      if (isAssigned) {
        const { count: higherCount } = await admin
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_template_id', att.test_template_id)
          .gt('total_score', att.total_score);

        const { count: totalCount } = await admin
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_template_id', att.test_template_id);
          
        rank = (higherCount || 0) + 1;
        totalParticipants = totalCount || 1;
      }

      return {
        id: att.id,
        testId: att.test_template_id,
        testName: tmpl?.name || 'Unknown Test',
        examType: tmpl?.exam_type || '',
        totalMarks: maxMarks,
        totalScore: att.total_score,
        scorePercent,
        accuracy,
        correctCount: att.correct_count,
        incorrectCount: att.incorrect_count,
        unansweredCount: att.unanswered_count,
        timeTakenSeconds: att.time_taken_seconds,
        durationMinutes: tmpl?.duration_minutes || 0,
        rank,
        totalParticipants,
        date: att.created_at,
      };
    }));

    return NextResponse.json({ history: enriched });
  } catch (err) {
    console.error('History API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
