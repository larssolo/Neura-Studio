/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  HelpCircle,
  Lightbulb,
  Maximize2,
  MessageSquare,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { BrainstormResult } from '../types';

interface BrainstormPanelProps {
  result: BrainstormResult;
  onClose: () => void;
  onExpand: () => void;
  onAddNote: (text: string) => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

export function BrainstormPanel({
  result,
  onClose,
  onExpand,
  onAddNote,
  copiedKey,
  onCopy,
}: BrainstormPanelProps) {
  const [expandedAngle, setExpandedAngle] = useState<number | null>(0);
  const [addedNotes, setAddedNotes] = useState<Set<string>>(new Set());

  const handleAddNote = (text: string, key: string) => {
    onAddNote(text);
    setAddedNotes(prev => new Set(prev).add(key));
    setTimeout(() => {
      setAddedNotes(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2500);
  };

  return (
    <div className="bg-slate-950 border border-amber-500/20 rounded-xl shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-amber-500/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-amber-500/15 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Kreativ Brainstorm
            </span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Idéer og vinkler — før produktionsstart
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onExpand}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            title="Forstør & arkivér"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            title="Luk brainstorm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* PROJECT CORE */}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Kernehistorien
            </span>
          </div>
          <p className="text-sm text-white leading-relaxed font-medium">
            {result.projectCore}
          </p>
          <button
            onClick={() => onCopy(result.projectCore, 'brainstorm_core')}
            className="mt-2 flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors"
          >
            {copiedKey === 'brainstorm_core' ? (
              <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Kopieret</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span>Kopiér</span></>
            )}
          </button>
        </div>

        {/* CREATIVE ANGLES */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 mb-3">
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              4 Kreative Retninger
            </span>
          </div>

          {result.angles.map((angle, i) => {
            const isOpen = expandedAngle === i;
            return (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isOpen
                    ? 'border-amber-500/30 bg-slate-900'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                {/* Angle header — always visible */}
                <button
                  onClick={() => setExpandedAngle(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`text-[11px] font-mono font-bold shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                      isOpen ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block truncate ${isOpen ? 'text-amber-300' : 'text-slate-200'}`}>
                        {angle.title}
                      </span>
                      {!isOpen && (
                        <span className="text-[11px] text-slate-500 truncate block font-mono">{angle.headline}</span>
                      )}
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  }
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-800">

                    {/* Headline */}
                    <div className="pt-3 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Overskrift</span>
                      <p className="text-sm font-semibold text-white leading-snug">{angle.headline}</p>
                      <div className="flex items-center space-x-3 pt-0.5">
                        <button
                          onClick={() => onCopy(angle.headline, `brainstorm_headline_${i}`)}
                          className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          {copiedKey === `brainstorm_headline_${i}`
                            ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Kopieret</span></>
                            : <><Copy className="w-3 h-3" /><span>Kopiér</span></>
                          }
                        </button>
                        <button
                          onClick={() => handleAddNote(angle.headline, `note_headline_${i}`)}
                          className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          {addedNotes.has(`note_headline_${i}`)
                            ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Tilføjet til noter</span></>
                            : <><MessageSquare className="w-3 h-3" /><span>Tilføj til noter</span></>
                          }
                        </button>
                      </div>
                    </div>

                    {/* LinkedIn Hook */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">LinkedIn Åbningslinje</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                        "{angle.linkedinHook}"
                      </p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onCopy(angle.linkedinHook, `brainstorm_hook_${i}`)}
                          className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          {copiedKey === `brainstorm_hook_${i}`
                            ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Kopieret</span></>
                            : <><Copy className="w-3 h-3" /><span>Kopiér krog</span></>
                          }
                        </button>
                        <button
                          onClick={() => handleAddNote(angle.linkedinHook, `note_hook_${i}`)}
                          className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          {addedNotes.has(`note_hook_${i}`)
                            ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Tilføjet til noter</span></>
                            : <><MessageSquare className="w-3 h-3" /><span>Tilføj til noter</span></>
                          }
                        </button>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Hvorfor denne vinkel virker</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{angle.reasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* KEY DIFFERENTIATORS + AUDIENCE INSIGHTS — side by side on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Key Differentiators */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Hvad gør det unikt
              </span>
            </div>
            <ul className="space-y-2">
              {result.keyDifferentiators.map((d, i) => (
                <li key={i} className="flex items-start space-x-2 text-[11px] text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 mt-1.5 shrink-0" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Audience Insights */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Målgruppe-indsigter
              </span>
            </div>
            <ul className="space-y-2">
              {result.audienceInsights.map((a, i) => (
                <li key={i} className="flex items-start space-x-2 text-[11px] text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500/70 mt-1.5 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BOLD QUESTION */}
        <div className="border border-amber-500/25 rounded-xl p-4 bg-amber-500/5 space-y-2">
          <div className="flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Det skærpende spørgsmål
            </span>
          </div>
          <p className="text-xs text-white leading-relaxed italic font-medium">
            "{result.boldQuestion}"
          </p>
          <button
            onClick={() => handleAddNote(result.boldQuestion, 'note_question')}
            className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors pt-1"
          >
            {addedNotes.has('note_question')
              ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Tilføjet til noter</span></>
              : <><MessageSquare className="w-3 h-3" /><span>Tilføj til noter</span></>
            }
          </button>
        </div>

        {/* BRIEF GAPS */}
        {result.briefGaps.length > 0 && (
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/50 space-y-2.5">
            <div className="flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Spørg kunden om dette
              </span>
              <span className="text-[10px] text-slate-600 font-mono">(for et stærkere brief)</span>
            </div>
            <ul className="space-y-2">
              {result.briefGaps.map((gap, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2 text-[11px] text-slate-400 leading-relaxed min-w-0">
                    <span className="text-slate-600 font-mono shrink-0 mt-0.5">{i + 1}.</span>
                    <span>{gap}</span>
                  </div>
                  <button
                    onClick={() => handleAddNote(gap, `note_gap_${i}`)}
                    className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors shrink-0"
                  >
                    {addedNotes.has(`note_gap_${i}`)
                      ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Tilføjet</span></>
                      : <><MessageSquare className="w-3 h-3" /><span>Tilføj</span></>
                    }
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
