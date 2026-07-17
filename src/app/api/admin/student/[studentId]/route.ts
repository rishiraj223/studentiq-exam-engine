import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { studentId } = await params;

    // 1. Fetch Student from CRM (to ensure they belong to this coaching)
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const coachingAdmin = createClient(coachingUrl, coachingKey);

    const { data: student, error: studentErr } = await coachingAdmin
      .from('students')
      .select('id, name, roll_no, batch, standard, coaching_center_id')
      .eq('id', studentId)
      .single();

    if (studentErr || !student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (student.coaching_center_id !== session.coaching_id) {
      return NextResponse.json({ error: 'Unauthorized access to student.' }, { status: 403 });
    }

    const examAdmin = createAdminClient();

    // 2. Fetch History
    const { data: attempts } = await examAdmin
      .from('test_attempts')
      .select(`
        id,
        test_template_id,
        total_score,
        correct_count,
        incorrect_count,
        time_taken_seconds,
        created_at,
        responses,
        mock_test_templates (
          name, exam_type, total_marks, test_mode
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    const history = [];
    let totalScorePercent = 0;
    
    // For analytics
    const allQuestionIds = new Set<string>();
    const responsesList: any[] = [];

    if (attempts) {
      for (const att of attempts) {
        const tmpl = att.mock_test_templates as any;
        const maxMarks = tmpl?.total_marks || 1;
        const scorePercent = Math.round(Math.max(0, att.total_score) / maxMarks * 100);
        totalScorePercent += scorePercent;
        
        history.push({
          id: att.id,
          testName: tmpl?.name || 'Unknown',
          examType: tmpl?.exam_type || '',
          scorePercent,
          correctCount: att.correct_count,
          incorrectCount: att.incorrect_count,
          timeTakenSeconds: att.time_taken_seconds,
          date: att.created_at,
          isAssigned: tmpl?.test_mode === 'assigned'
        });

        // Collect questions for analytics
        const res = att.responses as Array<{ question_id: string; is_correct: boolean | null }>;
        if (res) {
          responsesList.push(...res);
          res.forEach(r => allQuestionIds.add(r.question_id));
        }
      }
    }

    // 3. Analytics Engine
    let strongestSubject = null;
    let weakestSubject = null;
    const subjectMap: Record<string, { correct: number; incorrect: number }> = {};
    
    if (allQuestionIds.size > 0) {
      const { data: questions } = await examAdmin
        .from('questions')
        .select('id, subject')
        .in('id', Array.from(allQuestionIds));

      if (questions) {
        const qMap: Record<string, string> = {};
        questions.forEach(q => { qMap[q.id] = q.subject; });

        responsesList.forEach(r => {
          const subj = qMap[r.question_id];
          if (!subj) return;
          if (!subjectMap[subj]) subjectMap[subj] = { correct: 0, incorrect: 0 };
          
          if (r.is_correct === true) subjectMap[subj].correct++;
          else if (r.is_correct === false) subjectMap[subj].incorrect++;
        });

        let highestAcc = -1;
        let lowestAcc = 101;

        Object.entries(subjectMap).forEach(([subj, counts]) => {
          const att = counts.correct + counts.incorrect;
          if (att > 0) {
            const acc = Math.round((counts.correct / att) * 100);
            if (acc > highestAcc) { highestAcc = acc; strongestSubject = subj; }
            if (acc < lowestAcc) { lowestAcc = acc; weakestSubject = subj; }
          }
        });
      }
    }

    return NextResponse.json({
      student: {
        ...student,
        testsTaken: history.length,
        avgScore: history.length > 0 ? Math.round(totalScorePercent / history.length) : 0,
      },
      history,
      analytics: {
        strongestSubject,
        weakestSubject,
        subjectStats: Object.entries(subjectMap).map(([subj, counts]) => ({
          subject: subj,
          accuracy: (counts.correct + counts.incorrect) > 0 ? Math.round((counts.correct / (counts.correct + counts.incorrect)) * 100) : 0
        }))
      }
    });
  } catch (err) {
    console.error('Admin Student Detail error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
