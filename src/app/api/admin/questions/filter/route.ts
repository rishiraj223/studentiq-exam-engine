import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { exam, subjects, chapters } = await req.json();

    if (!exam || !subjects || !chapters || chapters.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('questions')
      .select('id, question_text, subject, chapter, difficulty')
      .eq('exam_type', exam)
      .in('subject', subjects)
      .in('chapter', chapters)
      .limit(500);

    if (error) {
      console.error('Questions Fetch Error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch questions' }, { status: 500 });
    }

    // Map database columns to frontend expectations
    const mappedQuestions = (data || []).map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      subject: q.subject,
      chapter_name: q.chapter,
      chapter: q.chapter,
      difficulty_level: q.difficulty
    }));

    return NextResponse.json({ questions: mappedQuestions });
  } catch (error) {
    console.error('Admin Questions API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
