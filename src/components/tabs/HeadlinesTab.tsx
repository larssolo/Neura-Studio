/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { BrandSurfaceOutput } from '../../types';

interface HeadlinesTabProps {
  output: BrandSurfaceOutput;
  handleCopyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function HeadlinesTab({ output, handleCopyToClipboard, copiedKey }: HeadlinesTabProps) {
  return (
                        <motion.div
                          key="tab_headlines"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 font-sans"
                        >
                          <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider block w-max">4. Overskrifter (Korte & Stærke)</span>
                          
                          <div className="space-y-3">
                            {output.headlines.map((headline, i) => (
                              <div key={i} className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-white">
                                <div className="flex items-center space-x-3 leading-relaxed">
                                  <span className="text-orange-500 font-mono font-bold">#{i+1}</span>
                                  <span className="font-display font-semibold tracking-tight text-white text-sm">"{headline}"</span>
                                </div>
                                <button
                                  onClick={() => handleCopyToClipboard(headline, `headline_${i}`)}
                                  className="text-slate-400 hover:text-slate-200"
                                >
                                  {copiedKey === `headline_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
  );
}
