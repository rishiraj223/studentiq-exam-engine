import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const reply = await AIService.chatWithBot(message);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Student AI Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
