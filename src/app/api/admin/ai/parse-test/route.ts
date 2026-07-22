import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const parsedParams = await AIService.parseTestRequest(query);

    return NextResponse.json({ params: parsedParams });
  } catch (error) {
    console.error('Admin AI Parse Test API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
