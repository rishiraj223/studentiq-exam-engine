import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Weightage config per exam type
const EXAM_WEIGHTAGE: Record<string, { subject: string; count: number }[]> = {
  'JEE Main': [
    { subject: 'Physics', count: 30 },
    { subject: 'Chemistry', count: 30 },
    { subject: 'Mathematics', count: 30 },
  ],
  'JEE Advanced': [
    { subject: 'Physics', count: 20 },
    { subject: 'Chemistry', count: 20 },
    { subject: 'Mathematics', count: 20 },
  ],
  'NEET': [
    { subject: 'Physics', count: 45 },
    { subject: 'Chemistry', count: 45 },
    { subject: 'Biology', count: 90 },
  ],
  'MHT-CET A': [
    { subject: 'Physics', count: 50 },
    { subject: 'Chemistry', count: 50 },
    { subject: 'Mathematics', count: 50 },
  ],
  'MHT-CET B': [
    { subject: 'Physics', count: 50 },
    { subject: 'Chemistry', count: 50 },
    { subject: 'Biology', count: 100 },
  ],
};

const EXAM_DURATION: Record<string, number> = {
  'JEE Main': 180,
  'JEE Advanced': 180,
  'NEET': 200,
  'MHT-CET A': 180,
  'MHT-CET B': 180,
};

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
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examType } = await req.json();
    if (!examType || !EXAM_WEIGHTAGE[examType]) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 });
    }

    const admin = createAdminClient();
    const weightage = EXAM_WEIGHTAGE[examType];
    const allSelectedIds: string[] = [];
    let totalMarks = 0;

    for (const { subject, count } of weightage) {
      const { data: questions } = await admin
        .from('questions')
        .select('id, marks')
        .eq('exam_type', examType)
        .eq('subject', subject);

      if (!questions || questions.length === 0) continue;

      const shuffled = shuffle(questions);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      selected.forEach(q => {
        allSelectedIds.push(q.id);
        totalMarks += q.marks || 4;
      });
    }

    if (allSelectedIds.length === 0) {
      return NextResponse.json(
        { error: 'Not enough questions in the database for this exam yet. Please add more questions via the admin panel.' },
        { status: 400 }
      );
    }

    const testName = `Auto ${examType} Test — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const { data: newTest, error: insertError } = await admin
      .from('mock_test_templates')
      .insert({
        name: testName,
        exam_type: examType,
        duration_minutes: EXAM_DURATION[examType] || 180,
        total_marks: totalMarks,
        question_ids: allSelectedIds,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ testId: newTest.id, totalQuestions: allSelectedIds.length, totalMarks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
