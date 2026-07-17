import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    if (!session?.student_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // 1. Verify test exists AND belongs to this student
    const { data: testTemplate, error: testError } = await admin
      .from('mock_test_templates')
      .select('id, created_by')
      .eq('id', testId)
      .single();

    if (testError || !testTemplate) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // ✅ FIX: Security check — only the creator can delete their own test
    if (testTemplate.created_by && testTemplate.created_by !== session.student_id) {
      return NextResponse.json({ error: 'You do not have permission to delete this test' }, { status: 403 });
    }

    // 2. Verify it's unattempted by this specific student
    const { data: attempt } = await admin
      .from('test_attempts')
      .select('id')
      .eq('test_template_id', testId)
      .eq('student_id', session.student_id)
      .maybeSingle();

    if (attempt) {
      return NextResponse.json({ error: 'Cannot delete a test you have already attempted' }, { status: 400 });
    }

    // 3. Delete it safely
    const { error: deleteError } = await admin
      .from('mock_test_templates')
      .delete()
      .eq('id', testId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
