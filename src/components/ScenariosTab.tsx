import { useState, useCallback } from 'react';
import { supabase, type Scenario } from '@/lib/supabase';
import { Plus, Trash2, Edit2, GripVertical, Clock, ListChecks } from 'lucide-react';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Props {
  planId: string;
  scenarios: Scenario[];
  onRefresh: () => void;
}

export default function ScenariosTab({ planId, scenarios, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Scenario | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    success_criteria: '',
    steps: '',
    estimated_time_minutes: 5,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', success_criteria: '', steps: '', estimated_time_minutes: 5 });
    setShowForm(true);
  };

  const openEdit = (s: Scenario) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description,
      success_criteria: s.success_criteria,
      steps: s.steps,
      estimated_time_minutes: s.estimated_time_minutes,
    });
    setShowForm(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('scenarios').update(form).eq('id', editing.id);
      } else {
        const nextIndex = scenarios.length;
        await supabase.from('scenarios').insert([{ ...form, test_plan_id: planId, order_index: nextIndex }]);
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save scenario:', err);
    } finally {
      setSaving(false);
    }
  }, [form, editing, scenarios.length, planId, onRefresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from('scenarios').delete().eq('id', id);
      onRefresh();
    },
    [onRefresh]
  );

  const stepsArray = (steps: string) =>
    steps.split('\n').filter((s) => s.trim().length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Test Scenarios</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Define the tasks participants will complete during testing
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Scenario
        </button>
      </div>

      {scenarios.length === 0 ? (
        <div className="card">
          <EmptyState
            message="Add scenarios that represent the tasks users will perform"
            label="No scenarios yet"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s, idx) => {
            const steps = stepsArray(s.steps);
            return (
              <div key={s.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                    {s.description && (
                      <p className="text-sm text-slate-500 mt-1">{s.description}</p>
                    )}
                    {steps.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                          <ListChecks className="w-3.5 h-3.5" /> Steps
                        </div>
                        <ol className="space-y-1">
                          {steps.map((step, i) => (
                            <li key={i} className="text-sm text-slate-600 flex gap-2">
                              <span className="text-slate-300 text-xs font-mono pt-0.5">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {s.success_criteria && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <div className="text-xs font-medium text-emerald-700 mb-0.5">
                          Success Criteria
                        </div>
                        <p className="text-sm text-emerald-800">{s.success_criteria}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Est. {s.estimated_time_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Scenario' : 'Add Scenario'}
        subtitle="Define a task for participants to complete during testing"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Scenario'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="e.g., Complete a purchase with a credit card"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="Context and instructions for the participant..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[70px] resize-y"
            />
          </div>
          <div>
            <label className="label">Steps (one per line)</label>
            <textarea
              placeholder={'Navigate to the checkout page\nEnter shipping information\nComplete payment'}
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              className="input min-h-[100px] resize-y font-mono text-sm"
            />
          </div>
          <div>
            <label className="label">Success Criteria</label>
            <textarea
              placeholder="What does successful completion look like?"
              value={form.success_criteria}
              onChange={(e) => setForm({ ...form, success_criteria: e.target.value })}
              className="input min-h-[70px] resize-y"
            />
          </div>
          <div>
            <label className="label">Estimated Time (minutes)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.estimated_time_minutes}
              onChange={(e) => setForm({ ...form, estimated_time_minutes: parseInt(e.target.value) || 5 })}
              className="input w-32"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
