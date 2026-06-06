/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction } from 'react';
import { Loader2 } from 'lucide-react';

interface VariantsDisplayProps {
  targetKey: string;
  variants: { key: string; options: string[] } | null;
  isVariating: boolean;
  setVariants: Dispatch<SetStateAction<{ key: string; options: string[] } | null>>;
  handleApplyVariant: (targetKey: string, value: string) => void;
}

export function VariantsDisplay({
  targetKey,
  variants,
  isVariating,
  setVariants,
  handleApplyVariant,
}: VariantsDisplayProps) {
  if (!variants || variants.key !== targetKey) return null;

  return (
    <div className="mt-3 bg-slate-950/80 rounded-xl p-4 border border-amber-800/40 space-y-2 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold">A/B Varianter</span>
        <button onClick={() => setVariants(null)} className="text-[11px] text-slate-500 hover:text-white font-mono">Luk</button>
      </div>
      {isVariating && variants.options.length === 0 && (
        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Genererer varianter...</span>
        </div>
      )}
      {variants.options.map((opt, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono text-slate-500 uppercase mb-1">Variant {String.fromCharCode(65 + i)}</div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{opt}</p>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => handleApplyVariant(targetKey, opt)}
              className="px-2 py-1 text-[11px] bg-brand-orange-600/20 text-brand-orange-400 border border-brand-orange-500/30 rounded hover:bg-brand-orange-600/30 font-mono"
            >
              Brug denne
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
