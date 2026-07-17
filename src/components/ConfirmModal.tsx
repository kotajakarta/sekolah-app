import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  requireInput?: string;
  confirmText?: string;
  variant?: 'danger' | 'primary' | 'success';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  requireInput,
  confirmText,
  variant = 'danger'
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  let iconColor = 'text-red-600';
  let buttonColor = 'bg-red-600 hover:bg-red-700';
  if (variant === 'primary') {
    iconColor = 'text-indigo-600';
    buttonColor = 'bg-indigo-600 hover:bg-indigo-700';
  } else if (variant === 'success') {
    iconColor = 'text-emerald-600';
    buttonColor = 'bg-emerald-600 hover:bg-emerald-700';
  }

  const defaultConfirmText = confirmText || (variant === 'danger' ? (t('common.delete') || 'Hapus') : (t('common.confirm') || 'Konfirmasi'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">{message}</p>
          {requireInput && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                Ketik <strong className="text-red-600">{requireInput}</strong> untuk melanjutkan:
              </p>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder={requireInput}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            {t('common.cancel') || 'Batal'}
          </button>
          <button
            disabled={requireInput ? inputValue !== requireInput : false}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
          >
            {defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
