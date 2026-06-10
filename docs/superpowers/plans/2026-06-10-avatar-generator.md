# Avatar-generator (VEED Fabric + Gemini TTS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj en avatar-generator (talking-head) under video-panelet: et to-trins flow hvor brugeren først genererer tale via Gemini TTS og derefter en talende avatar-video via VEED Fabric 1.0.

**Architecture:** To rene fal-adaptere (`server/audio/tts.ts`, `server/video/fabric.ts`) med unit-testbare input-buildere bag to routes. Et selvstændigt `useAvatarGeneration`-domæne-hook surfaced via `useContentMachine`, og et `AvatarPanel` med to sektioner (Tale → Avatar). Alt via fal (`FAL_KEY`), ingen upload.

**Tech Stack:** Express + `@fal-ai/client`; React 19 + Tailwind 4; Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-10-avatar-generator-design.md`. **Design-system:** `.interface-design/system.md`.

### Verificerede fal-schemas
- **TTS** `fal-ai/gemini-3.1-flash-tts` input: `prompt` (req), `voice` (enum, def `Kore`), `style_instructions` (valgfri), `temperature` (0–1, def 1), `output_format` (def `mp3`). Output `data.audio.url`.
- **Avatar** `veed/fabric-1.0` input: `image_url` (req), `audio_url` (req), `resolution` `720p`|`480p` (req). Output `data.video.url`.
- **30 stemmer:** Achernar, Achird, Algenib, Algieba, Alnilam, Aoede, Autonoe, Callirrhoe, Charon, Despina, Enceladus, Erinome, Fenrir, Gacrux, Iapetus, Kore, Laomedeia, Leda, Orus, Pulcherrima, Puck, Rasalgethi, Sadachbia, Sadaltager, Schedar, Sulafat, Umbriel, Vindemiatrix, Zephyr, Zubenelgenubi.

---

## File Structure
- **Create** `server/audio/tts.ts` + `server/audio/tts.test.ts` — TTS-adapter.
- **Create** `server/video/fabric.ts` + `server/video/fabric.test.ts` — avatar-adapter.
- **Modify** `server.ts` — `/api/generate-speech` + `/api/generate-avatar`.
- **Create** `src/hooks/useAvatarGeneration.ts` — hook + types + `TTS_VOICES`.
- **Modify** `src/hooks/useContentMachine.ts` — komposer + surface.
- **Create** `src/components/AvatarPanel.tsx` + `src/components/AvatarPanel.test.tsx`.
- **Modify** `src/App.tsx` — render under VideoPanel + overlay.
- **Modify** `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx`, `package-lock.json` — version 1.22.0.

---

## Task 1: TTS-adapter (TDD)

**Files:** Create `server/audio/tts.ts`, `server/audio/tts.test.ts`

- [ ] **Step 1: Write the failing test** — `server/audio/tts.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('buildTtsInput', () => {
  it('default voice Kore + mp3', async () => {
    const { buildTtsInput } = await import('./tts');
    const input = buildTtsInput({ prompt: 'hej' });
    expect(input.prompt).toBe('hej');
    expect(input.voice).toBe('Kore');
    expect(input.output_format).toBe('mp3');
    expect(input.style_instructions).toBeUndefined();
  });
  it('ugyldig voice falder tilbage til Kore; clamp temperatur; style når sat', async () => {
    const { buildTtsInput } = await import('./tts');
    const input = buildTtsInput({ prompt: 'hej', voice: 'NotAVoice', temperature: 5, styleInstructions: 'varmt' });
    expect(input.voice).toBe('Kore');
    expect(input.temperature).toBe(1);
    expect(input.style_instructions).toBe('varmt');
  });
  it('gyldig voice bevares', async () => {
    const { buildTtsInput } = await import('./tts');
    expect(buildTtsInput({ prompt: 'x', voice: 'Zephyr' }).voice).toBe('Zephyr');
  });
});

