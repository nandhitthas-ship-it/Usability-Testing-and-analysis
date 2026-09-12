import { useState, useCallback } from 'react';
import { supabase, type Scenario, type Finding, type Observation, type Feedback, type Session } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  Edit2,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  SEVERITY_STYLES,
  formatSeverity,
  FINDING_CATEGORY_OPTIONS,
  formatCategory,
} from '@/lib/constants';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Props {
  planId: string;
  scenarios: Scenario[];
  findings: Finding[];
  observations: Observation[];
  feedback: Feedback[];
  sessions: Session[];
  onRefresh: () => void;
}

export default function FindingsTab({
  planId,
  scenarios,
  findings,
  observations,
  feedback,
  onRefresh,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Finding | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'minor' as 'none' | 'minor' | 'major' | 'critical',
    frequency: 1,
    recommendation: '',
    category: 'navigation' as 'navigation' | 'content' | 'visual' | 'interaction' | 'performance' | 'information',
    scenario_id: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      severity: 'minor',
      frequency: 1,
      recommendation: '',
      category: 'navigation',
      scenario_id: '',
    });
    setShowForm(true);
  };

  const openEdit = (f: Finding) => {
    setEditing(f);
    setForm({
      title: f.title,
      description: f.description,
      severity: f.severity,
      frequency: f.frequency,
      recommendation: f.recommendation,
      category: f.category,
      scenario_id: f.scenario_id || '',
    });
    setShowForm(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        scenario_id: form.scenario_id || null,
        test_plan_id: planId,
      };
      if (editing) {
        await supabase.from('findings').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('findings').insert([payload]);
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save finding:', err);
    } finally {
      setSaving(false);
    }
  }, [form, editing, planId, onRefresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from('findings').delete().eq('id', id);
      onRefresh();
    },
    [onRefresh]
  );

  // Auto-generate findings from observations
  const autoGenerate = useCallback(async () => {
    setSaving(true);
    try {
      // Group errors and major observations by description similarity
      const errorObs = observations.filter((o) => o.observation_type === 'error' || o.severity === 'major' || o.severity === 'critical');
      const grouped: Record<string, Observation[]> = {};
      for (const obs of errorObs) {
        const key = obs.description.slice(0, 50);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(obs);
      }

      for (const [key, group] of Object.entries(grouped)) {
        const existing = findings.find((f) => f.title === key);
        if (existing) continue;
        await supabase.from('findings').insert([
          {
            test_plan_id: planId,
            scenario_id: group[0].scenario_id,
            title: key,
            description: `Observed across ${group.length} session(s): ${group[0].description}`,
            severity: group[0].severity,
            frequency: group.length,
            recommendation: 'Review and address this issue in the next design iteration',
            category: 'interaction',
          },
        ]);
      }

      // Generate findings from low feedback ratings
      const lowFeedback = feedback.filter((f) => f.overall_rating <= 2 || f.ease_of_use_rating <= 2);
      for (const fb of lowFeedback) {
        const title = `Low satisfaction rating (${fb.overall_rating}/5)`;
        const existing = findings.find((f) => f.title === title);
        if (existing) continue;
        await supabase.from('findings').insert([
          {
            test_plan_id: planId,
            title,
            description: `A participant rated their overall experience ${fb.overall_rating}/5 and ease of use ${fb.ease_of_use_rating}/5. Comments: ${fb.overall_comments || 'No comments provided.'}`,
            severity: 'major',
            frequency: 1,
            recommendation: 'Investigate pain points and improve the user experience in low-rated areas',
            category: 'interaction',
          },
        ]);
      }

      onRefresh();
    } catch (err) {
      console.error('Failed to auto-generate findings:', err);
    } finally {
      setSaving(false);
    }
  }, [observations, feedback, findings, planId, onRefresh]);

  const sortedFindings = [...findings].sort((a, b) => {
    const severityOrder = { critical: 0, major: 1, minor: 2, none: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity] || b.frequency - a.frequency;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Findings & Recommendations</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Document key findings and design improvement suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(observations.length > 0 || feedback.length > 0) && (
            <button
              onClick={autoGenerate}
              disabled={saving}
              className="btn-secondary"
            >
              <TrendingUp className="w-4 h-4" /> Auto-Generate
            </button>
          )}
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Finding
          </button>
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="card">
          <EmptyState
            message="Record findings from your analysis, or auto-generate from session observations"
            label="No findings yet"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFindings.map((f) => {
            const scenario = scenarios.find((s) => s.id === f.scenario_id);
            return (
              <div key={f.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`badge ${SEVERITY_STYLES[f.severity] || ''}`}>
                        {formatSeverity(f.severity)}
                      </span>
                      <span className="badge bg-slate-100 text-slate-600 border-slate-200">
                        {formatCategory(f.category)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {f.frequency} occurrence{f.frequency !== 1 ? 's' : ''}
                      </span>
                      {scenario && (
                        <span className="text-xs text-slate-400">• {scenario.title}</span>
                      )}
                    </div>
                    {f.description && (
                      <p className="text-sm text-slate-600 mb-3">{f.description}</p>
                    )}
                    {f.recommendation && (
                      <div className="mt-2 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                        <div className="text-xs font-medium text-blue-700 mb-0.5">
                          Recommendation
                        </div>
                        <p className="text-sm text-blue-800">{f.recommendation}</p>
                      </div>
                    )}
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
        title={editing ? 'Edit Finding' : 'Add Finding'}
        subtitle="Document a key finding with recommendation"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Finding'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="e.g., Users struggle to find the checkout button"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="What happened and why is it significant?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px] resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as 'none' | 'minor' | 'major' | 'critical' })}
                className="input"
              >
                <option value="none">None</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as 'navigation' | 'content' | 'visual' | 'interaction' | 'performance' | 'information' })}
                className="input"
              >
                {FINDING_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Frequency</label>
              <input
                type="number"
                min={1}
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value) || 1 })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Related Scenario</label>
              <select
                value={form.scenario_id}
                onChange={(e) => setForm({ ...form, scenario_id: e.target.value })}
                className="input"
              >
                <option value="">None</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Recommendation</label>
            <textarea
              placeholder="What should be done to address this finding?"
              value={form.recommendation}
              onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
              className="input min-h-[80px] resize-y"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
