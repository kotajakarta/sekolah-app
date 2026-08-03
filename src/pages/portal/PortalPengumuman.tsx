import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetPengumuman } from '../../features/portal/hooks/useGetPengumuman';
import { Megaphone, Loader2 } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PortalPengumuman() {
  const { selectedStudentId, isLoading: isStudentLoading, isError: isStudentError } = usePortalStudent();
  const { data: list = [], isLoading } = useGetPengumuman();

  if (isStudentLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }

  if (isStudentError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-rose-600">
        Gagal memuat data, coba lagi.
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Pengumuman</h1>
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-400">
          Belum ada pengumuman.
        </div>
      ) : (
        list.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-800">{item.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.createdAt)}</p>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{item.content}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