describe('generateSpeech', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('fejler klart uden FAL_KEY', async () => {
    vi.resetModules();
    vi.stubEnv('FAL_KEY', '');
    const { generateSpeech } = await import('./tts');
    await expect(generateSpeech({ prompt: 'x' })).rejects.toThrow(/FAL_KEY/);
  });
});
```
Run `npm test -- tts` → FAIL.

- [ ] **Step 2: Implement** — `server/audio/tts.ts`:
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fal } from '@fal-ai/client';

export const TTS_VOICES = ['Achernar','Achird','Algenib','Algieba','Alnilam','Aoede','Autonoe','Callirrhoe','Charon','Despina','Enceladus','Erinome','Fenrir','Gacrux','Iapetus','Kore','Laomedeia','Leda','Orus','Pulcherrima','Puck','Rasalgethi','Sadachbia','Sadaltager','Schedar','Sulafat','Umbriel','Vindemiatrix','Zephyr','Zubenelgenubi'] as const;

export interface SpeechRequest {
  prompt: string;
  voice?: string;
  styleInstructions?: string;
  temperature?: number;
}

/** Ren mapping: SpeechRequest → fal TTS input. Ugyldig voice → Kore. */
export function buildTtsInput(req: SpeechRequest): Record<string, unknown> {
  const voice = (TTS_VOICES as readonly string[]).includes(req.voice ?? '') ? req.voice : 'Kore';
  const input: Record<string, unknown> = { prompt: req.prompt, voice, output_format: 'mp3' };
  if (typeof req.temperature === 'number') input.temperature = Math.min(1, Math.max(0, req.temperature));
  if (req.styleInstructions?.trim()) input.style_instructions = req.styleInstructions;
  return input;
}

let configured = false;
function ensureConfigured() {
  if (!configured && process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
}

/** Generér tale via Gemini 3.1 Flash TTS på fal.ai. */
export async function generateSpeech(req: SpeechRequest): Promise<{ audioUrl: string }> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY er ikke sat i miljøet. Tilføj din fal.ai API-nøgle for at generere tale.');
  }
  ensureConfigured();

  const result: any = await fal.subscribe('fal-ai/gemini-3.1-flash-tts', { input: buildTtsInput(req) as any });

  const url: string | undefined = result?.data?.audio?.url ?? result?.audio?.url;
  if (!url) {
    throw new Error('Ingen lyd blev returneret fra fal.ai.');
  }
  return { audioUrl: url };
}
```

- [ ] **Step 3: Verify** — `npm test -- tts` → PASS. Then `npm run lint && npm test` → clean; all pass.
- [ ] **Step 4: Commit**
```bash
git add server/audio/tts.ts server/audio/tts.test.ts
git commit -m "feat: TTS-adapter (Gemini 3.1 Flash TTS via fal)"
```

---

## Task 2: Avatar-adapter (TDD)

**Files:** Create `server/video/fabric.ts`, `server/video/fabric.test.ts`

- [ ] **Step 1: Write the failing test** — `server/video/fabric.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('buildFabricInput', () => {
  it('mapper felter + default 480p', async () => {
    const { buildFabricInput } = await import('./fabric');
    const input = buildFabricInput({ imageUrl: 'http://img', audioUrl: 'http://a' });
    expect(input.image_url).toBe('http://img');
    expect(input.audio_url).toBe('http://a');
    expect(input.resolution).toBe('480p');
  });
  it('respekterer 720p', async () => {
    const { buildFabricInput } = await import('./fabric');
    expect(buildFabricInput({ imageUrl: 'i', audioUrl: 'a', resolution: '720p' }).resolution).toBe('720p');
  });
});

describe('generateAvatar', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('fejler klart uden FAL_KEY', async () => {
    vi.resetModules();
    vi.stubEnv('FAL_KEY', '');
    const { generateAvatar } = await import('./fabric');
    await expect(generateAvatar({ imageUrl: 'i', audioUrl: 'a' })).rejects.toThrow(/FAL_KEY/);
  });
});
```
Run `npm test -- fabric` → FAIL.

- [ ] **Step 2: Implement** — `server/video/fabric.ts`:
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fal } from '@fal-ai/client';

export interface AvatarRequest {
  imageUrl: string;
  audioUrl: string;
  resolution?: '720p' | '480p';
}

/** Ren mapping: AvatarRequest → fal fabric input. Default 480p. */
export function buildFabricInput(req: AvatarRequest): Record<string, unknown> {
  return {
    image_url: req.imageUrl,
    audio_url: req.audioUrl,
    resolution: req.resolution === '720p' ? '720p' : '480p',
  };
}

