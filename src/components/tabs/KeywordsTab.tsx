/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { BrandSurfaceOutput } from '../../types';

interface KeywordsTabProps {
  output: BrandSurfaceOutput;
  handleCopyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function KeywordsTab({ output, handleCopyToClipboard, copiedKey }: KeywordsTabProps) {
  return (
                        <motion.div
                          key="tab_keywords"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                          {/* Left: Keywords block */}
                          <div className="space-y-3">
                            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider">5. Tags & Keywords</span>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-wrap gap-2">
                              {output.keywords.map((kw, i) => (
                                <div 
                                  key={i} 
                                  onClick={() => handleCopyToClipboard(kw, `kw_${i}`)}
                                  className="bg-slate-900 hover:bg-slate-850 hover:text-orange-400 cursor-pointer border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono flex items-center space-x-1.5 transition-all text-[11px]"
                                >
                                  <span className="text-orange-500">#</span>
                                  <span>{kw}</span>
                                  {copiedKey === `kw_${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: CTA options */}
                          <div className="space-y-3">
                            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider">6. Call to Action (3 typer)</span>
                            <div className="space-y-3">
                              {["Direkte", "Blød", "Kreativ"].map((type, idx) => {
                                const val = output.cta[idx] || "";
                                return (
                                  <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 relative">
                                    <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                      <span>{type} CTA</span>
                                      <button 
                                        onClick={() => handleCopyToClipboard(val, `cta_${idx}`)}
                                        className="text-slate-500 hover:text-white"
                                      >
                                        {copiedKey === `cta_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                    <p className="text-white text-xs font-semibold font-mono text-orange-400">{val}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
  );
}
