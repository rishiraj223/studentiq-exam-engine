import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Since this is a public API route to insert into the database, we can use the service role key to bypass RLS,
// OR if RLS is set up to allow anonymous inserts, we could just use the anon key.
// We'll use the anon key by default assuming the SQL script enables public inserts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // or SUPABASE_SERVICE_ROLE_KEY if needed
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.name || !data.email || !data.phone || !data.user_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('demo_requests')
      .insert([
        {
          user_type: data.user_type,
          name: data.name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          students_count: data.user_type === 'institute' ? data.students_count : null,
          standard: data.user_type === 'student' ? data.standard : null,
        }
      ]);

    if (error) {
      console.error('Supabase insertion error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
