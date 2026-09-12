interface Props {
  label?: string;
}

export default function Loading({ label = 'Loading...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      <p className="text-sm text-slate-400 mt-3">{label}</p>
    </div>
  );
}
