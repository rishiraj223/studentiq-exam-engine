import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;
    const { name, examType, durationMinutes, dueDate, storageUrl, totalMarks } = await req.json();

    if (!name || !examType || !storageUrl) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const examAdmin = createAdminClient();

    const { data: template, error: insertErr } = await examAdmin
      .from('mock_test_templates')
      .insert({
        name,
        exam_type: examType,
        test_mode: 'assigned',
        coaching_id: coachingId,
        duration_minutes: Number(durationMinutes) || 60,
        total_marks: Number(totalMarks) || 0,
        question_ids: null, // Since it's a custom JSON test
        storage_url: storageUrl, // Points to the JSON file in the bucket
        due_date: dueDate || null
      })
      .select('id')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: template.id });
  } catch (err) {
    console.error('Admin Custom Tests POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
