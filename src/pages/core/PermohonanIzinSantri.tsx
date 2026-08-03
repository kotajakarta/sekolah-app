import { useTranslation } from 'react-i18next';
import PermohonanIzinSantriTab from '../../features/permohonan/PermohonanIzinSantriTab';

export default function PermohonanIzinSantri() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{t('portal.izin_title') || 'Konfirmasi Izin Santri'}</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          {t('portal.izin_subtitle') || 'Tinjau dan proses permohonan izin dari wali santri.'}
        </p>
      </div>

      <PermohonanIzinSantriTab />
    </div>
  );
}
