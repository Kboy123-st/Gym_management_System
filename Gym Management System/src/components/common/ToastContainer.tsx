import React from 'react';
import { useGym } from '../../context/GymContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useGym();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const bg =
          t.type === 'error'
            ? 'bg-[#D8483A] text-white'
            : t.type === 'info'
            ? 'bg-[#17544C] text-white'
            : 'bg-[#0E2B27] text-white border border-[#CFFF3D]/20';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg shadow-xl text-sm font-medium ${bg} transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
              ) : t.type === 'info' ? (
                <Info className="w-5 h-5 text-teal-200 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#CFFF3D] shrink-0" />
              )}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:opacity-80 transition-opacity"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
