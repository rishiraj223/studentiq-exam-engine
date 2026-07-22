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

    // 1. Fetch Test Details
    const { data: test, error: testErr } = await admin
      .from('mock_test_templates')
      .select('id, name, exam_type')
      .eq('id', testId)
      .eq('coaching_id', coachingId)
      .single();

    if (testErr || !test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // 2. Fetch Attempts
    const { data: attempts, error: attErr } = await admin
      .from('test_attempts')
      .select('student_id, student_batch, total_score, correct_count, incorrect_count, responses')
      .eq('test_template_id', testId)
      .eq('coaching_id', coachingId);

    if (attErr) throw new Error('Failed to fetch attempts');

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ batchPerformance: [], questionDifficulty: [] });
    }

    // 3. Process Batch Performance
    const batchMap: Record<string, { totalScore: number, totalAccuracy: number, count: number }> = {};
    const questionFails: Record<string, number> = {};

    attempts.forEach(att => {
      const batchName = att.student_batch || 'Unknown Batch';
      
      if (!batchMap[batchName]) {
        batchMap[batchName] = { totalScore: 0, totalAccuracy: 0, count: 0 };
      }

      batchMap[batchName].count += 1;
      batchMap[batchName].totalScore += att.total_score;
      
      const totalAttempted = att.correct_count + att.incorrect_count;
      if (totalAttempted > 0) {
        batchMap[batchName].totalAccuracy += (att.correct_count / totalAttempted) * 100;
      }

      // Process Question Difficulty
      const responses = att.responses as any[];
      if (responses && Array.isArray(responses)) {
        responses.forEach(r => {
          if (r.is_correct === false) {
            questionFails[r.question_id] = (questionFails[r.question_id] || 0) + 1;
          }
        });
      }
    });

    const batchPerformance = Object.keys(batchMap).map(batchName => {
      const b = batchMap[batchName];
      return {
        batchName,
        totalAttempts: b.count,
        avgScore: Math.round(b.totalScore / b.count),
        avgAccuracy: Math.round(b.totalAccuracy / b.count)
      };
    });

    // 4. Process Question Difficulty Intelligence
    // Sort failed questions by frequency
    const sortedFails = Object.entries(questionFails)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15); // Top 15

    let questionDifficulty: any[] = [];

    if (sortedFails.length > 0) {
      const failedIds = sortedFails.map(f => f[0]);
      
      const { data: qData } = await admin
        .from('questions')
        .select('id, question_text, subject')
        .in('id', failedIds);
      
      if (qData) {
        questionDifficulty = sortedFails.map(([qId, failCount]) => {
          const qDetails = qData.find(q => q.id === qId);
          return {
            id: qId,
            text: qDetails?.question_text || 'Text not available',
            subject: qDetails?.subject || 'Unknown',
            incorrectCount: failCount,
            incorrectPercentage: Math.round((failCount / attempts.length) * 100)
          };
        });
      }
    }

    return NextResponse.json({
      batchPerformance,
      questionDifficulty
    });

  } catch (error) {
    console.error('Advanced Analytics Test API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
