/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction } from 'react';
import { Sliders } from 'lucide-react';
import { BrandSurfaceOutput } from '../types';

interface RevisionSelectorProps {
  targetKey: string;
  activeValue: string;
  revisions: Record<string, string[]>;
  setRevisions: Dispatch<SetStateAction<Record<string, string[]>>>;
  activeCompareIndex: Record<string, number | null>;
  setActiveCompareIndex: Dispatch<SetStateAction<Record<string, number | null>>>;
  setOutput: Dispatch<SetStateAction<BrandSurfaceOutput | null>>;
  setErrorMsg: Dispatch<SetStateAction<string | null>>;
}

export function RevisionSelector({
  targetKey,
  activeValue,
  revisions,
  setRevisions,
  activeCompareIndex,
  setActiveCompareIndex,
  setOutput,
  setErrorMsg,
}: RevisionSelectorProps) {
  const revs = revisions[targetKey] || [];
  if (revs.length <= 1) return null;

  const activeCompareIdx = activeCompareIndex[targetKey];
  const currentRevisionCount = revs.length;

  return (
    <div className="mt-3 bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-350 space-y-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            AI-Raffinering Historik & Sammenligning ({currentRevisionCount - 1} omskrivninger)
          </span>
        </div>
        {activeCompareIdx !== null && (
          <button
            type="button"
            onClick={() => {
              setActiveCompareIndex(prev => ({ ...prev, [targetKey]: null }));
            }}
            className="text-[11px] text-brand-orange-500 hover:text-brand-orange-400 font-medium font-mono cursor-pointer"
          >
            [Luk Sammenligning]
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
        {/* Version badge selectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-mono">Udgaver:</span>
          {revs.map((revText, index) => {
            const isCurrent = index === revs.length - 1;
            const isSelected = activeCompareIdx === index || (activeCompareIdx === null && isCurrent);
            let label = index === 0 ? "Første" : `#${index}`;
            if (isCurrent) label += " (Nyeste)";

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setActiveCompareIndex(prev => ({
                    ...prev,
                    [targetKey]: isCurrent ? null : index
                  }));
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-orange-500/20 text-brand-orange-400 border border-brand-orange-500/40 font-semibold'
                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={isCurrent ? "Aktivt og nyeste omskrevne udkast" : `Omskrivning #${index}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Range Slider for stepping through chronological versions */}
        {revs.length > 2 && (
          <div className="flex items-center space-x-2.5 flex-1 max-w-[180px] sm:ml-auto">
            <span className="text-[11px] text-slate-500 font-mono shrink-0">Hurtig-slider:</span>
            <input
              type="range"
              min="0"
              max={revs.length - 1}
              value={activeCompareIdx !== null ? activeCompareIdx : revs.length - 1}
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                setActiveCompareIndex(prev => ({
                  ...prev,
                  [targetKey]: idx === revs.length - 1 ? null : idx
                }));
              }}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#ff5400' }}
            />
          </div>
        )}
      </div>

      {/* Diff comparison box */}
      {activeCompareIdx !== null && revs[activeCompareIdx] !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 mt-1 border-t border-slate-900">
          {/* Version selected visually */}
          <div className="p-3.5 bg-slate-900/90 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-amber-500 font-bold">
                <span>HISTORISK UDGAVE: {activeCompareIdx === 0 ? "FØRSTE GENERERING" : `RAF-UDSKRIFT #${activeCompareIdx}`}</span>
                <span className="bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px] border border-amber-500/25">Revision Arkiv</span>
              </div>
              <div className="text-[11px] text-slate-350 leading-relaxed italic whitespace-pre-wrap mt-2 overflow-y-auto max-h-[160px] font-sans">
                "{revs[activeCompareIdx]}"
              </div>
            </div>
            <div className="pt-3 border-t border-slate-850/60 mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const selectedText = revs[activeCompareIdx];

                  setRevisions(prev => {
                    const currentList = prev[targetKey] || [];
                    const updatedList = [...currentList];
                    if (!updatedList.includes(activeValue)) {
                      updatedList.push(activeValue);
                    }
                    updatedList.push(selectedText);
                    return { ...prev, [targetKey]: updatedList };
                  });

                  setOutput(prev => {
                    if (!prev) return null;
                    const updated = { ...prev };
                    if (targetKey === 'shortCaseText') updated.shortCaseText = selectedText;
                    else if (targetKey === 'longCaseText') updated.longCaseText = selectedText;
                    else if (targetKey === 'linkedinPost') updated.linkedinPost = selectedText;
                    else if (targetKey === 'creativeNewsletterSection' && updated.production) {
                      updated.production.newsletterSection = selectedText;
                    }
                    return updated;
                  });

                  setActiveCompareIndex(prev => ({ ...prev, [targetKey]: null }));
                  setErrorMsg(`Gendannede udgave "${activeCompareIdx === 0 ? 'Første' : `Ref #${activeCompareIdx}`}" som aktiv tekst til redigering.`);
                }}
                className="px-3 py-1.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold font-sans rounded text-[11px] transition-all cursor-pointer shadow-md tracking-wide"
              >
                Gør denne udgave aktiv
              </button>
            </div>
          </div>

          {/* Current active text */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-emerald-400 font-bold">
                <span>NUVÆRENDE AKTIVE UDGAVE INKL. EVENTUELLE MANUELLE RETTELSER</span>
                <span className="bg-emerald-500/15 px-1.5 py-0.5 rounded text-[11px] border border-emerald-500/25 font-semibold">Aktiv nu</span>
              </div>
              <div className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap mt-2 overflow-y-auto max-h-[160px] font-sans">
                "{activeValue || '(Tom tekst)'}"
              </div>
            </div>
            <div className="pt-3 border-t border-slate-905 mt-4 text-right text-[11px] font-mono text-slate-500">
              Låst til midlertidig sammenligning
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
