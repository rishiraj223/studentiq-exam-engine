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
 * Submits a demo request to the Main SaaS API.
 */
export async function submitDemoRequest(data: DemoFormData) {
  // We POST to our internal proxy API route to bypass browser CORS restrictions
  const response = await fetch('/api/demo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      institute_name: data.institute_name,
      owner_name: data.name,
      email_id: data.email,
      mobile_number: data.phone,
      location: data.city,
      student_count: data.student_strength.toString(),
      remarks: `[Source: EXAM ENGINE] ${data.message || ''}`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to submit demo request.');
  }

  return { success: true };
}
