import { createClient } from '@/lib/supabase/browser';

export interface DemoFormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  institute_name: string;
  student_strength: number;
  message?: string;
}

/**
 * Submits a demo request to Supabase.
 * Automatically sets product_source to 'StudentIQ Exam Engine'
 * so the main CRM can identify lead origin.
 */
export async function submitDemoRequest(data: DemoFormData) {
  const supabase = createClient();

  const { error } = await supabase.from('demo_requests').insert({
    ...data,
    product_source: 'StudentIQ Exam Engine',
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
