import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Single institute
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from('institutes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

// PATCH - Update institute (edit fields, toggle active, edit days)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    // If toggling is_active ON and no start date yet, set start date now
    const updates: any = { ...body };
    if (body.is_active === true) {
      // fetch current record to check if plan_start_date already set
      const { data: current } = await supabase
        .from('institutes')
        .select('plan_start_date')
        .eq('id', id)
        .single();
      if (!current?.plan_start_date) {
        updates.plan_start_date = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('institutes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH institute error:', error);
    return NextResponse.json({ error: 'Failed to update institute' }, { status: 500 });
  }
}

// DELETE - Delete institute
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { error } = await supabase.from('institutes').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete institute' }, { status: 500 });
  }
}
