import React from 'react';
import StudentPoolTable from '../../features/core_data/components/StudentPoolTable';
import { useTranslation } from 'react-i18next';

export default function PoolSiswa() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{t('pool_siswa.title')}</h1>
        <p className="text-sm text-slate-500 mt-1.5">{t('pool_siswa.subtitle')}</p>
      </div>
      
      <StudentPoolTable />
    </div>
  );
}
