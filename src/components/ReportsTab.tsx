import { useState, useCallback } from 'react';
import { supabase, type TestPlan, type Scenario, type Participant, type Session, type Observation, type Feedback, type Finding, type Report } from '@/lib/supabase';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import {
  SEVERITY_STYLES,
  formatSeverity,
  formatDate,
  formatCategory,
} from '@/lib/constants';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Props {
  planId: string;
  plan: TestPlan;
  scenarios: Scenario[];
  participants: Participant[];
  sessions: Session[];
  observations: Observation[];
  feedback: Feedback[];
  findings: Finding[];
  reports: Report[];
  onRefresh: () => void;
}

export default function ReportsTab({
  planId,
  plan,
  scenarios,
  participants,
  sessions,
  observations,
  feedback,
  findings,
  reports,
  onRefresh,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    summary: '',
    methodology: '',
    key_metrics: '',
  });

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length).toFixed(1)
      : '—';
  const avgEase =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.ease_of_use_rating, 0) / feedback.length).toFixed(1)
      : '—';
  const avgClarity =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.clarity_rating, 0) / feedback.length).toFixed(1)
      : '—';
  const avgSuccessRate =
    feedback.length > 0
      ? Math.round(feedback.reduce((sum, f) => sum + f.task_success_rate, 0) / feedback.length)
      : 0;
  const recommendRate =
    feedback.length > 0
      ? Math.round((feedback.filter((f) => f.would_recommend).length / feedback.length) * 100)
      : 0;

  const generateAutoReport = useCallback(async () => {
    setSaving(true);
    try {
      const errorCount = observations.filter((o) => o.observation_type === 'error').length;
      const successCount = observations.filter((o) => o.observation_type === 'success').length;
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const majorFindings = findings.filter((f) => f.severity === 'major').length;

      const summary = `This usability study evaluated ${plan.title} for ${plan.product_name || 'the product'} with ${participants.length} participant(s) across ${completedSessions.length} completed session(s). ${observations.length} observations were recorded, including ${errorCount} error(s) and ${successCount} successful action(s). ${findings.length} finding(s) were identified, of which ${criticalFindings} critical and ${majorFindings} major. The average overall satisfaction rating was ${avgRating}/5, with an average task success rate of ${avgSuccessRate}%.`;

      const methodology = `Moderated usability testing was conducted with ${participants.length} recruited participant(s) of varying technical proficiency (${participants.filter((p) => p.tech_proficiency === 'beginner').length} beginner, ${participants.filter((p) => p.tech_proficiency === 'intermediate').length} intermediate, ${participants.filter((p) => p.tech_proficiency === 'advanced').length} advanced). Participants were asked to complete ${scenarios.length} scenario(s). Observations were recorded in real-time, categorizing each by type (behavior, comment, error, success) and severity (none, minor, major, critical). Post-session feedback was collected covering overall experience, ease of use, clarity, and task success rate.`;

      const keyMetrics = [
        `Participants: ${participants.length}`,
        `Completed Sessions: ${completedSessions.length}/${sessions.length}`,
        `Total Observations: ${observations.length}`,
        `Errors Observed: ${errorCount}`,
        `Successful Actions: ${successCount}`,
        `Average Overall Rating: ${avgRating}/5`,
        `Average Ease of Use: ${avgEase}/5`,
        `Average Clarity: ${avgClarity}/5`,
        `Average Task Success Rate: ${avgSuccessRate}%`,
        `Recommendation Rate: ${recommendRate}%`,
        `Total Findings: ${findings.length}`,
        `Critical Findings: ${criticalFindings}`,
        `Major Findings: ${majorFindings}`,
      ].join('\n');

      setForm({ summary, methodology, key_metrics: keyMetrics });
      setShowForm(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setSaving(false);
    }
  }, [
    plan,
    participants,
    completedSessions,
    sessions,
    observations,
    findings,
    scenarios,
    avgRating,
    avgEase,
    avgClarity,
    avgSuccessRate,
    recommendRate,
  ]);

  const handleSaveReport = useCallback(async () => {
    setSaving(true);
    try {
      await supabase.from('reports').insert([
        { ...form, test_plan_id: planId },
      ]);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save report:', err);
    } finally {
      setSaving(false);
    }
  }, [form, planId, onRefresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from('reports').delete().eq('id', id);
      onRefresh();
    },
    [onRefresh]
  );

  const downloadReport = (report: Report) => {
    const content = [
      `# Usability Testing Report`,
      `## ${plan.title}`,
      '',
      `**Product:** ${plan.product_name || 'N/A'}`,
      `**Date:** ${formatDate(report.created_at)}`,
      '',
      `### Summary`,
      report.summary,
      '',
      `### Methodology`,
      report.methodology,
      '',
      `### Key Metrics`,
      report.key_metrics,
      '',
      `### Findings & Recommendations`,
      ...findings.map(
        (f) =>
          `- **${f.title}** [${formatSeverity(f.severity)} | ${formatCategory(f.category)}]\n  ${f.description}\n  Recommendation: ${f.recommendation}`
      ),
      '',
      `### Participant Feedback`,
      ...feedback.map(
        (f) =>
          `- Overall: ${f.overall_rating}/5, Ease: ${f.ease_of_use_rating}/5, Clarity: ${f.clarity_rating}/5, Success: ${f.task_success_rate}%, Recommend: ${f.would_recommend ? 'Yes' : 'No'}\n  Comments: ${f.overall_comments || 'None'}`
      ),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usability-report-${plan.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const metricsCards = [
    { label: 'Avg. Rating', value: `${avgRating}`, sub: '/5', icon: Star, color: 'text-amber-500' },
    { label: 'Task Success', value: `${avgSuccessRate}%`, sub: '', icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Recommend Rate', value: `${recommendRate}%`, sub: '', icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Findings', value: `${findings.length}`, sub: '', icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Generate reports with findings and design improvement suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {completedSessions.length > 0 && (
            <button onClick={generateAutoReport} disabled={saving} className="btn-secondary">
              <BarChart3 className="w-4 h-4" /> Auto-Generate
            </button>
          )}
          <button
            onClick={() => {
              setForm({ summary: '', methodology: '', key_metrics: '' });
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New Report
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      {feedback.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {metricsCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {m.value}
                  {m.sub && <span className="text-sm text-slate-400 ml-0.5">{m.sub}</span>}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="card">
          <EmptyState
            message="Generate a report from your testing data or create one manually"
            label="No reports yet"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Report — {formatDate(report.created_at)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 mb-2">
                    Generated {new Date(report.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500 line-clamp-2">{report.summary}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setViewing(report)} className="btn-secondary btn-sm">
                      <FileText className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => downloadReport(report)} className="btn-secondary btn-sm">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Report Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Create Report"
        subtitle="Document your usability testing findings and recommendations"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveReport} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Report'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Summary</label>
            <textarea
              placeholder="Executive summary of the usability study results..."
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="input min-h-[100px] resize-y"
            />
          </div>
          <div>
            <label className="label">Methodology</label>
            <textarea
              placeholder="How was the testing conducted? What methods were used?"
              value={form.methodology}
              onChange={(e) => setForm({ ...form, methodology: e.target.value })}
              className="input min-h-[100px] resize-y"
            />
          </div>
          <div>
            <label className="label">Key Metrics (one per line)</label>
            <textarea
              placeholder={'Participants: 5\nCompleted Sessions: 4\nAverage Rating: 3.8/5'}
              value={form.key_metrics}
              onChange={(e) => setForm({ ...form, key_metrics: e.target.value })}
              className="input min-h-[100px] resize-y font-mono text-sm"
            />
          </div>
        </div>
      </Modal>

      {/* View Report Modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Full Report"
        subtitle={viewing ? formatDate(viewing.created_at) : ''}
        size="lg"
        footer={
          <>
            <button onClick={() => setViewing(null)} className="btn-secondary">Close</button>
            {viewing && (
              <button onClick={() => downloadReport(viewing)} className="btn-primary">
                <Download className="w-4 h-4" /> Download
              </button>
            )}
          </>
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Summary</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewing.summary || 'No summary provided.'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Methodology</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewing.methodology || 'No methodology provided.'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Key Metrics</h3>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <pre className="text-sm text-slate-600 whitespace-pre-wrap font-mono">
                  {viewing.key_metrics || 'No metrics provided.'}
                </pre>
              </div>
            </div>
            {findings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Findings & Recommendations ({findings.length})
                </h3>
                <div className="space-y-2">
                  {findings.map((f) => (
                    <div key={f.id} className="p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${SEVERITY_STYLES[f.severity] || ''}`}>
                          {formatSeverity(f.severity)}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{f.title}</span>
                      </div>
                      <p className="text-xs text-slate-500">{f.description}</p>
                      {f.recommendation && (
                        <p className="text-xs text-blue-600 mt-1">→ {f.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {feedback.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Participant Feedback ({feedback.length})
                </h3>
                <div className="space-y-2">
                  {feedback.map((f) => (
                    <div key={f.id} className="p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Overall: <strong className="text-slate-700">{f.overall_rating}/5</strong></span>
                        <span>Ease: <strong className="text-slate-700">{f.ease_of_use_rating}/5</strong></span>
                        <span>Clarity: <strong className="text-slate-700">{f.clarity_rating}/5</strong></span>
                        <span>Success: <strong className="text-slate-700">{f.task_success_rate}%</strong></span>
                        <span>Recommend: <strong className="text-slate-700">{f.would_recommend ? 'Yes' : 'No'}</strong></span>
                      </div>
                      {f.overall_comments && (
                        <p className="text-xs text-slate-500 mt-1.5 italic">"{f.overall_comments}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
