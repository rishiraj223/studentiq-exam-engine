import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function getSessionCoachingId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    return session?.coaching_id || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const coachingId = getSessionCoachingId(req);
    if (!coachingId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('offline_test_history')
      .select('*')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch offline test history error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch test history' }, { status: 500 });
    }

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error('Offline test history GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const coachingId = getSessionCoachingId(req);
    if (!coachingId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      test_name,
      exam_type,
      subject,
      subjects,
      standard,
      chapters,
      question_ids,
      total_marks,
      duration_minutes,
      difficulty_mix,
      num_questions,
    } = body;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('offline_test_history')
      .insert({
        coaching_id: coachingId,
        test_name,
        exam_type,
        subject: subject ?? null,
        subjects: subjects ?? null,
        standard: standard ?? null,
        chapters: chapters ?? null,
        question_ids: question_ids ?? null,
        total_marks: total_marks ?? null,
        duration_minutes: duration_minutes ?? null,
        difficulty_mix: difficulty_mix ?? null,
        num_questions: num_questions ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Insert offline test history error:', error);
      return NextResponse.json({ error: error.message || 'Failed to save test history' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('Offline test history POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const coachingId = getSessionCoachingId(req);
    if (!coachingId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing test history ID' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('offline_test_history')
      .delete()
      .eq('id', id)
      .eq('coaching_id', coachingId);

    if (error) {
      console.error('Delete offline test history error:', error);
      return NextResponse.json({ error: error.message || 'Failed to delete test history' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Offline test history DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
