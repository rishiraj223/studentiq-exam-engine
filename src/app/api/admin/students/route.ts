import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;

    // 1. Fetch Students from the Old Coaching Database
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const coachingAdmin = createClient(coachingUrl, coachingKey);

    const { data: students, error: studentsErr } = await coachingAdmin
      .from('students')
      .select('id, name, roll_no, parent_phone, batch, standard, created_at')
      .eq('coaching_center_id', coachingId)
      .order('name');

    if (studentsErr) {
      console.error('Students fetch error:', studentsErr);
      return NextResponse.json({ error: 'Failed to fetch students from CRM.' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ students: [] });
    }

    // 2. Fetch all Test Attempts from New Exam Database for these students
    const studentIds = students.map((s: any) => s.id);
    const examAdmin = createAdminClient();

    const { data: attempts, error: attemptsErr } = await examAdmin
      .from('test_attempts')
      .select(`
        student_id,
        total_score,
        created_at,
        mock_test_templates (
          total_marks
        )
      `)
      .in('student_id', studentIds);

    if (attemptsErr) {
      console.error('Attempts fetch error:', attemptsErr);
    }

    // 3. Merge data
    const studentStats: Record<string, { testsTaken: number; totalPercent: number; lastActive: string | null }> = {};
    for (const id of studentIds) {
      studentStats[id] = { testsTaken: 0, totalPercent: 0, lastActive: null };
    }

    if (attempts) {
      for (const att of attempts) {
        const sid = att.student_id;
        if (!studentStats[sid]) continue;

        const tmpl = att.mock_test_templates as any;
        const maxMarks = tmpl?.total_marks || 1;
        const scorePercent = Math.max(0, att.total_score) / maxMarks * 100;

        studentStats[sid].testsTaken += 1;
        studentStats[sid].totalPercent += scorePercent;
        
        const attDate = new Date(att.created_at);
        const lastActive = studentStats[sid].lastActive ? new Date(studentStats[sid].lastActive!) : null;
        if (!lastActive || attDate > lastActive) {
          studentStats[sid].lastActive = att.created_at;
        }
      }
    }

    const mergedStudents = students.map((s: any) => {
      const stats = studentStats[s.id];
      const avgScore = stats.testsTaken > 0 ? Math.round(stats.totalPercent / stats.testsTaken) : 0;
      return {
        ...s,
        testsTaken: stats.testsTaken,
        avgScore,
        lastActive: stats.lastActive
      };
    });

    return NextResponse.json({ students: mergedStudents });
  } catch (err) {
    console.error('Admin Students API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
