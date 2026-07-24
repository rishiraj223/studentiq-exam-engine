import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // ONLY ALLOWED IN DEVELOPMENT
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const name = url.searchParams.get('name') || 'Forced Coaching';

  if (!id) return NextResponse.json({ error: 'Missing id param' }, { status: 400 });

  const session = {
    coaching_id: id,
    coaching_name: name,
    email: 'debug@studentiq.test',
  };

  const response = NextResponse.redirect(new URL('/admin/dashboard', req.url));
  
  response.cookies.set('exam_coaching_session', JSON.stringify(session), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: false,
  });

  return response;
}