let configured = false;
function ensureConfigured() {
  if (!configured && process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
}

/** Generér talking-head avatar via VEED Fabric 1.0 på fal.ai. */
export async function generateAvatar(req: AvatarRequest): Promise<{ videoUrl: string }> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY er ikke sat i miljøet. Tilføj din fal.ai API-nøgle for at generere avatar.');
  }
  ensureConfigured();

  const result: any = await fal.subscribe('veed/fabric-1.0', { input: buildFabricInput(req) as any });

  const url: string | undefined = result?.data?.video?.url ?? result?.video?.url;
  if (!url) {
    throw new Error('Ingen video blev returneret fra fal.ai.');
  }
  return { videoUrl: url };
}
```

- [ ] **Step 3: Verify** — `npm test -- fabric` → PASS. Then `npm run lint && npm test` → clean; all pass.
- [ ] **Step 4: Commit**
```bash
git add server/video/fabric.ts server/video/fabric.test.ts
git commit -m "feat: avatar-adapter (VEED Fabric 1.0 via fal)"
```

---

## Task 3: Routes (/api/generate-speech + /api/generate-avatar)

**Files:** Modify `server.ts`

- [ ] **Step 1: Imports + routes**
Add imports near the other `./server/...` imports:
```ts
import { generateSpeech } from './server/audio/tts';
import { generateAvatar } from './server/video/fabric';
```
Add both routes right after the `/api/generate-video` route:
```ts
  // Tale-generering via Gemini TTS (fal.ai)
  app.post('/api/generate-speech', async (req, res) => {
    try {
      const { prompt, voice, styleInstructions, temperature } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Tekst (prompt) er påkrævet.' });
      }
      const { audioUrl } = await generateSpeech({ prompt, voice, styleInstructions, temperature });
      res.json({ audioUrl });
    } catch (error: any) {
      console.error('Fejl under tale-generering:', error);
      res.status(500).json({ error: error.message || 'Kunne ikke generere tale. Kontroller din API konfiguration.' });
    }
  });

  // Avatar-generering (talking-head) via VEED Fabric (fal.ai)
  app.post('/api/generate-avatar', async (req, res) => {
    try {
      const { imageUrl, audioUrl, resolution } = req.body;
      if (!imageUrl || !audioUrl) {
        return res.status(400).json({ error: 'Både et billede og en lyd er påkrævet.' });
      }
      const { videoUrl } = await generateAvatar({ imageUrl, audioUrl, resolution });
      res.json({ videoUrl });
    } catch (error: any) {
      console.error('Fejl under avatar-generering:', error);
      res.status(500).json({ error: error.message || 'Kunne ikke generere avatar. Kontroller din API konfiguration.' });
    }
  });
```

- [ ] **Step 2: Verify** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 3: Commit**
```bash
git add server.ts
git commit -m "feat: /api/generate-speech + /api/generate-avatar routes"
```

---

## Task 4: useAvatarGeneration hook + surface

**Files:** Create `src/hooks/useAvatarGeneration.ts`; Modify `src/hooks/useContentMachine.ts`

- [ ] **Step 1: Create the hook** — `src/hooks/useAvatarGeneration.ts`:
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { httpErrorMessage } from './httpError';

export const TTS_VOICES = ['Achernar','Achird','Algenib','Algieba','Alnilam','Aoede','Autonoe','Callirrhoe','Charon','Despina','Enceladus','Erinome','Fenrir','Gacrux','Iapetus','Kore','Laomedeia','Leda','Orus','Pulcherrima','Puck','Rasalgethi','Sadachbia','Sadaltager','Schedar','Sulafat','Umbriel','Vindemiatrix','Zephyr','Zubenelgenubi'] as const;

export type SpeechState = { url: string; loading: boolean; error: string | null };
export type AvatarState = { url: string; loading: boolean; error: string | null };

export interface SpeechParams {
  prompt: string;
  voice?: string;
  styleInstructions?: string;
  temperature?: number;
}
export interface AvatarParams {
  imageUrl: string;
  audioUrl: string;
  resolution?: '720p' | '480p';
}

/** Avatar-domæne: TTS (tale) + Fabric (talking-head). Selvstændigt. */
export function useAvatarGeneration() {
  const [speechResult, setSpeechResult] = useState<SpeechState>({ url: '', loading: false, error: null });
  const [avatarResult, setAvatarResult] = useState<AvatarState>({ url: '', loading: false, error: null });

  const handleGenerateSpeech = async (params: SpeechParams) => {
    setSpeechResult({ url: '', loading: true, error: null });
    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(httpErrorMessage(response.status, errData.error));
      }
      const data = await response.json();
      if (!data.audioUrl) throw new Error('Forkert svar-format fra API.');
      setSpeechResult({ url: data.audioUrl, loading: false, error: null });
    } catch (err: any) {
      console.error('Fejl i handleGenerateSpeech:', err);
      setSpeechResult({ url: '', loading: false, error: err.message || 'Der opstod en uventet fejl under tale-genereringen.' });
    }
  };

  const handleGenerateAvatar = async (params: AvatarParams) => {
    setAvatarResult({ url: '', loading: true, error: null });
    try {
      const response = await fetch('/api/generate-avatar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(httpErrorMessage(response.status, errData.error));
      }
      const data = await response.json();
      if (!data.videoUrl) throw new Error('Forkert svar-format fra API.');
      setAvatarResult({ url: data.videoUrl, loading: false, error: null });
    } catch (err: any) {
      console.error('Fejl i handleGenerateAvatar:', err);
      setAvatarResult({ url: '', loading: false, error: err.message || 'Der opstod en uventet fejl under avatar-genereringen.' });
    }
  };

  return { speechResult, avatarResult, handleGenerateSpeech, handleGenerateAvatar };
}
```

