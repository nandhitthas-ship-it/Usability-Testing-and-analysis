import { useState, useCallback } from 'react';
import { supabase, type TestPlan } from '@/lib/supabase';
import { Plus, Search, ClipboardList, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { STATUS_STYLES, formatStatus } from '@/lib/constants';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

interface Props {
  plans: TestPlan[];
  loading: boolean;
  onRefresh: () => void;
  onOpenPlan: (id: string) => void;
}

export default function TestPlans({ plans, loading, onRefresh, onOpenPlan }: Props) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TestPlan | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    product_name: '',
    description: '',
    objectives: '',
    status: 'draft' as 'draft' | 'active' | 'completed',
  });

  const filtered = plans.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', product_name: '', description: '', objectives: '', status: 'draft' });
    setShowCreate(true);
  };

  const openEdit = (plan: TestPlan) => {
    setEditing(plan);
    setForm({
      title: plan.title,
      product_name: plan.product_name,
      description: plan.description,
      objectives: plan.objectives,
      status: plan.status,
    });
    setShowCreate(true);
    setMenuOpen(null);
  };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase
          .from('test_plans')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
      } else {
        await supabase.from('test_plans').insert([form]);
      }
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save test plan:', err);
    } finally {
      setSaving(false);
    }
  }, [form, editing, onRefresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from('test_plans').delete().eq('id', id);
      setMenuOpen(null);
      onRefresh();
    },
    [onRefresh]
  );

  if (loading) return <Loading />;

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Plans</h1>
          <p className="text-sm text-slate-500 mt-1">
            Prepare and manage usability test plans for your products
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Test Plan
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search test plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 max-w-md"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card">
          {search ? (
            <EmptyState message="Try adjusting your search" label="No matching test plans" />
          ) : (
            <EmptyState message="Create your first test plan to start conducting usability tests" label="No test plans yet" />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plan) => (
            <div
              key={plan.id}
              className="card p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 group cursor-pointer relative"
              onClick={() => onOpenPlan(plan.id)}
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
                <div className="relative shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === plan.id ? null : plan.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === plan.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-36">
                        <button
                          onClick={() => openEdit(plan)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className={`badge ${STATUS_STYLES[plan.status] || ''} mb-3`}>
                {formatStatus(plan.status)}
              </span>
              {plan.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-2">{plan.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
                <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={editing ? 'Edit Test Plan' : 'Create Test Plan'}
        subtitle="Define the scope and objectives of your usability study"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="btn-primary"
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Plan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="e.g., Checkout Flow Usability Study"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Product Name</label>
            <input
              type="text"
              placeholder="e.g., E-Commerce Mobile App"
              value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="Brief description of what you're testing..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px] resize-y"
            />
          </div>
          <div>
            <label className="label">Objectives</label>
            <textarea
              placeholder="What do you want to learn from this study?"
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              className="input min-h-[80px] resize-y"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'active' | 'completed' })}
              className="input"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
