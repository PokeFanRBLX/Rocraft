import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Gift,
  Coins,
  Check,
  Lock,
  Clock,
  ChevronRight,
  RotateCcw,
  FastForward,
  Shirt,
  Info
} from 'lucide-react';
import {
  DAILY_REWARD_TIERS,
  EXCLUSIVE_HATS_INFO,
  loadDailyRewardState,
  claimDailyReward,
  simulateAdvanceDay,
  resetStreakDebug,
  getTodayDateString
} from '../utils/dailyRewardStorage';
import { DailyRewardState, DailyRewardTier, HatType } from '../types';
import { soundEngine } from '../utils/audio';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipHat: (hat: HatType) => void;
  onCoinsChanged: (newBalance: number) => void;
  onTixChanged?: (newTixBalance: number) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  onEquipHat,
  onCoinsChanged,
  onTixChanged
}) => {
  const [state, setState] = useState<DailyRewardState>(loadDailyRewardState());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [claimCelebration, setClaimCelebration] = useState<{
    reward: DailyRewardTier;
    unlockedHat?: HatType;
  } | null>(null);
  const [testNotice, setTestNotice] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      const fresh = loadDailyRewardState();
      setState(fresh);
      // Select the current streak day by default
      setSelectedDayIndex(Math.max(0, Math.min(6, fresh.currentStreak - 1)));
      setClaimCelebration(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const today = getTodayDateString();
  const isTodayClaimed =
    state.lastClaimDate === today || state.claimedCycleDays.includes(state.currentStreak);
  const canClaimToday = !isTodayClaimed;

  const activeReward = DAILY_REWARD_TIERS[selectedDayIndex] || DAILY_REWARD_TIERS[0];
  const isCurrentStreakDay = selectedDayIndex + 1 === state.currentStreak;
  const isDayClaimed = state.claimedCycleDays.includes(selectedDayIndex + 1);
  const isDayLocked = selectedDayIndex + 1 > state.currentStreak;

  const handleClaim = () => {
    if (!canClaimToday) return;

    const result = claimDailyReward();
    if (result.success && result.reward) {
      setState(result.updatedState);
      onCoinsChanged(result.updatedState.coins);
      if (onTixChanged) {
        onTixChanged(result.updatedState.tix);
      }
      soundEngine.playDailyClaim();

      setClaimCelebration({
        reward: result.reward,
        unlockedHat: result.unlockedHat
      });
    }
  };

  const handleSimulateNextDay = () => {
    const updated = simulateAdvanceDay();
    setState(updated);
    setSelectedDayIndex(Math.max(0, Math.min(6, updated.currentStreak - 1)));
    setClaimCelebration(null);
    soundEngine.playCollectCoin();
    setTestNotice(`⏩ Fast-forwarded 1 day! You are now on Day ${updated.currentStreak}.`);
    setTimeout(() => setTestNotice(null), 3500);
  };

  const handleResetStreak = () => {
    const updated = resetStreakDebug();
    setState(updated);
    setSelectedDayIndex(0);
    setClaimCelebration(null);
    soundEngine.playOof();
    setTestNotice('🔄 Reset streak back to Day 1.');
    setTimeout(() => setTestNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 font-['Fredoka'] tracking-wide">
                  Daily Login Rewards
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cycle #{state.streakCycle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log in every consecutive day to earn TIX & Blox Coins and unlock exclusive mythic hats!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* TIX (Tickets) balance */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-500/15 border border-rose-500/40 rounded-xl shadow-sm">
              <span className="text-base">🎟️</span>
              <span className="text-xs sm:text-sm font-black text-rose-300 font-mono">
                {(state.tix || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-300 uppercase font-extrabold tracking-wider hidden sm:inline">
                TIX
              </span>
            </div>

            {/* Coins balance */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-base">🪙</span>
              <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                {state.coins.toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-400/80 uppercase font-bold hidden sm:inline">
                Coins
              </span>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close Daily Rewards (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= STREAK BANNER ================= */}
        <div className="px-5 py-3 bg-gradient-to-r from-orange-950/60 via-amber-950/40 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 text-xs font-black">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
              <span>{state.currentStreak}-DAY STREAK</span>
            </div>
            <span className="text-xs text-slate-300 font-medium">
              {canClaimToday
                ? '🔥 Your daily gift is waiting to be claimed today!'
                : '✨ Today’s gift claimed! Return tomorrow to keep your streak burning.'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {canClaimToday ? (
                <strong className="text-emerald-400">READY NOW</strong>
              ) : (
                'Resets at Midnight (or fast-forward below)'
              )}
            </span>
          </div>
        </div>

        {/* Test Notice if any */}
        {testNotice && (
          <div className="mx-5 mt-3 px-3 py-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testNotice}</span>
          </div>
        )}

        {/* ================= CLAIM CELEBRATION MODAL OVERLAY ================= */}
        {claimCelebration && (
          <div className="m-4 p-5 rounded-2xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner">
                  {claimCelebration.unlockedHat
                    ? EXCLUSIVE_HATS_INFO[claimCelebration.unlockedHat]?.icon || '👑'
                    : '🪙'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                      REWARD CLAIMED!
                    </span>
                    <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                      <span>🪙</span>
                      <span>+{claimCelebration.reward.coins.toLocaleString()} Coins</span>
                    </span>
                    <span className="text-xs text-rose-300 font-bold flex items-center gap-1 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-500/30">
                      <span>🎟️</span>
                      <span>+{claimCelebration.reward.tix || 15} TIX</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {claimCelebration.reward.title}
                  </h3>
                  {claimCelebration.unlockedHat && (
                    <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                      🎉 Unlocked Exclusive Item:{' '}
                      <strong>
                        {EXCLUSIVE_HATS_INFO[claimCelebration.unlockedHat]?.name ||
                          claimCelebration.reward.hatName}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {claimCelebration.unlockedHat && (
                  <button
                    onClick={() => {
                      if (claimCelebration.unlockedHat) {
                        onEquipHat(claimCelebration.unlockedHat);
                        soundEngine.playCollectCoin();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Equip Hat Now</span>
                  </button>
                )}
                <button
                  onClick={() => setClaimCelebration(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Awesome!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 7-DAY REWARD CARDS TRACK ================= */}
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {DAILY_REWARD_TIERS.map((tier, idx) => {
              const dayNum = tier.day;
              const isSelected = selectedDayIndex === idx;
              const isClaimed = state.claimedCycleDays.includes(dayNum);
              const isToday = state.currentStreak === dayNum;
              const isLocked = dayNum > state.currentStreak;
              const hasHat = Boolean(tier.hatReward);

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`relative flex flex-col items-center p-3 rounded-2xl border text-center transition-all cursor-pointer select-none ${
                    dayNum === 7
                      ? isSelected
                        ? 'bg-gradient-to-b from-amber-500/25 to-slate-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105 z-10'
                        : 'bg-gradient-to-b from-amber-950/30 to-slate-950 border-amber-500/40 hover:border-amber-400'
                      : isSelected
                      ? 'bg-slate-800 border-amber-400 shadow-lg scale-105 z-10'
                      : isClaimed
                      ? 'bg-slate-950/60 border-emerald-600/30 opacity-70 hover:opacity-100 hover:bg-slate-900'
                      : isToday && canClaimToday
                      ? 'bg-amber-950/40 border-amber-500/70 hover:border-amber-400 ring-2 ring-amber-500/30 animate-pulse'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Day Badge */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isToday
                          ? 'bg-amber-500/30 text-amber-300 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Day {dayNum}
                    </span>

                    {/* Rarity */}
                    <span
                      className={`text-[9px] font-bold ${
                        tier.badge === 'Mythic'
                          ? 'text-amber-400'
                          : tier.badge === 'Legendary'
                          ? 'text-purple-400'
                          : tier.badge === 'Epic'
                          ? 'text-pink-400'
                          : tier.badge === 'Rare'
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="my-2 relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
                    {hasHat && tier.hatReward ? (
                      <span className="text-2xl drop-shadow">
                        {EXCLUSIVE_HATS_INFO[tier.hatReward]?.icon || '🎩'}
                      </span>
                    ) : (
                      <span className="text-2xl drop-shadow">🪙</span>
                    )}

                    {hasHat && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-purple-600 text-white rounded text-[8px] font-black uppercase shadow">
                        HAT
                      </span>
                    )}
                  </div>

                  {/* Coins & TIX amount */}
                  <div className="flex flex-col items-center gap-0.5 my-1">
                    <div className="text-xs font-black text-amber-300 font-mono flex items-center gap-0.5">
                      <span>🪙</span>
                      <span>+{tier.coins}</span>
                    </div>
                    <div className="text-[10px] font-black text-rose-300 font-mono flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-950/40 border border-rose-500/30">
                      <span>🎟️</span>
                      <span>+{tier.tix} TIX</span>
                    </div>
                  </div>

                  {/* Hat label preview if present */}
                  {hasHat && tier.hatReward && (
                    <div className="text-[10px] font-semibold text-purple-300 truncate w-full mt-0.5">
                      {EXCLUSIVE_HATS_INFO[tier.hatReward]?.name}
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="mt-2 w-full pt-1.5 border-t border-slate-800/80">
                    {isClaimed ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>Claimed</span>
                      </div>
                    ) : isToday && canClaimToday ? (
                      <div className="text-[10px] font-black text-amber-300 animate-bounce">
                        ★ READY
                      </div>
                    ) : isLocked ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400">Missed</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= SELECTED DAY INSPECTION & CLAIM PANEL ================= */}
        <div className="mx-5 mb-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-lg shrink-0">
              {activeReward.hatReward
                ? EXCLUSIVE_HATS_INFO[activeReward.hatReward]?.icon || '👑'
                : '🪙'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-100">
                  {activeReward.title}
                </span>
                <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold border border-amber-500/30">
                  Day {activeReward.day}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeReward.perkDescription || activeReward.hatDescription}
              </p>
              {activeReward.hatReward && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-300 font-semibold">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>
                    Includes exclusive accessory:{' '}
                    <strong>{EXCLUSIVE_HATS_INFO[activeReward.hatReward]?.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
            {isDayClaimed ? (
              <div className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Day {activeReward.day} Already Claimed</span>
              </div>
            ) : isCurrentStreakDay && canClaimToday ? (
              <button
                id="btn-claim-daily-reward"
                onClick={handleClaim}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black shadow-xl shadow-amber-500/20 transition cursor-pointer hover:scale-105 active:scale-95"
              >
                <Gift className="w-4 h-4" />
                <span>
                  CLAIM DAY {activeReward.day} REWARD (+{activeReward.coins} 🪙 & +{activeReward.tix} 🎟️ TIX)
                </span>
              </button>
            ) : isDayLocked ? (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Unlocks on Day {activeReward.day} Login</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Available in next cycle</div>
            )}
          </div>
        </div>

        {/* ================= CATALOG PREVIEW OF EXCLUSIVE HATS ================= */}
        <div className="px-5 pb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-pink-400" />
            <span>Streak Exclusive Hats Preview</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['dino_hood', 'cyber_visor', 'wizard_hat', 'dominus'] as const).map((hatKey) => {
              const info = EXCLUSIVE_HATS_INFO[hatKey];
              const isUnlocked = state.unlockedHats.includes(hatKey);

              return (
                <div
                  key={hatKey}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isUnlocked
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">{info.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {info.name}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-purple-500/20 text-purple-300">
                          {info.rarity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {isUnlocked
                          ? 'Unlocked & ready to wear!'
                          : `Claim via Day ${info.unlockDay} Login`}
                      </span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        onEquipHat(hatKey);
                        soundEngine.playCollectCoin();
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer shrink-0"
                    >
                      Wear
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Day {info.unlockDay}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= FOOTER / DEMO CONTROLS ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">
              Tip: Press <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">G</kbd> anytime during gameplay to open Daily Rewards!
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fast forward debug button */}
            <button
              onClick={handleSimulateNextDay}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              title="Fast-forward 24 hours to test Day 2..7 immediately"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Next Day</span>
            </button>

            {/* Reset debug button */}
            <button
              onClick={handleResetStreak}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg text-[11px] transition cursor-pointer"
              title="Reset streak to Day 1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
