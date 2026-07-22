import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIService } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const studentId = session.student_id;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const admin = createAdminClient();

    // Fetch student's last 10 test attempts
    const { data: attempts } = await admin
      .from('test_attempts')
      .select('total_score, correct_count, incorrect_count, responses')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ 
        studyPlan: [], 
        recommendations: [], 
        estimatedRank: 'Not Enough Data' 
      });
    }

    // Process attempts
    let totalQuestions = 0;
    let totalCorrect = 0;
    let incorrectQIds: string[] = [];

    attempts.forEach(att => {
      totalQuestions += (att.correct_count + att.incorrect_count);
      totalCorrect += att.correct_count;
      
      const responses = att.responses as any[];
      if (responses) {
        responses.forEach(r => {
          if (r.is_correct === false) incorrectQIds.push(r.question_id);
        });
      }
    });

    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const estimatedRank = AIService.estimateRank(avgAccuracy, 'JEE');

    // Get chapters for incorrect questions
    let weakChapters: string[] = [];
    let chapterFails: Record<string, number> = {};

    if (incorrectQIds.length > 0) {
      // Limit to last 50 incorrect to prevent huge payloads
      const { data: qs } = await admin
        .from('questions')
        .select('chapter')
        .in('id', incorrectQIds.slice(0, 50));

      if (qs) {
        qs.forEach(q => {
          const chap = q.chapter || 'General';
          chapterFails[chap] = (chapterFails[chap] || 0) + 1;
        });
        weakChapters = AIService.getChapterRecommendations(chapterFails);
      }
    }

    if (action === 'recommendations') {
      return NextResponse.json({ recommendations: weakChapters });
    }

    // action === 'study-plan'
    const studyPlan = await AIService.generateStudyPlan(weakChapters, 7);

    return NextResponse.json({
      studyPlan,
      estimatedRank,
      weakChapters
    });

  } catch (error) {
    console.error('Student AI API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
