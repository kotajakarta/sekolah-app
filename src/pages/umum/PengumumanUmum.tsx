import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, ExternalLink, Calendar, Info, Megaphone, Link as LinkIcon, Mail, Key } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

interface LinkItem {
  title?: string;
  group?: string;
  description?: string;
  url: string;
  username?: string;
  password?: string;
}

interface Pengumuman {
  id: string;
  title: string;
  content: string;
  links: LinkItem[];
  isActive: boolean;
  createdAt: string;
}

export default function PengumumanUmum() {
  const { data: list, isLoading } = useQuery<Pengumuman[]>({
    queryKey: ['pengumuman'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/pengumuman');
      return res.data;
    }
  });

  const activePengumuman = list?.filter(p => p.isActive) || [];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="bg-[#2A3F54] text-white px-6 py-4 rounded-t-lg flex items-center shadow-md mb-6">
        <Megaphone className="w-6 h-6 mr-3 text-white fill-white transform -rotate-12" />
        <h1 className="text-xl font-bold tracking-wide text-white">PENGUMUMAN</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : activePengumuman.length === 0 ? (
        <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 shadow-sm p-12 text-center flex flex-col items-center">
          <Info className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Tidak Ada Pengumuman</h3>
          <p className="text-slate-500 mt-2 text-sm">Saat ini belum ada informasi yang dapat ditampilkan.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activePengumuman.map((item) => {
            // Group links by their group name
            const groupedLinks: Record<string, LinkItem[]> = {};
            item.links?.forEach(link => {
              const groupName = link.group?.trim() || 'TAUTAN LAINNYA';
              if (!groupedLinks[groupName]) {
                groupedLinks[groupName] = [];
              }
              groupedLinks[groupName].push(link);
            });

            return (
              <div key={item.id} className="flex flex-col lg:flex-row gap-6">

                {/* Left Column: Content */}
                <div className="flex-1 bg-white rounded-md shadow-sm border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">{item.title}</h2>
                  <div
                    className="prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>

                {/* Right Column: Links */}
                {Object.keys(groupedLinks).length > 0 && (
                  <div className="w-full lg:w-[400px] flex flex-col gap-4">
                    {Object.entries(groupedLinks).map(([groupName, groupLinks], gIdx) => (
                      <div key={gIdx} className="bg-white rounded-sm shadow-sm border border-slate-200">
                        {/* Group Header */}
                        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            {groupName}
                          </h3>
                        </div>

                        {/* Links List */}
                        <div className="divide-y divide-slate-100">
                          {groupLinks.map((link, lIdx) => (
                            <div key={lIdx} className="p-4">
                              <h4 className="text-[#0d6efd] font-bold text-sm mb-2 uppercase hover:underline cursor-pointer">
                                {link.title || link.url}
                              </h4>

                              {link.description && (
                                <div className="text-[13px] text-slate-500 mb-2 mt-1">
                                  {link.description}
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <div className="flex items-start text-[13px] text-slate-600">
                                  <LinkIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                  <a href={link.url} target="_blank" rel="noreferrer" className="text-[#0d6efd] hover:underline break-all">
                                    {link.url}
                                  </a>
                                </div>

                                {link.username && (
                                  <div className="flex items-start text-[13px] text-slate-600">
                                    <Mail className="w-3.5 h-3.5 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                    <span>{link.username}</span>
                                  </div>
                                )}

                                {link.password && (
                                  <div className="flex items-start text-[13px] text-pink-500 font-mono">
                                    <Key className="w-3.5 h-3.5 mr-2 mt-0.5 shrink-0" />
                                    <span>{link.password}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
