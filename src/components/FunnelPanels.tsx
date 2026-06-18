/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentProps, Dispatch, SetStateAction } from 'react';
import { Archive } from 'lucide-react';
import {
  CulturalScanResult,
  StrategyFoundation,
  CampaignPlatform,
  CampaignTerritory,
  IdeaDeliberationResult,
  ChannelMatrix,
  EffectivenessFramework,
  BrainstormResult,
  VisualDevResult,
  ProjectBrief,
} from '../types';
import { CulturalAntennaPanel } from './CulturalAntennaPanel';
import { StrategyPanel } from './StrategyPanel';
import { CampaignPanel } from './CampaignPanel';
import { IdeaPressureTestPanel } from './IdeaPressureTestPanel';
import { ChannelMatrixPanel } from './ChannelMatrixPanel';
import { EffectivenessPanel } from './EffectivenessPanel';
import { BrainstormPanel } from './BrainstormPanel';
import { VisualDevPanel } from './VisualDevPanel';
import {
  type FunnelDoc,
  culturalToDoc, strategyToDoc, bigIdeaToDoc, pressureTestToDoc,
  channelMatrixToDoc, effectivenessToDoc, brainstormToDoc, visualToDoc,
} from '../lib/funnelDoc';

/**
 * Den kreative funnel: kæden af betingede resultat-paneler i højre kolonne
 * (kulturel antenne → strategi → Den Store Idé → ECD pres-test → omni-channel
 * → effekt-lag → brainstorm → visuel udvikling). Hvert panel renderes kun når
 * dets state findes. Udtrukket fra App.tsx for læsbarhed — ren forwarding.
 */
interface FunnelPanelsProps {
  // Pres-test/copy fælles
  copiedKey: ComponentProps<typeof CampaignPanel>['copiedKey'];
  onCopy: ComponentProps<typeof CampaignPanel>['onCopy'];

  // Forstør & arkivér — åbner et panel i FocusModal
  onExpandFunnel: (doc: FunnelDoc) => void;
  // Arkivér hele forløbet som ét dokument
  funnelDocCount: number;
  onArchiveAllFunnel: () => void;

  // Kulturel antenne
  culturalIntel: CulturalScanResult | null;
  onClearCulturalIntel: () => void;

  // Strategi
  strategy: StrategyFoundation | null;
  onClearStrategy: () => void;
  isGeneratingStrategy: boolean;
  onGenerateStrategy: () => void;

  // Den Store Idé
  campaignPlatform: CampaignPlatform | null;
  setCampaignPlatform: Dispatch<SetStateAction<CampaignPlatform | null>>;
  selectedTerritory: CampaignTerritory | null;
  onSelectTerritory: ComponentProps<typeof CampaignPanel>['onSelectTerritory'];
  onClearTerritory: () => void;
  onExportDeck: () => void;
  isGeneratingCampaign: boolean;
  onGenerateBigIdea: () => void;

  // ECD pres-test
  pressureTest: { original: CampaignTerritory; result: IdeaDeliberationResult } | null;
  onPressureTest: ComponentProps<typeof CampaignPanel>['onPressureTest'];
  isSharpening: boolean;
  sharpeningTarget: string | null;
  onAdoptSharpened: ComponentProps<typeof IdeaPressureTestPanel>['onAdopt'];
  onClearPressureTest: () => void;

  // Omni-channel matrix
  channelMatrix: ChannelMatrix | null;
  isGeneratingMatrix: boolean;
  onGenerateChannelMatrix: () => void;
  onClearChannelMatrix: () => void;

  // Effekt-lag
  effectiveness: EffectivenessFramework | null;
  isGeneratingEffectiveness: boolean;
  onGenerateEffectiveness: () => void;
  onClearEffectiveness: () => void;

  // Brainstorm
  brainstormResult: BrainstormResult | null;
  setBrainstormResult: Dispatch<SetStateAction<BrainstormResult | null>>;
  brief: ProjectBrief;
  setBrief: Dispatch<SetStateAction<ProjectBrief>>;

  // Visuel udvikling
  visualResult: VisualDevResult | null;
  setVisualResult: Dispatch<SetStateAction<VisualDevResult | null>>;
  generatedImages: ComponentProps<typeof VisualDevPanel>['images'];
  onAspectChange: ComponentProps<typeof VisualDevPanel>['onAspectChange'];
  onGenerateImage: ComponentProps<typeof VisualDevPanel>['onGenerateImage'];
}

