import { useCallback, useEffect, useState } from 'react';
import { supabase, type TestPlan, type Session, type Participant, type Feedback } from '@/lib/supabase';
import {
  ClipboardList,
  Users,
  Video,
  Star,
  TrendingUp,
  ArrowRight,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { STATUS_STYLES, formatStatus } from '@/lib/constants';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';

type View =
  | { name: 'dashboard' }
  | { name: 'test-plans' }
  | { name: 'test-plan-detail'; id: string };

interface Props {
  plans: TestPlan[];
  loading: boolean;
  onNavigate: (view: View) => void;
  onRefresh: () => void;
}

export default function Dashboard({ plans, loading, onNavigate }: Props) {
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    completedPlans: 0,
    totalParticipants: 0,
    totalSessions: 0,
    completedSessions: 0,
    avgRating: 0,
    totalFeedback: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [plansRes, participantsRes, sessionsRes, feedbackRes] = await Promise.all([
        supabase.from('test_plans').select('*'),
        supabase.from('participants').select('*'),
        supabase.from('sessions').select('*'),
        supabase.from('feedback').select('*'),
      ]);

      if (plansRes.error) throw plansRes.error;
      if (participantsRes.error) throw participantsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (feedbackRes.error) throw feedbackRes.error;

      const allPlans = plansRes.data || [];
      const allSessions = sessionsRes.data || [];
      const allFeedback = feedbackRes.data || [];

      const avgRating =
        allFeedback.length > 0
          ? allFeedback.reduce((sum, f: Feedback) => sum + f.overall_rating, 0) / allFeedback.length
          : 0;

      setStats({
        totalPlans: allPlans.length,
        activePlans: allPlans.filter((p) => p.status === 'active').length,
        completedPlans: allPlans.filter((p) => p.status === 'completed').length,
        totalParticipants: participantsRes.data?.length || 0,
        totalSessions: allSessions.length,
        completedSessions: allSessions.filter((s: Session) => s.status === 'completed').length,
        avgRating,
        totalFeedback: allFeedback.length,
      });
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      label: 'Test Plans',
      value: stats.totalPlans,
      icon: ClipboardList,
      sub: `${stats.activePlans} active`,
      color: 'bg-slate-900',
    },
    {
      label: 'Participants',
      value: stats.totalParticipants,
      icon: Users,
      sub: 'Recruited users',
      color: 'bg-emerald-600',
    },
    {
      label: 'Sessions',
      value: stats.totalSessions,
      icon: Video,
      sub: `${stats.completedSessions} completed`,
      color: 'bg-blue-600',
    },
    {
      label: 'Avg. Rating',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
      icon: Star,
      sub: `${stats.totalFeedback} reviews`,
      color: 'bg-amber-500',
    },
  ];

  if (loading && plans.length === 0) return <Loading />;

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your usability testing and analysis activities
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-slate-100 mb-4" />
              <div className="h-7 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-4 w-28 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <ErrorState message={statsError} onRetry={fetchStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{card.label}</div>
                <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Plans */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent Test Plans</h2>
        <button
          onClick={() => onNavigate({ name: 'test-plans' })}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No test plans yet</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create your first usability test plan to get started
          </p>
          <button
            onClick={() => onNavigate({ name: 'test-plans' })}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Create Test Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.slice(0, 6).map((plan) => (
            <button
              key={plan.id}
              onClick={() => onNavigate({ name: 'test-plan-detail', id: plan.id })}
              className="card p-5 text-left hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-slate-700">
                    {plan.title}
                  </h3>
                  {plan.product_name && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{plan.product_name}</p>
                  )}
                </div>
                <span className={`badge ${STATUS_STYLES[plan.status] || ''} shrink-0 ml-2`}>
                  {formatStatus(plan.status)}
                </span>
              </div>
              {plan.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{plan.description}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {plan.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Updated {new Date(plan.updated_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
