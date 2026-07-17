import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;
    const { name, examType, durationMinutes, dueDate, questionIds } = await req.json();

    if (!name || !examType || !questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or empty test.' }, { status: 400 });
    }

    const examAdmin = createAdminClient();

    // Fetch question subjects to build the sections map (Physics: [id1, id2], Chemistry: [...])
    const { data: questions, error: qErr } = await examAdmin
      .from('questions')
      .select('id, subject')
      .in('id', questionIds);

    if (qErr || !questions) {
      return NextResponse.json({ error: 'Failed to validate questions.' }, { status: 500 });
    }

    // Build sections JSONB: { "Physics": ["uuid1", "uuid2"], "Chemistry": [...] }
    const sections: Record<string, string[]> = {};
    questions.forEach(q => {
      if (!sections[q.subject]) sections[q.subject] = [];
      sections[q.subject].push(q.id);
    });

    const totalMarks = questions.length * 4;

    // Insert using the CORRECT schema: sections JSONB (question_ids was DROPPED in admin_schema_update.sql)
    const { data: template, error: insertErr } = await examAdmin
      .from('mock_test_templates')
      .insert({
        name,
        exam_type: examType,
        test_mode: 'assigned',
        coaching_id: coachingId,
        duration_minutes: Number(durationMinutes) || 60,
        total_marks: totalMarks,
        sections: sections,
        due_date: dueDate || null,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Premade Test Insert Error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: template.id });
  } catch (err) {
    console.error('Admin Premade Tests POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