export function FunnelPanels({
  copiedKey, onCopy,
  onExpandFunnel,
  funnelDocCount, onArchiveAllFunnel,
  culturalIntel, onClearCulturalIntel,
  strategy, onClearStrategy, isGeneratingStrategy, onGenerateStrategy,
  campaignPlatform, setCampaignPlatform, selectedTerritory, onSelectTerritory,
  onClearTerritory, onExportDeck, isGeneratingCampaign, onGenerateBigIdea,
  pressureTest, onPressureTest, isSharpening, sharpeningTarget,
  onAdoptSharpened, onClearPressureTest,
  channelMatrix, isGeneratingMatrix, onGenerateChannelMatrix, onClearChannelMatrix,
  effectiveness, isGeneratingEffectiveness, onGenerateEffectiveness, onClearEffectiveness,
  brainstormResult, setBrainstormResult, brief, setBrief,
  visualResult, setVisualResult, generatedImages, onAspectChange, onGenerateImage,
}: FunnelPanelsProps) {
  return (
    <>
      {/* ARKIVÉR HELE FORLØBET */}
      {funnelDocCount >= 2 && (
        <div className="flex justify-end">
          <button
            onClick={onArchiveAllFunnel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer active:scale-95"
            title="Saml alle genererede paneler i ét dokument og arkivér"
          >
            <Archive className="w-3.5 h-3.5 text-brand-orange-400" />
            <span>Arkivér hele forløbet · {funnelDocCount}</span>
          </button>
        </div>
      )}

      {/* CULTURAL ANTENNA PANEL */}
      {culturalIntel && (
        <CulturalAntennaPanel
          intel={culturalIntel}
          onClose={onClearCulturalIntel}
          onExpand={() => onExpandFunnel(culturalToDoc(culturalIntel))}
          onGenerateStrategy={onGenerateStrategy}
          isGeneratingStrategy={isGeneratingStrategy}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* STRATEGY FOUNDATION PANEL (Strategi-fundament) */}
      {strategy && (
        <StrategyPanel
          strategy={strategy}
          onClose={onClearStrategy}
          onExpand={() => onExpandFunnel(strategyToDoc(strategy))}
          onGenerateBigIdea={onGenerateBigIdea}
          isGeneratingCampaign={isGeneratingCampaign}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* CAMPAIGN PLATFORM PANEL (Den Store Idé) */}
      {campaignPlatform && (
        <CampaignPanel
          platform={campaignPlatform}
          selectedTerritory={selectedTerritory}
          onSelectTerritory={onSelectTerritory}
          onClearTerritory={onClearTerritory}
          onExpand={() => onExpandFunnel(bigIdeaToDoc(campaignPlatform))}
          onExportDeck={onExportDeck}
          onPressureTest={onPressureTest}
          isSharpening={isSharpening}
          sharpeningTarget={sharpeningTarget}
          onClose={() => setCampaignPlatform(null)}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* ECD PRESSURE-TEST PANEL */}
      {pressureTest && (
        <IdeaPressureTestPanel
          original={pressureTest.original}
          result={pressureTest.result}
          onAdopt={onAdoptSharpened}
          onClose={onClearPressureTest}
          onExpand={() => onExpandFunnel(pressureTestToDoc(pressureTest.original, pressureTest.result))}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* OMNI-CHANNEL MATRIX PANEL */}
      {channelMatrix && (
        <ChannelMatrixPanel
          matrix={channelMatrix}
          onClose={onClearChannelMatrix}
          onExpand={() => onExpandFunnel(channelMatrixToDoc(channelMatrix))}
          onRegenerate={onGenerateChannelMatrix}
          isGenerating={isGeneratingMatrix}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* EFFECTIVENESS PANEL (Effekt-lag) */}
      {effectiveness && (
        <EffectivenessPanel
          framework={effectiveness}
          onClose={onClearEffectiveness}
          onExpand={() => onExpandFunnel(effectivenessToDoc(effectiveness))}
          onRegenerate={onGenerateEffectiveness}
          isGenerating={isGeneratingEffectiveness}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* BRAINSTORM RESULT PANEL */}
      {brainstormResult && (
        <BrainstormPanel
          result={brainstormResult}
          onClose={() => setBrainstormResult(null)}
          onExpand={() => onExpandFunnel(brainstormToDoc(brainstormResult))}
          onAddNote={(text) => {
            const sep = brief.notes.trim() ? '\n\n' : '';
            setBrief(prev => ({ ...prev, notes: prev.notes.trim() + sep + text }));
          }}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      )}

      {/* VISUAL DEVELOPMENT RESULT (visuel redaktion) */}
      {visualResult && (
        <VisualDevPanel
          result={visualResult}
          images={generatedImages}
          copiedKey={copiedKey}
          clientName={brief.client}
          onCopyPrompt={onCopy}
          onAspectChange={onAspectChange}
          onGenerateImage={onGenerateImage}
          onClose={() => setVisualResult(null)}
          onExpand={() => onExpandFunnel(visualToDoc(visualResult))}
        />
      )}
    </>
  );
}
