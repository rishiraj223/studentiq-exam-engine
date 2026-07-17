import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Weightage config per exam type
const EXAM_WEIGHTAGE: Record<string, { subject: string; count: number }[]> = {
  'JEE Main': [
    { subject: 'Physics', count: 30 },
    { subject: 'Chemistry', count: 30 },
    { subject: 'Mathematics', count: 30 },
  ],
  'JEE Advanced': [
    { subject: 'Physics', count: 20 },
    { subject: 'Chemistry', count: 20 },
    { subject: 'Mathematics', count: 20 },
  ],
  'NEET': [
    { subject: 'Physics', count: 45 },
    { subject: 'Chemistry', count: 45 },
    { subject: 'Biology', count: 90 },
  ],
  'MHT-CET A': [
    { subject: 'Physics', count: 50 },
    { subject: 'Chemistry', count: 50 },
    { subject: 'Mathematics', count: 50 },
  ],
  'MHT-CET B': [
    { subject: 'Physics', count: 50 },
    { subject: 'Chemistry', count: 50 },
    { subject: 'Biology', count: 100 },
  ],
};

const EXAM_DURATION: Record<string, number> = {
  'JEE Main': 180,
  'JEE Advanced': 180,
  'NEET': 200,
  'MHT-CET A': 180,
  'MHT-CET B': 180,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('exam_student_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate session object
    const session = JSON.parse(sessionCookie);
    if (!session || !session.student_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examType } = await req.json();
    if (!examType || !EXAM_WEIGHTAGE[examType]) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 });
    }

    const admin = createAdminClient();
    const weightage = EXAM_WEIGHTAGE[examType];
    const sections: Record<string, string[]> = {};
    let totalMarks = 0;
    let totalQuestions = 0;

    // Fetch questions for all subjects in parallel for maximum speed
    const fetchPromises = weightage.map(async ({ subject, count }) => {
      const { data: questions } = await admin
        .from('questions')
        .select('id, marks')
        .eq('exam_type', examType)
        .eq('subject', subject);

      if (!questions || questions.length === 0) return null;

      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      
      return { subject, selected };
    });

    const results = await Promise.all(fetchPromises);

    results.forEach(result => {
      if (!result) return;
      const { subject, selected } = result;
      sections[subject] = [];
      selected.forEach(q => {
        sections[subject].push(q.id);
        totalMarks += q.marks || 4;
        totalQuestions++;
      });
    });

    if (totalQuestions === 0) {
      // ===== DEMO MODE GENERATION =====
      // If DB is empty, generate 5 dummy questions per subject on the fly
      const dummyQuestions = [];
      let demoTotalMarks = 0;

      for (const { subject } of weightage) {
        sections[subject] = [];
        
        // Determine marks based on exam type rules
        let qMarks = 4;
        let qNeg = 1;

        if (examType.includes('MHT-CET')) {
          qMarks = subject === 'Mathematics' ? 2 : 1;
          qNeg = 0;
        }

        for (let i = 1; i <= 5; i++) {
          const dummyQ = {
            exam_type: examType,
            subject: subject,
            question_text: `Demo Question ${i} for ${subject} (${examType}). This is an auto-generated dummy question to test the NTA Simulator UI. What is the correct answer?`,
            options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
            correct_answer_index: 0,
            marks: qMarks,
            negative_marks: qNeg,
          };
          dummyQuestions.push(dummyQ);
        }
      }

      // Insert dummy questions into DB
      const { data: insertedQs, error: insertQErr } = await admin
        .from('questions')
        .insert(dummyQuestions)
        .select('id, subject, marks');

      if (insertQErr || !insertedQs) {
        return NextResponse.json({ error: 'Failed to generate demo questions' }, { status: 500 });
      }

      // Assign to sections
      insertedQs.forEach((q) => {
        sections[q.subject].push(q.id);
        demoTotalMarks += q.marks || 4;
        totalQuestions++;
      });
      totalMarks = demoTotalMarks;
    }

    const testName = `Auto ${examType} Test — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const { data: newTest, error: insertError } = await admin
      .from('mock_test_templates')
      .insert({
        name: testName,
        exam_type: examType,
        duration_minutes: EXAM_DURATION[examType] || 180,
        total_marks: totalMarks,
        sections: sections,
        created_by: session.student_id,  // ✅ FIX: stamp owner
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ testId: newTest.id, totalQuestions, totalMarks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
