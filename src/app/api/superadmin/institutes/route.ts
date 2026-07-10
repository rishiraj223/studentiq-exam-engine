import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate a unique 6-char alphanumeric code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - List all institutes
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('institutes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET institutes error:', error);
    return NextResponse.json({ error: 'Failed to fetch institutes' }, { status: 500 });
  }
}

// POST - Create a new institute
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique access code (retry if collision)
    let accessCode = generateAccessCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('institutes')
        .select('id')
        .eq('access_code', accessCode)
        .single();
      if (!existing) break;
      accessCode = generateAccessCode();
      attempts++;
    }

    const planDays = body.plan === 'trial' ? 5 : 365;
    const planStartDate = body.is_active ? new Date().toISOString() : null;

    const insertData: any = {
      name: body.name,
      city: body.city || '',
      phone: body.phone || '',
      contact_number: body.contact_number || null,
      email: body.email || '',
      address: body.address || null,
      student_strength: Number(body.student_strength) || 0,
      recovery_phone: body.recovery_phone || null,
      plan: body.plan,
      plan_start_date: planStartDate,
      plan_days: planDays,
      is_active: body.is_active !== false,
      access_code: accessCode,
      subscriber_type: body.subscriber_type || 'institute', // 'institute' | 'student'
      standard: body.standard || null,
    };

    if (body.converted_from_lead) {
      insertData.converted_from_lead = body.converted_from_lead;
    }

    const { data, error } = await supabase
      .from('institutes')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    // If converted from a lead, mark that lead as converted
    if (body.converted_from_lead) {
      await supabase
        .from('demo_requests')
        .update({ converted_to_institute: true, institute_id: data.id })
        .eq('id', body.converted_from_lead);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST institute error:', error);
    return NextResponse.json({ error: 'Failed to create institute' }, { status: 500 });
  }
}
