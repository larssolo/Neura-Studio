/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { BrandSurfaceOutput } from '../../types';

interface EnglishTabProps {
  output: BrandSurfaceOutput;
  selectedTextKey: string;
  setSelectedTextKey: Dispatch<SetStateAction<string>>;
  handleCopyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
}

export function EnglishTab({ output, selectedTextKey, setSelectedTextKey, handleCopyToClipboard, copiedKey }: EnglishTabProps) {
  return (
                        <motion.div
                          key="tab_english"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider">7. Engelsk Version</span>
                            <span className="text-[11px] text-slate-500 font-mono">Mature translation</span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            
                            {/* Short english */}
                            <div 
                              onClick={() => setSelectedTextKey('englishShortCaseText')}
                              className={`p-3.5 rounded-lg border text-xs text-white ${
                                selectedTextKey === 'englishShortCaseText' ? 'bg-slate-850 border-brand-orange-500/40' : 'bg-slate-900/50 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-bold tracking-wide">
                                <span>Short Case Text</span>
                                <button
                                  onClick={() => handleCopyToClipboard(output.english?.shortCaseText || "", 'eng_short')}
                                  className="text-slate-400 hover:text-white"
                                >
                                  {copiedKey === 'eng_short' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <p className="text-slate-300 leading-relaxed italic">{output.english?.shortCaseText}</p>
                            </div>

                            {/* Long english */}
                            <div 
                              onClick={() => setSelectedTextKey('englishLongCaseText')}
                              className={`p-3.5 rounded-lg border text-xs text-white ${
                                selectedTextKey === 'englishLongCaseText' ? 'bg-slate-850 border-brand-orange-500/40' : 'bg-slate-900/50 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-bold tracking-wide">
                                <span>Long Case Text (Website)</span>
                                <button
                                  onClick={() => handleCopyToClipboard(output.english?.longCaseText || "", 'eng_long')}
                                  className="text-slate-400 hover:text-white"
                                >
                                  {copiedKey === 'eng_long' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <p className="text-slate-300 leading-relaxed italic">{output.english?.longCaseText}</p>
                            </div>

                            {/* LinkedIn english */}
                            <div 
                              onClick={() => setSelectedTextKey('englishLinkedinPost')}
                              className={`p-3.5 rounded-lg border text-xs text-white ${
                                selectedTextKey === 'englishLinkedinPost' ? 'bg-slate-850 border-brand-orange-500/40' : 'bg-slate-900/50 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase mb-1.5 font-bold tracking-wide">
                                <span>LinkedIn Post</span>
                                <button
                                  onClick={() => handleCopyToClipboard(output.english?.linkedinPost || "", 'eng_linkedin')}
                                  className="text-slate-400 hover:text-white"
                                >
                                  {copiedKey === 'eng_linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <p className="text-slate-300 leading-relaxed italic whitespace-pre-line">{output.english?.linkedinPost}</p>
                            </div>

                          </div>
                        </motion.div>
  );
}
