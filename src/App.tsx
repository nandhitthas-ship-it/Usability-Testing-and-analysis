import { useState, useEffect, useCallback } from 'react';
import { supabase, type TestPlan } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import TestPlans from '@/pages/TestPlans';
import TestPlanDetail from '@/pages/TestPlanDetail';

type View =
  | { name: 'dashboard' }
  | { name: 'test-plans' }
  | { name: 'test-plan-detail'; id: string };

export default function App() {
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('test_plans')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('Failed to load test plans:', error);
    }
    setPlans(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleNavigate = (v: View) => {
    setView(v);
    if (v.name === 'test-plans' || v.name === 'dashboard') {
      fetchPlans();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        currentView={view.name}
        onNavigate={handleNavigate}
        planCount={plans.length}
      />
      <main className="flex-1 overflow-auto">
        {view.name === 'dashboard' && (
          <Dashboard
            plans={plans}
            loading={loading}
            onNavigate={handleNavigate}
            onRefresh={fetchPlans}
          />
        )}
        {view.name === 'test-plans' && (
          <TestPlans
            plans={plans}
            loading={loading}
            onRefresh={fetchPlans}
            onOpenPlan={(id) => handleNavigate({ name: 'test-plan-detail', id })}
          />
        )}
        {view.name === 'test-plan-detail' && (
          <TestPlanDetail
            planId={view.id}
            onBack={() => handleNavigate({ name: 'test-plans' })}
          />
        )}
      </main>
    </div>
  );
}
