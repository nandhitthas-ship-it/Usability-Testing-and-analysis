import { useState, useCallback, useEffect } from 'react';
import { supabase, type TestPlan, type Scenario, type Participant, type Session, type Observation, type Feedback, type Finding, type Report } from '@/lib/supabase';
import { ArrowLeft, ClipboardList, Users, Video, Star, Lightbulb, FileText, BarChart3 } from 'lucide-react';
import { STATUS_STYLES, formatStatus } from '@/lib/constants';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import ScenariosTab from '@/components/ScenariosTab';
import ParticipantsTab from '@/components/ParticipantsTab';
import SessionsTab from '@/components/SessionsTab';
import FindingsTab from '@/components/FindingsTab';
import ReportsTab from '@/components/ReportsTab';

interface Props {
  planId: string;
  onBack: () => void;
}

type Tab = 'scenarios' | 'participants' | 'sessions' | 'findings' | 'reports';

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: 'scenarios', label: 'Scenarios', icon: ClipboardList },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: Video },
  { id: 'findings', label: 'Findings', icon: Lightbulb },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function TestPlanDetail({ planId, onBack }: Props) {
  const [plan, setPlan] = useState<TestPlan | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('scenarios');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        planRes,
        scenariosRes,
        participantsRes,
        sessionsRes,
        observationsRes,
        feedbackRes,
        findingsRes,
        reportsRes,
      ] = await Promise.all([
        supabase.from('test_plans').select('*').eq('id', planId).maybeSingle(),
        supabase.from('scenarios').select('*').eq('test_plan_id', planId).order('order_index'),
        supabase.from('participants').select('*').eq('test_plan_id', planId).order('created_at'),
        supabase.from('sessions').select('*').eq('test_plan_id', planId).order('created_at', { ascending: false }),
        supabase.from('observations').select('*').in('session_id', (await supabase.from('sessions').select('id').eq('test_plan_id', planId)).data?.map((s: { id: string }) => s.id) || ['00000000-0000-0000-0000-000000000000']),
        supabase.from('feedback').select('*').in('session_id', (await supabase.from('sessions').select('id').eq('test_plan_id', planId)).data?.map((s: { id: string }) => s.id) || ['00000000-0000-0000-0000-000000000000']),
        supabase.from('findings').select('*').eq('test_plan_id', planId).order('created_at', { ascending: false }),
        supabase.from('reports').select('*').eq('test_plan_id', planId).order('created_at', { ascending: false }),
      ]);

      if (planRes.error) throw planRes.error;
      if (scenariosRes.error) throw scenariosRes.error;
      if (participantsRes.error) throw participantsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      setPlan(planRes.data as TestPlan | null);
      setScenarios(scenariosRes.data || []);
      setParticipants(participantsRes.data || []);
      setSessions(sessionsRes.data || []);
      setObservations(observationsRes.data || []);
      setFeedback(feedbackRes.data || []);
      setFindings(findingsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test plan');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) return <Loading label="Loading test plan..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAll} />;
  if (!plan)
    return (
      <div className="px-8 py-8 max-w-7xl mx-auto">
        <ErrorState message="This test plan could not be found" />
        <div className="text-center">
          <button onClick={onBack} className="btn-secondary">Go back</button>
        </div>
      </div>
    );

  const tabCounts: Record<Tab, number> = {
    scenarios: scenarios.length,
    participants: participants.length,
    sessions: sessions.length,
    findings: findings.length,
    reports: reports.length,
  };

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Test Plans
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{plan.title}</h1>
              <span className={`badge ${STATUS_STYLES[plan.status] || ''}`}>
                {formatStatus(plan.status)}
              </span>
            </div>
            {plan.product_name && (
              <p className="text-sm text-slate-500">{plan.product_name}</p>
            )}
            {plan.description && (
              <p className="text-sm text-slate-500 mt-2 max-w-3xl">{plan.description}</p>
            )}
            {plan.objectives && (
              <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Objectives
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{plan.objectives}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'scenarios' && (
        <ScenariosTab
          planId={planId}
          scenarios={scenarios}
          onRefresh={fetchAll}
        />
      )}
      {activeTab === 'participants' && (
        <ParticipantsTab
          planId={planId}
          participants={participants}
          sessions={sessions}
          onRefresh={fetchAll}
        />
      )}
      {activeTab === 'sessions' && (
        <SessionsTab
          planId={planId}
          participants={participants}
          scenarios={scenarios}
          sessions={sessions}
          observations={observations}
          feedback={feedback}
          onRefresh={fetchAll}
        />
      )}
      {activeTab === 'findings' && (
        <FindingsTab
          planId={planId}
          scenarios={scenarios}
          findings={findings}
          observations={observations}
          feedback={feedback}
          sessions={sessions}
          onRefresh={fetchAll}
        />
      )}
      {activeTab === 'reports' && (
        <ReportsTab
          planId={planId}
          plan={plan}
          scenarios={scenarios}
          participants={participants}
          sessions={sessions}
          observations={observations}
          feedback={feedback}
          findings={findings}
          reports={reports}
          onRefresh={fetchAll}
        />
      )}
    </div>
  );
}
