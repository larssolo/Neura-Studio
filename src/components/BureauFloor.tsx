/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import { Building2, CheckCircle2, AlertCircle, Clock, Loader2, MessageSquare, RefreshCw, SkipForward } from 'lucide-react';
import type { BureauStageState, BureauStageStatus } from '../types';

interface BureauFloorProps {
  stages: BureauStageState[];
  isRunning: boolean;
  onRun: () => void;
  onAbort: () => void;
}

const STATUS_CONFIG: Record<BureauStageStatus, { label: string; color: string; icon: ReactNode }> = {
  idle:       { label: 'Venter',     color: 'text-slate-500 border-slate-700 bg-slate-900',               icon: <Clock className="w-3.5 h-3.5" /> },
  working:    { label: 'Arbejder',   color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',            icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  critiquing: { label: 'Kritiserer', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',         icon: <MessageSquare className="w-3.5 h-3.5" /> },
  revising:   { label: 'Reviderer',  color: 'text-violet-400 border-violet-500/40 bg-violet-500/10',      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
  done:       { label: 'Færdig',     color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  error:      { label: 'Fejlet',     color: 'text-red-400 border-red-500/40 bg-red-500/10',               icon: <AlertCircle className="w-3.5 h-3.5" /> },
  skipped:    { label: 'Sprunget',   color: 'text-slate-600 border-slate-800 bg-slate-900/50',            icon: <SkipForward className="w-3.5 h-3.5" /> },
};

function StageCard({ stage }: { stage: BureauStageState; key?: string | number | null }) {
  const cfg = STATUS_CONFIG[stage.status];
  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${cfg.color}`}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-70">{stage.role}</span>
          <span className="block text-sm font-medium">{stage.title}</span>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      {stage.streamText && (
        <p className="mt-2 text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-2">
          {stage.streamText}
        </p>
      )}

      {stage.critiqueVerdict && (
        <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${stage.critiqueVerdict === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
          {stage.critiqueVerdict === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
          {stage.critiqueVerdict === 'approved' ? 'Godkendt af kritiker' : 'Revideret efter kritik'}
        </div>
      )}

      {stage.error && (
        <p className="mt-2 text-[11px] text-red-400/80">{stage.error}</p>
      )}
    </div>
  );
}

export function BureauFloor({ stages, isRunning, onRun, onAbort }: BureauFloorProps) {
  const doneCount = stages.filter(s => s.status === 'done').length;
  const hasStarted = stages.some(s => s.status !== 'idle');

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600/15 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <span className="block font-medium text-sm text-white">Bureau-mode</span>
            <span className="block text-[11px] text-slate-400">
              {isRunning
                ? `Kører pipeline… ${doneCount}/${stages.length} stadier færdige`
                : hasStarted
                  ? `${doneCount}/${stages.length} stadier færdige`
                  : 'Kør den fulde bureau-pipeline fra analyse til pitch'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <button
              onClick={onAbort}
              className="px-3 py-1.5 text-[11px] font-mono rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              Afbryd
            </button>
          )}
          {!isRunning && (
            <button
              onClick={onRun}
              className="px-3 py-1.5 text-[11px] font-mono rounded-lg border border-orange-500/40 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
            >
              {hasStarted ? 'Kør igen' : 'Start bureau'}
            </button>
          )}
        </div>
      </div>

      {hasStarted && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stages.map(stage => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      )}
    </div>
  );
}
