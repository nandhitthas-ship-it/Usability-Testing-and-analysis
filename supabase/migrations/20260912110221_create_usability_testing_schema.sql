/*
# Usability Testing & Analysis Platform — Schema

1. Purpose
   A platform for conducting usability testing on digital products: prepare test plans and scenarios,
   recruit sample users, conduct sessions, record observations, collect feedback, and generate
   reports with findings and design improvement suggestions.

2. New Tables
   - test_plans: Top-level container for a usability study. Fields: title, product_name, description,
     status (draft/active/completed), objectives.
   - scenarios: Individual tasks within a test plan. Fields: test_plan_id, title, description,
     success_criteria, steps, order_index, estimated_time_minutes.
   - participants: Recruited sample users for a test plan. Fields: test_plan_id, name, email,
     demographics, tech_proficiency (beginner/intermediate/advanced), status (recruited/scheduled/completed).
   - sessions: A testing session linking a participant to a test plan. Fields: test_plan_id,
     participant_id, scheduled_date, status (scheduled/in_progress/completed), moderator_notes,
     duration_minutes.
   - observations: Recorded observations during a session for a specific scenario. Fields:
     session_id, scenario_id, description, severity (none/minor/major/critical), observation_type
     (behavior/comment/error/success), timestamp_seconds.
   - feedback: Post-session feedback from a participant. Fields: session_id, overall_rating (1-5),
     ease_of_use_rating (1-5), clarity_rating (1-5), overall_comments, would_recommend (boolean),
     task_success_rate (numeric percentage).
   - findings: Key findings derived from analysis, tied to a test plan. Fields: test_plan_id,
     scenario_id (nullable), title, description, severity, frequency, recommendation, category
     (navigation/content/visual/interaction/performance/content).
   - reports: Generated report for a test plan. Fields: test_plan_id, summary, methodology,
     key_metrics, created_at.

3. Security
   - Single-tenant app (no auth). All policies use TO anon, authenticated with USING/WITH CHECK (true)
     because the data is intentionally shared/public.
   - RLS enabled on every table.

4. Notes
   - All tables use uuid primary keys with gen_random_uuid() defaults.
   - Foreign keys with ON DELETE CASCADE to clean up child data.
   - created_at/updated_at timestamps with defaults.
*/

-- Test Plans
CREATE TABLE IF NOT EXISTS test_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  product_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  objectives text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE test_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_test_plans" ON test_plans;
CREATE POLICY "anon_select_test_plans" ON test_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_test_plans" ON test_plans;
CREATE POLICY "anon_insert_test_plans" ON test_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_test_plans" ON test_plans;
CREATE POLICY "anon_update_test_plans" ON test_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_test_plans" ON test_plans;
CREATE POLICY "anon_delete_test_plans" ON test_plans FOR DELETE TO anon, authenticated USING (true);

-- Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_plan_id uuid NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  success_criteria text NOT NULL DEFAULT '',
  steps text NOT NULL DEFAULT '',
  order_index int NOT NULL DEFAULT 0,
  estimated_time_minutes int NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_scenarios" ON scenarios;
CREATE POLICY "anon_select_scenarios" ON scenarios FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_scenarios" ON scenarios;
CREATE POLICY "anon_insert_scenarios" ON scenarios FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_scenarios" ON scenarios;
CREATE POLICY "anon_update_scenarios" ON scenarios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_scenarios" ON scenarios;
CREATE POLICY "anon_delete_scenarios" ON scenarios FOR DELETE TO anon, authenticated USING (true);

-- Participants
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_plan_id uuid NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  demographics text NOT NULL DEFAULT '',
  tech_proficiency text NOT NULL DEFAULT 'intermediate' CHECK (tech_proficiency IN ('beginner', 'intermediate', 'advanced')),
  status text NOT NULL DEFAULT 'recruited' CHECK (status IN ('recruited', 'scheduled', 'completed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_participants" ON participants;
CREATE POLICY "anon_select_participants" ON participants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_participants" ON participants;
CREATE POLICY "anon_insert_participants" ON participants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_participants" ON participants;
CREATE POLICY "anon_update_participants" ON participants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_participants" ON participants;
CREATE POLICY "anon_delete_participants" ON participants FOR DELETE TO anon, authenticated USING (true);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_plan_id uuid NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  scheduled_date timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  moderator_notes text NOT NULL DEFAULT '',
  duration_minutes int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE TO anon, authenticated USING (true);

-- Observations
CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('none', 'minor', 'major', 'critical')),
  observation_type text NOT NULL DEFAULT 'behavior' CHECK (observation_type IN ('behavior', 'comment', 'error', 'success')),
  timestamp_seconds int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_observations" ON observations;
CREATE POLICY "anon_select_observations" ON observations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_observations" ON observations;
CREATE POLICY "anon_insert_observations" ON observations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_observations" ON observations;
CREATE POLICY "anon_update_observations" ON observations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_observations" ON observations;
CREATE POLICY "anon_delete_observations" ON observations FOR DELETE TO anon, authenticated USING (true);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  overall_rating int NOT NULL DEFAULT 3 CHECK (overall_rating >= 1 AND overall_rating <= 5),
  ease_of_use_rating int NOT NULL DEFAULT 3 CHECK (ease_of_use_rating >= 1 AND ease_of_use_rating <= 5),
  clarity_rating int NOT NULL DEFAULT 3 CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  overall_comments text NOT NULL DEFAULT '',
  would_recommend boolean NOT NULL DEFAULT false,
  task_success_rate numeric NOT NULL DEFAULT 0 CHECK (task_success_rate >= 0 AND task_success_rate <= 100),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_feedback" ON feedback;
CREATE POLICY "anon_select_feedback" ON feedback FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback;
CREATE POLICY "anon_insert_feedback" ON feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_feedback" ON feedback;
CREATE POLICY "anon_update_feedback" ON feedback FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_feedback" ON feedback;
CREATE POLICY "anon_delete_feedback" ON feedback FOR DELETE TO anon, authenticated USING (true);

-- Findings
CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_plan_id uuid NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('none', 'minor', 'major', 'critical')),
  frequency int NOT NULL DEFAULT 1,
  recommendation text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'navigation' CHECK (category IN ('navigation', 'content', 'visual', 'interaction', 'performance', 'information')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_findings" ON findings;
CREATE POLICY "anon_select_findings" ON findings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_findings" ON findings;
CREATE POLICY "anon_insert_findings" ON findings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_findings" ON findings;
CREATE POLICY "anon_update_findings" ON findings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_findings" ON findings;
CREATE POLICY "anon_delete_findings" ON findings FOR DELETE TO anon, authenticated USING (true);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_plan_id uuid NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  methodology text NOT NULL DEFAULT '',
  key_metrics text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_reports" ON reports;
CREATE POLICY "anon_select_reports" ON reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reports" ON reports;
CREATE POLICY "anon_insert_reports" ON reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reports" ON reports;
CREATE POLICY "anon_update_reports" ON reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reports" ON reports;
CREATE POLICY "anon_delete_reports" ON reports FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_test_plan ON scenarios(test_plan_id);
CREATE INDEX IF NOT EXISTS idx_participants_test_plan ON participants(test_plan_id);
CREATE INDEX IF NOT EXISTS idx_sessions_test_plan ON sessions(test_plan_id);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(session_id);
CREATE INDEX IF NOT EXISTS idx_observations_scenario ON observations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_findings_test_plan ON findings(test_plan_id);
CREATE INDEX IF NOT EXISTS idx_reports_test_plan ON reports(test_plan_id);