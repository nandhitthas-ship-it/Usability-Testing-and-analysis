import { AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">Something went wrong</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
