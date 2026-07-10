import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Validate an access code and return the institute/subscriber info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('institutes')
    .select('id, name, plan, plan_days, plan_start_date, is_active, subscriber_type')
    .eq('access_code', code.toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 404 });
  }

  if (!data.is_active) {
    return NextResponse.json({ error: 'This account has been suspended. Contact support.' }, { status: 403 });
  }

  return NextResponse.json({ valid: true, institute: data });
}
