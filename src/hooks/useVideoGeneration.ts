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
