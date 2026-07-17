import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;
    const { testId } = await params;
    const examAdmin = createAdminClient();

    // 1. Fetch Test Details
    const { data: test, error: testErr } = await examAdmin
      .from('mock_test_templates')
      .select('*')
      .eq('id', testId)
      .eq('coaching_id', coachingId)
      .single();

    if (testErr || !test) {
      return NextResponse.json({ error: 'Test not found or unauthorized.' }, { status: 404 });
    }

    // 2. Fetch all Attempts for this Test
    const { data: attempts } = await examAdmin
      .from('test_attempts')
      .select('*')
      .eq('test_template_id', testId)
      .order('total_score', { ascending: false });

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ test, stats: null, leaderboard: [] });
    }

    // 3. Fetch Student Names from CRM
    const studentIds = attempts.map(a => a.student_id);
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const coachingAdmin = createClient(coachingUrl, coachingKey);

    const { data: students } = await coachingAdmin
      .from('students')
      .select('id, name, roll_no, batch')
      .in('id', studentIds);

    const studentMap: Record<string, any> = {};
    if (students) {
      students.forEach(s => studentMap[s.id] = s);
    }

    // 4. Calculate Stats and Leaderboard
    let totalScore = 0;
    let totalTime = 0;
    let totalAccuracy = 0;
    let highestScore = 0;

    const leaderboard = attempts.map((att, idx) => {
      const student = studentMap[att.student_id] || { name: 'Unknown', roll_no: 'N/A', batch: 'N/A' };
      const maxMarks = test.total_marks || 1;
      const scorePercent = Math.max(0, att.total_score) / maxMarks * 100;
      
      const attemptedCount = att.correct_count + att.incorrect_count;
      const accuracy = attemptedCount > 0 ? Math.round((att.correct_count / attemptedCount) * 100) : 0;

      totalScore += scorePercent;
      totalTime += att.time_taken_seconds;
      totalAccuracy += accuracy;
      if (att.total_score > highestScore) highestScore = att.total_score;

      return {
        rank: idx + 1,
        studentId: att.student_id,
        name: student.name,
        rollNo: student.roll_no,
        batch: student.batch,
        score: att.total_score,
        scorePercent: Math.round(scorePercent),
        accuracy,
        timeTakenSeconds: att.time_taken_seconds,
        date: att.created_at
      };
    });

    const count = attempts.length;
    const stats = {
      participations: count,
      avgScorePercent: Math.round(totalScore / count),
      avgAccuracy: Math.round(totalAccuracy / count),
      avgTimeTakenSeconds: Math.round(totalTime / count),
      highestScore
    };

    return NextResponse.json({ test, stats, leaderboard });
  } catch (err) {
    console.error('Admin Test Analytics GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
