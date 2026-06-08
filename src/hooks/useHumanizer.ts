/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Dispatch, SetStateAction } from 'react';
import { HumanizerResult } from '../types';
import { httpErrorMessage } from './httpError';

interface HumanizerDeps {
  setErrorMsg: Dispatch<SetStateAction<string | null>>;
}

/**
 * AI-humanizer / detektions-bypass: tager en ekstern tekst og omskriver den til
 * en mere menneskelig version via /api/humanize. Selvstændigt domæne.
 */
export function useHumanizer({ setErrorMsg }: HumanizerDeps) {
  const [externalText, setExternalText] = useState<string>('');
  const [humanizerResult, setHumanizerResult] = useState<HumanizerResult | null>(null);
  const [isHumanizing, setIsHumanizing] = useState<boolean>(false);

  const handleHumanizeText = async () => {
    if (!externalText || !externalText.trim()) {
      setErrorMsg("Indtast eller indsæt venligst en tekst først.");
      return;
    }
    setIsHumanizing(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: externalText })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(httpErrorMessage(response.status, errData.error));
      }
      const resData = await response.json();
      setHumanizerResult(resData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Kunne ikke gennemføre humanisering og AI-detektions bypass.');
    } finally {
      setIsHumanizing(false);
    }
  };

  return {
    externalText, setExternalText,
    humanizerResult, setHumanizerResult,
    isHumanizing, handleHumanizeText,
  };
}
