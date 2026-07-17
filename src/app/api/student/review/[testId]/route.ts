import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    if (!session?.student_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // 1. Get the test template
    const { data: tmpl, error: tmplErr } = await admin
      .from('mock_test_templates')
      .select('id, name, exam_type, total_marks, duration_minutes, sections')
      .eq('id', testId)
      .single();

    if (tmplErr || !tmpl) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // 2. Get THIS student's attempt (must have completed it)
    const { data: attempt, error: attErr } = await admin
      .from('test_attempts')
      .select('id, total_score, correct_count, incorrect_count, unanswered_count, time_taken_seconds, responses, created_at')
      .eq('test_template_id', testId)
      .eq('student_id', session.student_id)
      .single();

    if (attErr || !attempt) return NextResponse.json({ error: 'You have not attempted this test' }, { status: 404 });

    // 3. Get all question IDs from sections (preserving order)
    const allIds = Object.values(tmpl.sections as Record<string, string[]>).flat();

    // 4. Fetch full question data including correct answer and explanation
    const { data: questions, error: qErr } = await admin
      .from('questions')
      .select('id, question_text, options, correct_answer_index, marks, negative_marks, subject, chapter, image_url, explanation')
      .in('id', allIds);

    if (qErr || !questions) return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });

    // 5. Build a map of questionId → studentResponse
    const responseMap: Record<string, { selected_option: number | null; is_correct: boolean | null; status: string }> = {};
    const responses = attempt.responses as Array<{
      question_id: string;
      selected_option: number | null;
      is_correct: boolean | null;
      status: string;
    }>;
    for (const r of (responses || [])) {
      responseMap[r.question_id] = {
        selected_option: r.selected_option,
        is_correct: r.is_correct,
        status: r.status,
      };
    }

    // 6. Build a map for quick lookup
    const questionMap: Record<string, any> = {};
    for (const q of questions) questionMap[q.id] = q;

    // 7. Merge in section order, preserving subject grouping
    const sections: Record<string, Array<{
      questionId: string;
      questionText: string;
      imageUrl: string | null;
      options: string[];
      correctIndex: number;
      selectedIndex: number | null;
      isCorrect: boolean | null;
      marks: number;
      negativeMarks: number;
      subject: string;
      chapter: string;
      explanation: string | null;
      status: string;
    }>> = {};

    for (const [subject, qIds] of Object.entries(tmpl.sections as Record<string, string[]>)) {
      sections[subject] = qIds.map((qid, idx) => {
        const q = questionMap[qid];
        const r = responseMap[qid];
        if (!q) return null;
        return {
          questionId: qid,
          questionNumber: idx + 1,
          questionText: q.question_text,
          imageUrl: q.image_url || null,
          options: q.options,
          correctIndex: q.correct_answer_index,
          selectedIndex: r?.selected_option ?? null,
          isCorrect: r?.is_correct ?? null,
          marks: q.marks,
          negativeMarks: q.negative_marks,
          subject: q.subject,
          chapter: q.chapter,
          explanation: q.explanation || null,
          status: r?.status || 'not-visited',
        };
      }).filter((q): q is NonNullable<typeof q> => q !== null);
    }

    const accuracy = (attempt.correct_count + attempt.incorrect_count) > 0
      ? Math.round(attempt.correct_count / (attempt.correct_count + attempt.incorrect_count) * 100)
      : 0;

    return NextResponse.json({
      test: {
        id: tmpl.id,
        name: tmpl.name,
        examType: tmpl.exam_type,
        totalMarks: tmpl.total_marks,
        durationMinutes: tmpl.duration_minutes,
      },
      attempt: {
        totalScore: attempt.total_score,
        correctCount: attempt.correct_count,
        incorrectCount: attempt.incorrect_count,
        unansweredCount: attempt.unanswered_count,
        timeTakenSeconds: attempt.time_taken_seconds,
        accuracy,
        date: attempt.created_at,
      },
      sections,
    });
  } catch (err) {
    console.error('Review API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
