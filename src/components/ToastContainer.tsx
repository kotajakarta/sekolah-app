import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, Toast, ToastType } from '../contexts/ToastContext';

const toastConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; iconColor: string; title: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-emerald-500',
    iconColor: 'text-emerald-500',
    title: 'Berhasil'
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-red-500',
    iconColor: 'text-red-500',
    title: 'Gagal'
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-amber-500',
    iconColor: 'text-amber-500',
    title: 'Peringatan'
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bg: 'bg-white',
    border: 'border-l-4 border-l-blue-500',
    iconColor: 'text-blue-500',
    title: 'Informasi'
  }
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const config = toastConfig[toast.type];

  return (
    <div
      className={`flex items-start gap-3 w-80 p-4 rounded-lg shadow-lg border border-slate-100 ${config.bg} ${config.border} animate-in slide-in-from-right-4 fade-in duration-300`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{config.title}</p>
        <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-line">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors ml-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
