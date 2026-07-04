import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, coachingName, securityCode } = await request.json();

    // 1. Verify Security Code
    if (!securityCode.toLowerCase().includes('demo') && securityCode.length < 6) {
      return NextResponse.json({ error: 'Invalid security code' }, { status: 400 });
    }

    // 2. Create User in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 3. Create Coaching row
    const { data: coachingData, error: coachingError } = await supabaseAdmin
      .from('coachings')
      .insert({
        name: coachingName || email.split('@')[0], // Fallback if no name provided
        contact_email: email,
      })
      .select()
      .single();

    if (coachingError) {
      // Rollback user creation (best effort)
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to create coaching workspace' }, { status: 500 });
    }

    // 4. Create Profile row linking user and coaching
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        coaching_id: coachingData.id,
        role: 'coaching_admin',
        name: 'Admin',
      });

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account created successfully' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
