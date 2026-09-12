import { useState, useCallback } from 'react';
import { supabase, type Participant, type Session } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Mail, User, Calendar } from 'lucide-react';
import { STATUS_STYLES, PROFICIENCY_OPTIONS, formatStatus } from '@/lib/constants';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Props {
  planId: string;
  participants: Participant[];
  sessions: Session[];
  onRefresh: () => void;
}

export default function ParticipantsTab({ planId, participants, sessions, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    demographics: '',
    tech_proficiency: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    status: 'recruited' as 'recruited' | 'scheduled' | 'completed',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', demographics: '', tech_proficiency: 'intermediate', status: 'recruited' });
    setShowForm(true);
  };

  const openEdit = (p: Participant) => {
    setEditing(p);
    setForm({
      name: p.name,
      email: p.email,
      demographics: p.demographics,
      tech_proficiency: p.tech_proficiency,
      status: p.status,
    });
    setShowForm(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from('participants').update(form).eq('id', editing.id);
      } else {
        await supabase.from('participants').insert([{ ...form, test_plan_id: planId }]);
      }
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save participant:', err);
    } finally {
      setSaving(false);
    }
  }, [form, editing, planId, onRefresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from('participants').delete().eq('id', id);
      onRefresh();
    },
    [onRefresh]
  );

  const sessionCountFor = (pid: string) => sessions.filter((s) => s.participant_id === pid).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Participants</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Recruit and manage sample users for your usability study
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Participant
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="card">
          <EmptyState
            message="Recruit participants to begin conducting usability sessions"
            label="No participants yet"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((p) => {
            const sessionCount = sessionCountFor(p.id);
            return (
              <div key={p.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{p.name}</h3>
                      <span className={`badge ${STATUS_STYLES[p.status] || ''} mt-1`}>
                        {formatStatus(p.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{p.tech_proficiency}</span>
                    {p.demographics && <span className="text-slate-300">•</span>}
                    {p.demographics && <span className="truncate">{p.demographics}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
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
        title={editing ? 'Edit Participant' : 'Add Participant'}
        subtitle="Recruit a sample user for your usability study"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Participant'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="e.g., Jane Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Demographics</label>
            <input
              type="text"
              placeholder="e.g., 28, Designer, Urban"
              value={form.demographics}
              onChange={(e) => setForm({ ...form, demographics: e.target.value })}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tech Proficiency</label>
              <select
                value={form.tech_proficiency}
                onChange={(e) => setForm({ ...form, tech_proficiency: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                className="input"
              >
                {PROFICIENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'recruited' | 'scheduled' | 'completed' })}
                className="input"
              >
                <option value="recruited">Recruited</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
