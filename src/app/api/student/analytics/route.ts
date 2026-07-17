import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    if (!session?.student_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Get all attempts for this student
    const { data: attempts, error: attErr } = await admin
      .from('test_attempts')
      .select('id, test_template_id, correct_count, incorrect_count, unanswered_count, responses')
      .eq('student_id', session.student_id);

    if (attErr || !attempts || attempts.length === 0) {
      return NextResponse.json({ subjectStats: [], chapterStats: [] });
    }

    // Collect all question IDs from all responses
    const allQuestionIds: string[] = [];
    const responseMap: Record<string, { selected_option: number | null; is_correct: boolean | null }> = {};

    for (const att of attempts) {
      const responses = att.responses as Array<{
        question_id: string;
        selected_option: number | null;
        is_correct: boolean | null;
      }>;
      if (!responses) continue;
      for (const r of responses) {
        allQuestionIds.push(r.question_id);
        // Later response overwrites earlier — that's fine since each test is independent
        if (!responseMap[r.question_id]) {
          responseMap[r.question_id] = { selected_option: r.selected_option, is_correct: r.is_correct };
        }
      }
    }

    if (allQuestionIds.length === 0) {
      return NextResponse.json({ subjectStats: [], chapterStats: [] });
    }

    // Fetch subject + chapter info for all those question IDs
    const { data: questions, error: qErr } = await admin
      .from('questions')
      .select('id, subject, chapter')
      .in('id', [...new Set(allQuestionIds)]);

    if (qErr || !questions) {
      return NextResponse.json({ subjectStats: [], chapterStats: [] });
    }

    // Build per-attempt responses for accurate counting
    // We want: for each subject/chapter → correct, incorrect, unanswered
    const subjectMap: Record<string, { correct: number; incorrect: number; unanswered: number }> = {};
    const chapterMap: Record<string, { subject: string; correct: number; incorrect: number; unanswered: number }> = {};

    const questionMeta: Record<string, { subject: string; chapter: string }> = {};
    for (const q of questions) {
      questionMeta[q.id] = { subject: q.subject, chapter: q.chapter };
    }

    // Re-iterate all responses across all attempts
    for (const att of attempts) {
      const responses = att.responses as Array<{
        question_id: string;
        selected_option: number | null;
        is_correct: boolean | null;
      }>;
      if (!responses) continue;

      for (const r of responses) {
        const meta = questionMeta[r.question_id];
        if (!meta) continue;

        const { subject, chapter } = meta;
        const chapterKey = `${subject}||${chapter}`;

        if (!subjectMap[subject]) subjectMap[subject] = { correct: 0, incorrect: 0, unanswered: 0 };
        if (!chapterMap[chapterKey]) chapterMap[chapterKey] = { subject, correct: 0, incorrect: 0, unanswered: 0 };

        if (r.is_correct === true) {
          subjectMap[subject].correct++;
          chapterMap[chapterKey].correct++;
        } else if (r.is_correct === false) {
          subjectMap[subject].incorrect++;
          chapterMap[chapterKey].incorrect++;
        } else {
          subjectMap[subject].unanswered++;
          chapterMap[chapterKey].unanswered++;
        }
      }
    }

    // Format subject stats
    const subjectStats = Object.entries(subjectMap).map(([subject, counts]) => {
      const total = counts.correct + counts.incorrect + counts.unanswered;
      const attempted = counts.correct + counts.incorrect;
      const accuracy = attempted > 0 ? Math.round((counts.correct / attempted) * 100) : 0;
      return { subject, ...counts, total, accuracy };
    }).sort((a, b) => b.accuracy - a.accuracy);

    // Format chapter stats
    const chapterStats = Object.entries(chapterMap).map(([key, counts]) => {
      const [, chapter] = key.split('||'); // subject is already inside `counts`
      const total = counts.correct + counts.incorrect + counts.unanswered;
      const attempted = counts.correct + counts.incorrect;
      const accuracy = attempted > 0 ? Math.round((counts.correct / attempted) * 100) : 0;
      return { chapter, ...counts, total, accuracy };
    }).sort((a, b) => a.accuracy - b.accuracy); // weakest first

    return NextResponse.json({ subjectStats, chapterStats });
  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
