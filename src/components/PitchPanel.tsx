/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Presentation, ChevronDown, ChevronRight, MessageCircleQuestion, FileText, Sparkles } from 'lucide-react';
import type { PitchResult } from '../types';

interface PitchPanelProps {
  pitchResult: PitchResult | null;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
}

export function PitchPanel({ pitchResult, isGenerating, canGenerate, onGenerate }: PitchPanelProps) {
  const [narrativeOpen, setNarrativeOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [objectionsOpen, setObjectionsOpen] = useState(false);

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Presentation className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <span className="block font-medium text-sm text-white flex items-center gap-1.5">
              Pitch-afdeling
              {pitchResult && <Sparkles className="w-3 h-3 text-amber-400" />}
            </span>
            <span className="block text-[11px] text-slate-400">
              Anbefalings-narrativ, talenoter og indvendingshåndtering
            </span>
          </div>
        </div>
        {canGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 text-[11px] font-mono rounded-lg border border-violet-500/40 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Pitcher…' : pitchResult ? 'Regenerér' : 'Generér pitch'}
          </button>
        )}
      </div>

      {!pitchResult && !isGenerating && (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">
          {canGenerate
            ? 'Klik "Generér pitch" for at lave anbefalings-narrativ og klientmateriale.'
            : 'Kør Den Store Idé eller Bureau-mode for at aktivere pitch-afdelingen.'}
        </div>
      )}

      {isGenerating && (
        <div className="px-5 py-8 text-center text-violet-400 text-sm animate-pulse">
          Pitch-producenten arbejder…
        </div>
      )}

      {pitchResult && (
        <div className="divide-y divide-slate-800">
          <div>
            <button
              onClick={() => setNarrativeOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-900/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <FileText className="w-4 h-4 text-violet-400" />
                Anbefalings-narrativ
              </span>
              {narrativeOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            </button>
            {narrativeOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {pitchResult.narrative}
                </p>
              </div>
            )}
          </div>

          {pitchResult.slideNotes.length > 0 && (
            <div>
              <button
                onClick={() => setNotesOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-900/40 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Presentation className="w-4 h-4 text-violet-400" />
                  Talenoter ({pitchResult.slideNotes.length} slides)
                </span>
                {notesOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>
              {notesOpen && (
                <div className="px-5 pb-4 space-y-3">
                  {pitchResult.slideNotes.map((note, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                      <span className="block text-[11px] font-semibold text-violet-400 mb-1">{note.slide}</span>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">{note.note}</p>
                      <span className="block text-[10px] text-slate-500 italic">Retorisk formål: {note.rhetoricalPurpose}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {pitchResult.objections.length > 0 && (
            <div>
              <button
                onClick={() => setObjectionsOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-900/40 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <MessageCircleQuestion className="w-4 h-4 text-violet-400" />
                  Indvendingshåndtering ({pitchResult.objections.length})
                </span>
                {objectionsOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>
              {objectionsOpen && (
                <div className="px-5 pb-4 space-y-3">
                  {pitchResult.objections.map((obj, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                      <span className="block text-xs font-semibold text-amber-400 mb-1">❝ {obj.question}</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{obj.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
