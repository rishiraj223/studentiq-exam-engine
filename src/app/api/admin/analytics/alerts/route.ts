import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingId = session.coaching_id;
    if (!coachingId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Fetch all students for this coaching
    const { data: students, error: stdErr } = await admin
      .from('profiles')
      .select('id, name')
      .eq('coaching_id', coachingId)
      .eq('role', 'student');

    if (stdErr) throw new Error('Failed to fetch students');

    // Fetch all test attempts for this coaching to analyze trends
    const { data: attempts, error: attErr } = await admin
      .from('test_attempts')
      .select('student_id, student_batch, total_score, created_at')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (attErr) throw new Error('Failed to fetch attempts');

    const alerts: any[] = [];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    students.forEach(student => {
      const studentAttempts = attempts.filter(a => a.student_id === student.id);
      
      const batchName = studentAttempts.length > 0 && studentAttempts[0].student_batch 
        ? studentAttempts[0].student_batch 
        : 'Unknown Batch';

      if (studentAttempts.length === 0) {
        alerts.push({
          studentId: student.id,
          studentName: student.name,
          batch: batchName,
          reason: 'No tests attempted yet.',
          severity: 'high'
        });
      } else {
        const latestAttemptDate = new Date(studentAttempts[0].created_at);
        if (latestAttemptDate < fourteenDaysAgo) {
          alerts.push({
            studentId: student.id,
            studentName: student.name,
            batch: batchName,
            reason: `Inactive for 14+ days. Last test was ${latestAttemptDate.toLocaleDateString()}.`,
            severity: 'medium'
          });
        } else if (studentAttempts.length >= 3) {
          // Check for score drop across last 3 attempts
          // Since it's ordered desc, [0] is latest, [1] is previous, [2] is older
          const latestScore = studentAttempts[0].total_score;
          const olderScore = studentAttempts[2].total_score;
          
          // If the older score was positive, and latest score dropped by more than 20%
          if (olderScore > 0 && latestScore < olderScore * 0.8) {
            alerts.push({
              studentId: student.id,
              studentName: student.name,
              batch: batchName,
              reason: `Significant score drop in last 3 tests (${olderScore} pts -> ${latestScore} pts).`,
              severity: 'high'
            });
          }
        }
      }
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Analytics Alerts API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
