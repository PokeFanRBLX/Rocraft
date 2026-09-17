import React from 'react';
import {
  Volume2,
  VolumeX,
  User,
  Eye,
  RotateCcw,
  Palette,
  Compass,
  Box,
  HelpCircle,
  Sparkles,
  Zap,
  Flame,
  CheckCircle2,
  Music,
  Radio,
  Crown,
  MessageSquare,
  Users,
  Gift,
  Coins
} from 'lucide-react';
import { HotbarSlot, ToolDef, BlockDef } from '../types';
import { TOOL_DEFINITIONS, BLOCK_DEFINITIONS } from '../engine/blocks';

interface HUDProps {
  health: number;
  maxHealth: number;
  currentStage: number;
  deaths: number;
  worldName: string;
  isFirstPerson: boolean;
  isPointerLocked?: boolean;
  checkpointMessage?: string | null;
  isMuted: boolean;
  isNight: boolean;
  isMusicPlaying?: boolean;
  activeSlot: HotbarSlot;
  hotbarSlots: HotbarSlot[];
  activeEffects: { lowGravity: boolean; speedBoost: boolean };
  targetedBlockId: string | null;
  onTogglePerspective: () => void;
  onToggleMute: () => void;
  onOpenMusicModal?: () => void;
  onResetCharacter: () => void;
  onOpenAvatarModal: () => void;
  onOpenWorldModal: () => void;
  onOpenInventoryModal: () => void;
  onOpenControlsModal: () => void;
  onSelectSlot: (index: number) => void;
  // Friends & Lobbies
  onOpenFriendsModal?: () => void;
  onlineFriendsCount?: number;
  currentLobbyName?: string;
  // Daily Rewards & Currency
  coins?: number;
  tix?: number;
  onOpenDailyRewardModal?: () => void;
  canClaimDailyReward?: boolean;
  currentStreak?: number;
  // Mobile touch buttons
  onMobileJump?: () => void;
  onMobileAttack?: () => void;
  onMobilePlace?: () => void;
  // Owner Rank & Announcement
  isOwner?: boolean;
  playerName?: string;
  activeAnnouncement?: string | null;
  onOpenOwnerPanel?: () => void;
  // Chat
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  currentStage,
  deaths,
  worldName,
  isFirstPerson,
  isPointerLocked,
  checkpointMessage,
  isMuted,
  isNight,
  isMusicPlaying = false,
  activeSlot,
  hotbarSlots,
  activeEffects,
  targetedBlockId,
  onTogglePerspective,
  onToggleMute,
  onOpenMusicModal,
  onResetCharacter,
  onOpenAvatarModal,
  onOpenWorldModal,
  onOpenInventoryModal,
  onOpenControlsModal,
  onSelectSlot,
  onOpenFriendsModal,
  onlineFriendsCount,
  currentLobbyName,
  coins = 350,
  tix = 50,
  onOpenDailyRewardModal,
  canClaimDailyReward = false,
  currentStreak = 1,
  onMobileJump,
  onMobileAttack,
  onMobilePlace,
  isOwner = false,
  playerName = 'Player',
  activeAnnouncement = null,
  onOpenOwnerPanel,
  isChatOpen = false,
  onToggleChat
}) => {
  const hpPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4 font-sans select-none z-10">
      {/* ================= TOP BAR (Roblox Style) ================= */}
      <header className="pointer-events-auto flex items-center justify-between gap-2">
        {/* Left: Brand & World Info */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-400 font-['Fredoka'] drop-shadow">
              RO<span className="text-emerald-400">CRAFT</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
              v1.0
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 max-w-[110px] sm:max-w-[180px] truncate leading-tight">
                {worldName}
              </span>
              {currentLobbyName && (
                <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[120px] sm:max-w-[170px] hidden sm:block leading-tight">
                  {currentLobbyName}
                </span>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Stage badge for obby */}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-0.5 rounded-lg text-xs font-black text-emerald-300 shadow">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stage {currentStage}</span>
          </div>

          {/* Blox Coins balance badge */}
          <button
            id="hud-btn-coins"
            onClick={onOpenDailyRewardModal}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-300 shadow transition cursor-pointer"
            title="Blox Coins Balance (Click for Daily Rewards)"
          >
            <span>🪙</span>
            <span className="font-mono">{coins.toLocaleString()}</span>
          </button>

          {/* TIX (Tickets) balance badge */}
          <button
            id="hud-btn-tix"
            onClick={onOpenDailyRewardModal}
            className="flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 hover:border-rose-400 px-2 py-0.5 rounded-lg text-xs font-black text-rose-300 shadow transition cursor-pointer"
            title="TIX (Tickets) Balance - Earned Daily (Click for Rewards)"
          >
            <span>🎟️</span>
            <span className="font-mono">{tix.toLocaleString()}</span>
            <span className="text-[10px] text-rose-400 font-extrabold hidden sm:inline">TIX</span>
          </button>

          {/* Rainbow OWNER Badge if user has owner name */}
          {isOwner && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black rainbow-badge shadow animate-in fade-in">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span className="rainbow-text font-black">OWNER</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Owner Panel Button (Glowing Rainbow) */}
          {isOwner && (
            <button
              id="hud-btn-owner"
              onClick={onOpenOwnerPanel}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer shadow-lg rainbow-badge rainbow-glow text-white hover:scale-105 active:scale-95"
              title="Open Owner Control Panel (Press #)"
            >
              <Crown className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="rainbow-text hidden sm:inline">OWNER GUI (#)</span>
              <span className="rainbow-text sm:hidden">#</span>
            </button>
          )}

          {/* Active status effect pills */}
          {activeEffects.lowGravity && (
            <div className="hidden md:flex items-center gap-1 bg-sky-500/20 border border-sky-400/50 px-2.5 py-1 rounded-lg text-xs font-bold text-sky-300 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Low Grav</span>
            </div>
          )}
          {activeEffects.speedBoost && (
            <div className="hidden md:flex items-center gap-1 bg-red-500/20 border border-red-400/50 px-2.5 py-1 rounded-lg text-xs font-bold text-red-300 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>Speed Boost</span>
            </div>
          )}

          {/* Daily Login Rewards button */}
          {onOpenDailyRewardModal && (
            <button
              id="hud-btn-daily-rewards"
              onClick={onOpenDailyRewardModal}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow border ${
                canClaimDailyReward
                  ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-200 border-amber-400 ring-2 ring-amber-500/40 animate-pulse'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Daily Login Rewards & Streaks (G)"
            >
              <Gift
                className={`w-4 h-4 ${
                  canClaimDailyReward ? 'text-amber-300 animate-bounce' : 'text-amber-400'
                }`}
              />
              <span className="hidden md:inline">Rewards</span>
              {canClaimDailyReward ? (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase shadow">
                  GIFT!
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-bold">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  <span>{currentStreak}d</span>
                </span>
              )}
            </button>
          )}

          {/* Friends & Lobbies button */}
          {onOpenFriendsModal && (
            <button
              id="hud-btn-friends"
              onClick={onOpenFriendsModal}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
              title="Friends & Multiplayer Lobbies (F)"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Friends</span>
              {typeof onlineFriendsCount === 'number' && onlineFriendsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/40">
                  {onlineFriendsCount}
                </span>
              )}
            </button>
          )}

          {/* World Browser button */}
          <button
            id="hud-btn-worlds"
            onClick={onOpenWorldModal}
            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
            title="Browse & Switch Worlds"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Worlds</span>
          </button>

          {/* Avatar Customizer button */}
          <button
            id="hud-btn-avatar"
            onClick={onOpenAvatarModal}
            className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
            title="Customize Roblox Avatar"
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span className="hidden md:inline">Avatar</span>
          </button>

          {/* Chat Toggle button */}
          {onToggleChat && (
            <button
              id="hud-btn-chat"
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow border ${
                isChatOpen
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Multiplayer Chat (])"
            >
              <MessageSquare className={`w-4 h-4 ${isChatOpen ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">Chat</span>
            </button>
          )}

          {/* Perspective Toggle (1st person / 3rd person) */}
          <button
            id="hud-btn-perspective"
            onClick={onTogglePerspective}
            className="flex items-center gap-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
            title="Toggle Perspective (V)"
          >
            {isFirstPerson ? <Eye className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-sky-400" />}
            <span className="hidden sm:inline">{isFirstPerson ? '1st Person' : '3rd Person'}</span>
          </button>

          {/* Soundtrack / Boombox button */}
          <button
            id="hud-btn-music"
            onClick={onOpenMusicModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow border ${
              isMusicPlaying
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Open Boombox & Soundtrack (B)"
          >
            <Music className={`w-4 h-4 ${isMusicPlaying ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{isMusicPlaying ? 'Soundtrack: ON' : 'Soundtrack'}</span>
          </button>

          {/* Reset / OOF Character */}
          <button
            id="hud-btn-reset"
            onClick={onResetCharacter}
            className="flex items-center gap-1 bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-700/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow"
            title="Reset Character (R)"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">OOF!</span>
          </button>

          {/* Mute Audio */}
          <button
            id="hud-btn-mute"
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer shadow"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Controls Help */}
          <button
            id="hud-btn-help"
            onClick={onOpenControlsModal}
            className="p-1.5 sm:p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer shadow"
            title="Keybinds & Controls"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* ================= GLOBAL OWNER ANNOUNCEMENT ================= */}
      {activeAnnouncement && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40 animate-in slide-in-from-top-3 duration-300">
          <div className="bg-slate-950/95 border-2 border-transparent rainbow-border px-4 py-2.5 rounded-2xl shadow-2xl rainbow-glow flex items-center justify-center gap-2.5 text-center">
            <Crown className="w-5 h-5 text-amber-300 animate-bounce shrink-0" />
            <div className="text-xs sm:text-sm font-bold text-slate-100">
              <span className="rainbow-text font-black mr-1">[OWNER ANNOUNCEMENT]:</span>
              <span className="text-white drop-shadow">{activeAnnouncement}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATIONS & OVERLAYS ================= */}
      {checkpointMessage && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-100 px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-bounce z-30">
          <span className="text-xl text-yellow-300">★</span>
          <span className="text-sm sm:text-base font-black tracking-wide uppercase">{checkpointMessage}</span>
          <span className="text-xl text-yellow-300">★</span>
        </div>
      )}

      {isFirstPerson && !isPointerLocked && (
        <div className="pointer-events-none absolute bottom-36 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-amber-400/60 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur flex items-center gap-2 z-20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Click screen to lock cursor view (ESC to unlock • V to switch view)</span>
        </div>
      )}

      {/* ================= CENTER CROSSHAIR & TARGET DISPLAY ================= */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        {/* Crosshair */}
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute w-4 h-0.5 bg-white/90 shadow-[0_0_2px_black]" />
          <div className="absolute h-4 w-0.5 bg-white/90 shadow-[0_0_2px_black]" />
        </div>

        {/* Targeted Voxel Info */}
        {targetedBlockId && BLOCK_DEFINITIONS[targetedBlockId as keyof typeof BLOCK_DEFINITIONS] && (
          <div className="mt-3 px-2 py-0.5 bg-slate-950/80 backdrop-blur border border-slate-700/80 rounded-md text-[11px] font-semibold text-slate-300 shadow">
            {BLOCK_DEFINITIONS[targetedBlockId as keyof typeof BLOCK_DEFINITIONS].name}
          </div>
        )}
      </div>

      {/* ================= BOTTOM BAR (Health + Minecraft Hotbar) ================= */}
      <footer className="pointer-events-auto flex flex-col items-center gap-2 sm:gap-3">
        {/* Health Bar (Roblox classic green/red bar) */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 px-3.5 py-1.5 rounded-full shadow-lg">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
            <span className="text-red-500 font-bold text-sm">♥</span>
            <span>{Math.round(health)}</span>
            <span className="text-slate-500 text-[10px]">/ {maxHealth}</span>
          </div>

          <div className="w-28 sm:w-44 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                hpPercent > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : hpPercent > 25
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          {deaths > 0 && (
            <span className="text-[11px] font-semibold text-slate-400">
              OOFs: <strong className="text-rose-400">{deaths}</strong>
            </span>
          )}
        </div>

        {/* Golden Boombox active hint */}
        {activeSlot.type === 'tool' && activeSlot.id === 'boombox' && (
          <button
            id="hud-btn-boombox-hint"
            onClick={onOpenMusicModal}
            className="pointer-events-auto flex items-center gap-2 bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/60 text-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse cursor-pointer"
          >
            <Radio className="w-4 h-4 text-amber-300" />
            <span>Golden Boombox Equipped • Click to Switch or Upload Soundtrack</span>
          </button>
        )}

        {/* Minecraft 9-Slot Hotbar */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/90 backdrop-blur-md border-2 border-slate-700 p-1 sm:p-1.5 rounded-xl shadow-2xl">
          {hotbarSlots.map((slot, index) => {
            const isActive = activeSlot.type === slot.type && activeSlot.id === slot.id;
            const isTool = slot.type === 'tool';
            const toolDef = isTool ? TOOL_DEFINITIONS[slot.id as keyof typeof TOOL_DEFINITIONS] : null;
            const blockDef = !isTool ? BLOCK_DEFINITIONS[slot.id as keyof typeof BLOCK_DEFINITIONS] : null;

            return (
              <button
                key={index}
                id={`hotbar-slot-${index + 1}`}
                onClick={() => onSelectSlot(index)}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] scale-105'
                    : 'bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800/80'
                }`}
              >
                {/* Number Key Indicator */}
                <span className="absolute top-0.5 left-1 text-[9px] font-bold text-slate-400">
                  {index + 1}
                </span>

                {/* Slot Graphic */}
                {isTool && toolDef ? (
                  <span className="text-lg sm:text-xl drop-shadow">{toolDef.icon}</span>
                ) : blockDef ? (
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded border border-black/40 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: blockDef.color }}
                  >
                    {blockDef.isHazard && <Flame className="w-3 h-3 text-yellow-300" />}
                    {blockDef.isCheckpoint && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {blockDef.isBouncy && <span className="text-[10px]">🌀</span>}
                  </div>
                ) : null}

                {/* Subtitle / Label on Hover / Active */}
                {isActive && (
                  <span className="absolute -top-7 px-2 py-0.5 bg-slate-900 text-amber-300 border border-slate-700 rounded text-[10px] font-bold whitespace-nowrap shadow pointer-events-none">
                    {toolDef?.name || blockDef?.name}
                  </span>
                )}
              </button>
            );
          })}

          {/* Inventory Catalog button */}
          <button
            id="hotbar-inventory-btn"
            onClick={onOpenInventoryModal}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/60 rounded-lg flex flex-col items-center justify-center transition cursor-pointer shadow ml-1"
            title="Open Block & Gear Catalog (E)"
          >
            <Box className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider">All</span>
          </button>
        </div>

        {/* Quick hint on desktop */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-medium">
          <span>
            <strong className="text-slate-200">WASD</strong> Move
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-200">Space</strong> Jump
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-200">L-Click</strong> Break / Attack
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-200">R-Click</strong> Place Voxel
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-200">1-9</strong> Select Item
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-200">V</strong> Camera
          </span>
        </div>

        {/* Mobile touch controls bar */}
        <div className="flex sm:hidden items-center justify-center gap-4 w-full pt-1">
          <button
            id="mobile-btn-mine"
            onClick={onMobileAttack}
            className="flex-1 py-2.5 bg-rose-600/90 active:bg-rose-700 text-white font-bold rounded-xl text-xs shadow border border-rose-400/40"
          >
            Mine / Slash
          </button>
          <button
            id="mobile-btn-place"
            onClick={onMobilePlace}
            className="flex-1 py-2.5 bg-emerald-600/90 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow border border-emerald-400/40"
          >
            Place Voxel
          </button>
          <button
            id="mobile-btn-jump"
            onClick={onMobileJump}
            className="w-16 py-2.5 bg-amber-500/90 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow border border-amber-300/40"
          >
            Jump
          </button>
        </div>
      </footer>
    </div>
  );
};
