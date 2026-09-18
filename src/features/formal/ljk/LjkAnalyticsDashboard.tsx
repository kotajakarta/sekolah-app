import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import {
  BarChart2, TrendingUp, TrendingDown, Users, Target,
  AlertTriangle, BookOpen, Filter, RefreshCw, Loader2, Award, Star, Info,
} from 'lucide-react';

interface AnalyticsProps {
  selectedMapelId?: string;
  selectedMapel?: { id: string; name: string; kodeMapel?: string };
  selectedKelasId?: string;
  selectedKelas?: { id: string; name: string; tingkat?: string | null };
  tahunAjaran?: string;
  semester?: string;
  officialBanks?: any[];
  activeBankSoalId?: string;
}

interface PerSoalItem {
  nomor: number;
  kunciJawaban: string | null;
  benar: number; salah: number; kosong: number;
  pctBenar: number; pctSalah: number; pctKosong: number;
  distribusiPilihan: Record<string, number>;
  difficulty: number | null;
  label: 'MUDAH' | 'SEDANG' | 'AGAK_SULIT' | 'SULIT' | 'TIDAK_ADA_KUNCI';
}

interface AnalyticsData {
  totalSiswa: number; avgSkor: number; maxSkor: number; minSkor: number;
  kelulusanPct: number; hasAnswerKey: boolean; mapel: string; kelas: string; semester: string;
  skorDistribution: { range: string; count: number }[];
  perSoal: PerSoalItem[];
  soalTersulit: { nomor: number; pctBenar: number; label: string }[];
  soalTermudah: { nomor: number; pctBenar: number; label: string }[];
}

const LABEL_CONFIG: Record<string, { color: string; barColor: string }> = {
  MUDAH: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', barColor: '#10b981' },
  SEDANG: { color: 'bg-blue-100 text-blue-800 border-blue-300', barColor: '#3b82f6' },
  AGAK_SULIT: { color: 'bg-amber-100 text-amber-800 border-amber-300', barColor: '#f59e0b' },
  SULIT: { color: 'bg-rose-100 text-rose-800 border-rose-300', barColor: '#ef4444' },
  TIDAK_ADA_KUNCI: { color: 'bg-slate-100 text-slate-500 border-slate-200', barColor: '#94a3b8' },
};

const OPTION_COLORS: Record<string, string> = { A: '#6366f1', B: '#0ea5e9', C: '#f59e0b', D: '#10b981' };

