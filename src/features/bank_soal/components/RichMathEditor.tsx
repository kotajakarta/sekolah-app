import React, { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Sigma,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';

interface RichMathEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MATH_PRESETS = [
  { label: 'Pecahan (a/b)', latex: '\\frac{a}{b}' },
  { label: 'Akar (√x)', latex: '\\sqrt{x}' },
  { label: 'Pangkat (x²)', latex: 'x^{2}' },
  { label: 'Subskrip (x₁)', latex: 'x_{1}' },
  { label: 'Perkalian (×)', latex: '\\times' },
  { label: 'Pembagian (÷)', latex: '\\div' },
  { label: 'Plus-Minus (±)', latex: '\\pm' },
  { label: 'Tidak Sama (≠)', latex: '\\neq' },
  { label: 'Kurang Sama (≤)', latex: '\\le' },
  { label: 'Lebih Sama (≥)', latex: '\\ge' },
  { label: 'Panah (→)', latex: '\\rightarrow' },
  { label: 'Pi (π)', latex: '\\pi' },
  { label: 'Alpha (α)', latex: '\\alpha' },
  { label: 'Beta (β)', latex: '\\beta' },
  { label: 'Theta (θ)', latex: '\\theta' },
  { label: 'Sigma (∑)', latex: '\\sum_{i=1}^{n}' },
  { label: 'Integral (∫)', latex: '\\int_{a}^{b} f(x)dx' },
  { label: 'Derajat (°)', latex: '^{\\circ}' },
];

/**
 * Komponen pembantu untuk merender teks HTML dengan KaTeX math tags ($...$ atau $$...$$)
 */
export const FormattedMathPreview: React.FC<{ html: string; className?: string }> = ({
  html,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    el.innerHTML = html || '';

    // Cari teks yang berisi formula LaTeX dalam $...$ atau $$...$$
    const renderMathInNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const text = node.nodeValue;
        if (text.includes('$')) {
          const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
          if (parts.length > 1) {
            const frag = document.createDocumentFragment();
            for (const part of parts) {
              if (part.startsWith('$$') && part.endsWith('$$')) {
                const math = part.slice(2, -2);
                const span = document.createElement('span');
                try {
                  katex.render(math, span, { displayMode: true, throwOnError: false });
                } catch {
                  span.textContent = part;
                }
                frag.appendChild(span);
              } else if (part.startsWith('$') && part.endsWith('$')) {
                const math = part.slice(1, -1);
                const span = document.createElement('span');
                try {
                  katex.render(math, span, { displayMode: false, throwOnError: false });
                } catch {
                  span.textContent = part;
                }
                frag.appendChild(span);
              } else if (part) {
                frag.appendChild(document.createTextNode(part));
              }
            }
            if (node.parentNode) {
              node.parentNode.replaceChild(frag, node);
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(renderMathInNode);
      }
    };

    renderMathInNode(el);
  }, [html]);

  return <div ref={containerRef} className={`prose prose-slate max-w-none ${className}`} />;
};

export const RichMathEditor: React.FC<RichMathEditorProps> = ({
  value,
  onChange,
  placeholder = 'Ketik isi soal atau teks di sini...',
  minHeight = '140px',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showMathMenu, setShowMathMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTextAtCursor = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${before}${selectedText || ''}${after}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      );
    }, 10);
  };

  const handleInsertImage = () => {
    const url = prompt('Masukkan URL Gambar (https://...):');
    if (url) {
      insertTextAtCursor(`<img src="${url}" alt="Gambar Soal" style="max-width: 100%; height: auto; margin: 8px 0;" />\n`);
    }
  };

  const handleInsertTable = () => {
    const tableTemplate = `
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; margin: 8px 0;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th>Kolom 1</th>
      <th>Kolom 2</th>
      <th>Kolom 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data A1</td>
      <td>Data A2</td>
      <td>Data A3</td>
    </tr>
    <tr>
      <td>Data B1</td>
      <td>Data B2</td>
      <td>Data B3</td>
    </tr>
  </tbody>
</table>
`;
    insertTextAtCursor(tableTemplate);
  };

  const handleInsertMath = (latex: string) => {
    insertTextAtCursor(`$${latex}$`);
    setShowMathMenu(false);
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50/80 border-b border-slate-100 text-slate-700 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => insertTextAtCursor('<b>', '</b>')}
            title="Tebal (Bold)"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('<i>', '</i>')}
            title="Miring (Italic)"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('<u>', '</u>')}
            title="Garis Bawah (Underline)"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={() => insertTextAtCursor('<ul>\n  <li>', '</li>\n</ul>')}
            title="Daftar Poin (List)"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('<ol>\n  <li>', '</li>\n</ol>')}
            title="Daftar Nomor"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            title="Sisip Tabel"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            title="Sisip Gambar via URL"
            className="p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Math Formula Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMathMenu(!showMathMenu)}
              title="Sisip Rumus Matematika / Sains (LaTeX)"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition font-bold text-xs cursor-pointer shadow-2xs"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Rumus / Math</span>
            </button>

            {showMathMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3">
                <div className="text-xs font-bold text-slate-700 mb-2 px-1 flex items-center justify-between">
                  <span>PILIH RUMUS CEPAT</span>
                  <span className="text-[10px] text-indigo-600 font-mono">Format: $latex$</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {MATH_PRESETS.map((m) => (
                    <button
                      key={m.latex}
                      type="button"
                      onClick={() => handleInsertMath(m.latex)}
                      className="text-left px-2.5 py-2 rounded-xl text-xs hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition text-slate-800 cursor-pointer"
                    >
                      <div className="font-bold truncate">{m.label}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{m.latex}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <span>Gunakan tanda $ di awal & akhir rumus</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Toggle: Tulis / Preview */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition font-bold cursor-pointer ${
              activeTab === 'write'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Tulis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition font-bold cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-4 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 font-sans text-xs font-medium resize-y leading-relaxed"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full p-4 bg-slate-50/50 overflow-y-auto text-xs"
        >
          {value ? (
            <FormattedMathPreview html={value} />
          ) : (
            <span className="text-slate-400 italic text-xs">Belum ada konten untuk ditampilkan di pratinjau.</span>
          )}
        </div>
      )}
    </div>
  );
};
