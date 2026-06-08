/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

/**
 * Kopiér-til-udklipsholder med en kortvarig "kopieret"-markør (copiedKey),
 * der bruges til at vise feedback på den knap der blev klikket.
 */
export function useClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(err => {
      console.warn("Kopiering mislykkedes, fallback:", err);
    });
  };

  return { copiedKey, handleCopyToClipboard };
}
