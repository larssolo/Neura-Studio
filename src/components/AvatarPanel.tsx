/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Loader2, AlertTriangle, Download, Volume2, Clapperboard } from 'lucide-react';
import { TTS_VOICES, type SpeechState, type AvatarState, type SpeechParams, type AvatarParams } from '../hooks/useAvatarGeneration';

interface AvatarPanelProps {
  generatedImageUrl: string;
  speech: SpeechState;
  avatar: AvatarState;
  onGenerateSpeech: (p: SpeechParams) => void;
  onGenerateAvatar: (p: AvatarParams) => void;
}

const segIdle = 'flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 text-[11px] font-mono transition-all';
const segActive = 'flex-1 py-1.5 px-2 rounded-lg border border-violet-500/60 bg-violet-500/10 text-white text-[11px] font-mono transition-all';

export function AvatarPanel({ generatedImageUrl, speech, avatar, onGenerateSpeech, onGenerateAvatar }: AvatarPanelProps) {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [style, setStyle] = useState('');
  const [temperature, setTemperature] = useState(1);
  const [useGenerated, setUseGenerated] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [resolution, setResolution] = useState<'720p' | '480p'>('480p');

  const imageUrl = useGenerated ? generatedImageUrl : urlInput.trim();
  const canSpeak = !!text.trim() && !speech.loading;
  const canAvatar = !!imageUrl && !!speech.url && !avatar.loading;

  const inputCls = 'w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 transition-all font-sans';

  const submitSpeech = () => { if (canSpeak) onGenerateSpeech({ prompt: text.trim(), voice, styleInstructions: style, temperature }); };
  const submitAvatar = () => { if (canAvatar) onGenerateAvatar({ imageUrl, audioUrl: speech.url, resolution }); };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">

      {/* HEADER */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Clapperboard className="w-5 h-5 text-violet-400 shrink-0" />
        <div>
          <h3 className="font-display font-bold text-xs text-slate-100 uppercase tracking-wider">
            Avatar Generator · VEED Fabric
          </h3>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            tale + talking-head via fal-ai/veed/fabric-1.0/image-to-video
          </p>
        </div>
      </div>

      {/* 1 — TALE */}
      <div className="space-y-2 pb-4 border-b border-slate-800">
        <span className="block text-[11px] font-medium text-slate-400">1 · Tale</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Skriv hvad avataren skal sige… (understøtter [sigh], [whispering])"
          rows={2} className={`${inputCls} resize-y`} />

        <div className="flex items-center gap-2">
          <select aria-label="Stemme" value={voice} onChange={(e) => setVoice(e.target.value)}
            className={`${inputCls} flex-1`}>
            {TTS_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-slate-400">Temp</span>
            <span className="text-[11px] font-mono text-violet-300 w-7 text-right">{temperature.toFixed(1)}</span>
          </div>
        </div>

        <input type="range" aria-label="Temperatur" min={0} max={1} step={0.1} value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-violet-500" />

        <input type="text" value={style} onChange={(e) => setStyle(e.target.value)}
          placeholder="Stil-instruktion (valgfri, fx 'tal varmt og langsomt')" className={inputCls} />

        <button type="button" onClick={submitSpeech} disabled={!canSpeak}
          className={`w-full py-2.5 px-4 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
            canSpeak
              ? 'bg-violet-600/15 hover:bg-violet-600/25 text-violet-200 hover:text-white border border-violet-500/40 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}>
          {speech.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
          <span>{speech.loading ? 'Genererer tale…' : 'Generér tale'}</span>
        </button>

        {speech.error && (
          <div className="bg-red-950/40 border border-red-900/40 text-red-400 rounded-lg p-3 text-[11px] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="leading-tight">{speech.error}</span>
          </div>
        )}
        {speech.url && !speech.loading && (
          <audio src={speech.url} controls className="w-full" />
        )}
      </div>

      {/* 2 — AVATAR */}
      <div className="space-y-2">
        <span className="block text-[11px] font-medium text-slate-400">2 · Avatar</span>
        <span className="block text-[11px] font-medium text-slate-400">Inputbillede</span>
        <div className="flex gap-1.5">
          <button type="button" aria-pressed={useGenerated} onClick={() => setUseGenerated(true)}
            className={useGenerated ? segActive : segIdle}>Brug genereret billede</button>
          <button type="button" aria-pressed={!useGenerated} onClick={() => setUseGenerated(false)}
            className={!useGenerated ? segActive : segIdle}>Indsæt URL</button>
        </div>
        {useGenerated && !generatedImageUrl && (
          <span className="block text-[11px] text-slate-500 font-mono">Generér først et billede ovenfor, eller vælg "Indsæt URL".</span>
        )}
        {!useGenerated && (
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://… billede-URL" className={inputCls} />
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium text-slate-400">Opløsning</span>
          <div className="flex gap-1.5">
            {(['480p', '720p'] as const).map((r) => (
              <button key={r} type="button" aria-pressed={resolution === r} onClick={() => setResolution(r)}
                className={`py-1 px-3 rounded-lg border text-[11px] font-mono transition-all ${
                  resolution === r
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}>{r}</button>
            ))}
          </div>
        </div>

        <span className={`block text-[11px] font-mono ${speech.url ? 'text-violet-300' : 'text-slate-500'}`}>
          {speech.url ? '✓ Tale klar' : 'Generér tale først (trin 1)'}
        </span>

        <button type="button" onClick={submitAvatar} disabled={!canAvatar}
          className={`w-full py-2.5 px-4 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
            canAvatar
              ? 'bg-violet-600/15 hover:bg-violet-600/25 text-violet-200 hover:text-white border border-violet-500/40 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}>
          {avatar.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clapperboard className="w-4 h-4" />}
          <span>{avatar.loading ? 'Genererer avatar…' : 'Generér avatar'}</span>
        </button>

        {avatar.loading && (
          <span className="block text-[11px] text-slate-500 font-mono text-center">Fabric kan tage et par minutter…</span>
        )}
        {avatar.error && (
          <div className="bg-red-950/40 border border-red-900/40 text-red-400 rounded-lg p-3 text-[11px] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="leading-tight">{avatar.error}</span>
          </div>
        )}
        {avatar.url && !avatar.loading && (
          <div className="space-y-2">
            <video src={avatar.url} controls className="w-full rounded-lg border border-slate-800 bg-slate-950" />
            <a href={avatar.url} download="neura_avatar.mp4"
              className="text-[11px] text-violet-300 hover:text-violet-200 font-mono flex items-center gap-1">
              <Download className="w-3 h-3" /><span>Download avatar</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
