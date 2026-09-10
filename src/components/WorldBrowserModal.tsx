import React, { useState } from 'react';
import { X, Compass, Download, Upload, RefreshCw, Check, Sparkles, Shield, Trees, Box } from 'lucide-react';
import { WorldPreset } from '../types';

interface WorldBrowserModalProps {
  isOpen: boolean;
  currentPreset: WorldPreset;
  onClose: () => void;
  onSelectPreset: (preset: WorldPreset) => void;
  onExportWorld: () => string;
  onImportWorld: (json: string) => void;
  onResetWorld: () => void;
}

const PRESETS: {
  id: WorldPreset;
  name: string;
  tag: 'Roblox Classic' | 'Minecraft Classic' | 'PvP Arena' | 'Sandbox';
  desc: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    id: 'obby',
    name: 'Mega Rocraft Obby',
    tag: 'Roblox Classic',
    desc: 'Multi-stage obstacle course with stage checkpoints, red killbrick hazards, bounce trampolines, fading crumble blocks, and the golden summit star.',
    icon: <Sparkles className="w-6 h-6 text-amber-400" />,
    accent: 'border-amber-500/40 bg-amber-500/10 hover:border-amber-400'
  },
  {
    id: 'survival',
    name: 'Voxel Wilderness',
    tag: 'Minecraft Classic',
    desc: 'Rolling green terrain with oak forests, diamond ore veins, gold caches, stone caves, and a cozy wood & brick starter cabin.',
    icon: <Trees className="w-6 h-6 text-emerald-400" />,
    accent: 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400'
  },
  {
    id: 'arena',
    name: 'Castle Battle Arena',
    tag: 'PvP Arena',
    desc: 'Medieval stone fortress battleground with battlements, rocket towers, TNT explosive caches, and active target dummies to duel.',
    icon: <Shield className="w-6 h-6 text-rose-400" />,
    accent: 'border-rose-500/40 bg-rose-500/10 hover:border-rose-400'
  },
  {
    id: 'flat',
    name: 'Creative Studio Canvas',
    tag: 'Sandbox',
    desc: 'Clean flat voxel building plane with classic Roblox stud pattern. Perfect for building your own obbies, houses, or redstone contraptions.',
    icon: <Box className="w-6 h-6 text-sky-400" />,
    accent: 'border-sky-500/40 bg-sky-500/10 hover:border-sky-400'
  }
];

export const WorldBrowserModal: React.FC<WorldBrowserModalProps> = ({
  isOpen,
  currentPreset,
  onClose,
  onSelectPreset,
  onExportWorld,
  onImportWorld,
  onResetWorld
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const json = onExportWorld();
    navigator.clipboard.writeText(json).catch(() => {});
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2500);

    // Also download JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rocraft-world-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    onImportWorld(importJsonText);
    setImportJsonText('');
    setShowImportBox(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Fredoka']">
              Experiences & Worlds
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-slate-400 mb-3">
            Choose an experience or create your own custom world. Your voxel modifications are saved live.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {PRESETS.map((p) => {
              const isSelected = currentPreset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPreset(p.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                    isSelected ? 'ring-2 ring-amber-400 bg-slate-800/90' : p.accent
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 shadow">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-100 font-['Fredoka']">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Import text box toggle */}
          {showImportBox && (
            <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Paste World JSON Data:
              </label>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"version": 1, "blocks": {...}}'
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportBox(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                >
                  Load World
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              id="world-export-btn"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
              title="Download world file and copy JSON to clipboard"
            >
              {exportCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{exportCopied ? 'Exported!' : 'Export World'}</span>
            </button>

            <button
              id="world-import-btn"
              onClick={() => setShowImportBox(!showImportBox)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          <button
            onClick={() => {
              onResetWorld();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
