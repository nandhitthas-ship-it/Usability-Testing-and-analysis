import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions

export type TestPlan = {
  id: string;
  title: string;
  product_name: string;
  description: string;
  objectives: string;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
};

export type Scenario = {
  id: string;
  test_plan_id: string;
  title: string;
  description: string;
  success_criteria: string;
  steps: string;
  order_index: number;
  estimated_time_minutes: number;
  created_at: string;
};

export type Participant = {
  id: string;
  test_plan_id: string;
  name: string;
  email: string;
  demographics: string;
  tech_proficiency: 'beginner' | 'intermediate' | 'advanced';
  status: 'recruited' | 'scheduled' | 'completed';
  created_at: string;
};

export type Session = {
  id: string;
  test_plan_id: string;
  participant_id: string;
  scheduled_date: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  moderator_notes: string;
  duration_minutes: number;
  created_at: string;
};

export type Observation = {
  id: string;
  session_id: string;
  scenario_id: string | null;
  description: string;
  severity: 'none' | 'minor' | 'major' | 'critical';
  observation_type: 'behavior' | 'comment' | 'error' | 'success';
  timestamp_seconds: number;
  created_at: string;
};

export type Feedback = {
  id: string;
  session_id: string;
  overall_rating: number;
  ease_of_use_rating: number;
  clarity_rating: number;
  overall_comments: string;
  would_recommend: boolean;
  task_success_rate: number;
  created_at: string;
};

export type Finding = {
  id: string;
  test_plan_id: string;
  scenario_id: string | null;
  title: string;
  description: string;
  severity: 'none' | 'minor' | 'major' | 'critical';
  frequency: number;
  recommendation: string;
  category: 'navigation' | 'content' | 'visual' | 'interaction' | 'performance' | 'information';
  created_at: string;
};

export type Report = {
  id: string;
  test_plan_id: string;
  summary: string;
  methodology: string;
  key_metrics: string;
  created_at: string;
};
