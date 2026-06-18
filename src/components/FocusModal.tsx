/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import {
  X, Download, FileText, Globe, Printer, Sparkles, Loader2, ListChecks,
} from 'lucide-react';
import type { FunnelDoc } from '../lib/funnelDoc';
import type { ArchiveFormat } from '../lib/funnelExport';

interface FocusModalProps {
  doc: FunnelDoc;
  summary: string[] | undefined;
  isGeneratingSummary: boolean;
  onGenerateSummary: (doc: FunnelDoc) => void;
  onArchive: (doc: FunnelDoc, format: ArchiveFormat) => void;
  onClose: () => void;
}

/**
 * Fuldskærms-overlay der forstørrer et funnel-panel til læsevenligt format,
 * tilbyder arkivering (HTML/Word/Markdown/print) og et AI-genereret resumé.
 * Renderer den generiske FunnelDoc-model, så ét panel dækker alle paneltyper.
 */
export function FocusModal({
  doc, summary, isGeneratingSummary, onGenerateSummary, onArchive, onClose,
}: FocusModalProps) {
  // Escape lukker; baggrunds-scroll låses mens åben.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl my-auto bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-white truncate">{doc.title}</h2>
            {doc.subtitle && <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onGenerateSummary(doc)}
              disabled={isGeneratingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 hover:text-white text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              title="Generér et skarpt resumé af de vigtigste tekster"
            >
              {isGeneratingSummary
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Resumé</span>
            </button>

            {/* ARKIVÉR-DROPDOWN (hover) */}
            <div className="relative group/archive flex items-stretch">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange-600 hover:bg-brand-orange-500 text-white text-[11px] font-semibold transition-all cursor-pointer active:scale-95"
                title="Arkivér dette panel som dokument"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Arkivér</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover/archive:opacity-100 group-hover/archive:visible transition-all duration-150 z-30 w-52 p-1 text-left font-mono">
                <button
                  onClick={() => onArchive(doc, 'html')}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-250 hover:text-white hover:bg-slate-900 rounded transition-colors flex items-center space-x-2"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Download HTML (.html)</span>
                </button>
                <button
                  onClick={() => onArchive(doc, 'docx')}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-250 hover:text-white hover:bg-slate-900 rounded transition-colors flex items-center space-x-2 border-t border-slate-900"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Download Word (.docx)</span>
                </button>
                <button
                  onClick={() => onArchive(doc, 'markdown')}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-250 hover:text-white hover:bg-slate-900 rounded transition-colors flex items-center space-x-2 border-t border-slate-900"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Download Markdown (.md)</span>
                </button>
                <button
                  onClick={() => onArchive(doc, 'print')}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-250 hover:text-white hover:bg-slate-900 rounded transition-colors flex items-center space-x-2 border-t border-slate-900"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" />
                  <span>Print / Gem som PDF</span>
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
              title="Luk (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {/* RESUMÉ */}
          {summary && summary.length > 0 && (
            <div className="p-4 bg-violet-600/8 border border-violet-500/25 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5">
                <ListChecks className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-wider">Resumé</span>
              </div>
              <ul className="space-y-1.5">
                {summary.map((s, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm text-slate-200 leading-relaxed">
                    <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SEKTIONER */}
          {doc.sections.map((section, si) => (
            <section key={si} className="space-y-2.5">
              <h3 className="text-[11px] font-mono font-bold text-brand-orange-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                {section.heading}
              </h3>
              <div className="space-y-3">
                {section.blocks.map((block, bi) => {
                  if (block.type === 'p') {
                    return <p key={bi} className="text-[15px] text-slate-200 leading-relaxed">{block.text}</p>;
                  }
                  if (block.type === 'bullets') {
                    return (
                      <ul key={bi} className="space-y-1.5">
                        {block.items.map((it, ii) => (
                          <li key={ii} className="flex items-start space-x-2 text-sm text-slate-300 leading-relaxed">
                            <span className="text-brand-orange-500 mt-0.5 shrink-0">—</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <dl key={bi} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                      {block.pairs.map((pr, pi) => (
                        <div key={pi} className="contents">
                          <dt className="text-[10px] font-mono text-slate-500 uppercase tracking-wide pt-1 whitespace-nowrap">{pr.key}</dt>
                          <dd className="text-sm text-slate-200 leading-relaxed">{pr.value}</dd>
                        </div>
                      ))}
                    </dl>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
