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
