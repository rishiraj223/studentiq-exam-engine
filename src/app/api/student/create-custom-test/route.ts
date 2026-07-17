import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    if (!session || !session.student_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { examType, subjects, totalQuestions, durationMinutes, testName, isChapterMode, chapterName } = body;
    
    if (!examType) return NextResponse.json({ error: 'Exam type is required' }, { status: 400 });

    const admin = createAdminClient();
    const sections: Record<string, string[]> = {};
    let totalMarks = 0;
    let fetchedQs = 0;

    // Handle Custom vs Chapter Test modes
    if (isChapterMode && chapterName && subjects.length === 1) {
      const subject = subjects[0];
      const { data: questions } = await admin
        .from('questions')
        .select('id, marks')
        .eq('exam_type', examType)
        .eq('subject', subject)
        .eq('chapter', chapterName);

      if (!questions || questions.length === 0) {
        return NextResponse.json({ error: `No questions found for ${chapterName}` }, { status: 400 });
      }

      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(totalQuestions || 20, shuffled.length));
      
      sections[subject] = [];
      selected.forEach(q => {
        sections[subject].push(q.id);
        totalMarks += q.marks || 4;
        fetchedQs++;
      });
    } else {
      // CUSTOM TEST MODE
      if (!subjects || subjects.length === 0) {
        return NextResponse.json({ error: 'At least one subject is required' }, { status: 400 });
      }
      
      const targetQuestionsPerSubject = Math.floor(totalQuestions / subjects.length);
      const fetchPromises = subjects.map(async (subject: string) => {
        const { data: questions } = await admin
          .from('questions')
          .select('id, marks')
          .eq('exam_type', examType)
          .eq('subject', subject);
        // Note: We don't filter by standard here because the user explicitly requested BOTH 11th and 12th standards to be included in custom tests!
        
        if (!questions || questions.length === 0) return null;

        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(targetQuestionsPerSubject, shuffled.length));
        return { subject, selected };
      });

      const results = await Promise.all(fetchPromises);

      results.forEach(result => {
        if (!result) return;
        const { subject, selected } = result;
        sections[subject] = [];
        selected.forEach((q: any) => {
          sections[subject].push(q.id);
          totalMarks += q.marks || 4;
          fetchedQs++;
        });
      });
    }

    if (fetchedQs === 0) {
      return NextResponse.json(
        { error: 'Not enough questions in the database to create this test.' },
        { status: 400 }
      );
    }

    const { data: newTest, error: insertError } = await admin
      .from('mock_test_templates')
      .insert({
        name: testName || `Custom ${examType} Test`,
        exam_type: examType,
        duration_minutes: durationMinutes || 60,
        total_marks: totalMarks,
        sections: sections,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ testId: newTest.id, totalQuestions: fetchedQs, totalMarks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
