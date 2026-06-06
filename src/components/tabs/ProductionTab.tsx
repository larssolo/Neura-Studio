/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { BrandSurfaceOutput } from '../../types';

interface ProductionTabProps {
  output: BrandSurfaceOutput;
  handleCopyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function ProductionTab({ output, handleCopyToClipboard, copiedKey }: ProductionTabProps) {
  if (!output.production) return null;
  return (
                        <motion.div
                          key="tab_production"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider block w-max">10. Kreative workflow & Produktions-forslag</span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Missing Images proposal */}
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
                              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Mangler i billed-dokumentation (Forslag)</span>
                              <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-300 text-xs text-left">
                                {output.production.missingImages.map((mi, i) => (
                                  <li key={i}>{mi}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Formats required proposal */}
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
                              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Produktions-formater der bør klargøres</span>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {output.production.suggestedFormats.map((fmt, i) => (
                                  <span key={i} className="px-2 py-1 bg-slate-950 text-slate-300 border border-slate-850 rounded text-[11px] font-mono">{fmt}</span>
                                ))}
                              </div>
                            </div>

                            {/* Hero Visual Proposal */}
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 md:col-span-2 space-y-1.5">
                              <span className="text-[11px] font-mono text-orange-400 uppercase font-bold">Skærm / Hero Visual idé</span>
                              <p className="text-slate-300 text-xs leading-relaxed">{output.production.heroVisual}</p>
                            </div>

                            {/* SoMe visual Format Proposal */}
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                              <span className="text-[11px] font-mono text-orange-400 uppercase font-bold">Forslag til SoMe-format</span>
                              <p className="text-slate-300 text-xs leading-relaxed">{output.production.someFormat}</p>
                            </div>

                            {/* Target production CTA */}
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1 rounded relative">
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase font-bold">
                                <span>Produktions-relateret CTA</span>
                                <button
                                  onClick={() => handleCopyToClipboard(output.production?.cta || "", 'prod_cta')}
                                  className="text-slate-500 hover:text-white"
                                >
                                  {copiedKey === 'prod_cta' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <p className="text-orange-400 font-mono text-xs font-semibold pt-1">{output.production.cta}</p>
                            </div>

                          </div>
                        </motion.div>
  );
}
