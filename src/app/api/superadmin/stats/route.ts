import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Stats for dashboard
export async function GET() {
  try {
    const { data: allSubscribers, error } = await supabase
      .from('institutes')
      .select('subscriber_type, plan, is_active, plan_start_date, plan_days');

    if (error) throw error;

    const now = Date.now();

    const stats = {
      totalInstitutes: 0,
      activeInstitutes: 0,
      totalStudents: 0,
      activeStudents: 0,
      trialCount: 0,
      standardCount: 0,
      expiredCount: 0,
    };

    for (const s of allSubscribers || []) {
      const isExpired = s.plan_start_date
        ? Math.floor((now - new Date(s.plan_start_date).getTime()) / 86400000) >= s.plan_days
        : false;

      if (isExpired) stats.expiredCount++;

      if (s.subscriber_type === 'student') {
        stats.totalStudents++;
        if (s.is_active && !isExpired) stats.activeStudents++;
      } else {
        stats.totalInstitutes++;
        if (s.is_active && !isExpired) stats.activeInstitutes++;
      }

      if (s.plan === 'trial') stats.trialCount++;
      else stats.standardCount++;
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
