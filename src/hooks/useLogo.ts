/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Dispatch, SetStateAction } from 'react';
import { ProjectBrief, LogoResult } from '../types';
import { httpErrorMessage } from './httpError';

interface LogoDeps {
  brief: ProjectBrief;
  setErrorMsg: Dispatch<SetStateAction<string | null>>;
}

/**
 * Logo-generator: Recraft text-to-vector via /api/generate-logo, plus
 * prompt-optimering (oversæt/forfin) via /api/logo-prompt. logoResult eksponeres
 * så pitch-deck-eksporten kan indlejre logoet.
 */
export function useLogo({ brief, setErrorMsg }: LogoDeps) {
  const [logoResult, setLogoResult] = useState<LogoResult | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState<boolean>(false);
  const [isOptimizingLogoPrompt, setIsOptimizingLogoPrompt] = useState<boolean>(false);

  const handleGenerateLogo = async (
    prompt: string,
    style: string,
    colors: Array<{ r: number; g: number; b: number }>,
  ) => {
    if (!prompt.trim()) {
      setErrorMsg("Indtast en logo-beskrivelse for at generere logo.");
      return;
    }
    setIsGeneratingLogo(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style: style || undefined, colors })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(httpErrorMessage(response.status, errData.error));
      }
      const data = await response.json();
      if (!data.imageUrl) throw new Error('Forkert svar-format fra logo-API.');
      setLogoResult({ imageUrl: data.imageUrl, contentType: data.contentType, svg: data.svg, prompt, style });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Kunne ikke generere logo.');
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleOptimizeLogoPrompt = async (
    currentPrompt: string,
    mode: 'translate' | 'refine',
  ): Promise<string | null> => {
    if (mode === 'refine' && !currentPrompt.trim()) {
      setErrorMsg("Skriv en prompt først, før den kan forfines.");
      return null;
    }
    setIsOptimizingLogoPrompt(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/logo-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, currentPrompt, mode })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(httpErrorMessage(response.status, errData.error));
      }
      const data = await response.json();
      return (data.prompt as string) || null;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Kunne ikke optimere logo-prompten.');
      return null;
    } finally {
      setIsOptimizingLogoPrompt(false);
    }
  };

  return {
    logoResult, setLogoResult,
    isGeneratingLogo, handleGenerateLogo,
    isOptimizingLogoPrompt, handleOptimizeLogoPrompt,
  };
}
