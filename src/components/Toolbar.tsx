/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction, FormEvent } from 'react';
import { Sliders } from 'lucide-react';
import { BrandSurfaceOutput } from '../types';

interface ToolbarProps {
  output: BrandSurfaceOutput | null;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setErrorMsg: Dispatch<SetStateAction<string | null>>;
  terminalCommand: string;
  setTerminalCommand: Dispatch<SetStateAction<string>>;
  handleExecuteTerminalCommand: (e: FormEvent) => void;
}

export function Toolbar({
  output, activeTab, setActiveTab, setErrorMsg,
  terminalCommand, setTerminalCommand, handleExecuteTerminalCommand,
}: ToolbarProps) {
  return (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
              <span className="flex items-center space-x-2 font-medium text-slate-300">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Værktøjslinje</span>
              </span>
              <span className="text-[11px] text-slate-500">Navigér & forfin</span>
            </div>
            
            <form onSubmit={handleExecuteTerminalCommand} className="flex items-center p-2 bg-slate-900">
              <input
                type="text"
                id="terminal_input"
                value={terminalCommand}
                onChange={(e) => setTerminalCommand(e.target.value)}
                placeholder="Skriv kommando (f.eks. /case, /shorten, /more-human) eller brug knapperne herunder…"
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-mono text-white placeholder:text-slate-600 px-3 py-1.5"
              />
              <button
                type="submit"
                className="mr-1 p-1 px-3 text-[11px] font-mono bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors"
              >
                Kør
              </button>
            </form>

            {/* Quick buttons bar */}
            <div className="bg-slate-950 border-t border-slate-800 px-3 py-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-500 mr-1">Gå til:</span>
              {[
                { label: "/case", tab: "case" },
                { label: "/linkedin", tab: "linkedin" },
                { label: "/newsletter", tab: "newsletter" },
                { label: "/headlines", tab: "headlines" },
                { label: "/keywords", tab: "keywords" },
                { label: "/prompts", tab: "prompts" },
                { label: "/english", tab: "english" },
                { label: "/cvi", tab: "cvi" },
                { label: "/production", tab: "production" }
              ].map(c => (
                <button
                  key={c.label}
                  type="button"
                  id={`cmd_btn_${c.tab}`}
                  onClick={() => {
                    if (output) setActiveTab(c.tab);
                    else setErrorMsg("Kør venligst maskinen først for at navigere.");
                  }}
                  className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-all ${
                    activeTab === c.tab && output
                      ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
  );
}
