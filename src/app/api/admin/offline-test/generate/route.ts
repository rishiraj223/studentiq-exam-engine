import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface SectionRequest {
  subject: string;
  chapters: string[];
  count: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionData = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingName = sessionData.coaching_name || 'Coaching Center';
    const coachingId   = sessionData.coaching_id;

    const body = await req.json();
    const {
      exam,
      standard,
      duration,
      testName,
      avoidRepeats,
      // Single-subject mode
      subject,
      chapters,
      difficulty,
      difficultyMix,
      count,
      mcqCount,        // for NTA pattern
      numericalCount,  // for NTA pattern
      // Multi-subject mode
      mode,
      sections,
    } = body;

    const admin = createAdminClient();

    if (mode === 'history' && body.questionIds && body.questionIds.length > 0) {
      const { data, error } = await admin
        .from('questions')
        .select('id, question_text, options, image_url, correct_answer_index, subject, chapter, difficulty, marks, negative_marks, standard, explanation, question_type, numerical_answer')
        .in('id', body.questionIds);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      
      // Keep the original order of the IDs
      const orderedQuestions = body.questionIds.map((id: string) => data?.find((q: any) => q.id === id)).filter(Boolean);
      const totalMarks = orderedQuestions.reduce((sum: number, q: any) => sum + (q.marks || 4), 0);
      const mcqs = orderedQuestions.filter((q: any) => q.question_type !== 'numerical');
      const nums = orderedQuestions.filter((q: any) => q.question_type === 'numerical');

      return NextResponse.json({
        questions: orderedQuestions,
        coachingName,
        testName: testName || 'Saved Test',
        duration: duration || null,
        totalMarks,
        mcqCount: mcqs.length,
        numericalCount: nums.length,
      });
    }

    if (!exam || !standard) {
      return NextResponse.json({ error: 'Missing exam or standard' }, { status: 400 });
    }

    // ── Feature E: Get recently used question IDs ──────────────────────────
    let usedIds: string[] = [];
    if (avoidRepeats && coachingId) {
      const { data: recentHistory } = await admin
        .from('offline_test_history')
        .select('question_ids')
        .eq('coaching_id', coachingId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentHistory) {
        usedIds = recentHistory.flatMap((h: any) => h.question_ids || []);
      }
    }

    // ── Helper: fetch questions for one subject/chapters combo ─────────────
    const fetchQuestionsForSection = async (
      subj: string,
      chapterList: string[],
      diff: string,
      requested: number,
      diffMix?: { easy: number; medium: number; hard: number } | null
    ): Promise<any[]> => {
      if (!subj || chapterList.length === 0) return [];

      const baseQuery = admin
        .from('questions')
        .select('id, question_text, options, image_url, correct_answer_index, subject, chapter, difficulty, marks, negative_marks, standard, explanation, question_type, numerical_answer')
        .eq('exam_type', exam)
        .eq('standard', standard)
        .eq('subject', subj)
        .in('chapter', chapterList);

      // Exclude recently used question IDs (Feature E)
      let finalQuestions: any[] = [];

      if (diffMix && diff === 'mix') {
        // Feature D: Difficulty mix — fetch each difficulty separately
        const levels = ['easy', 'medium', 'hard'] as const;
        for (const level of levels) {
          const needed = diffMix[level];
          if (needed <= 0) continue;

          let q = baseQuery.eq('difficulty', level);
          if (usedIds.length > 0) q = q.not('id', 'in', `(${usedIds.join(',')})`);
          const { data } = await q.limit(needed * 5); // fetch pool then slice
          const shuffled = shuffle(data || []).slice(0, needed);
          finalQuestions.push(...shuffled);
        }
      } else {
        // Normal difficulty filter
        let q = diff && diff !== 'all' ? baseQuery.eq('difficulty', diff) : baseQuery;
        if (usedIds.length > 0) q = q.not('id', 'in', `(${usedIds.join(',')})`);
        const { data, error } = await q.limit(500);
        if (error) {
          console.error('Question fetch error:', error.message);
          return [];
        }
        finalQuestions = shuffle(data || []).slice(0, requested);
      }

      return finalQuestions;
    };

    let allQuestions: any[] = [];

    if (mode === 'multi' && sections && sections.length > 0) {
      // ── Multi-subject mode (Feature C) ──────────────────────────────────
      for (const sec of sections as SectionRequest[]) {
        const qs = await fetchQuestionsForSection(sec.subject, sec.chapters, 'all', sec.count);
        allQuestions.push(...qs);
      }
    } else {
      // ── Single-subject mode ──────────────────────────────────────────────
      const chapterList: string[] = chapters || [];
      if (chapterList.length === 0) {
        return NextResponse.json({ error: 'No chapters selected' }, { status: 400 });
      }

      const buildQuery = (qType: string) => {
        let q = admin
          .from('questions')
          .select('id, question_text, options, image_url, correct_answer_index, subject, chapter, difficulty, marks, negative_marks, standard, explanation, question_type, numerical_answer')
          .eq('exam_type', exam)
          .eq('standard', standard)
          .eq('subject', subject)
          .in('chapter', chapterList)
          .eq('question_type', qType);
        
        if (usedIds.length > 0) q = q.not('id', 'in', `(${usedIds.join(',')})`);
        return q;
      };

      if (mcqCount !== undefined && numericalCount !== undefined) {
        let mcqQuery = buildQuery('mcq');
        let numQuery = buildQuery('numerical');

        const [mcqRes, numRes] = await Promise.all([
          mcqQuery.limit(parseInt(mcqCount.toString()) * 4),
          numQuery.limit(parseInt(numericalCount.toString()) * 4),
        ]);

        const mcqs = shuffle(mcqRes.data || []).slice(0, parseInt(mcqCount.toString()));
        let nums = shuffle(numRes.data || []).slice(0, parseInt(numericalCount.toString()));

        // Fallback: if not enough numericals, fill with more MCQs
        if (nums.length < parseInt(numericalCount.toString())) {
          const deficit = parseInt(numericalCount.toString()) - nums.length;
          const extraMcqs = shuffle(mcqRes.data || []).slice(parseInt(mcqCount.toString()), parseInt(mcqCount.toString()) + deficit);
          nums = [...nums, ...extraMcqs];
        }

        allQuestions = [...mcqs, ...nums];

        if (allQuestions.length === 0) {
          return NextResponse.json({ questions: [], coachingName, testName, duration });
        }

        const totalMarks = allQuestions.reduce((sum: number, q: any) => sum + (q.marks || 4), 0);

        return NextResponse.json({
          questions: allQuestions,
          coachingName,
          testName: testName || `${subject} — ${exam}`,
          duration: duration || null,
          totalMarks,
          mcqCount: mcqs.length,
          numericalCount: nums.length,
        });
      }

      // Feature D: check for difficulty mix
      const isDiffMix = difficulty === 'mix' && difficultyMix;

      allQuestions = await fetchQuestionsForSection(
        subject,
        chapterList,
        difficulty,
        parseInt(count?.toString() || '20', 10),
        isDiffMix ? difficultyMix : null
      );
    }

    if (allQuestions.length === 0) {
      return NextResponse.json({ questions: [], coachingName, testName, duration });
    }

    // Calculate actual total marks from question data
    const totalMarks = allQuestions.reduce((sum: number, q: any) => sum + (q.marks || 4), 0);

    return NextResponse.json({
      questions: allQuestions,
      coachingName,
      testName: testName || `${subject || 'Mixed'} — ${exam}`,
      duration: duration || null,
      totalMarks,
    });

  } catch (error: any) {
    console.error('Offline Test Generate API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
