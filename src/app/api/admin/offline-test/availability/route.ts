import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session: any;
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.coaching_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const exam = searchParams.get('exam');
    const subject = searchParams.get('subject');
    const standard = searchParams.get('standard');
    const difficulty = searchParams.get('difficulty') || 'all';

    const admin = createAdminClient();
    let query = admin
      .from('question_availability')
      .select('chapter, difficulty, question_count');

    if (exam) {
      query = query.eq('exam_type', exam);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (standard) {
      query = query.eq('standard', standard);
    }
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Question availability fetch error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch question availability' }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    if (data) {
      for (const row of data) {
        if (!row.chapter) continue;
        const count = Number(row.question_count) || 0;
        counts[row.chapter] = (counts[row.chapter] || 0) + count;
      }
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Question availability API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
