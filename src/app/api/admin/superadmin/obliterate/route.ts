import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { coaching_id, security_code } = await req.json();
    const envSecurityCode = process.env.SUPER_ADMIN_SECURITY_CODE;

    if (!coaching_id || !security_code) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    if (security_code !== envSecurityCode) {
      return NextResponse.json({ success: false, message: 'Invalid security code' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // 1. Delete test attempts
    await supabase.from('test_attempts').delete().eq('coaching_id', coaching_id);

    // 2. Delete offline test history
    await supabase.from('offline_test_history').delete().eq('coaching_id', coaching_id);

    // 3. Delete mock test templates (assigned tests)
    await supabase.from('mock_test_templates').delete().eq('coaching_id', coaching_id);

    return NextResponse.json({ success: true, message: 'Exam engine data obliterated' });

  } catch (error: any) {
    console.error('Obliterate exam engine data error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
