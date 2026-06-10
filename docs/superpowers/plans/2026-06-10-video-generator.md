# Video-generator (Kling image-to-video) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj en video-generator (Kling 2.5 Turbo Pro image-to-video) i Assets-klyngen under billede-panelet, med alle kling-parametre, koblet til det sidst genererede billede.

**Architecture:** Backend: en ren `buildKlingInput`-helper + `generateVideo` i `server/video/kling.ts` (mirror af fal-billede-adapteren) bag en `/api/generate-video`-route. Frontend: et selvstændigt `useVideoGeneration`-domæne-hook surfaced via `useContentMachine`, og et `VideoPanel` der defaulter sit inputbillede til `generatedImages.custom.url`.

**Tech Stack:** Express + `@fal-ai/client`; React 19 + Tailwind 4; Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-10-video-generator-design.md`. **Design-system:** `.interface-design/system.md`.

### Verificeret kling-schema
`fal-ai/kling-video/v2.5-turbo/pro/image-to-video` input: `prompt` (req), `image_url` (req), `duration` `"5"`|`"10"` (def `"5"`), `negative_prompt` (def `"blur, distort, and low quality"`), `cfg_scale` float (def `0.5`), `tail_image_url` (valgfri). Output: `data.video.url`.

---

## File Structure

- **Create** `server/video/kling.ts` — `VideoRequest`-type, `buildKlingInput`, `generateVideo`.
- **Create** `server/video/kling.test.ts` — mapping + FAL_KEY-test.
- **Modify** `server.ts` — `/api/generate-video`-route.
- **Create** `src/hooks/useVideoGeneration.ts` — `VideoState`, `VideoParams`, hook.
- **Modify** `src/hooks/useContentMachine.ts` — komposer + surface hooket.
- **Create** `src/components/VideoPanel.tsx` — UI.
- **Create** `src/components/VideoPanel.test.tsx` — komponenttest.
- **Modify** `src/App.tsx` — render i Assets-klyngen + WorkingOverlay.
- **Modify** `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx`, `package-lock.json` — version 1.21.0.

---

## Task 1: kling-adapter (TDD)

**Files:** Create `server/video/kling.ts`, `server/video/kling.test.ts`

- [ ] **Step 1: Write the failing test** — `server/video/kling.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('buildKlingInput', () => {
  it('mapper med defaults', async () => {
    const { buildKlingInput } = await import('./kling');
    const input = buildKlingInput({ imageUrl: 'http://img', prompt: 'a wave' });
    expect(input.image_url).toBe('http://img');
    expect(input.prompt).toBe('a wave');
    expect(input.duration).toBe('5');
    expect(input.cfg_scale).toBe(0.5);
    expect(input.negative_prompt).toBe('blur, distort, and low quality');
    expect(input.tail_image_url).toBeUndefined();
  });
  it('respekterer eksplicitte værdier + slut-frame', async () => {
    const { buildKlingInput } = await import('./kling');
    const input = buildKlingInput({ imageUrl: 'http://img', prompt: 'a wave', duration: '10', cfgScale: 0.8, negativePrompt: 'no text', tailImageUrl: 'http://end' });
    expect(input.duration).toBe('10');
    expect(input.cfg_scale).toBe(0.8);
    expect(input.negative_prompt).toBe('no text');
    expect(input.tail_image_url).toBe('http://end');
  });
});

