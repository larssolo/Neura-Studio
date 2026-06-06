/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { BrandSurfaceOutput, ProjectBrief } from '../../types';
import { ImageGenCard } from '../ImageGenCard';

interface PromptsTabProps {
  output: BrandSurfaceOutput;
  brief: ProjectBrief;
  generatedImages: Record<'hero' | 'detail' | 'abstract', { url: string; loading: boolean; error: string | null; aspectRatio: string }>;
  copiedKey: string | null;
  handleCopyToClipboard: (text: string, key: string) => void;
  handleAspectChange: (key: 'hero' | 'detail' | 'abstract', ratio: string) => void;
  handleGenerateImage: (key: 'hero' | 'detail' | 'abstract', promptText: string) => void;
}

export function PromptsTab({ output, brief, generatedImages, copiedKey, handleCopyToClipboard, handleAspectChange, handleGenerateImage }: PromptsTabProps) {
  return (
                        <motion.div
                          key="tab_prompts"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 font-sans"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-350 px-2 py-0.5 rounded uppercase font-bold tracking-wider">8. AI-billedprompts (AI Billedmotor integreret)</span>
                            <span className="text-[11px] text-slate-500 font-mono">Skal altid være på engelsk</span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Prompt 1: Hero */}
                            <ImageGenCard
                              label="1. Hero Image Prompt"
                              footer="High Production Value"
                              alt="AI generated hero concept"
                              ratios={['16:9', '1:1', '4:3', '9:16']}
                              promptText={output.imagePrompts.hero}
                              image={generatedImages.hero}
                              downloadBase={`${(brief.client || '').replace(/\s+/g, '_')}_hero`}
                              copied={copiedKey === 'prompt_hero'}
                              onCopy={() => handleCopyToClipboard(output.imagePrompts.hero, 'prompt_hero')}
                              onAspectChange={(r) => handleAspectChange('hero', r)}
                              onGenerate={() => handleGenerateImage('hero', output.imagePrompts.hero)}
                            />

                            {/* Prompt 2: Detail */}
                            <ImageGenCard
                              label="2. Detail / Close-up Prompt"
                              footer="Macro / Technical texture"
                              alt="AI generated closeup concept"
                              ratios={['1:1', '4:3', '16:9', '9:16']}
                              promptText={output.imagePrompts.detail}
                              image={generatedImages.detail}
                              downloadBase={`${(brief.client || '').replace(/\s+/g, '_')}_detail`}
                              copied={copiedKey === 'prompt_detail'}
                              onCopy={() => handleCopyToClipboard(output.imagePrompts.detail, 'prompt_detail')}
                              onAspectChange={(r) => handleAspectChange('detail', r)}
                              onGenerate={() => handleGenerateImage('detail', output.imagePrompts.detail)}
                            />

                            {/* Prompt 3: Abstract */}
                            <ImageGenCard
                              label="3. Abstract Background"
                              footer="Visual Atmosphere textures"
                              alt="AI generated abstract background concept"
                              ratios={['16:9', '1:1', '4:3', '9:16']}
                              promptText={output.imagePrompts.abstract}
                              image={generatedImages.abstract}
                              downloadBase={`${(brief.client || '').replace(/\s+/g, '_')}_abstract`}
                              copied={copiedKey === 'prompt_abstract'}
                              onCopy={() => handleCopyToClipboard(output.imagePrompts.abstract, 'prompt_abstract')}
                              onAspectChange={(r) => handleAspectChange('abstract', r)}
                              onGenerate={() => handleGenerateImage('abstract', output.imagePrompts.abstract)}
                            />

                          </div>
                        </motion.div>
  );
}
