import React from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export default function NotificationModal({ isOpen, onClose, type, title, message }: NotificationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex justify-center mb-4 mt-2">
          {type === 'success' ? (
            <div className="w-20 h-20 rounded-full border-[3px] border-[#4fd1c5] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#4fd1c5]" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full border-[3px] border-red-500 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-8 whitespace-pre-line">{message}</p>
        
        <button
          onClick={onClose}
          className={`w-32 py-2 rounded-md font-medium text-white transition-colors ${
            type === 'success' ? 'bg-[#4fd1c5] hover:bg-[#3db8ac]' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
