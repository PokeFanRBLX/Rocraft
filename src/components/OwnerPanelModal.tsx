import React, { useState } from 'react';
import {
  X,
  Shield,
  Plane,
  Ghost,
  Sparkles,
  Zap,
  Heart,
  Activity,
  MapPin,
  Flag,
  Sun,
  Moon,
  Bomb,
  Users,
  CheckCircle2,
  Trash2,
  Crown,
  Volume2,
  Send,
  Sliders
} from 'lucide-react';
import { PhysicsEngine } from '../engine/physics';
import { RocraftGameEngine } from '../engine/gameEngine';
import { AvatarConfig } from '../types';
import { soundEngine } from '../utils/audio';

interface OwnerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  physics: PhysicsEngine | null;
  gameEngine: RocraftGameEngine | null;
  avatarConfig: AvatarConfig;
  onUpdateAvatarConfig: (config: AvatarConfig) => void;
  onBroadcastAnnouncement: (message: string) => void;
}

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({
  isOpen,
  onClose,
  physics,
  gameEngine,
  avatarConfig,
  onUpdateAvatarConfig,
  onBroadcastAnnouncement
}) => {
  const [activeTab, setActiveTab] = useState<'powers' | 'teleport' | 'world' | 'chaos' | 'broadcast'>('powers');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Local state reflecting physics engine
  const [godMode, setGodMode] = useState(physics?.isGodMode ?? false);
  const [flying, setFlying] = useState(physics?.isFlying ?? false);
  const [noclip, setNoclip] = useState(physics?.isNoclip ?? false);
  const [rainbowAura, setRainbowAura] = useState(physics?.rainbowAura ?? false);
  const [speedMultiplier, setSpeedMultiplier] = useState(physics?.speedMultiplier ?? 1.0);
  const [jumpMultiplier, setJumpMultiplier] = useState(physics?.jumpMultiplier ?? 1.0);
  const [hasSavedWaypoint, setHasSavedWaypoint] = useState(!!physics?.savedWaypoint);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // 1. Toggles
  const toggleGodMode = () => {
    if (!physics) return;
    const next = !godMode;
    physics.isGodMode = next;
    setGodMode(next);
    if (next) {
      physics.healFull();
      soundEngine.playPowerup();
      showToast('🛡️ God Mode Enabled — Invincible to damage & void!');
    } else {
      showToast('God Mode Disabled');
    }
  };

  const toggleFlying = () => {
    if (!physics) return;
    const next = !flying;
    physics.isFlying = next;
    setFlying(next);
    if (next) {
      soundEngine.playGravityBoing();
      showToast('🕊️ Flight Enabled — Use W/A/S/D and SPACE to fly!');
    } else {
      showToast('Flight Disabled');
    }
  };

  const toggleNoclip = () => {
    if (!physics) return;
    const next = !noclip;
    physics.isNoclip = next;
    setNoclip(next);
    if (next) {
      soundEngine.playPowerup();
      showToast('👻 Noclip Ghost Mode Enabled — Pass through walls!');
    } else {
      showToast('Noclip Disabled');
    }
  };

  const toggleRainbowAura = () => {
    if (!physics) return;
    const next = !rainbowAura;
    physics.rainbowAura = next;
    setRainbowAura(next);
    if (next) {
      soundEngine.playPowerup();
      showToast('🌈 Rainbow Particle Aura Activated!');
    } else {
      showToast('Rainbow Aura Disabled');
    }
  };

  const handleSpeedChange = (mult: number) => {
    if (!physics) return;
    physics.speedMultiplier = mult;
    setSpeedMultiplier(mult);
    soundEngine.playSpeedBoost();
    showToast(`⚡ Movement Speed set to ${mult}x`);
  };

  const handleJumpChange = (mult: number) => {
    if (!physics) return;
    physics.jumpMultiplier = mult;
    setJumpMultiplier(mult);
    soundEngine.playWobbleJump();
    showToast(`🦘 Jump Height set to ${mult}x`);
  };

  const handleInstantHeal = () => {
    if (!physics) return;
    physics.healFull();
    showToast('💖 Restored Health to 100%');
  };

  const handleSuperHealth = () => {
    if (!physics) return;
    physics.setSuperHealth(10000);
    showToast('💪 Super Health: 10,000 HP Applied!');
  };

  // 2. Teleports
  const handleTeleportSpawn = () => {
    if (!physics) return;
    physics.resetPlayerToSpawn();
    showToast('Teleported to Spawn Point');
  };

  const handleTeleportStage = (stageNumber: number) => {
    if (!physics) return;
    // Each obby stage is spaced approximately 12 units along the Z axis
    const targetZ = (stageNumber - 1) * 12 + 2;
    const targetY = (stageNumber - 1) * 1.5 + 4;
    physics.teleportTo(0, targetY, targetZ);
    physics.currentStage = stageNumber;
    if (physics.onStageChange) physics.onStageChange(stageNumber);
    showToast(`Teleported to Stage ${stageNumber}`);
  };

  const handleTeleportVictory = () => {
    if (!physics) return;
    physics.teleportTo(0, 20, 115);
    showToast('Teleported to Trophy Finish Line!');
  };

  const handleSaveWaypoint = () => {
    if (!physics) return;
    physics.saveWaypoint();
    setHasSavedWaypoint(true);
    showToast(`📍 Saved Waypoint at (${Math.round(physics.playerPos.x)}, ${Math.round(physics.playerPos.y)}, ${Math.round(physics.playerPos.z)})`);
  };

  const handleTeleportWaypoint = () => {
    if (!physics) return;
    const success = physics.teleportToWaypoint();
    if (success) {
      showToast('Teleported to Saved Waypoint');
    } else {
      showToast('No Waypoint Saved Yet!');
    }
  };

  // 3. World & Chaos
  const handleSetTime = (timeFraction: number, label: string) => {
    if (!gameEngine) return;
    gameEngine.dayTime = timeFraction;
    soundEngine.playPowerup();
    showToast(`Time set to ${label}`);
  };

  const handleClearKillbricks = () => {
    if (!physics) return;
    const count = physics.clearHazards();
    showToast(`✨ Neutralized ${count} Killbricks into Golden Blocks!`);
  };

  const handleDetonateAllTNT = () => {
    if (!physics) return;
    const count = physics.detonateAllTNT();
    showToast(`💥 Igniting ${count} TNT Blocks across the world!`);
  };

  const handleSpawnDummies = (count: number) => {
    if (!physics) return;
    physics.spawnDummiesAtPlayer(count);
    showToast(`⚔️ Spawned ${count} Target Dummies around you!`);
  };

  const handleClearDummies = () => {
    if (!physics) return;
    physics.clearDummies();
    soundEngine.playPlaceBlock();
    showToast('Cleared all Target Dummies');
  };

  // 4. Announcements
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim()) return;
    onBroadcastAnnouncement(announcementInput.trim());
    soundEngine.playOwnerFanfare();
    showToast('📢 Global Owner Announcement broadcasted!');
    setAnnouncementInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border-2 border-transparent rainbow-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with glowing rainbow theme */}
        <div className="relative flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide font-['Fredoka'] rainbow-text">
                  OWNER CONTROL PANEL
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  RANK: OWNER
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Authorized User: <span className="font-bold text-slate-200">{avatarConfig.name}</span> • Toggle GUI with key <kbd className="px-1 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded font-mono text-amber-300">#</kbd>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Panel (or press # / Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Toast Feedback */}
        {notification && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 border-b border-amber-500/30 text-xs font-bold text-center text-amber-200 animate-in fade-in">
            {notification}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('powers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'powers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Powers & Cheats
          </button>

          <button
            onClick={() => setActiveTab('teleport')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'teleport'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Teleport & Stages
          </button>

          <button
            onClick={() => setActiveTab('world')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'world'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            World & Light
          </button>

          <button
            onClick={() => setActiveTab('chaos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'chaos'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bomb className="w-3.5 h-3.5" />
            Chaos & Spawning
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Server Broadcast
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-200">
          {/* TAB 1: POWERS */}
          {activeTab === 'powers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* God Mode */}
                <div
                  onClick={toggleGodMode}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    godMode
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-900/20'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${godMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">God Mode</div>
                      <div className="text-[11px] text-slate-400">Invulnerable to void & hazards</div>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${godMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700 text-slate-400'}`}>
                    {godMode ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>

                {/* Flying */}
                <div
                  onClick={toggleFlying}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    flying
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-900/20'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${flying ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">3D Fly Mode</div>
                      <div className="text-[11px] text-slate-400">Fly in camera direction & Space</div>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${flying ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-700 text-slate-400'}`}>
                    {flying ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>

                {/* Noclip Ghost */}
                <div
                  onClick={toggleNoclip}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    noclip
                      ? 'bg-purple-950/40 border-purple-500/80 shadow-md shadow-purple-900/20'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${noclip ? 'bg-purple-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      <Ghost className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Ghost / Noclip</div>
                      <div className="text-[11px] text-slate-400">Walk directly through blocks</div>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${noclip ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-700 text-slate-400'}`}>
                    {noclip ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>

                {/* Rainbow Particle Aura */}
                <div
                  onClick={toggleRainbowAura}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    rainbowAura
                      ? 'bg-pink-950/40 border-pink-500/80 shadow-md shadow-pink-900/20'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${rainbowAura ? 'bg-pink-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Rainbow Sparkle Aura</div>
                      <div className="text-[11px] text-slate-400">Trailing colorful particles</div>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${rainbowAura ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-slate-700 text-slate-400'}`}>
                    {rainbowAura ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Speed Multipliers */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Walk Speed Multiplier: <span className="text-amber-400 font-black">{speedMultiplier}x</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1.0, 1.8, 3.0, 5.0, 10.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleSpeedChange(val)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        speedMultiplier === val
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {val}x {val === 10 ? '⚡' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jump Multipliers */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Jump Height Multiplier: <span className="text-cyan-400 font-black">{jumpMultiplier}x</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1.0, 1.6, 2.5, 4.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleJumpChange(val)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        jumpMultiplier === val
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {val}x {val === 4 ? '🚀' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Controls */}
              <div className="flex gap-3">
                <button
                  onClick={handleInstantHeal}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
                >
                  <Heart className="w-4 h-4" />
                  Instant Full Heal (100 HP)
                </button>
                <button
                  onClick={handleSuperHealth}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
                >
                  <Crown className="w-4 h-4" />
                  Super Health (10,000 HP)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TELEPORT */}
          {activeTab === 'teleport' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Waypoint Teleportation
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveWaypoint}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
                  >
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Save Current Position
                  </button>
                  <button
                    onClick={handleTeleportWaypoint}
                    disabled={!hasSavedWaypoint}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                      hasSavedWaypoint
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Teleport to Waypoint
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Obby Stage Shortcuts
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((stg) => (
                    <button
                      key={stg}
                      onClick={() => handleTeleportStage(stg)}
                      className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700/60 transition cursor-pointer hover:border-amber-400"
                    >
                      Stage {stg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTeleportSpawn}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  Teleport to Spawn
                </button>
                <button
                  onClick={handleTeleportVictory}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-xs font-bold text-white transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                >
                  <Flag className="w-4 h-4" />
                  Teleport to Victory Trophy
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: WORLD & LIGHT */}
          {activeTab === 'world' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Time of Day & Atmosphere
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleSetTime(0.5, 'Bright Noon')}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex flex-col items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sun className="w-5 h-5 text-amber-400" />
                    High Noon
                  </button>
                  <button
                    onClick={() => handleSetTime(0.25, 'Sunset Golden Hour')}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex flex-col items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sun className="w-5 h-5 text-orange-400" />
                    Golden Sunset
                  </button>
                  <button
                    onClick={() => handleSetTime(0.0, 'Midnight Starlight')}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex flex-col items-center gap-1.5 transition cursor-pointer"
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    Midnight
                  </button>
                  <button
                    onClick={() => handleSetTime(0.75, 'Sunrise Dawn')}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex flex-col items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    Early Dawn
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  World Safety & Purification
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Convert every dangerous red Killbrick in the entire world into safe golden solid blocks so nobody dies.
                </p>
                <button
                  onClick={handleClearKillbricks}
                  className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Neutralize All Killbricks (Turn to Gold)
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CHAOS & SPAWNING */}
          {activeTab === 'chaos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  World TNT Chain Detonation
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Instantly ignite and detonate every TNT block placed anywhere in the world in an epic cascade!
                </p>
                <button
                  onClick={handleDetonateAllTNT}
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer shadow"
                >
                  <Bomb className="w-4 h-4" />
                  Detonate All World TNT
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Combat Target Dummies
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Spawn interactive wobbly target dummies around your position for sword and rocket target practice.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSpawnDummies(3)}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-cyan-400" />
                    Spawn 3 Dummies
                  </button>
                  <button
                    onClick={() => handleSpawnDummies(6)}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    Spawn 6 Dummies
                  </button>
                  <button
                    onClick={handleClearDummies}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-red-900/60 text-xs font-bold text-red-300 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Clear Dummies"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Global Server Announcement
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Broadcast an official server banner across the screen with a royal fanfare sound for all players to see.
                </p>
                <form onSubmit={handleSendAnnouncement} className="space-y-3">
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    placeholder="e.g. Welcome to my server! Obby race starting soon!"
                    maxLength={100}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:brightness-110 text-xs font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer shadow"
                  >
                    <Send className="w-4 h-4" />
                    Send Global Announcement
                  </button>
                </form>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Owner Rank Identity
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Your current name is <span className="font-bold text-white">{avatarConfig.name}</span>. Because your name contains or starts with <span className="text-amber-400 font-mono font-bold">PokeFan_</span>, you have permanent OWNER privileges, rainbow overhead nametag, and keybind shortcut <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300">#</kbd>.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onUpdateAvatarConfig({ ...avatarConfig, name: 'PokeFan_' });
                      showToast('Name updated to PokeFan_');
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition cursor-pointer"
                  >
                    Set to "PokeFan_"
                  </button>
                  <button
                    onClick={() => {
                      onUpdateAvatarConfig({ ...avatarConfig, name: 'PokeFan_Dev' });
                      showToast('Name updated to PokeFan_Dev');
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-pink-300 transition cursor-pointer"
                  >
                    Set to "PokeFan_Dev"
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Owner Rank active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Close Panel (#)
          </button>
        </div>
      </div>
    </div>
  );
};
