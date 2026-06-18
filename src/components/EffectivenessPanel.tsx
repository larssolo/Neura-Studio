/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Check,
  Copy,
  Gauge,
  Layers,
  Maximize2,
  Scale,
  Target,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { EffectivenessFramework } from '../types';

interface EffectivenessPanelProps {
  framework: EffectivenessFramework;
  onClose: () => void;
  onExpand: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

function levelColor(level: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('forretning')) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  if (l.includes('adfærd') || l.includes('adfaerd')) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
  return 'text-violet-400 border-violet-500/40 bg-violet-500/10'; // kommunikation / default
}

export function EffectivenessPanel({
  framework,
  onClose,
  onExpand,
  onRegenerate,
  isGenerating,
  copiedKey,
  onCopy,
}: EffectivenessPanelProps) {
  const allText = [
    `Forretningsmål: ${framework.businessObjective}`,
    ...framework.objectives.map((o) => `[${o.level}] ${o.objective} — KPI: ${o.kpi} (mål: ${o.target}, benchmark: ${o.benchmark})`),
    ...framework.channelKpis.map((c) => `${c.channel}: ${c.primaryMetric} (mål: ${c.target})`),
    `Balance: ${framework.balance.recommendedSplit} — kort: ${framework.balance.shortTermActivation} | lang: ${framework.balance.longTermBrand}`,
    `Succes-scenarie: ${framework.successScenario}`,
  ].join('\n');

  return (
    <div className="bg-slate-950 border border-indigo-500/25 rounded-xl shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-blue-600/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-500/15 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Effekt-lag · Sådan måler vi succes
            </span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Mål-hierarki · KPI'er · kort/lang-balance · måleplan
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
            onClick={() => onCopy(allText, 'effectiveness_all')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            title="Kopiér hele effekt-laget"
          >
            {copiedKey === 'effectiveness_all'
              ? <Check className="w-4 h-4 text-emerald-400" />
              : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Generér effekt-laget igen"
          >
            <TrendingUp className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            title="Luk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* BUSINESS OBJECTIVE */}
        <div className="p-4 bg-indigo-500/6 border border-indigo-500/20 rounded-xl space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">Forretningsmål</span>
          </div>
          <p className="text-sm text-white leading-relaxed font-semibold">{framework.businessObjective}</p>
        </div>

        {/* OBJECTIVE LADDER */}
        {framework.objectives?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Mål-hierarki & KPI'er</span>
            </div>
            <div className="space-y-2">
              {framework.objectives.map((o, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${levelColor(o.level)}`}>
                      {o.level}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug">{o.objective}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">KPI</span>
                      <span className="text-[11px] text-slate-300">{o.kpi}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Mål</span>
                      <span className="text-[11px] font-bold text-indigo-300">{o.target}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Benchmark</span>
                      <span className="text-[11px] text-slate-400">{o.benchmark}</span>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Måling: </span>
                    <span className="text-[11px] text-slate-400">{o.measurementMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHANNEL KPIS */}
        {framework.channelKpis?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">KPI pr. kanal</span>
            </div>
            <div className="space-y-1.5">
              {framework.channelKpis.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono font-bold text-emerald-400/90">{c.channel}</span>
                    <span className="text-[11px] text-slate-300 block truncate">{c.primaryMetric}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{c.measurementTool}</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-300 shrink-0">{c.target}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BALANCE */}
        {framework.balance && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Kort vs. lang (Binet & Field)</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-center">
                <span className="text-sm font-bold text-amber-300 font-mono">{framework.balance.recommendedSplit}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">Kortsigtet aktivering</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{framework.balance.shortTermActivation}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">Langsigtet brand</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{framework.balance.longTermBrand}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADING / LAGGING */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {framework.leadingIndicators?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Leading-indikatorer</span>
              <ul className="space-y-1">
                {framework.leadingIndicators.map((x, i) => (
                  <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start space-x-1.5">
                    <span className="text-emerald-400/70 shrink-0">↗</span><span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {framework.laggingIndicators?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">Lagging-indikatorer</span>
              <ul className="space-y-1">
                {framework.laggingIndicators.map((x, i) => (
                  <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start space-x-1.5">
                    <span className="text-sky-400/70 shrink-0">✓</span><span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* SUCCESS SCENARIO */}
        {framework.successScenario && (
          <div className="p-3.5 bg-indigo-500/6 border-l-2 border-indigo-400 rounded-r-xl">
            <div className="flex items-center space-x-1.5 mb-1">
              <BarChart3 className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Succes-scenarie</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{framework.successScenario}</p>
          </div>
        )}

        {/* RISKS */}
        {framework.risks?.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Risici & antagelser</span>
            </div>
            <ul className="space-y-1">
              {framework.risks.map((r, i) => (
                <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start space-x-2">
                  <span className="text-amber-400/70 shrink-0">·</span><span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CADENCE */}
        {framework.measurementCadence && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-start space-x-2">
            <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Måle-kadence</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{framework.measurementCadence}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
