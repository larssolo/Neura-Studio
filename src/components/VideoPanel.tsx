/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Loader2, AlertTriangle, Download, Film } from 'lucide-react';
import type { VideoState, VideoParams } from '../hooks/useVideoGeneration';

interface VideoPanelProps {
  generatedImageUrl: string;
  video: VideoState;
  onGenerate: (params: VideoParams) => void;
}

export function VideoPanel({ generatedImageUrl, video, onGenerate }: VideoPanelProps) {
  const [useGenerated, setUseGenerated] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [cfgScale, setCfgScale] = useState(0.5);
  const [tailUrl, setTailUrl] = useState('');

  const imageUrl = useGenerated ? generatedImageUrl : urlInput.trim();
  const canGenerate = !!prompt.trim() && !!imageUrl && !video.loading;

  const submit = () => {
    if (!canGenerate) return;
    onGenerate({ imageUrl, prompt: prompt.trim(), negativePrompt, duration, cfgScale, tailImageUrl: tailUrl });
  };

  const inputCls = 'w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 transition-all font-sans';
  const segIdle = 'flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 text-[11px] font-mono transition-all';
  const segActive = 'flex-1 py-1.5 px-2 rounded-lg border border-violet-500/60 bg-violet-500/10 text-white text-[11px] font-mono transition-all';

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">

      {/* HEADER */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Film className="w-5 h-5 text-violet-400 shrink-0" />
        <div>
          <h3 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
            Video Generator · Kling 2.5 Turbo
          </h3>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            image-to-video via fal-ai/kling/v2.5/standard/image-to-video
          </p>
        </div>
      </div>

      {/* INPUTBILLEDE */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-medium text-slate-400">Inputbillede</span>
        <div className="flex gap-1.5">
          <button type="button" aria-pressed={useGenerated} onClick={() => setUseGenerated(true)}
            className={useGenerated ? segActive : segIdle}>
            Brug genereret billede
          </button>
          <button type="button" aria-pressed={!useGenerated} onClick={() => setUseGenerated(false)}
            className={!useGenerated ? segActive : segIdle}>
            Indsæt URL
          </button>
        </div>
        {useGenerated && !generatedImageUrl && (
          <span className="block text-[11px] text-slate-500 font-mono">Generér først et billede ovenfor, eller vælg "Indsæt URL".</span>
        )}
        {!useGenerated && (
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://… billede-URL" className={inputCls} />
        )}
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Beskriv bevægelsen / scenen…" rows={2}
        className={`${inputCls} resize-y`} />
      <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Negativ prompt (default: blur, distort, low quality)" rows={1}
        className={`${inputCls} resize-y`} />

      {/* VARIGHED */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-slate-400">Varighed</span>
        <div className="flex gap-1.5">
          {(['5', '10'] as const).map((d) => (
            <button key={d} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)}
              className={`py-1 px-3 rounded-lg border text-[11px] font-mono transition-all ${
                duration === d ? 'border-violet-500/60 bg-violet-500/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}>
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* CFG SCALE */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>cfg_scale (prompt-styrke)</span>
          <span className="text-violet-300">{cfgScale.toFixed(2)}</span>
        </div>
        <input type="range" aria-label="cfg_scale (prompt-styrke)" min={0} max={1} step={0.05} value={cfgScale}
          onChange={(e) => setCfgScale(parseFloat(e.target.value))} className="w-full accent-violet-500" />
      </div>

      <input type="text" value={tailUrl} onChange={(e) => setTailUrl(e.target.value)} placeholder="Slut-frame URL (valgfri)" className={inputCls} />

      {/* CTA */}
      <button type="button" onClick={submit} disabled={!canGenerate}
        className={`w-full py-2.5 px-4 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
          canGenerate
            ? 'bg-violet-600/15 hover:bg-violet-600/25 text-violet-200 hover:text-white border border-violet-500/40 active:scale-[0.99] cursor-pointer'
            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
        }`}>
        {video.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
        <span>{video.loading ? 'Genererer video…' : 'Generér video'}</span>
      </button>

      {video.loading && (
        <span className="block text-[11px] text-slate-500 font-mono text-center">Kling kan tage et par minutter…</span>
      )}

      {video.error && (
        <div className="bg-red-950/40 border border-red-900/40 text-red-400 rounded-lg p-3 text-[11px] flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-tight">{video.error}</span>
        </div>
      )}

      {video.url && !video.loading && (
        <div className="space-y-2">
          <video src={video.url} controls className="w-full rounded-lg border border-slate-800 bg-slate-950" />
          <a href={video.url} download="neura_video.mp4"
            className="text-[11px] text-violet-300 hover:text-violet-200 font-mono flex items-center gap-1">
            <Download className="w-3 h-3" /><span>Download video</span>
          </a>
        </div>
      )}
    </div>
  );
}
