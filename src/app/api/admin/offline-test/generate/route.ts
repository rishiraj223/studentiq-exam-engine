import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionData = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingName = sessionData.coaching_name || 'Coaching Center';

    const { exam, subject, chapter, difficulty, count } = await req.json();

    if (!exam || !subject || !chapter || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();

    let query = admin
      .from('questions')
      .select('id, question_text, text, options, image_url, correct_answer, subject, chapter, difficulty, marks, negative_marks')
      .eq('exam_type', exam)
      .eq('subject', subject)
      .eq('chapter', chapter);

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    // Limit to a large pool and shuffle in memory since random ordering isn't native easily
    const { data, error } = await query.limit(500);

    if (error) {
      console.error('Questions Fetch Error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch questions' }, { status: 500 });
    }

    let questions = data || [];

    // Shuffle questions
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Take requested count
    const requestedCount = parseInt(count.toString(), 10) || 10;
    const selectedQuestions = questions.slice(0, requestedCount);

    return NextResponse.json({ questions: selectedQuestions, coachingName });
  } catch (error) {
    console.error('Offline Test Generate API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
