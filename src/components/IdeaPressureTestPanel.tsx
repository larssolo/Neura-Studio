/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  ArrowRight,
  Check,
  Gavel,
  Lightbulb,
  Skull,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { CampaignTerritory, IdeaDeliberationResult, TerritoryCritique } from '../types';

interface IdeaPressureTestPanelProps {
  original: CampaignTerritory;
  result: IdeaDeliberationResult;
  onAdopt: () => void;
  onClose: () => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

const AXES: Array<{ key: keyof TerritoryCritique; label: string }> = [
  { key: 'distinctivenessScore', label: 'Distinkthed' },
  { key: 'truthScore', label: 'Sandhed' },
  { key: 'elasticityScore', label: 'Elasticitet' },
  { key: 'memorabilityScore', label: 'Mindeværdighed' },
];

function avg(c: TerritoryCritique): number {
  return Math.round(
    (c.distinctivenessScore + c.truthScore + c.elasticityScore + c.memorabilityScore) / 4,
  );
}

function scoreColor(n: number): string {
  if (n >= 80) return 'text-emerald-400';
  if (n >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function barColor(n: number): string {
  if (n >= 80) return 'bg-emerald-500';
  if (n >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function ScoreGrid({ critique, afterCritique }: { critique: TerritoryCritique; afterCritique?: TerritoryCritique }) {
  return (
    <div className="space-y-2">
      {AXES.map(({ key, label }) => {
        const before = critique[key] as number;
        const after = afterCritique ? (afterCritique[key] as number) : undefined;
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">{label}</span>
              <span className="flex items-center space-x-1.5">
                <span className={scoreColor(before)}>{before}</span>
                {after !== undefined && (
                  <>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className={`font-bold ${scoreColor(after)}`}>{after}</span>
                  </>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${barColor(after ?? before)} transition-all`}
                style={{ width: `${after ?? before}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function IdeaPressureTestPanel({
  original,
  result,
  onAdopt,
  onClose,
  copiedKey,
  onCopy,
}: IdeaPressureTestPanelProps) {
  const { critiqueBefore, critiqueAfter, sharpened, earlyStopped } = result;
  const beforeAvg = avg(critiqueBefore);
  const afterAvg = critiqueAfter ? avg(critiqueAfter) : undefined;

  return (
    <div className="bg-slate-950 border border-rose-500/25 rounded-xl shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-amber-600/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-rose-500/15 flex items-center justify-center">
            <Gavel className="w-4 h-4 text-rose-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              ECD Pres-test · {original.name}
            </span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Strategen pres-tester · ECD skærper
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          title="Luk pres-test"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* OVERALL SCORE */}
        <div className="flex items-center justify-center space-x-4 py-2">
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono ${scoreColor(beforeAvg)}`}>{beforeAvg}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Før</div>
          </div>
          {afterAvg !== undefined && (
            <>
              <ArrowRight className="w-5 h-5 text-slate-600" />
              <div className="text-center">
                <div className={`text-3xl font-bold font-mono ${scoreColor(afterAvg)}`}>{afterAvg}</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Efter</div>
              </div>
              {afterAvg > beforeAvg && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{afterAvg - beforeAvg}</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* SCORE GRID */}
        <ScoreGrid critique={critiqueBefore} afterCritique={critiqueAfter} />

        {/* VERDICT */}
        <div className="p-3.5 bg-slate-900 border-l-2 border-rose-400 rounded-r-xl">
          <div className="flex items-center space-x-1.5 mb-1">
            <Gavel className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">Strategens dom</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed italic">"{critiqueBefore.verdict}"</p>
        </div>

        {/* WEAKNESSES */}
        {critiqueBefore.weaknesses?.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Svagheder</span>
            </div>
            <ul className="space-y-1">
              {critiqueBefore.weaknesses.map((w, i) => (
                <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start space-x-2">
                  <span className="text-amber-400/70 shrink-0">·</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PROVOCATIONS */}
        {critiqueBefore.provocations?.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Provokationer</span>
            </div>
            <ul className="space-y-1">
              {critiqueBefore.provocations.map((p, i) => (
                <li key={i} className="text-[11px] text-rose-100 leading-relaxed flex items-start space-x-2">
                  <span className="text-rose-400/70 shrink-0">?</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* KILL CRITERION */}
        {critiqueBefore.killCriterion && (
          <div className="p-3 bg-rose-500/8 border border-rose-500/20 rounded-lg flex items-start space-x-2">
            <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block mb-0.5">Kill-kriterium</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{critiqueBefore.killCriterion}</p>
            </div>
          </div>
        )}

        {/* EARLY STOP NOTE */}
        {earlyStopped && (
          <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg flex items-start space-x-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-200 leading-relaxed">
              Ruten er allerede usædvanligt stærk — strategen vurderer den står uden skærpning. Ingen ændringer foreslået.
            </p>
          </div>
        )}

        {/* SHARPENED IDEA */}
        {sharpened && (
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 pt-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Skærpet idé</span>
            </div>

            <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">Den store idé</span>
              </div>
              <p className="text-sm text-white leading-relaxed font-semibold">{sharpened.bigIdea}</p>
              <p className="text-sm font-bold text-brand-orange-400 leading-snug">{sharpened.tagline}</p>
              <button
                onClick={() => onCopy(`${sharpened.bigIdea}\n${sharpened.tagline}`, 'sharpened_idea')}
                className="flex items-center space-x-1 text-[11px] font-mono text-slate-500 hover:text-emerald-300 transition-colors pt-0.5"
              >
                {copiedKey === 'sharpened_idea'
                  ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Kopieret</span></>
                  : <><span>Kopiér</span></>
                }
              </button>
            </div>

            {sharpened.manifesto && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Manifest</span>
                <p className="text-xs text-slate-300 leading-relaxed italic">{sharpened.manifesto}</p>
              </div>
            )}

            {/* WHAT CHANGED */}
            {sharpened.whatChanged?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Hvad blev skærpet</span>
                <ul className="space-y-1">
                  {sharpened.whatChanged.map((c, i) => (
                    <li key={i} className="text-[11px] text-emerald-100 leading-relaxed flex items-start space-x-2">
                      <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ADOPT BUTTON */}
            <button
              onClick={onAdopt}
              className="w-full mt-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-semibold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
              title="Erstat den oprindelige rute med den skærpede version og vælg den"
            >
              <Check className="w-4 h-4" />
              <span>Adoptér skærpet rute</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
