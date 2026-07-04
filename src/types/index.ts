/* ===== Demo Request ===== */
export interface DemoRequest {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  institute_name: string;
  student_strength: number;
  message?: string;
  product_source: string;
  created_at?: string;
}

/* ===== Coaching Center (future phases) ===== */
export interface CoachingCenter {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  is_active: boolean;
  plan_type?: string;
  created_at: string;
}

/* ===== Student (future phases) ===== */
export interface Student {
  id: string;
  name: string;
  email?: string;
  phone: string;
  batch: string;
  coaching_center_id: string;
  created_at: string;
}

/* ===== Question (future phases) ===== */
export interface Question {
  id: string;
  subject: string;
  chapter: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exam_type: string;
  year?: number;
  text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  image_url?: string;
  marks: number;
  negative_marks: number;
}