describe('generateVideo', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('fejler klart uden FAL_KEY', async () => {
    vi.resetModules();
    vi.stubEnv('FAL_KEY', '');
    const { generateVideo } = await import('./kling');
    await expect(generateVideo({ imageUrl: 'http://img', prompt: 'x' })).rejects.toThrow(/FAL_KEY/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — `npm test -- kling` → FAIL (import unresolved).

- [ ] **Step 3: Implement** — `server/video/kling.ts`:
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fal } from '@fal-ai/client';

export interface VideoRequest {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  duration?: '5' | '10';
  cfgScale?: number;
  tailImageUrl?: string;
}

/** Ren mapping: VideoRequest → fal kling input-objekt. */
export function buildKlingInput(req: VideoRequest): Record<string, unknown> {
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    image_url: req.imageUrl,
    duration: req.duration ?? '5',
    cfg_scale: req.cfgScale ?? 0.5,
    negative_prompt: req.negativePrompt?.trim() ? req.negativePrompt : 'blur, distort, and low quality',
  };
  if (req.tailImageUrl?.trim()) input.tail_image_url = req.tailImageUrl;
  return input;
}

let configured = false;
function ensureConfigured() {
  if (!configured && process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
}

/** Generér video via Kling 2.5 Turbo Pro (image-to-video) på fal.ai. */
export async function generateVideo(req: VideoRequest): Promise<{ videoUrl: string }> {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY er ikke sat i miljøet. Tilføj din fal.ai API-nøgle for at generere video.');
  }
  ensureConfigured();

  const result: any = await fal.subscribe('fal-ai/kling-video/v2.5-turbo/pro/image-to-video', {
    input: buildKlingInput(req),
  });

  const url: string | undefined = result?.data?.video?.url ?? result?.video?.url;
  if (!url) {
    throw new Error('Ingen video blev returneret fra fal.ai.');
  }
  return { videoUrl: url };
}
```

- [ ] **Step 4: Run test** — `npm test -- kling` → PASS.
- [ ] **Step 5: Lint + full suite** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 6: Commit**
```bash
git add server/video/kling.ts server/video/kling.test.ts
git commit -m "feat: kling video-adapter (buildKlingInput + generateVideo)"
```

---

## Task 2: /api/generate-video route

**Files:** Modify `server.ts`

- [ ] **Step 1: Add import + route**
Add import near the other `./server/...` imports:
```ts
import { generateVideo } from './server/video/kling';
```
Add this route right after the `/api/generate-image` route:
```ts
  // Video-generering via Kling image-to-video (fal.ai)
  app.post('/api/generate-video', async (req, res) => {
    try {
      const { imageUrl, prompt, negativePrompt, duration, cfgScale, tailImageUrl } = req.body;
      if (!prompt || !imageUrl) {
        return res.status(400).json({ error: 'Både prompt og et inputbillede er påkrævet.' });
      }
      const { videoUrl } = await generateVideo({ imageUrl, prompt, negativePrompt, duration, cfgScale, tailImageUrl });
      res.json({ videoUrl });
    } catch (error: any) {
      console.error('Fejl under video-generering:', error);
      res.status(500).json({ error: error.message || 'Kunne ikke generere video. Kontroller din API konfiguration.' });
    }
  });
```

- [ ] **Step 2: Verify** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 3: Commit**
```bash
git add server.ts
git commit -m "feat: /api/generate-video route (Kling)"
```

---

## Task 3: useVideoGeneration hook + surface i useContentMachine

**Files:** Create `src/hooks/useVideoGeneration.ts`; Modify `src/hooks/useContentMachine.ts`

- [ ] **Step 1: Create the hook** — `src/hooks/useVideoGeneration.ts`:
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { httpErrorMessage } from './httpError';

export type VideoState = { url: string; loading: boolean; error: string | null };

export interface VideoParams {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  duration?: '5' | '10';
  cfgScale?: number;
  tailImageUrl?: string;
}

/** Video-generering (Kling image-to-video) via /api/generate-video. Selvstændigt domæne. */
export function useVideoGeneration() {
  const [videoResult, setVideoResult] = useState<VideoState>({ url: '', loading: false, error: null });

  const handleGenerateVideo = async (params: VideoParams) => {
    setVideoResult({ url: '', loading: true, error: null });
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(httpErrorMessage(response.status, errData.error));
      }
      const data = await response.json();
      if (!data.videoUrl) throw new Error('Forkert svar-format fra API.');
      setVideoResult({ url: data.videoUrl, loading: false, error: null });
    } catch (err: any) {
      console.error('Fejl i handleGenerateVideo:', err);
      setVideoResult({ url: '', loading: false, error: err.message || 'Der opstod en uventet fejl under video-genereringen.' });
    }
  };

  return { videoResult, setVideoResult, handleGenerateVideo };
}
```

- [ ] **Step 2: Surface it in `src/hooks/useContentMachine.ts`**
Add the import near the other hook imports (e.g. after `import { useImageGeneration } from './useImageGeneration';`):
```ts
import { useVideoGeneration } from './useVideoGeneration';
```
Add the composition call right after the `useImageGeneration()` line (currently line ~125):
```ts
  const { videoResult, setVideoResult, handleGenerateVideo } = useVideoGeneration();
```
Add `videoResult`, `setVideoResult`, `handleGenerateVideo` to `useContentMachine`'s returned object (the big `return { … }`), alongside the existing image fields (`generatedImages`, `handleGenerateImage`, …).

- [ ] **Step 3: Verify** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 4: Commit**
```bash
git add src/hooks/useVideoGeneration.ts src/hooks/useContentMachine.ts
git commit -m "feat: useVideoGeneration-hook surfaced via useContentMachine"
```

---

## Task 4: VideoPanel-komponent (TDD)

**Files:** Create `src/components/VideoPanel.tsx`, `src/components/VideoPanel.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/VideoPanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPanel } from './VideoPanel';

const baseVideo = { url: '', loading: false, error: null };

describe('VideoPanel', () => {
  it('deaktiverer generér uden prompt (selv med et genereret billede)', () => {
    render(<VideoPanel generatedImageUrl="http://img" video={baseVideo} onGenerate={() => {}} />);
    const btn = screen.getByText('Generér video').closest('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('kalder onGenerate med billede + prompt + default-params', () => {
    const onGenerate = vi.fn();
    render(<VideoPanel generatedImageUrl="http://img" video={baseVideo} onGenerate={onGenerate} />);
    fireEvent.change(screen.getByPlaceholderText('Beskriv bevægelsen / scenen…'), { target: { value: 'bølger ruller' } });
    fireEvent.click(screen.getByText('Generér video'));
    expect(onGenerate).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'http://img', prompt: 'bølger ruller', duration: '5' }));
  });

  it('er deaktiveret når der hverken er genereret billede eller URL', () => {
    render(<VideoPanel generatedImageUrl="" video={baseVideo} onGenerate={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Beskriv bevægelsen / scenen…'), { target: { value: 'noget' } });
    const btn = screen.getByText('Generér video').closest('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — `npm test -- VideoPanel` → FAIL (import unresolved).

- [ ] **Step 3: Implement** — `src/components/VideoPanel.tsx`:
```tsx
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

const SRC_BTN = 'flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-mono transition-all';

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

  const inputCls = 'w-full bg-slate-900 border border-slate-800 focus:border-brand-orange-500 focus:ring-1 focus:ring-brand-orange-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 transition-all font-sans';

  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
      <span className="block text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">Video</span>

      {/* Input-kilde */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-mono text-slate-400">Inputbillede</span>
        <div className="flex gap-1.5">
          <button type="button" aria-pressed={useGenerated} onClick={() => setUseGenerated(true)}
            className={`${SRC_BTN} ${useGenerated ? 'border-brand-orange-500/50 bg-brand-orange-600/10 text-brand-orange-300' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'}`}>
            Brug genereret billede
          </button>
          <button type="button" aria-pressed={!useGenerated} onClick={() => setUseGenerated(false)}
            className={`${SRC_BTN} ${!useGenerated ? 'border-brand-orange-500/50 bg-brand-orange-600/10 text-brand-orange-300' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'}`}>
            Indsæt URL
          </button>
        </div>
        {useGenerated && !generatedImageUrl && (
          <span className="block text-[11px] text-slate-500">Generér først et billede ovenfor, eller vælg “Indsæt URL”.</span>
        )}
        {!useGenerated && (
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://… billede-URL" className={inputCls} />
        )}
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Beskriv bevægelsen / scenen…" rows={2} className={`${inputCls} resize-y`} />
      <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Negativ prompt (default: blur, distort, low quality)" rows={1} className={`${inputCls} resize-y`} />

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-mono text-slate-400">Varighed</span>
        <div className="flex gap-1.5">
          {(['5', '10'] as const).map((d) => (
            <button key={d} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)}
              className={`py-1 px-3 rounded-lg border text-[11px] font-mono transition-all ${duration === d ? 'border-brand-orange-500/50 bg-brand-orange-600/10 text-brand-orange-300' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'}`}>
              {d}s
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>cfg_scale (prompt-styrke)</span><span className="text-brand-orange-300">{cfgScale.toFixed(2)}</span>
        </div>
        <input type="range" min={0} max={1} step={0.05} value={cfgScale} onChange={(e) => setCfgScale(parseFloat(e.target.value))} className="w-full accent-brand-orange-500" />
      </div>

      <input type="text" value={tailUrl} onChange={(e) => setTailUrl(e.target.value)} placeholder="Slut-frame URL (valgfri)" className={inputCls} />

      <button type="button" onClick={submit} disabled={!canGenerate}
        className={`w-full py-3 px-4 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${
          canGenerate ? 'bg-brand-orange-600 hover:bg-brand-orange-500 cursor-pointer active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}>
        {video.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
        <span>{video.loading ? 'Genererer video…' : 'Generér video'}</span>
      </button>

      {video.loading && (
        <span className="block text-[11px] text-slate-500 text-center">Kling kan tage et par minutter…</span>
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
          <a href={video.url} download="neura_video.mp4" className="text-[11px] text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1">
            <Download className="w-3 h-3" /><span>Download video</span>
          </a>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test** — `npm test -- VideoPanel` → PASS (3/3).
- [ ] **Step 5: Lint + full suite** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 6: Commit**
```bash
git add src/components/VideoPanel.tsx src/components/VideoPanel.test.tsx
git commit -m "feat: VideoPanel — Kling image-to-video med alle parametre"
```

---

## Task 5: Wire VideoPanel i App.tsx

**Files:** Modify `src/App.tsx`

- [ ] **Step 1: Import + destructure**
Add import near the other component imports:
```tsx
import { VideoPanel } from './components/VideoPanel';
```
Add `videoResult, handleGenerateVideo` to the `useContentMachine()` destructure (alongside `generatedImages, handleGenerateImage, …`).

- [ ] **Step 2: Render in the Assets cluster**
In the `{/* ASSET GENERATORS … */}` block, insert `<VideoPanel … />` between the `</ImagePanel>` closing and the `<LogoPanel …>`:
```tsx
              <VideoPanel
                generatedImageUrl={generatedImages.custom.url}
                video={videoResult}
                onGenerate={handleGenerateVideo}
              />
```

- [ ] **Step 3: WorkingOverlay**
Add `videoResult.loading` to the `WorkingOverlay` `show={…}` boolean, and a title branch near the others: `videoResult.loading ? 'Genererer video' :`.

- [ ] **Step 4: Verify** — `npm run lint && npm test` → clean; all pass.
- [ ] **Step 5: Commit**
```bash
git add src/App.tsx
git commit -m "feat: placér VideoPanel i Assets-klyngen under Billede"
```

---

## Task 6: Versionsbump 1.20.0 → 1.21.0

**Files:** `package.json`, `src/components/AppHeader.tsx`, `src/App.tsx`, `package-lock.json`

- [ ] **Step 1:** `grep -rn "1\.20\.0" package.json src/App.tsx src/components/AppHeader.tsx` → tre hits.
- [ ] **Step 2:** Ret de tre til `1.21.0` (package.json version, AppHeader `v1.21.0`, App.tsx footer `· v1.21.0`).
- [ ] **Step 3:** `npm install --package-lock-only` → bekræft `grep -m1 '"version"' package-lock.json` = `1.21.0`.
- [ ] **Step 4:** `grep -rn "1\.\(20\|21\)\.0" package.json src/App.tsx src/components/AppHeader.tsx` → alle `1.21.0`.
- [ ] **Step 5:** Commit:
```bash
git add package.json src/App.tsx src/components/AppHeader.tsx package-lock.json
git commit -m "chore: bump version til 1.21.0"
```

---

## Task 7: Verifikation (lint, test, manuelt)

**Files:** ingen ændringer.

- [ ] **Step 1:** `npm run lint && npm test` → begge grønne.
- [ ] **Step 2:** `npm run dev` (http://localhost:3000).
- [ ] **Step 3: Manuelt:**
  1. Generér et billede i Billede-panelet.
  2. I Video-panelet: "Brug genereret billede" er valgt; skriv en bevægelses-prompt → **Generér video** → afspilleren viser en mp4 (kan tage et par min); download virker.
  3. Test "Indsæt URL" med en billede-URL; test 10s + cfg-slider; test en slut-frame URL (valgfri).
  4. Bekræft at billede-/logo-/funnel-flows er upåvirkede.
- [ ] **Step 4:** `pkill -f "tsx server.ts"`.

---

## Self-Review (udført ved skrivning)

- **Spec coverage:** kling-adapter+test (T1), route (T2), hook+surface (T3), VideoPanel+test (T4), App-wiring+overlay (T5), version (T6), verifikation (T7). Alle spec-punkter dækket (alle params inkl. tail/slut-frame; kobling til `generatedImages.custom.url`; URL-override).
- **Type-konsistens:** `VideoRequest` (backend, kling.ts) og `VideoParams` (frontend, useVideoGeneration.ts) har samme felt-navne; `VideoState` defineret i hook (T3) og brugt i VideoPanel-props (T4) + App (T5). `handleGenerateVideo(params: VideoParams)` konsistent mellem hook (T3), VideoPanel `onGenerate` (T4) og App (T5).
- **Ingen placeholders:** al kode + kommandoer konkrete; kling output-sti verificeret.
- **YAGNI:** ingen upload (fast-follow), ingen video-prompt-AI, ingen text-to-video.
- **Afhængigheder:** T2 afhænger af T1; T4 af T3; T5 af T3+T4. Fase-orden lineær.
