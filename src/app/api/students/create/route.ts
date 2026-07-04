import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, email, batch_id, coaching_id, standard } = await request.json();

    // 1. Create User in auth.users (with a default password they can change later)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'StudentIQ123!', // Default password
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Create Profile row
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        coaching_id: coaching_id,
        role: 'student',
        name: name,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
    }

    // 3. Create Student row
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        id: userId,
        coaching_id: coaching_id,
        batch_id: batch_id || null,
        standard: standard || null,
      });

    if (studentError) {
      return NextResponse.json({ error: 'Failed to link student to batch' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student added successfully' });
  } catch (error: any) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