- [ ] **Step 2: Surface in `src/hooks/useContentMachine.ts`**
Add import after `import { useVideoGeneration } from './useVideoGeneration';`:
```ts
import { useAvatarGeneration } from './useAvatarGeneration';
```
Add composition after the `useVideoGeneration()` line:
```ts
  const { speechResult, avatarResult, handleGenerateSpeech, handleGenerateAvatar } = useAvatarGeneration();
```
Add `speechResult`, `avatarResult`, `handleGenerateSpeech`, `handleGenerateAvatar` to the returned object (near the video fields).

- [ ] **Step 3: Verify** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 4: Commit**
```bash
git add src/hooks/useAvatarGeneration.ts src/hooks/useContentMachine.ts
git commit -m "feat: useAvatarGeneration-hook (tale + avatar) surfaced via useContentMachine"
```

---

## Task 5: AvatarPanel (TDD)

**Files:** Create `src/components/AvatarPanel.tsx`, `src/components/AvatarPanel.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/AvatarPanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarPanel } from './AvatarPanel';

const empty = { url: '', loading: false, error: null };
const base = {
  generatedImageUrl: 'http://img',
  speech: empty,
  avatar: empty,
  onGenerateSpeech: () => {},
  onGenerateAvatar: () => {},
};

describe('AvatarPanel', () => {
  it('stemme-dropdown indeholder alle 30 stemmer', () => {
    render(<AvatarPanel {...base} />);
    const select = screen.getByLabelText('Stemme') as HTMLSelectElement;
    expect(select.options.length).toBe(30);
  });

  it('Generér tale kalder onGenerateSpeech med tekst + default-stemme', () => {
    const onGenerateSpeech = vi.fn();
    render(<AvatarPanel {...base} onGenerateSpeech={onGenerateSpeech} />);
    fireEvent.change(screen.getByPlaceholderText(/Skriv hvad avataren skal sige/), { target: { value: 'Hej verden' } });
    fireEvent.click(screen.getByText('Generér tale'));
    expect(onGenerateSpeech).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'Hej verden', voice: 'Kore' }));
  });

  it('Generér avatar er deaktiveret uden genereret tale', () => {
    render(<AvatarPanel {...base} />);
    const btn = screen.getByText('Generér avatar').closest('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Generér avatar kalder onGenerateAvatar når billede + tale findes', () => {
    const onGenerateAvatar = vi.fn();
    render(<AvatarPanel {...base} speech={{ url: 'http://audio', loading: false, error: null }} onGenerateAvatar={onGenerateAvatar} />);
    fireEvent.click(screen.getByText('Generér avatar'));
    expect(onGenerateAvatar).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'http://img', audioUrl: 'http://audio', resolution: '480p' }));
  });
});
```
Run `npm test -- AvatarPanel` → FAIL.

