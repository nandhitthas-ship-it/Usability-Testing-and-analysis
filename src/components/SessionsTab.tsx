import { useState, useCallback } from 'react';
import { supabase, type Participant, type Scenario, type Session, type Observation, type Feedback } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  Video,
  Play,
  CheckCircle2,
  Eye,
  Star,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  STATUS_STYLES,
  formatStatus,
  formatDate,
  formatTime,
  SEVERITY_STYLES,
  OBSERVATION_TYPE_STYLES,
  SEVERITY_OPTIONS,
  OBSERVATION_TYPE_OPTIONS,
  formatSeverity,
  formatObservationType,
} from '@/lib/constants';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Props {
  planId: string;
  participants: Participant[];
  scenarios: Scenario[];
  sessions: Session[];
  observations: Observation[];
  feedback: Feedback[];
  onRefresh: () => void;
}

export default function SessionsTab({
  planId,
  participants,
  scenarios,
  sessions,
  observations,
  feedback,
  onRefresh,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [conducting, setConducting] = useState<Session | null>(null);
  const [collectingFeedback, setCollectingFeedback] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    participant_id: '',
    scheduled_date: '',
  });
  const [obsForm, setObsForm] = useState({
    scenario_id: '',
    description: '',
    severity: 'minor' as 'none' | 'minor' | 'major' | 'critical',
    observation_type: 'behavior' as 'behavior' | 'comment' | 'error' | 'success',
    timestamp_seconds: 0,
  });
  const [feedbackForm, setFeedbackForm] = useState({
    overall_rating: 3,
    ease_of_use_rating: 3,
    clarity_rating: 3,
    overall_comments: '',
    would_recommend: false,
    task_success_rate: 0,
  });

  const openCreate = () => {
    setSessionForm({ participant_id: '', scheduled_date: '' });
    setShowCreate(true);
  };

  const handleCreateSession = useCallback(async () => {
    if (!sessionForm.participant_id) return;
    setSaving(true);
    try {
      const { data } = await supabase
        .from('sessions')
        .insert([
          {
            test_plan_id: planId,
            participant_id: sessionForm.participant_id,
            scheduled_date: sessionForm.scheduled_date || null,
            status: 'scheduled',
          },
        ])
        .select()
        .maybeSingle();
      if (data) {
        await supabase
          .from('participants')
          .update({ status: 'scheduled' })
          .eq('id', sessionForm.participant_id);
      }
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setSaving(false);
    }
  }, [sessionForm, planId, onRefresh]);

  const handleStartSession = useCallback(async (session: Session) => {
    await supabase.from('sessions').update({ status: 'in_progress' }).eq('id', session.id);
    setConducting(session);
    onRefresh();
  }, [onRefresh]);

  const handleCompleteSession = useCallback(async () => {
    if (!conducting) return;
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', conducting.id);
    await supabase.from('participants').update({ status: 'completed' }).eq('id', conducting.participant_id);
    setConducting(null);
    onRefresh();
  }, [conducting, onRefresh]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await supabase.from('sessions').delete().eq('id', id);
      onRefresh();
    },
    [onRefresh]
  );

  const handleAddObservation = useCallback(async () => {
    if (!conducting || !obsForm.description.trim()) return;
    setSaving(true);
    try {
      await supabase.from('observations').insert([
        {
          session_id: conducting.id,
          scenario_id: obsForm.scenario_id || null,
          description: obsForm.description,
          severity: obsForm.severity,
          observation_type: obsForm.observation_type,
          timestamp_seconds: obsForm.timestamp_seconds,
        },
      ]);
      setObsForm({
        scenario_id: '',
        description: '',
        severity: 'minor',
        observation_type: 'behavior',
        timestamp_seconds: 0,
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to add observation:', err);
    } finally {
      setSaving(false);
    }
  }, [conducting, obsForm, onRefresh]);

  const handleDeleteObservation = useCallback(
    async (id: string) => {
      await supabase.from('observations').delete().eq('id', id);
      onRefresh();
    },
    [onRefresh]
  );

  const handleSaveFeedback = useCallback(async () => {
    if (!collectingFeedback) return;
    setSaving(true);
    try {
      const existing = feedback.find((f) => f.session_id === collectingFeedback.id);
      if (existing) {
        await supabase.from('feedback').update(feedbackForm).eq('id', existing.id);
      } else {
        await supabase.from('feedback').insert([{ ...feedbackForm, session_id: collectingFeedback.id }]);
      }
      setCollectingFeedback(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to save feedback:', err);
    } finally {
      setSaving(false);
    }
  }, [collectingFeedback, feedbackForm, feedback, onRefresh]);

  const openFeedback = (session: Session) => {
    const existing = feedback.find((f) => f.session_id === session.id);
    if (existing) {
      setFeedbackForm({
        overall_rating: existing.overall_rating,
        ease_of_use_rating: existing.ease_of_use_rating,
        clarity_rating: existing.clarity_rating,
        overall_comments: existing.overall_comments,
        would_recommend: existing.would_recommend,
        task_success_rate: existing.task_success_rate,
      });
    } else {
      setFeedbackForm({
        overall_rating: 3,
        ease_of_use_rating: 3,
        clarity_rating: 3,
        overall_comments: '',
        would_recommend: false,
        task_success_rate: 0,
      });
    }
    setCollectingFeedback(session);
  };

  const participantName = (pid: string) => participants.find((p) => p.id === pid)?.name || 'Unknown';
  const sessionObservations = (sid: string) => observations.filter((o) => o.session_id === sid);
  const sessionFeedback = (sid: string) => feedback.find((f) => f.session_id === sid);
  const conductingObservations = conducting ? sessionObservations(conducting.id) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Testing Sessions</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Schedule and conduct usability testing sessions with participants
          </p>
        </div>
        <button onClick={openCreate} disabled={participants.length === 0} className="btn-primary">
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      {participants.length === 0 && sessions.length === 0 ? (
        <div className="card">
          <EmptyState
            message="Add participants first, then schedule testing sessions"
            label="No sessions yet"
          />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card">
          <EmptyState
            message="Schedule your first testing session with a participant"
            label="No sessions yet"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const obs = sessionObservations(session.id);
            const fb = sessionFeedback(session.id);
            return (
              <div key={session.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {participantName(session.participant_id)}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className={`badge ${STATUS_STYLES[session.status] || ''}`}>
                          {formatStatus(session.status)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(session.scheduled_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {obs.length} observations
                        </span>
                        {fb && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" /> {fb.overall_rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartSession(session)}
                        className="btn-secondary btn-sm"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                    {session.status === 'in_progress' && (
                      <button
                        onClick={() => handleStartSession(session)}
                        className="btn-secondary btn-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Continue
                      </button>
                    )}
                    <button
                      onClick={() => openFeedback(session)}
                      className="btn-secondary btn-sm"
                    >
                      <Star className="w-3.5 h-3.5" /> Feedback
                    </button>
                    {session.status !== 'completed' && (
                      <button
                        onClick={async () => {
                          await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id);
                          onRefresh();
                        }}
                        className="btn-secondary btn-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Schedule Session"
        subtitle="Schedule a usability testing session with a participant"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateSession} disabled={saving || !sessionForm.participant_id} className="btn-primary">
              {saving ? 'Creating...' : 'Schedule'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Participant <span className="text-red-400">*</span></label>
            <select
              value={sessionForm.participant_id}
              onChange={(e) => setSessionForm({ ...sessionForm, participant_id: e.target.value })}
              className="input"
            >
              <option value="">Select a participant...</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.tech_proficiency}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Scheduled Date</label>
            <input
              type="datetime-local"
              value={sessionForm.scheduled_date}
              onChange={(e) => setSessionForm({ ...sessionForm, scheduled_date: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </Modal>

      {/* Conduct Session Modal */}
      <Modal
        open={!!conducting}
        onClose={() => setConducting(null)}
        title="Conduct Session"
        subtitle={conducting ? `Recording observations for ${participantName(conducting.participant_id)}` : ''}
        size="lg"
        footer={
          <>
            <button onClick={() => setConducting(null)} className="btn-secondary">Close</button>
            <button onClick={handleCompleteSession} className="btn-primary">
              <CheckCircle2 className="w-4 h-4" /> Complete Session
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Add Observation Form */}
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Record Observation</h4>
            <div className="space-y-3">
              <div>
                <label className="label text-xs">Scenario (optional)</label>
                <select
                  value={obsForm.scenario_id}
                  onChange={(e) => setObsForm({ ...obsForm, scenario_id: e.target.value })}
                  className="input text-sm"
                >
                  <option value="">General observation</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Description <span className="text-red-400">*</span></label>
                <textarea
                  placeholder="What did the participant do or say?"
                  value={obsForm.description}
                  onChange={(e) => setObsForm({ ...obsForm, description: e.target.value })}
                  className="input text-sm min-h-[60px] resize-y"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">Type</label>
                  <select
                    value={obsForm.observation_type}
                    onChange={(e) => setObsForm({ ...obsForm, observation_type: e.target.value as 'behavior' | 'comment' | 'error' | 'success' })}
                    className="input text-sm"
                  >
                    {OBSERVATION_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Severity</label>
                  <select
                    value={obsForm.severity}
                    onChange={(e) => setObsForm({ ...obsForm, severity: e.target.value as 'none' | 'minor' | 'major' | 'critical' })}
                    className="input text-sm"
                  >
                    {SEVERITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Time (sec)</label>
                  <input
                    type="number"
                    min={0}
                    value={obsForm.timestamp_seconds}
                    onChange={(e) => setObsForm({ ...obsForm, timestamp_seconds: parseInt(e.target.value) || 0 })}
                    className="input text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleAddObservation}
                disabled={saving || !obsForm.description.trim()}
                className="btn-primary btn-sm w-full"
              >
                <Plus className="w-3.5 h-3.5" /> Add Observation
              </button>
            </div>
          </div>

          {/* Observations List */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Observations ({conductingObservations.length})
            </h4>
            {conductingObservations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                No observations recorded yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {conductingObservations
                  .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
                  .map((obs) => {
                    const scenario = scenarios.find((s) => s.id === obs.scenario_id);
                    return (
                      <div
                        key={obs.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white"
                      >
                        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                          <span className="text-xs font-mono text-slate-400">
                            {formatTime(obs.timestamp_seconds)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`badge ${OBSERVATION_TYPE_STYLES[obs.observation_type] || ''}`}>
                              {formatObservationType(obs.observation_type)}
                            </span>
                            <span className={`badge ${SEVERITY_STYLES[obs.severity] || ''}`}>
                              {formatSeverity(obs.severity)}
                            </span>
                            {scenario && (
                              <span className="text-xs text-slate-400 truncate">{scenario.title}</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{obs.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteObservation(obs.id)}
                          className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        open={!!collectingFeedback}
        onClose={() => setCollectingFeedback(null)}
        title="Session Feedback"
        subtitle={collectingFeedback ? `Post-session feedback from ${participantName(collectingFeedback.participant_id)}` : ''}
        footer={
          <>
            <button onClick={() => setCollectingFeedback(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveFeedback} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Feedback'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <RatingInput
            label="Overall Experience"
            value={feedbackForm.overall_rating}
            onChange={(v) => setFeedbackForm({ ...feedbackForm, overall_rating: v })}
          />
          <RatingInput
            label="Ease of Use"
            value={feedbackForm.ease_of_use_rating}
            onChange={(v) => setFeedbackForm({ ...feedbackForm, ease_of_use_rating: v })}
          />
          <RatingInput
            label="Clarity"
            value={feedbackForm.clarity_rating}
            onChange={(v) => setFeedbackForm({ ...feedbackForm, clarity_rating: v })}
          />
          <div>
            <label className="label">Task Success Rate (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={feedbackForm.task_success_rate}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, task_success_rate: parseInt(e.target.value) })}
                className="flex-1 accent-slate-900"
              />
              <span className="text-sm font-semibold text-slate-700 w-12 text-right">
                {feedbackForm.task_success_rate}%
              </span>
            </div>
          </div>
          <div>
            <label className="label">Would you recommend this product?</label>
            <button
              onClick={() => setFeedbackForm({ ...feedbackForm, would_recommend: !feedbackForm.would_recommend })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                feedbackForm.would_recommend
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {feedbackForm.would_recommend ? 'Yes, would recommend' : 'No, would not recommend'}
            </button>
          </div>
          <div>
            <label className="label">Overall Comments</label>
            <textarea
              placeholder="Any additional feedback from the participant..."
              value={feedbackForm.overall_comments}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, overall_comments: e.target.value })}
              className="input min-h-[80px] resize-y"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`p-1 transition-all ${n <= value ? 'text-amber-400' : 'text-slate-200 hover:text-slate-300'}`}
          >
            <Star className="w-6 h-6" fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className="text-sm text-slate-400 ml-2">{value}/5</span>
      </div>
    </div>
  );
}
