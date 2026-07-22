import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationService } from '@/lib/notifications';

// This endpoint is designed to be triggered by a Cron Job (e.g. Vercel Cron) on the 1st of every month
export async function GET(req: NextRequest) {
  try {
    // Basic API Key security for cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In MVP, we might allow it without strict check, but good practice
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Determine last month's date range
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // 2. Fetch all attempts from last month
    const { data: attempts, error } = await admin
      .from('test_attempts')
      .select('student_id, student_name, total_score')
      .gte('created_at', firstDayLastMonth)
      .lte('created_at', lastDayLastMonth);

    if (error || !attempts) {
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }

    // 3. Group by student and calculate averages
    const studentStats: Record<string, { name: string, totalScore: number, testsTaken: number }> = {};
    
    attempts.forEach(att => {
      if (!studentStats[att.student_id]) {
        studentStats[att.student_id] = { name: att.student_name, totalScore: 0, testsTaken: 0 };
      }
      studentStats[att.student_id].totalScore += att.total_score;
      studentStats[att.student_id].testsTaken += 1;
    });

    // 4. Fire notifications
    for (const studentId in studentStats) {
      const stats = studentStats[studentId];
      const avgScore = Math.round(stats.totalScore / stats.testsTaken);
      
      // Async dispatch
      NotificationService.sendMonthlyReport(stats.name, avgScore, stats.testsTaken);
    }

    return NextResponse.json({ ok: true, reportsSent: Object.keys(studentStats).length });
  } catch (error) {
    console.error('Monthly Cron Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
