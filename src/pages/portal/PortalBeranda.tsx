import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';

// Placeholder — Task 6 replaces this body with real content.
export default function PortalBeranda() {
  const { selectedLink } = usePortalStudent();
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
      <h1 className="text-lg font-bold text-slate-800">Beranda</h1>
      <p className="mt-2 text-sm text-slate-500">
        {selectedLink ? `Menampilkan data untuk ${selectedLink.student.biodata?.fullName ?? '...'}.` : 'Memuat data anak...'}
      </p>
      <p className="mt-4 text-sm text-slate-400">Konten segera hadir.</p>
    </div>
  );
}
