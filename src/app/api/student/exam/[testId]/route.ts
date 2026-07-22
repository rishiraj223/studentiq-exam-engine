import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationService } from '@/lib/notifications';

export async function GET(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { testId } = await params;
    const admin = createAdminClient();

    const { data: tmpl, error: tmplErr } = await admin
      .from('mock_test_templates')
      .select('*')
      .eq('id', testId)
      .single();

    if (tmplErr || !tmpl) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // Deadline Enforcement
    if (tmpl.due_date && new Date(tmpl.due_date).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Test deadline has passed' }, { status: 403 });
    }

    // Handle Custom JSON Tests
    if (tmpl.storage_url) {
      const fetchRes = await fetch(tmpl.storage_url);
      const jsonData = await fetchRes.json();
      const rawQs = jsonData.questions;

      const qs = rawQs.map((q: any) => ({
        id: q.id,
        question_text: q.text,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        marks: q.positiveMarks,
        negative_marks: q.negativeMarks,
        subject: q.subject,
        image_url: q.imageUrl || null,
      }));

      const sections: Record<string, string[]> = {};
      rawQs.forEach((q: any) => {
        if (!sections[q.subject]) sections[q.subject] = [];
        sections[q.subject].push(q.id);
      });
      tmpl.sections = sections;

      return NextResponse.json({ template: tmpl, questions: qs });
    }

    // Standard DB Tests
    const allIds = Object.values(tmpl.sections).flat() as string[];
    const { data: qs, error: qErr } = await admin
      .from('questions')
      .select('id, question_text, options, marks, negative_marks, subject, image_url')
      .in('id', allIds);

    if (qErr || !qs) return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });

    return NextResponse.json({ template: tmpl, questions: qs });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = JSON.parse(sessionCookie);
    const { testId } = await params;
    const body = await req.json();
    const { answers, statuses, timeLeft } = body;

    const admin = createAdminClient();

    const { data: tmpl } = await admin.from('mock_test_templates').select('duration_minutes, sections, storage_url, due_date').eq('id', testId).single();
    if (!tmpl) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // Deadline Enforcement
    if (tmpl.due_date && new Date(tmpl.due_date).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Test deadline has passed' }, { status: 403 });
    }

    const correctMap: Record<string, { correct_answer_index: number; marks: number; negative_marks: number }> = {};
    let allIds: string[] = [];

    // Custom JSON Tests logic
    if (tmpl.storage_url) {
      const fetchRes = await fetch(tmpl.storage_url);
      const jsonData = await fetchRes.json();
      const rawQs = jsonData.questions;
      
      const optMap: Record<string, number> = { 'A':0, 'B':1, 'C':2, 'D':3 };
      rawQs.forEach((q: any) => {
        correctMap[q.id] = {
          correct_answer_index: optMap[q.correctOption],
          marks: q.positiveMarks,
          negative_marks: q.negativeMarks
        };
        allIds.push(q.id);
      });
    } else {
      // Standard DB logic
      allIds = Object.values(tmpl.sections).flat() as string[];
      const { data: correctData } = await admin
        .from('questions')
        .select('id, correct_answer_index, marks, negative_marks')
        .in('id', allIds);
      
      correctData?.forEach(q => { correctMap[q.id] = q; });
    }

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const responses = allIds.map(qid => {
      const selected = answers[qid];
      const correct = correctMap[qid];
      let is_correct: boolean | null = null;

      if (selected === undefined || selected === null) {
        unansweredCount++;
      } else if (correct && selected === correct.correct_answer_index) {
        is_correct = true;
        correctCount++;
        totalScore += correct.marks || 4;
      } else {
        is_correct = false;
        incorrectCount++;
        totalScore -= correct?.negative_marks || 1;
      }

      return {
        question_id: qid,
        selected_option: selected ?? null,
        is_correct,
        status: statuses[qid] || 'not-visited',
      };
    });

    const { error: insertError } = await admin.from('test_attempts').insert({
      student_id: session.student_id,
      coaching_id: session.coaching_center_id,
      student_name: session.name,
      test_template_id: testId,
      responses,
      total_score: totalScore,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      time_taken_seconds: (tmpl.duration_minutes || 0) * 60 - timeLeft,
    });

    if (insertError) {
      console.error('Submit error:', insertError);
      return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 });
    }

    // Trigger Asynchronous Auto-Report to Parents
    NotificationService.sendTestReport(
      session.student_id, 
      testId, 
      session.name, 
      { totalScore, correctCount, incorrectCount }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
