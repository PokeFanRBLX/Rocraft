import React, { useState } from 'react';
import { X, Box, Wrench, Flame, CheckCircle2 } from 'lucide-react';
import { BlockId, ToolId, HotbarSlot } from '../types';
import { BLOCK_DEFINITIONS, TOOL_DEFINITIONS } from '../engine/blocks';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignToSlot: (slotIndex: number, item: HotbarSlot) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onAssignToSlot
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(7); // Default slot 8 or 9
  const [category, setCategory] = useState<'all' | 'tools' | 'minecraft' | 'roblox'>('all');

  if (!isOpen) return null;

  const toolList = Object.values(TOOL_DEFINITIONS);
  const blockList = Object.values(BLOCK_DEFINITIONS);

  const filteredBlocks = blockList.filter((b) => {
    if (category === 'tools') return false;
    if (category === 'minecraft') return b.category === 'minecraft';
    if (category === 'roblox') return b.category === 'roblox';
    return true;
  });

  const showTools = category === 'all' || category === 'tools';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Fredoka']">
              Item & Voxel Catalog
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotbar Slot Destination Picker */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-300">
            Click an item below to equip into Hotbar Slot:
          </span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSlotIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedSlotIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 px-5 pt-3 pb-1 border-b border-slate-800/80">
          {(['all', 'tools', 'roblox', 'minecraft'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                category === cat
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all'
                ? 'All Items'
                : cat === 'tools'
                ? 'Gadgets & Tools'
                : cat === 'roblox'
                ? 'Roblox Obby Blocks'
                : 'Minecraft Voxels'}
            </button>
          ))}
        </div>

        {/* Grid Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Tools Section */}
          {showTools && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Gadgets & Weapons ({toolList.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {toolList.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onAssignToSlot(selectedSlotIndex, { type: 'tool', id: tool.id });
                      onClose();
                    }}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400/50 transition cursor-pointer text-left group shadow-sm"
                  >
                    <span className="text-2xl drop-shadow group-hover:scale-110 transition">
                      {tool.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                        {tool.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {tool.origin}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blocks Section */}
          {filteredBlocks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voxel Blocks ({filteredBlocks.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => {
                      onAssignToSlot(selectedSlotIndex, { type: 'block', id: block.id });
                      onClose();
                    }}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-400/50 transition cursor-pointer text-left group shadow-sm"
                  >
                    <div
                      className="w-8 h-8 rounded-lg shadow border border-black/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition"
                      style={{ backgroundColor: block.color }}
                    >
                      {block.isHazard && <Flame className="w-4 h-4 text-yellow-300" />}
                      {block.isCheckpoint && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {block.isBouncy && <span className="text-xs">🌀</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                        {block.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {block.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
