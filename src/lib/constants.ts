export const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  recruited: 'bg-slate-100 text-slate-600 border-slate-200',
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
};

export const SEVERITY_STYLES: Record<string, string> = {
  none: 'bg-slate-100 text-slate-600 border-slate-200',
  minor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  major: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

export const OBSERVATION_TYPE_STYLES: Record<string, string> = {
  behavior: 'bg-sky-50 text-sky-700 border-sky-200',
  comment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const SEVERITY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'critical', label: 'Critical' },
];

export const OBSERVATION_TYPE_OPTIONS = [
  { value: 'behavior', label: 'Behavior' },
  { value: 'comment', label: 'Comment' },
  { value: 'error', label: 'Error' },
  { value: 'success', label: 'Success' },
];

export const FINDING_CATEGORY_OPTIONS = [
  { value: 'navigation', label: 'Navigation' },
  { value: 'content', label: 'Content' },
  { value: 'visual', label: 'Visual Design' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'performance', label: 'Performance' },
  { value: 'information', label: 'Information Architecture' },
];

export const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function formatSeverity(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatObservationType(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatCategory(s: string): string {
  const map: Record<string, string> = {
    navigation: 'Navigation',
    content: 'Content',
    visual: 'Visual Design',
    interaction: 'Interaction',
    performance: 'Performance',
    information: 'Information Architecture',
  };
  return map[s] || s;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
