import React from 'react';
import { X, Keyboard, Mouse, HelpCircle, Gamepad2, Sparkles } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Fredoka']">
              Rocraft Controls & Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Movement */}
          <div>
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Movement & Navigation</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div><strong className="text-amber-300 font-mono">W / A / S / D</strong> or Arrows</div>
              <div className="text-slate-400">Walk & Strafe</div>
              <div><strong className="text-amber-300 font-mono">Space</strong></div>
              <div className="text-slate-400">Jump</div>
              <div><strong className="text-amber-300 font-mono">V</strong> or <strong className="text-amber-300 font-mono">F5</strong></div>
              <div className="text-slate-400">Toggle 1st / 3rd Person</div>
              <div><strong className="text-amber-300 font-mono">R</strong></div>
              <div className="text-slate-400">Reset Character (OOF!)</div>
            </div>
          </div>

          {/* Mouse & Building */}
          <div>
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Mouse className="w-4 h-4 text-sky-400" />
              <span>Mining & Interacting</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div><strong className="text-sky-300 font-mono">Left Click</strong></div>
              <div className="text-slate-400">Mine Voxel / Sword Slash / Rocket</div>
              <div><strong className="text-sky-300 font-mono">Right Click</strong></div>
              <div className="text-slate-400">Place Voxel / Secondary Action</div>
              <div><strong className="text-sky-300 font-mono">Scroll Wheel</strong></div>
              <div className="text-slate-400">Zoom Camera in 3rd Person</div>
              <div><strong className="text-sky-300 font-mono">1 - 9</strong></div>
              <div className="text-slate-400">Select Hotbar Slot</div>
              <div><strong className="text-sky-300 font-mono">B</strong></div>
              <div className="text-slate-400">Open Boombox & Soundtrack Player</div>
              <div><strong className="text-sky-300 font-mono">E</strong></div>
              <div className="text-slate-400">Open Full Block/Gear Catalog</div>
            </div>
          </div>

          {/* Mechanics */}
          <div>
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Special Roblox Gadgets</span>
            </h3>
            <ul className="space-y-1.5 text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <li>📻 <strong className="text-amber-300">Golden Boombox:</strong> Hold to blast Chill Lofi Boom Bap or custom audio files!</li>
              <li>🌀 <strong className="text-sky-300">Gravity Coil:</strong> Hold to drop gravity by 60% and jump super high.</li>
              <li>⚡ <strong className="text-rose-300">Speed Coil:</strong> Hold to sprint 2.2x faster with particle trails.</li>
              <li>🚀 <strong className="text-emerald-300">Rocket Launcher:</strong> Fire explosive missiles that blow up voxels.</li>
              <li>🔴 <strong className="text-red-400">Killbrick:</strong> Watch out! Glowing red blocks cause instant OOF.</li>
              <li>🟦 <strong className="text-cyan-300">Trampolines:</strong> Step on them to super bounce into the sky!</li>
            </ul>
          </div>

          {/* Owner Rank Privileges */}
          <div>
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span className="text-amber-400">👑</span>
              <span className="rainbow-text">Owner Rank & Privileges</span>
            </h3>
            <div className="text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-pink-500/30 space-y-1.5">
              <p>
                If your player name starts with <strong className="text-amber-300 font-mono">PokeFan_</strong>, you are automatically recognized as the <strong className="rainbow-text">OWNER</strong> with rainbow animated overhead nametags!
              </p>
              <div className="flex items-center gap-2 pt-1 text-slate-300">
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold">#</kbd>
                <span>Toggle the Owner Control Panel GUI (God Mode, Flight, Noclip, Teleports, TNT & Broadcast)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
