/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, Copy, Printer } from 'lucide-react';
import { BrandSurfaceOutput } from '../../types';

interface CviTabProps {
  output: BrandSurfaceOutput;
  handleCopyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
  handleExportSingleSection: (mode: 'all' | 'cvi' | 'case') => void;
}

export function CviTab({ output, handleCopyToClipboard, copiedKey, handleExportSingleSection }: CviTabProps) {
  if (!output.cviSuggestion) return null;
  return (
                        <motion.div
                          key="tab_cvi"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-5 text-left"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3 mb-1">
                            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider block w-max">AI-Genereret CVI (Corporate Visual Identity)</span>
                            <button
                              onClick={() => handleExportSingleSection('cvi')}
                              className="flex items-center space-x-1.5 px-3 py-1 bg-brand-orange-600 hover:bg-brand-orange-500 text-white text-[11px] font-semibold rounded-md shadow-sm transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
                              title="Eksporter kun brandets designmanual og farvekoder som PDF"
                            >
                              <Printer className="w-3 h-3 text-white" />
                              <span>Eksportér designmanual (PDF)</span>
                            </button>
                          </div>

                          {/* Concept & Identity Board */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider">A. Overordnet Designkoncept & Identitet</span>
                              <button
                                onClick={() => handleCopyToClipboard(output.cviSuggestion?.visualIdentityConcept || "", 'cvi_concept')}
                                className="text-slate-550 hover:text-white transition-colors"
                              >
                                {copiedKey === 'cvi_concept' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-white text-sm font-semibold leading-relaxed font-serif italic border-l-2 border-brand-orange-500 pl-3">
                              "{output.cviSuggestion.visualIdentityConcept}"
                            </p>
                            <p className="text-slate-350 text-xs leading-relaxed">
                              {output.cviSuggestion.generalBrandIdentitySummary}
                            </p>
                          </div>

                          {/* Dual Grid: Colors & Typography */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Color Palette */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                              <span className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-2">B. Eksplicit Farvepalet Forslag</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                                {output.cviSuggestion.brandColors.map((color, i) => (
                                  <div 
                                    key={i} 
                                    onClick={() => handleCopyToClipboard(color.hex, `hex_${i}`)}
                                    className="bg-slate-955 p-3 rounded-lg border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/30 transition-all cursor-pointer flex items-center space-x-3 group relative"
                                    title="Klik for at kopiere HEX-kode"
                                  >
                                    <span 
                                      className="w-10 h-10 rounded-lg border border-slate-800/50 block shrink-0 transition-transform group-hover:scale-105 shadow-md" 
                                      style={{ backgroundColor: color.hex }}
                                    ></span>
                                    <div className="truncate flex-1 font-sans">
                                      <span className="text-xs font-bold text-white block truncate">{color.name}</span>
                                      <span className="text-[11px] font-mono font-medium text-slate-400 block group-hover:text-brand-orange-400 transition-colors uppercase">{color.hex}</span>
                                      <span className="text-[11px] text-slate-500 block truncate leading-tight">{color.useCase}</span>
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {copiedKey === `hex_${i}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-500" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Typography Pairings */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                              <div>
                                <span className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-2">C. Typografi & Typografiske Dogmer</span>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block mb-1">Overskrifter</span>
                                    <span 
                                      className="text-lg font-bold text-white tracking-tight leading-none block border-b border-slate-800/50 pb-1 w-max px-0.5"
                                      style={{ fontFamily: output.cviSuggestion.fonts.primaryHeadings }}
                                    >
                                      {output.cviSuggestion.fonts.primaryHeadings}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block mb-1">Brødtekst / Body</span>
                                    <span 
                                      className="text-xs text-slate-300 block"
                                      style={{ fontFamily: output.cviSuggestion.fonts.bodyText }}
                                    >
                                      Aktiv brødtekst sat i <strong className="text-white">{output.cviSuggestion.fonts.bodyText}</strong>. Letlæselig og strømlinet.
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 italic bg-slate-955 p-2.5 rounded border border-slate-850 mt-4 leading-relaxed">
                                <strong>Begrundelse:</strong> {output.cviSuggestion.fonts.description}
                              </p>
                            </div>

                          </div>

                          {/* Image styling & Graphic elements guidelines */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Fotostil og Billedinstruks */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2.5">
                              <span className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-2">D. Billedstil og Fotomanual (Midjourney/Firefly input)</span>
                              <p className="text-slate-300 text-xs leading-relaxed">
                                {output.cviSuggestion.imageStyleGuidelines}
                              </p>
                              <div className="pt-2">
                                <button
                                  onClick={() => handleCopyToClipboard(output.cviSuggestion?.imageStyleGuidelines || "", 'cvi_images')}
                                  className="px-2.5 py-1.5 bg-slate-955 text-slate-300 hover:text-white rounded border border-slate-850 text-[11px] font-mono flex items-center space-x-1.5 transition-all"
                                >
                                  <Copy className="w-3 h-3 shrink-0" />
                                  <span>Kopier fotomanual</span>
                                </button>
                              </div>
                            </div>

                            {/* Grafiske Layoutspilleregler */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2.5">
                              <span className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-2">E. Grafiske Elementer & Layoutspilleregler</span>
                              <p className="text-slate-300 text-xs leading-relaxed">
                                {output.cviSuggestion.graphicElementsRules}
                              </p>
                              <div className="pt-2">
                                <button
                                  onClick={() => handleCopyToClipboard(output.cviSuggestion?.graphicElementsRules || "", 'cvi_graphics')}
                                  className="px-2.5 py-1.5 bg-slate-955 text-slate-300 hover:text-white rounded border border-slate-855 text-[11px] font-mono flex items-center space-x-1.5 transition-all"
                                >
                                  <Copy className="w-3 h-3 shrink-0" />
                                  <span>Kopier layoutspilleregler</span>
                                </button>
                              </div>
                            </div>

                          </div>

                          {/* Logo Usage rules */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2.5">
                            <span className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-2">F. Logo Anvendelsesdogmer & Markører</span>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              {output.cviSuggestion.logoUsageRules}
                            </p>
                          </div>

                        </motion.div>
  );
}
