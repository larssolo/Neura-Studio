/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import type { ProjectBrief } from '../types';
import {
  type FunnelDoc,
  funnelDocToPlainText,
  funnelDocCacheKey,
} from '../lib/funnelDoc';
import { downloadFunnelDoc, printFunnelDoc, type ArchiveFormat } from '../lib/funnelExport';
import { httpErrorMessage } from './httpError';

interface FunnelArchiveDeps {
  brief: ProjectBrief;
  setErrorMsg: Dispatch<SetStateAction<string | null>>;
}

/**
 * Forstør/arkivér/resumér et funnel-panel. Holder hvilket dokument der er åbent
 * i fuldskærm, et resumé-cache pr. panel (så genåbning ikke regenererer), og
 * eksport-handlere drevet af den fælles FunnelDoc-model.
 */
export function useFunnelArchive({ brief, setErrorMsg }: FunnelArchiveDeps) {
  const [expandedDoc, setExpandedDoc] = useState<FunnelDoc | null>(null);
  const [summaryByKey, setSummaryByKey] = useState<Record<string, string[]>>({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  const openDoc = useCallback((doc: FunnelDoc) => setExpandedDoc(doc), []);
  const closeDoc = useCallback(() => setExpandedDoc(null), []);

  const handleGenerateSummary = useCallback(
    async (doc: FunnelDoc) => {
      const key = funnelDocCacheKey(doc);
      if (summaryByKey[key]) return; // allerede genereret
      setIsGeneratingSummary(true);
      setErrorMsg(null);
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: doc.title, content: funnelDocToPlainText(doc) }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(httpErrorMessage(response.status, errData.error));
        }
        const data = await response.json();
        setSummaryByKey((prev) => ({ ...prev, [key]: data.summary || [] }));
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Kunne ikke lave resumé.');
      } finally {
        setIsGeneratingSummary(false);
      }
    },
    [summaryByKey, setErrorMsg],
  );

  const handleArchive = useCallback(
    async (doc: FunnelDoc, format: ArchiveFormat) => {
      try {
        if (format === 'print') {
          printFunnelDoc(doc, brief);
        } else {
          await downloadFunnelDoc(doc, brief, format);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Kunne ikke arkivere dokumentet.');
      }
    },
    [brief, setErrorMsg],
  );

  const summaryFor = useCallback(
    (doc: FunnelDoc | null): string[] | undefined =>
      doc ? summaryByKey[funnelDocCacheKey(doc)] : undefined,
    [summaryByKey],
  );

  return {
    expandedDoc,
    openDoc,
    closeDoc,
    summaryFor,
    isGeneratingSummary,
    handleGenerateSummary,
    handleArchive,
  };
}
