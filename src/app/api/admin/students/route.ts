import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_coaching_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session?.coaching_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coachingId = session.coaching_id;

    // Read optional query params: standard for tab filtering
    // DB stores standard as '11th' or '12th' (not '11' or '12')
    const url = new URL(req.url);
    const standardParam = url.searchParams.get('standard'); // '11th' | '12th' | null

    // 1. Fetch Students from Coaching CRM (live, always fresh)
    const coachingUrl = process.env.COACHING_SUPABASE_URL!;
    const coachingKey = process.env.COACHING_SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const coachingAdmin = createClient(coachingUrl, coachingKey);

    let query = coachingAdmin
      .from('students')
      .select('id, name, roll_no, parent_phone, batch, standard, created_at')
      .eq('coaching_center_id', coachingId);

    if (standardParam) {
      query = query.eq('standard', standardParam);
    }

    const { data: students, error: studentsErr } = await query;

    if (studentsErr) {
      console.error('Students fetch error:', studentsErr);
      return NextResponse.json({ error: 'Failed to fetch students from CRM.' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ students: [], batches: [] });
    }

    // 2. Sort numerically by roll_no
    students.sort((a: any, b: any) => {
      const aNum = parseInt(a.roll_no, 10);
      const bNum = parseInt(b.roll_no, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return String(a.roll_no).localeCompare(String(b.roll_no));
    });

    // 3. Get unique batches for the dropdown (dynamic — never hardcoded)
    const batches = Array.from(new Set(students.map((s: any) => s.batch).filter(Boolean))).sort();

    // 4. Fetch Test Attempts from Exam DB and merge stats
    const studentIds = students.map((s: any) => s.id);
    const examAdmin = createAdminClient();

    const { data: attempts } = await examAdmin
      .from('test_attempts')
      .select('student_id, total_score, created_at, mock_test_templates(total_marks)')
      .in('student_id', studentIds);

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
      return {
        ...s,
        testsTaken: stats.testsTaken,
        avgScore: stats.testsTaken > 0 ? Math.round(stats.totalPercent / stats.testsTaken) : 0,
        lastActive: stats.lastActive,
      };
    });

    return NextResponse.json({ students: mergedStudents, batches });
  } catch (err) {
    console.error('Admin Students API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