- [ ] **Step 2: Implement** — `src/components/AvatarPanel.tsx`:
```tsx
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

const SEG = 'flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-mono transition-all';
const active = 'border-brand-orange-500/50 bg-brand-orange-600/10 text-brand-orange-300';
const idle = 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700';

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

  const inputCls = 'w-full bg-slate-900 border border-slate-800 focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 transition-all font-sans';

  const submitSpeech = () => { if (canSpeak) onGenerateSpeech({ prompt: text.trim(), voice, styleInstructions: style, temperature }); };
  const submitAvatar = () => { if (canAvatar) onGenerateAvatar({ imageUrl, audioUrl: speech.url, resolution }); };

  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
      <span className="block text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">Avatar</span>

      {/* 1 — TALE */}
      <div className="space-y-2 pb-2 border-b border-slate-800">
        <span className="block text-[11px] font-mono text-slate-500">1 · Tale</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Skriv hvad avataren skal sige… (understøtter [sigh], [whispering])" rows={2} className={`${inputCls} resize-y`} />
        <div className="flex items-center gap-2">
          <select aria-label="Stemme" value={voice} onChange={(e) => setVoice(e.target.value)} className={`${inputCls} flex-1`}>
            {TTS_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-slate-400">Temp</span>
            <span className="text-[11px] font-mono text-brand-orange-300 w-7 text-right">{temperature.toFixed(1)}</span>
          </div>
        </div>
        <input type="range" aria-label="Temperatur" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-brand-orange-500" />
        <input type="text" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Stil-instruktion (valgfri, fx ‘tal varmt og langsomt’)" className={inputCls} />
        <button type="button" onClick={submitSpeech} disabled={!canSpeak}
          className={`w-full py-2 px-4 rounded-lg font-display font-semibold text-xs text-white flex items-center justify-center gap-2 transition-all ${
            canSpeak ? 'bg-brand-orange-600 hover:bg-brand-orange-500 cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
        <span className="block text-[11px] font-mono text-slate-500">2 · Avatar</span>
        <span className="block text-[11px] font-mono text-slate-400">Inputbillede</span>
        <div className="flex gap-1.5">
          <button type="button" aria-pressed={useGenerated} onClick={() => setUseGenerated(true)} className={`${SEG} ${useGenerated ? active : idle}`}>Brug genereret billede</button>
          <button type="button" aria-pressed={!useGenerated} onClick={() => setUseGenerated(false)} className={`${SEG} ${!useGenerated ? active : idle}`}>Indsæt URL</button>
        </div>
        {useGenerated && !generatedImageUrl && (
          <span className="block text-[11px] text-slate-500">Generér først et billede ovenfor, eller vælg “Indsæt URL”.</span>
        )}
        {!useGenerated && (
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://… billede-URL" className={inputCls} />
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-slate-400">Opløsning</span>
          <div className="flex gap-1.5">
            {(['480p', '720p'] as const).map((r) => (
              <button key={r} type="button" aria-pressed={resolution === r} onClick={() => setResolution(r)}
                className={`py-1 px-3 rounded-lg border text-[11px] font-mono transition-all ${resolution === r ? active : idle}`}>{r}</button>
            ))}
          </div>
        </div>

        <span className={`block text-[11px] font-mono ${speech.url ? 'text-brand-orange-300' : 'text-slate-500'}`}>
          {speech.url ? '✓ Tale klar' : 'Generér tale først (trin 1)'}
        </span>

        <button type="button" onClick={submitAvatar} disabled={!canAvatar}
          className={`w-full py-3 px-4 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${
            canAvatar ? 'bg-brand-orange-600 hover:bg-brand-orange-500 cursor-pointer active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}>
          {avatar.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clapperboard className="w-5 h-5" />}
          <span>{avatar.loading ? 'Genererer avatar…' : 'Generér avatar'}</span>
        </button>
        {avatar.loading && <span className="block text-[11px] text-slate-500 text-center">Fabric kan tage et par minutter…</span>}
        {avatar.error && (
          <div className="bg-red-950/40 border border-red-900/40 text-red-400 rounded-lg p-3 text-[11px] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="leading-tight">{avatar.error}</span>
          </div>
        )}
        {avatar.url && !avatar.loading && (
          <div className="space-y-2">
            <video src={avatar.url} controls className="w-full rounded-lg border border-slate-800 bg-slate-950" />
            <a href={avatar.url} download="neura_avatar.mp4" className="text-[11px] text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1">
              <Download className="w-3 h-3" /><span>Download avatar</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — `npm test -- AvatarPanel` → PASS (4/4). Then `npm run lint && npm test` → clean; all pass.
- [ ] **Step 4: Commit**
```bash
git add src/components/AvatarPanel.tsx src/components/AvatarPanel.test.tsx
git commit -m "feat: AvatarPanel — to-trins tale→avatar (alle 30 stemmer)"
```

---

## Task 6: Wire AvatarPanel i App.tsx

**Files:** Modify `src/App.tsx`

- [ ] **Step 1: Import + destructure**
Add import near the other component imports:
```tsx
import { AvatarPanel } from './components/AvatarPanel';
```
Add `speechResult, avatarResult, handleGenerateSpeech, handleGenerateAvatar` to the `useContentMachine()` destructure (near `videoResult, handleGenerateVideo`).

- [ ] **Step 2: Render under VideoPanel**
In the Assets cluster, insert directly AFTER the `<VideoPanel … />` element and BEFORE `<LogoPanel`:
```tsx
              <AvatarPanel
                generatedImageUrl={generatedImages.custom.url}
                speech={speechResult}
                avatar={avatarResult}
                onGenerateSpeech={handleGenerateSpeech}
                onGenerateAvatar={handleGenerateAvatar}
              />
```

- [ ] **Step 3: WorkingOverlay**
Add `|| speechResult.loading || avatarResult.loading` to the `show` boolean. Add two title branches near the video one:
```tsx
            speechResult.loading ? 'Genererer tale' :
            avatarResult.loading ? 'Genererer avatar' :
```

- [ ] **Step 4: Verify** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 5: Commit**
```bash
git add src/App.tsx
git commit -m "feat: placér AvatarPanel under Video i Assets-klyngen"
```

---

## Task 7: Versionsbump 1.21.0 → 1.22.0

**Files:** `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx`, `package-lock.json`

- [ ] **Step 1:** `grep -rn "1\.21\.0" package.json src/App.tsx src/components/AppHeader.tsx` → tre hits.
- [ ] **Step 2:** Ret de tre til `1.22.0` (package.json version, AppHeader `v1.22.0`, App.tsx footer `· v1.22.0`).
- [ ] **Step 3:** `npm install --package-lock-only` → bekræft `grep -m1 '"version"' package-lock.json` = `1.22.0`.
- [ ] **Step 4:** `grep -rn "1\.\(21\|22\)\.0" package.json src/App.tsx src/components/AppHeader.tsx` → alle `1.22.0`.
- [ ] **Step 5:** Commit:
```bash
git add package.json src/App.tsx src/components/AppHeader.tsx package-lock.json
git commit -m "chore: bump version til 1.22.0"
```

---

## Task 8: Verifikation (lint, test, manuelt)

**Files:** ingen ændringer.

- [ ] **Step 1:** `npm run lint && npm test` → begge grønne.
- [ ] **Step 2:** `npm run dev` (http://localhost:3000).
- [ ] **Step 3: Manuelt:**
  1. Generér et billede i Billede-panelet.
  2. I Avatar-panelet (trin 1): skriv tekst, vælg en stemme blandt alle 30, justér temperatur → **Generér tale** → hør `<audio>`-preview.
  3. Trin 2: "Brug genereret billede" valgt; vælg opløsning → **Generér avatar** (deaktiveret indtil tale findes) → talende `<video>`; download virker.
  4. Test "Indsæt URL" til billedet; test 720p.
  5. Bekræft at billede-/video-/logo-/funnel-flows er upåvirkede.
- [ ] **Step 4:** `pkill -f "tsx server.ts"`.

---

## Self-Review (udført ved skrivning)

- **Spec coverage:** TTS-adapter+test (T1), fabric-adapter+test (T2), begge routes (T3), hook+surface (T4), AvatarPanel to-trins+test inkl. alle 30 stemmer (T5), App-wiring+overlay (T6), version (T7), verifikation (T8). Alle spec-punkter dækket.
- **Type-konsistens:** `SpeechRequest`/`AvatarRequest` (backend) ↔ `SpeechParams`/`AvatarParams` (frontend) har samme feltnavne; `SpeechState`/`AvatarState` defineret i hook (T4), brugt i AvatarPanel-props (T5) + App (T6). `TTS_VOICES` defineret i backend (T1, til validering) og frontend hook (T4, til dropdown) — bevidst duplikering (frontend kan ikke importere server-kode); begge har de 30 stemmer i samme rækkefølge. `handleGenerateSpeech(SpeechParams)`/`handleGenerateAvatar(AvatarParams)` konsistent mellem hook (T4), AvatarPanel (T5) og App (T6).
- **Ingen placeholders:** al kode + kommandoer konkrete; fal output-stier verificeret (`data.audio.url`, `data.video.url`).
- **YAGNI:** ingen multi-speaker, ingen upload, `output_format` låst til mp3.
- **Afhængigheder:** T3 afhænger af T1+T2; T5 af T4; T6 af T4+T5. Lineær.
