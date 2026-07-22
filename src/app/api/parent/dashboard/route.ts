import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_parent_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (!session.students || session.students.length === 0) {
      return NextResponse.json({ error: 'No students found for this parent.' }, { status: 404 });
    }

    const admin = createAdminClient();
    const studentIds = session.students.map((s: any) => s.id);

    // Fetch all test attempts for all siblings
    const { data: attempts, error: attErr } = await admin
      .from('test_attempts')
      .select('id, student_id, test_template_id, total_score, correct_count, incorrect_count, unanswered_count, created_at, responses')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (attErr) throw new Error('Failed to fetch test attempts');

    // Fetch corresponding test templates
    const testTemplateIds = Array.from(new Set(attempts?.map(a => a.test_template_id) || []));
    
    let templates: any[] = [];
    if (testTemplateIds.length > 0) {
      const { data: tmplData, error: tmplErr } = await admin
        .from('mock_test_templates')
        .select('id, name, exam_type, total_marks')
        .in('id', testTemplateIds);
        
      if (!tmplErr && tmplData) {
        templates = tmplData;
      }
    }

    // Process attempts to include test details
    const processedAttempts = attempts?.map(a => {
      const testInfo = templates.find(t => t.id === a.test_template_id);
      return {
        ...a,
        test_name: testInfo?.name || 'Unknown Test',
        exam_type: testInfo?.exam_type || 'Unknown',
        total_test_marks: testInfo?.total_marks || 0,
        // Calculate basic accuracy
        accuracy: (a.correct_count + a.incorrect_count > 0) 
          ? Math.round((a.correct_count / (a.correct_count + a.incorrect_count)) * 100) 
          : 0
      };
    });

    return NextResponse.json({
      students: session.students,
      attempts: processedAttempts || []
    });
  } catch (error) {
    console.error('Parent Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
