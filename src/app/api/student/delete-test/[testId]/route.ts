import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = JSON.parse(sessionCookie);
    if (!session || !session.student_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    // 1. Verify if the test exists
    const { data: testTemplate, error: testError } = await admin
      .from('mock_test_templates')
      .select('id')
      .eq('id', testId)
      .single();

    if (testError || !testTemplate) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // 2. Verify it is unattempted by this specific student (or globally since templates are 1:1 right now)
    const { data: attempt, error: attemptError } = await admin
      .from('test_attempts')
      .select('id')
      .eq('test_template_id', testId)
      .single();

    if (attempt) {
      return NextResponse.json({ error: 'Cannot delete an attempted test' }, { status: 400 });
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
