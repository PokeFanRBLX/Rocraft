import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, RotateCcw, Compass, ArrowRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  stage: number;
  deaths: number;
  onClose: () => void;
  onPlayAgain: () => void;
  onOpenWorlds: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  stage,
  deaths,
  onClose,
  onPlayAgain,
  onOpenWorlds
}) => {
  useEffect(() => {
    if (isOpen) {
      soundEngine.playVictory();

      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const interval = setInterval(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 700);

      const timer = setTimeout(() => {
        clearInterval(interval);
      }, 3500);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400/80 rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.35)] overflow-hidden text-center p-6 flex flex-col items-center">
        {/* Glowing Trophy Graphic */}
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl scale-150 animate-pulse" />
          <div className="relative w-20 h-20 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Trophy className="w-11 h-11 text-amber-300 drop-shadow" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-amber-400 font-['Fredoka'] tracking-tight">
          OBBY COMPLETED!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
          You conquered the summit and touched the Golden Trophy Star!
        </p>

        {/* Stats Card */}
        <div className="w-full grid grid-cols-2 gap-3 my-5 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stages Cleared
            </span>
            <span className="text-xl font-black text-emerald-400 mt-0.5">
              {stage} / {stage}
            </span>
          </div>

          <div className="flex flex-col items-center border-l border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total OOFs
            </span>
            <span className="text-xl font-black text-rose-400 mt-0.5">
              {deaths}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={() => {
              onClose();
              onPlayAgain();
            }}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again from Start</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenWorlds();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Explore Other Worlds</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Continue Freeform Exploring
          </button>
        </div>
      </div>
    </div>
  );
};
