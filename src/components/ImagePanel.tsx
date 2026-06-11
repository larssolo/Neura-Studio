/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ImageIcon, Languages, Loader2, Wand2 } from 'lucide-react';
import { ImageGenCard, type ImageGenState } from './ImageGenCard';

const MODELS: Array<{ id: string; label: string }> = [
  { id: 'flux', label: 'Flux 1.1 Pro' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro' },
  { id: 'gpt-image-2', label: 'GPT Image 2' },
];

interface ImagePanelProps {
  image: ImageGenState;
  onGenerate: (prompt: string, model: string) => void;
  onAspectChange: (ratio: string) => void;
  onOptimize: (prompt: string, mode: 'translate' | 'refine') => Promise<string | null>;
  isOptimizing: boolean;
}

export function ImagePanel({ image, onGenerate, onAspectChange, onOptimize, isOptimizing }: ImagePanelProps) {
  const [model, setModel] = useState('flux');
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const trimmed = prompt.trim();

  const runOptimize = async (mode: 'translate' | 'refine') => {
    if (!trimmed) return;
    const result = await onOptimize(prompt, mode);
    if (result) setPrompt(result);
  };

  const handleCopy = () => {
    if (!trimmed) return;
    navigator.clipboard?.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">

      {/* HEADER */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <ImageIcon className="w-5 h-5 text-violet-400 shrink-0" />
        <div>
          <h3 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
            Billede Generator · Flux 1.1 Pro
          </h3>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            tekst-til-billede via fal-ai/flux-pro/v1.1
          </p>
        </div>
      </div>

      {/* PROMPT */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Beskriv billedet du vil generere…"
        rows={3}
        className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-lg p-3 text-xs text-white placeholder:text-slate-600 leading-relaxed transition-all font-sans resize-y"
      />

      {/* AI PROMPT-VÆRKTØJER */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => runOptimize('translate')}
          disabled={!trimmed || isOptimizing}
          title="Oversæt og omdan dit input til en optimeret engelsk billed-prompt"
          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-violet-500/40 hover:bg-violet-500/5 text-[11px] font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isOptimizing ? <Loader2 className="w-3.5 h-3.5 text-violet-400 shrink-0 animate-spin" /> : <Languages className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
          <span>Oversæt til engelsk</span>
        </button>
        <button
          type="button"
          onClick={() => runOptimize('refine')}
          disabled={!trimmed || isOptimizing}
          title="Forfin den eksisterende prompt gennem AI"
          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-violet-500/40 hover:bg-violet-500/5 text-[11px] font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isOptimizing ? <Loader2 className="w-3.5 h-3.5 text-violet-400 shrink-0 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
          <span>Forfin gennem AI</span>
        </button>
      </div>

      {/* MODEL SELECTOR */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-400 block">Model</label>
        <div className="grid grid-cols-3 gap-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={model === m.id}
              onClick={() => setModel(m.id)}
              className={`px-2.5 py-2 rounded-lg border text-left transition-all ${
                model === m.id
                  ? 'border-violet-500/60 bg-violet-500/10 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="block text-[11px] font-bold">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ImageGenCard
        label="Dit billede"
        footer="Genereres direkte fra din prompt — ingen funnel nødvendig."
        alt="Genereret billede"
        ratios={['1:1', '16:9', '9:16', '4:3']}
        promptText={trimmed || '—'}
        image={image}
        downloadBase="neura_billede"
        copied={copied}
        onCopy={handleCopy}
        onAspectChange={onAspectChange}
        onGenerate={() => { if (trimmed) onGenerate(trimmed, model); }}
        disabled={!trimmed}
      />
    </div>
  );
}