export const LjkAnalyticsDashboard: React.FC<AnalyticsProps> = ({
  selectedMapelId, selectedMapel, selectedKelasId, selectedKelas,
  tahunAjaran, semester, officialBanks = [], activeBankSoalId,
}) => {
  const [selectedBankId, setSelectedBankId] = useState(activeBankSoalId || '');
  const [filterMapelId] = useState(selectedMapelId || '');
  const [filterKelasId] = useState(selectedKelasId || '');
  const [filterSemester, setFilterSemester] = useState(semester || '');
  const [filterTahunAjaran] = useState(tahunAjaran || '2024/2025');
  const [showAllSoal, setShowAllSoal] = useState(false);

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (selectedBankId) p.questionBankId = selectedBankId;
    if (filterMapelId) p.mataPelajaranId = filterMapelId;
    if (filterKelasId) p.kelasId = filterKelasId;
    if (filterSemester) p.semester = filterSemester;
    if (filterTahunAjaran) p.tahunAjaran = filterTahunAjaran;
    return p;
  }, [selectedBankId, filterMapelId, filterKelasId, filterSemester, filterTahunAjaran]);

  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['ljk-analytics', queryParams],
    queryFn: async () => {
      const res = await apiClient.get('/formal/ljk/analytics', { params: queryParams });
      return res.data;
    },
    enabled: !!(filterMapelId || filterKelasId || selectedBankId),
    staleTime: 30000,
  });

  const maxDistCount = data ? Math.max(...data.skorDistribution.map(d => d.count), 1) : 1;
  const displayedSoal = data ? (showAllSoal ? data.perSoal : data.perSoal.slice(0, 15)) : [];

  if (!filterMapelId && !filterKelasId && !selectedBankId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
        <BarChart2 className="w-16 h-16 opacity-20" />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-500 mb-1">Pilih filter untuk melihat analitik</p>
          <p className="text-sm">Pilih Bank Soal, Mata Pelajaran, atau Kelas di atas untuk menampilkan dashboard analitik LJK</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-600">Filter Analitik:</span>
          <select
            id="analytics-bank-filter"
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-violet-400 focus:outline-none"
          >
            <option value="">— Semua Bank Soal —</option>
            {officialBanks.map((b: any) => (
              <option key={b.id} value={b.id}>{b.title || b.subject} ({b.gradeLevel})</option>
            ))}
          </select>
          <select
            id="analytics-semester-filter"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-violet-400 focus:outline-none"
          >
            <option value="">— Semua Semester —</option>
            <option value="GANJIL">Ganjil</option>
            <option value="GENAP">Genap</option>
          </select>
          <button
            id="analytics-refresh-btn"
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <span>Menganalisis data hasil LJK...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />Gagal memuat data analitik. Coba refresh.
        </div>
      )}

      {data && !isLoading && (
        <>
          {data.totalSiswa === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <BookOpen className="w-12 h-12 opacity-20" />
              <p className="text-sm text-slate-500 font-medium">Belum ada data LJK untuk filter ini</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 px-1">
                <Info className="w-3.5 h-3.5 text-violet-400" />
                Analitik: <strong className="text-slate-700">{data.mapel || selectedMapel?.name}</strong>
                {(data.kelas || selectedKelas?.name) && <> · Kelas <strong className="text-slate-700">{data.kelas || selectedKelas?.name}</strong></>}
                {data.semester && <> · <strong className="text-slate-700">{data.semester}</strong></>}
                · <strong className="text-violet-700">{data.totalSiswa} siswa</strong>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'card-total', icon: Users, label: 'Total Siswa', value: data.totalSiswa.toString(), color: 'from-violet-500 to-violet-600', sub: 'lembar LJK diproses' },
                  { id: 'card-avg', icon: Target, label: 'Rata-rata Skor', value: `${data.avgSkor}`, color: data.avgSkor >= 75 ? 'from-emerald-500 to-emerald-600' : 'from-amber-500 to-amber-600', sub: `Min: ${data.minSkor} · Max: ${data.maxSkor}` },
                  { id: 'card-kelulusan', icon: Award, label: 'Kelulusan ≥75', value: `${data.kelulusanPct}%`, color: data.kelulusanPct >= 70 ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-rose-600', sub: `${Math.round(data.totalSiswa * data.kelulusanPct / 100)} dari ${data.totalSiswa} siswa` },
                  { id: 'card-sulit', icon: AlertTriangle, label: 'Soal Tersulit', value: data.soalTersulit[0] ? `No.${data.soalTersulit[0].nomor}` : '-', color: 'from-rose-500 to-rose-600', sub: data.soalTersulit[0] ? `${data.soalTersulit[0].pctBenar}% benar` : 'Belum ada kunci' },
                ].map(card => (
                  <div key={card.id} id={card.id} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                      <card.icon className="w-5 h-5 opacity-80" />
                      <span className="text-2xl font-black">{card.value}</span>
                    </div>
                    <p className="text-xs font-bold opacity-90 mb-0.5">{card.label}</p>
                    <p className="text-[10px] opacity-70">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Score Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800">Distribusi Skor Siswa</h3>
                </div>
                <div className="flex items-end gap-2 h-28">
                  {data.skorDistribution.map((d, i) => {
                    const heightPct = (d.count / maxDistCount) * 100;
                    const barColor = i >= 7 ? '#10b981' : i >= 5 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={d.range} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[9px] font-bold text-slate-600">{d.count > 0 ? d.count : ''}</span>
                        <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${Math.max(4, heightPct)}%`, backgroundColor: barColor, opacity: d.count === 0 ? 0.15 : 1 }} />
                        <span className="text-[8px] text-slate-400 whitespace-nowrap">{d.range}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-rose-500" /> {'<50'}</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-amber-400" /> 50–69</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-emerald-500" /> {'>= 70'}</span>
                </div>
              </div>

              {/* Top Sulit & Mudah */}
              {data.hasAnswerKey && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-rose-500" /><h3 className="text-sm font-bold text-rose-800">5 Soal Tersulit</h3></div>
                    <div className="space-y-2">
                      {data.soalTersulit.map((s, i) => (
                        <div key={s.nomor} className="flex items-center gap-3">
                          <span className="text-xs font-black text-rose-700 w-5">{i + 1}.</span>
                          <span className="text-xs font-bold text-slate-700 w-16">No. {s.nomor}</span>
                          <div className="flex-1 bg-rose-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${s.pctBenar}%` }} /></div>
                          <span className="text-xs font-bold text-rose-700 w-12 text-right">{s.pctBenar}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-600" /><h3 className="text-sm font-bold text-emerald-800">5 Soal Termudah</h3></div>
                    <div className="space-y-2">
                      {data.soalTermudah.map((s, i) => (
                        <div key={s.nomor} className="flex items-center gap-3">
                          <span className="text-xs font-black text-emerald-700 w-5">{i + 1}.</span>
                          <span className="text-xs font-bold text-slate-700 w-16">No. {s.nomor}</span>
                          <div className="flex-1 bg-emerald-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.pctBenar}%` }} /></div>
                          <span className="text-xs font-bold text-emerald-700 w-12 text-right">{s.pctBenar}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Per-Soal Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold text-slate-800">Analisis Per Soal</h3>
                    {!data.hasAnswerKey && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Tanpa kunci</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Benar</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Salah</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Kosong</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 w-12">No.</th>
                        <th className="px-4 py-2.5 text-center font-bold text-slate-600 w-12">Kunci</th>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600">Distribusi</th>
                        <th className="px-4 py-2.5 text-center font-bold text-slate-600 w-20">% Benar</th>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 w-24">A/B/C/D</th>
                        <th className="px-4 py-2.5 text-center font-bold text-slate-600 w-24">Tingkat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {displayedSoal.map((soal) => {
                        const cfg = LABEL_CONFIG[soal.label] || LABEL_CONFIG.TIDAK_ADA_KUNCI;
                        const totalPilihan = Object.values(soal.distribusiPilihan).reduce((a, b) => a + b, 0) || 1;
                        return (
                          <tr key={soal.nomor} id={`soal-row-${soal.nomor}`} className={`hover:bg-slate-50/50 transition-colors ${soal.label === 'SULIT' ? 'bg-rose-50/30' : soal.label === 'MUDAH' ? 'bg-emerald-50/20' : ''}`}>
                            <td className="px-4 py-2.5"><span className="font-black text-slate-700">#{soal.nomor}</span></td>
                            <td className="px-4 py-2.5 text-center">
                              {soal.kunciJawaban
                                ? <span className="font-black text-violet-700 bg-violet-100 rounded-full w-6 h-6 inline-flex items-center justify-center">{soal.kunciJawaban}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1 h-4">
                                {soal.pctBenar > 0 && <div className="h-full rounded-sm bg-emerald-500" style={{ width: `${soal.pctBenar}%` }} title={`Benar: ${soal.benar}`} />}
                                {soal.pctSalah > 0 && <div className="h-full rounded-sm bg-rose-400" style={{ width: `${soal.pctSalah}%` }} title={`Salah: ${soal.salah}`} />}
                                {soal.pctKosong > 0 && <div className="h-full rounded-sm bg-slate-200" style={{ width: `${soal.pctKosong}%` }} title={`Kosong: ${soal.kosong}`} />}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5">✓{soal.benar} · ✕{soal.salah} · —{soal.kosong}</div>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`font-black text-sm ${soal.pctBenar >= 90 ? 'text-emerald-600' : soal.pctBenar >= 70 ? 'text-blue-600' : soal.pctBenar >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{soal.pctBenar}%</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-end gap-0.5 h-6">
                                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                  const cnt = soal.distribusiPilihan[opt] || 0;
                                  const pct = (cnt / totalPilihan) * 100;
                                  return (
                                    <div key={opt} className="flex flex-col items-center gap-0.5 flex-1" title={`${opt}: ${cnt}`}>
                                      <div className="w-full rounded-sm" style={{ height: `${Math.max(2, pct)}%`, backgroundColor: OPTION_COLORS[opt], opacity: soal.kunciJawaban === opt ? 1 : 0.5 }} />
                                      <span className={`text-[8px] font-bold ${soal.kunciJawaban === opt ? 'text-slate-700' : 'text-slate-400'}`}>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                {soal.label === 'TIDAK_ADA_KUNCI' ? 'No Key' : soal.label === 'AGAK_SULIT' ? 'Agak Sulit' : soal.label.charAt(0) + soal.label.slice(1).toLowerCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {data.perSoal.length > 15 && (
                  <div className="px-5 py-3 border-t border-slate-100 text-center">
                    <button id="analytics-show-all-btn" onClick={() => setShowAllSoal(!showAllSoal)} className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                      {showAllSoal ? 'Tampilkan lebih sedikit ↑' : `Tampilkan semua ${data.perSoal.length} soal ↓`}
                    </button>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-600">Tingkat Kesulitan:</span>
                {[['MUDAH','≥90%'],['SEDANG','70–89%'],['AGAK_SULIT','50–69%'],['SULIT','<50%']].map(([lbl, pct]) => {
                  const cfg = LABEL_CONFIG[lbl];
                  return <span key={lbl} className={`px-2 py-0.5 rounded-full border font-semibold ${cfg.color}`}>{lbl === 'AGAK_SULIT' ? 'Agak Sulit' : lbl.charAt(0) + lbl.slice(1).toLowerCase()} ({pct})</span>;
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LjkAnalyticsDashboard;
