import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;
    const examAdmin = createAdminClient();

    // 1. Fetch assigned tests
    const { data: tests, error } = await examAdmin
      .from('mock_test_templates')
      .select('id, name, exam_type, total_marks, duration_minutes, due_date, active_from, created_at')
      .eq('coaching_id', coachingId)
      .eq('test_mode', 'assigned')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // 2. Fetch participation counts
    const testIds = tests?.map(t => t.id) || [];
    let attemptsCount: Record<string, number> = {};
    
    if (testIds.length > 0) {
      const { data: attempts } = await examAdmin
        .from('test_attempts')
        .select('test_template_id')
        .in('test_template_id', testIds);
        
      if (attempts) {
        attempts.forEach(att => {
          attemptsCount[att.test_template_id] = (attemptsCount[att.test_template_id] || 0) + 1;
        });
      }
    }
    
    const enriched = tests?.map(t => ({
      ...t,
      participations: attemptsCount[t.id] || 0
    })) || [];

    return NextResponse.json({ tests: enriched });
  } catch (err) {
    console.error('Admin Assigned Tests GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;
    const { name, examType, subject, durationMinutes, totalQuestions, dueDate } = await req.json();

    if (!name || !examType || !subject || !totalQuestions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const examAdmin = createAdminClient();

    // Fetch random questions for this assigned test
    const { data: questions, error: qErr } = await examAdmin
      .from('questions')
      .select('id')
      .eq('exam_type', examType)
      .eq('subject', subject)
      .limit(Number(totalQuestions));

    if (qErr || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Not enough questions in the bank for these criteria.' }, { status: 400 });
    }

    const questionIds = questions.map(q => q.id);
    
    // Create the test template
    const { data: template, error: insertErr } = await examAdmin
      .from('mock_test_templates')
      .insert({
        name,
        exam_type: examType,
        test_mode: 'assigned',
        coaching_id: coachingId,
        duration_minutes: Number(durationMinutes) || 60,
        total_marks: questionIds.length * 4,
        question_ids: questionIds,
        due_date: dueDate || null,
        sections: { [subject]: questionIds }
      })
      .select('id')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: template.id });
  } catch (err) {
    console.error('Admin Assigned Tests POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
