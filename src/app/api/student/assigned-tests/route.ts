import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    // ✅ Use the correct cookie name set by student-login and student-sso
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ assignments: [] });

    const session = JSON.parse(sessionCookie);
    // ✅ The coaching_center_id field from the student session cookie
    const coachingId = session.coaching_center_id;
    const studentId = session.student_id;

    if (!coachingId) return NextResponse.json({ assignments: [] });

    const admin = createAdminClient();

    // 1. Fetch all assigned tests for this specific coaching center
    const { data: tests, error } = await admin
      .from('mock_test_templates')
      .select('id, name, exam_type, total_marks, duration_minutes, due_date, created_at')
      .eq('test_mode', 'assigned')
      .eq('coaching_id', coachingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Assigned tests fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!tests || tests.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // 2. Fetch this student's attempts to mark completed tests
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

    // Sort: pending first, then soonest due date first
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
