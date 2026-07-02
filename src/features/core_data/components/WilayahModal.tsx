import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { Wilayah } from '../hooks/useMasterData';

interface WilayahModalProps {
  isOpen: boolean;
  onClose: () => void;
  wilayahToEdit?: Wilayah | null;
}

export default function WilayahModal({ isOpen, onClose, wilayahToEdit }: WilayahModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (wilayahToEdit) {
      setFormData({
        name: wilayahToEdit.name || '',
      });
    } else {
      setFormData({ name: '' });
    }
  }, [wilayahToEdit]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (wilayahToEdit) {
        return apiClient.put(`/master-data/wilayah/${wilayahToEdit.id}`, data);
      }
      return apiClient.post('/master-data/wilayah', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wilayah'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {wilayahToEdit ? t('common.edit') : t('common.add')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('wilayah.region_name')} *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
