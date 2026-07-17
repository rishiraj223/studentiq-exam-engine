import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    const coachingId = session.coaching_center_id;
    const studentId = session.student_id;

    if (!coachingId) return NextResponse.json({ assignments: [] });

    const admin = createAdminClient();

    // 1. Fetch assigned tests for this coaching
    const { data: tests, error } = await admin
      .from('mock_test_templates')
      .select('id, name, exam_type, total_marks, duration_minutes, due_date')
      .eq('test_mode', 'assigned')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Assigned fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!tests || tests.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // 2. Fetch attempts to see what is completed
    const testIds = tests.map(t => t.id);
    const { data: attempts } = await admin
      .from('test_attempts')
      .select('test_template_id')
      .eq('student_id', studentId)
      .in('test_template_id', testIds);

    const completedSet = new Set(attempts?.map(a => a.test_template_id) || []);

    const assignments = tests.map(t => ({
      ...t,
      isCompleted: completedSet.has(t.id)
    }));

    // Sort pending first, then by due date
    assignments.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return 0;
    });

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error('Student Assigned Tests GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
