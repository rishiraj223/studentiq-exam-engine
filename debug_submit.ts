// Test script to debug the submit failure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvvgrautgtclrzbkeabe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dmdyYXV0Z3RjbHJ6YmtlYWJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4MDU2OCwiZXhwIjoyMDk4NjU2NTY4fQ.QFMtp3Mfag0F7SjkeDEcSuqtZ5igmrcvVrCGp1y41Hs';
const admin = createClient(supabaseUrl, supabaseKey);

async function testSubmit() {
  const { data: tmpl } = await admin.from('mock_test_templates').select('id, duration_minutes, sections').limit(1).single();
  if (!tmpl) {
    console.log("No templates found.");
    return;
  }
  
  console.log("Template ID:", tmpl.id);
  
  const allIds = Object.values(tmpl.sections).flat() as string[];
  
  const responses = allIds.map(qid => ({
    question_id: qid,
    selected_option: null,
    is_correct: null,
    status: 'not-visited',
  }));

  const payload = {
    student_id: '123e4567-e89b-12d3-a456-426614174000', // valid uuid
    test_template_id: tmpl.id,
    responses,
    total_score: 0,
    correct_count: 0,
    incorrect_count: 0,
    unanswered_count: responses.length,
    time_taken_seconds: 60,
  };
  
  console.log("Trying to insert:", JSON.stringify(payload, null, 2));

  const { error: insertError } = await admin.from('test_attempts').insert(payload);
  
  if (insertError) {
    console.error("Insert Error:", insertError);
  } else {
    console.log("Insert Success!");
  }
}

testSubmit();
