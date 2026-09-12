import { LayoutDashboard, FolderPlus, Home, ClipboardList } from 'lucide-react';

type View =
  | { name: 'dashboard' }
  | { name: 'test-plans' }
  | { name: 'test-plan-detail'; id: string };

interface Props {
  currentView: string;
  onNavigate: (view: View) => void;
  planCount: number;
}

export default function Sidebar({ currentView, onNavigate, planCount }: Props) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'test-plans', label: 'Test Plans', icon: ClipboardList, badge: planCount },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 leading-tight">UsabilityHub</div>
            <div className="text-xs text-slate-400 leading-tight">Testing & Analysis</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            currentView === item.id ||
            (currentView === 'test-plan-detail' && item.id === 'test-plans');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate({ name: item.id as 'dashboard' | 'test-plans' })}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={() => onNavigate({ name: 'test-plans' })}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
        >
          <FolderPlus className="w-4.5 h-4.5 shrink-0" />
          <span>New Test Plan</span>
        </button>
      </div>
    </aside>
  );
}
