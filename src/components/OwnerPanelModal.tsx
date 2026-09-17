import React, { useState, useMemo } from 'react';
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
  Sliders,
  Feather,
  Maximize2,
  FastForward,
  ArrowRightCircle,
  ArrowLeftCircle,
  Gift,
  Coins,
  DollarSign,
  UserCheck,
  Plus,
  Check,
  RotateCcw
} from 'lucide-react';
import { PhysicsEngine } from '../engine/physics';
import { RocraftGameEngine } from '../engine/gameEngine';
import { AvatarConfig, LobbyInfo } from '../types';
import { soundEngine } from '../utils/audio';
import {
  getLobbyPlayerBalances,
  giveLobbyPlayerCurrency,
  PlayerBalance
} from '../utils/dailyRewardStorage';

interface LobbyPlayerMeta {
  name: string;
  badge: string;
  color: string;
}

const BASE_LOBBY_PLAYERS: LobbyPlayerMeta[] = [
  { name: 'NoobSlayer99', badge: 'VIP', color: '#16a34a' },
  { name: 'BlockyDave', badge: 'MEMBER', color: '#dc2626' },
  { name: 'Builderman', badge: 'CREATOR', color: '#0284c7' },
  { name: 'SeekMaster', badge: 'HOST', color: '#7c3aed' },
  { name: 'FarmerBob', badge: 'MEMBER', color: '#ca8a04' },
  { name: 'VoxelQueen', badge: 'VIP', color: '#8b5cf6' },
  { name: 'SkyCrafter', badge: 'MEMBER', color: '#059669' },
  { name: 'PixelBuilder', badge: 'BUILDER', color: '#ea580c' },
  { name: 'SpeedyBlox', badge: 'VIP', color: '#06b6d4' },
  { name: 'DiamondMiner', badge: 'MEMBER', color: '#2563eb' }
];

interface OwnerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  physics: PhysicsEngine | null;
  gameEngine: RocraftGameEngine | null;
  avatarConfig: AvatarConfig;
  onUpdateAvatarConfig: (config: AvatarConfig) => void;
  onBroadcastAnnouncement: (message: string) => void;
  // Economy & Give Currency
  currentLobby?: LobbyInfo | null;
  myCoins?: number;
  myTix?: number;
  onGiveMyCurrency?: (coinsDelta: number, tixDelta: number) => void;
  onGivePlayerCurrency?: (targetPlayer: string, coinsDelta: number, tixDelta: number) => void;
  onSendChatMessage?: (message: string) => void;
}

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({
  isOpen,
  onClose,
  physics,
  gameEngine,
  avatarConfig,
  onUpdateAvatarConfig,
  onBroadcastAnnouncement,
  currentLobby,
  myCoins = 0,
  myTix = 0,
  onGiveMyCurrency,
  onGivePlayerCurrency,
  onSendChatMessage
}) => {
  const [activeTab, setActiveTab] = useState<'powers' | 'give' | 'teleport' | 'world' | 'chaos' | 'broadcast'>('powers');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Give Currency State
  const [giveTargetType, setGiveTargetType] = useState<'myself' | 'lobby' | 'all'>('myself');
  const [selectedLobbyPlayer, setSelectedLobbyPlayer] = useState<string>('NoobSlayer99');
  const [customPlayerName, setCustomPlayerName] = useState<string>('');
  const [giveCoinsAmount, setGiveCoinsAmount] = useState<number>(1000);
  const [giveTixAmount, setGiveTixAmount] = useState<number>(100);
  const [broadcastInChat, setBroadcastInChat] = useState<boolean>(true);
  const [lobbyBalances, setLobbyBalances] = useState<Record<string, PlayerBalance>>(() => getLobbyPlayerBalances());

  // Dynamically assemble players list in current lobby
  const lobbyPlayersList = useMemo(() => {
    const map = new Map<string, LobbyPlayerMeta>();
    if (currentLobby?.hostName && currentLobby.hostName !== avatarConfig.name) {
      map.set(currentLobby.hostName, { name: currentLobby.hostName, badge: 'HOST', color: '#8b5cf6' });
    }
    if (currentLobby?.friendsInside) {
      currentLobby.friendsInside.forEach((f) => {
        if (f !== avatarConfig.name) {
          map.set(f, { name: f, badge: 'FRIEND', color: '#0284c7' });
        }
      });
    }
    BASE_LOBBY_PLAYERS.forEach((p) => {
      if (!map.has(p.name) && p.name !== avatarConfig.name) {
        map.set(p.name, p);
      }
    });
    return Array.from(map.values());
  }, [currentLobby, avatarConfig.name]);

  // Local state reflecting physics engine
  const [godMode, setGodMode] = useState(physics?.isGodMode ?? false);
  const [flying, setFlying] = useState(physics?.isFlying ?? false);
  const [noclip, setNoclip] = useState(physics?.isNoclip ?? false);
  const [infiniteJump, setInfiniteJump] = useState(physics?.infiniteJump ?? false);
  const [forcefield, setForcefield] = useState(physics?.forcefield ?? false);
  const [rainbowAura, setRainbowAura] = useState(physics?.rainbowAura ?? false);
  const [speedMultiplier, setSpeedMultiplier] = useState(physics?.speedMultiplier ?? 1.0);
  const [jumpMultiplier, setJumpMultiplier] = useState(physics?.jumpMultiplier ?? 1.0);
  const [gravityMultiplier, setGravityMultiplier] = useState(physics?.gravityMultiplier ?? 1.0);
  const [timeScale, setTimeScale] = useState(physics?.timeScale ?? 1.0);
  const [avatarScale, setAvatarScale] = useState(1.0);
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
    physics.setFlyingMode(next);
    setFlying(next);
    if (next) {
      soundEngine.playGravityBoing();
      showToast('🕊️ 3D Flight Enabled — Fly in any direction! (Space: Up, Shift/Q: Down)');
    } else {
      showToast('Flight Disabled');
    }
  };

  const toggleNoclip = () => {
    if (!physics) return;
    const next = !noclip;
    physics.setNoclipMode(next);
    setNoclip(next);
    if (next) {
      soundEngine.playPowerup();
      showToast('👻 Noclip Ghost Mode Enabled — Fly freely through walls without falling into void loops!');
    } else {
      showToast('Noclip Disabled');
    }
  };

  const toggleInfiniteJump = () => {
    if (!physics) return;
    const next = !infiniteJump;
    physics.setInfiniteJump(next);
    setInfiniteJump(next);
    if (next) {
      soundEngine.playGravityBoing();
      showToast('🦘 Infinite Air Jump Active — Tap Space in midair to fly upwards!');
    } else {
      showToast('Infinite Jump Disabled');
    }
  };

  const toggleForcefield = () => {
    if (!physics) return;
    const next = !forcefield;
    physics.setForcefield(next);
    setForcefield(next);
    if (next) {
      soundEngine.playPowerup();
      showToast('🛡️ Kinetic Energy Forcefield Activated — Deflects projectiles & dummies!');
    } else {
      showToast('Forcefield Deactivated');
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

  const handleGravityChange = (mult: number) => {
    if (!physics) return;
    physics.gravityMultiplier = mult;
    setGravityMultiplier(mult);
    soundEngine.playGravityBoing();
    showToast(mult < 1 ? `🌙 Low-G Moon Gravity (${mult}x) Activated!` : `Gravity set to ${mult}x`);
  };

  const handleTimeScaleChange = (scale: number) => {
    if (!physics) return;
    physics.timeScale = scale;
    setTimeScale(scale);
    soundEngine.playPowerup();
    showToast(scale < 1 ? `⏳ Matrix Slow-Mo (${scale}x speed)!` : scale > 1 ? `⚡ Hyper Fast-Forward (${scale}x speed)!` : `Game Speed Reset to 1.0x`);
  };

  const handleAvatarScale = (scale: number) => {
    if (!physics) return;
    physics.setAvatarScale(scale);
    setAvatarScale(scale);
    soundEngine.playWobbleJump();
    showToast(scale > 1 ? `🦍 Avatar Scaled to Giant (${scale}x)!` : scale < 1 ? `🐜 Avatar Scaled to Miniature (${scale}x)!` : `Avatar Scale Reset to 1.0x`);
  };

  const handleSkipStage = (delta: number) => {
    if (!physics) return;
    physics.skipStage(delta);
    showToast(delta > 0 ? `⏩ Skipped forward to Stage ${physics.currentStage}!` : `⏪ Moved back to Stage ${physics.currentStage}`);
  };

  const handleNukeTNTBarrage = () => {
    if (!physics) return;
    physics.spawnNukeTNTBarrage(8);
    showToast('💣 TNT Nuke Barrage Spawned! 8 ticking explosives incoming!');
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

  // 5. Give Currency Handlers
  const handleQuickGiveToPlayer = (targetName: string, coins: number, tix: number) => {
    const newBal = giveLobbyPlayerCurrency(targetName, coins, tix);
    setLobbyBalances((prev) => ({ ...prev, [targetName]: newBal }));
    if (onGivePlayerCurrency) {
      onGivePlayerCurrency(targetName, coins, tix);
    }
    soundEngine.playDailyClaim();
    const parts: string[] = [];
    if (coins > 0) parts.push(`+${coins.toLocaleString()} 🪙 Coins`);
    if (tix > 0) parts.push(`+${tix.toLocaleString()} 🎟️ TIX`);
    showToast(`🎁 Gifted ${parts.join(' & ')} to ${targetName}!`);
    if (broadcastInChat && onSendChatMessage) {
      onSendChatMessage(`💰 [OWNER TIP] ${avatarConfig.name} tipped ${parts.join(' & ')} to ${targetName}!`);
    }
  };

  const handleExecuteGive = (currencyType: 'coins' | 'tix' | 'both') => {
    const coinsToGive = currencyType === 'tix' ? 0 : Math.max(0, giveCoinsAmount);
    const tixToGive = currencyType === 'coins' ? 0 : Math.max(0, giveTixAmount);

    if (coinsToGive === 0 && tixToGive === 0) {
      showToast('⚠️ Please enter an amount of Coins or TIX greater than 0');
      return;
    }

    if (giveTargetType === 'myself') {
      if (onGiveMyCurrency) {
        onGiveMyCurrency(coinsToGive, tixToGive);
      }
      soundEngine.playDailyClaim();
      const parts: string[] = [];
      if (coinsToGive > 0) parts.push(`+${coinsToGive.toLocaleString()} 🪙 Blox Coins`);
      if (tixToGive > 0) parts.push(`+${tixToGive.toLocaleString()} 🎟️ TIX`);
      showToast(`👑 Granted ${parts.join(' & ')} to yourself!`);
      if (broadcastInChat && onSendChatMessage) {
        onSendChatMessage(`💰 [OWNER MINT] ${avatarConfig.name} added ${parts.join(' & ')} to their personal balance.`);
      }
    } else if (giveTargetType === 'all') {
      // Give to myself as well
      if (onGiveMyCurrency) {
        onGiveMyCurrency(coinsToGive, tixToGive);
      }
      // Give to all lobby players
      const updated = { ...lobbyBalances };
      lobbyPlayersList.forEach((p) => {
        const bal = giveLobbyPlayerCurrency(p.name, coinsToGive, tixToGive);
        updated[p.name] = bal;
        if (onGivePlayerCurrency) {
          onGivePlayerCurrency(p.name, coinsToGive, tixToGive);
        }
      });
      setLobbyBalances(updated);
      soundEngine.playOwnerFanfare();
      const parts: string[] = [];
      if (coinsToGive > 0) parts.push(`+${coinsToGive.toLocaleString()} 🪙 Coins`);
      if (tixToGive > 0) parts.push(`+${tixToGive.toLocaleString()} 🎟️ TIX`);
      showToast(`🎉 Server Airdrop! Gave ${parts.join(' & ')} to ALL players in the lobby!`);
      if (broadcastInChat && onSendChatMessage) {
        onSendChatMessage(`🎉 [OWNER AIRDROP] ${avatarConfig.name} rained ${parts.join(' & ')} on EVERYONE in the lobby! 🌧️💰`);
      }
    } else {
      const target = (customPlayerName.trim() || selectedLobbyPlayer).trim();
      if (!target) {
        showToast('⚠️ Please select or type a recipient player name');
        return;
      }
      const newBal = giveLobbyPlayerCurrency(target, coinsToGive, tixToGive);
      setLobbyBalances((prev) => ({ ...prev, [target]: newBal }));
      if (onGivePlayerCurrency) {
        onGivePlayerCurrency(target, coinsToGive, tixToGive);
      }
      soundEngine.playDailyClaim();
      const parts: string[] = [];
      if (coinsToGive > 0) parts.push(`+${coinsToGive.toLocaleString()} 🪙 Coins`);
      if (tixToGive > 0) parts.push(`+${tixToGive.toLocaleString()} 🎟️ TIX`);
      showToast(`🎁 Successfully sent ${parts.join(' & ')} to ${target}!`);
      if (broadcastInChat && onSendChatMessage) {
        onSendChatMessage(`💰 [OWNER GIFT] ${avatarConfig.name} granted ${parts.join(' & ')} to ${target}!`);
      }
    }
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Wallet Badges */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold shadow-inner">
              <span className="text-amber-300 font-mono flex items-center gap-1">
                🪙 {myCoins.toLocaleString()}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-300 font-mono flex items-center gap-1">
                🎟️ {myTix.toLocaleString()} <span className="text-[10px] text-rose-400">TIX</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Panel (or press # / Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
            id="owner-tab-give"
            onClick={() => setActiveTab('give')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'give'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-rose-300" />
            Give Coins & TIX
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

          {/* TAB: GIVE CURRENCY & ECONOMY */}
          {activeTab === 'give' && (
            <div className="space-y-4">
              {/* Recipient Selector Card */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Step 1: Choose Recipient
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {giveTargetType === 'myself'
                      ? 'Self-Minting'
                      : giveTargetType === 'lobby'
                      ? 'Lobby Player'
                      : 'Server-Wide Airdrop'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <button
                    type="button"
                    onClick={() => setGiveTargetType('myself')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      giveTargetType === 'myself'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">👑</span>
                    <span className="font-black">Myself</span>
                    <span className="text-[10px] opacity-75 truncate max-w-[120px]">{avatarConfig.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGiveTargetType('lobby')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      giveTargetType === 'lobby'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">👤</span>
                    <span className="font-black">Lobby Player</span>
                    <span className="text-[10px] opacity-75">{customPlayerName.trim() || selectedLobbyPlayer}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGiveTargetType('all')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      giveTargetType === 'all'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">🌐</span>
                    <span className="font-black">All in Lobby</span>
                    <span className="text-[10px] opacity-75">{lobbyPlayersList.length + 1} players</span>
                  </button>
                </div>

                {/* Recipient Details & Player Selection */}
                {giveTargetType === 'myself' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-sm font-black">
                        👑
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{avatarConfig.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-black">OWNER</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Your live wallet balances:</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="px-2 py-1 bg-slate-900/90 rounded border border-amber-500/40 text-amber-300">
                        🪙 {myCoins.toLocaleString()}
                      </span>
                      <span className="px-2 py-1 bg-slate-900/90 rounded border border-rose-500/40 text-rose-300">
                        🎟️ {myTix.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {giveTargetType === 'lobby' && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400">Select player in current server:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {lobbyPlayersList.map((p) => {
                        const bal = lobbyBalances[p.name] || { coins: 0, tix: 0 };
                        const isSelected = selectedLobbyPlayer === p.name && !customPlayerName.trim();
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                              setSelectedLobbyPlayer(p.name);
                              setCustomPlayerName('');
                            }}
                            className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer flex flex-col gap-0.5 ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow'
                                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate text-[11px]">{p.name}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {p.badge}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span className="text-amber-300">🪙 {bal.coins.toLocaleString()}</span>
                              <span>•</span>
                              <span className="text-rose-300">🎟️ {bal.tix.toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">Or custom username:</span>
                      <input
                        type="text"
                        value={customPlayerName}
                        onChange={(e) => setCustomPlayerName(e.target.value)}
                        placeholder="e.g. Guest_1234, BloxBuddy..."
                        maxLength={24}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {giveTargetType === 'all' && (
                  <div className="p-3 bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 border border-purple-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                        <span>🌧️ Server Money Rain Event</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Will deposit currency into the accounts of all <span className="text-white font-bold">{lobbyPlayersList.length + 1} players</span> (including yourself).
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-black">
                      AIRDROP
                    </span>
                  </div>
                )}
              </div>

              {/* Currency Amounts Card */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Step 2: Configure Currency Amount
                    </span>
                  </div>
                </div>

                {/* Blox Coins Input */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🪙</span>
                      <div>
                        <div className="text-xs font-bold text-amber-300">Blox Coins</div>
                        <div className="text-[10px] text-slate-400">Standard sandbox currency for items & hats</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={10000000}
                        value={giveCoinsAmount}
                        onChange={(e) => setGiveCoinsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-28 bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-black text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setGiveCoinsAmount(0)}
                        className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400 transition cursor-pointer"
                        title="Reset to 0"
                      >
                        0
                      </button>
                    </div>
                  </div>

                  {/* Quick Coin Increment Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 mr-1">Quick Add:</span>
                    {[100, 500, 1000, 5000, 50000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setGiveCoinsAmount((prev) => prev + amt)}
                        className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 transition cursor-pointer"
                      >
                        +{amt >= 1000000 ? '1M' : amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TIX (Tickets) Input */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎟️</span>
                      <div>
                        <div className="text-xs font-bold text-rose-300">TIX (Tickets)</div>
                        <div className="text-[10px] text-slate-400">Classic vintage currency for mythic catalog cosmetics</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={1000000}
                        value={giveTixAmount}
                        onChange={(e) => setGiveTixAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-28 bg-slate-950 border border-rose-500/50 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-black text-rose-300 focus:outline-none focus:border-rose-400"
                      />
                      <button
                        type="button"
                        onClick={() => setGiveTixAmount(0)}
                        className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400 transition cursor-pointer"
                        title="Reset to 0"
                      >
                        0
                      </button>
                    </div>
                  </div>

                  {/* Quick TIX Increment Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 mr-1">Quick Add:</span>
                    {[25, 50, 100, 500, 2500, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setGiveTixAmount((prev) => prev + amt)}
                        className="px-2 py-0.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-300 transition cursor-pointer"
                      >
                        +{amt >= 100000 ? '100k' : amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets / Bundles */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Combo Bundles:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGiveCoinsAmount(500);
                        setGiveTixAmount(50);
                      }}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-left transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-white">🎁 Pocket Stash</div>
                      <div className="text-[10px] text-amber-300 font-mono">500 🪙 • 50 🎟️</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGiveCoinsAmount(2500);
                        setGiveTixAmount(250);
                      }}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-left transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-white">⭐ VIP Stimulus</div>
                      <div className="text-[10px] text-amber-300 font-mono">2,500 🪙 • 250 🎟️</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGiveCoinsAmount(25000);
                        setGiveTixAmount(2500);
                      }}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-left transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-white">💎 Mythic Vault</div>
                      <div className="text-[10px] text-amber-300 font-mono">25k 🪙 • 2.5k 🎟️</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGiveCoinsAmount(1000000);
                        setGiveTixAmount(100000);
                      }}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-400 text-left transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-purple-300">♾️ Infinite Wealth</div>
                      <div className="text-[10px] text-purple-200 font-mono">1M 🪙 • 100k 🎟️</div>
                    </button>
                  </div>
                </div>

                {/* Broadcast in Chat Toggle */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={broadcastInChat}
                    onChange={(e) => setBroadcastInChat(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Announce transaction in public server chat window</span>
                </label>

                {/* Give Execution Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExecuteGive('coins')}
                    disabled={giveCoinsAmount <= 0}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      giveCoinsAmount > 0
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>🪙</span>
                    <span>Give {giveCoinsAmount.toLocaleString()} Coins</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteGive('tix')}
                    disabled={giveTixAmount <= 0}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      giveTixAmount > 0
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>🎟️</span>
                    <span>Give {giveTixAmount.toLocaleString()} TIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteGive('both')}
                    disabled={giveCoinsAmount <= 0 && giveTixAmount <= 0}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      giveCoinsAmount > 0 || giveTixAmount > 0
                        ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:brightness-110 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Give Both (Coins & TIX)</span>
                  </button>
                </div>
              </div>

              {/* Lobby Players Ledger & Quick Tip Section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Lobby Players Ledger & Quick Tipping
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {lobbyPlayersList.length} Players Online
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lobbyPlayersList.map((p) => {
                    const bal = lobbyBalances[p.name] || { coins: 0, tix: 0 };
                    return (
                      <div
                        key={p.name}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-inner"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {p.badge}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                              <span className="text-amber-300">🪙 {bal.coins.toLocaleString()}</span>
                              <span>•</span>
                              <span className="text-rose-300">🎟️ {bal.tix.toLocaleString()} TIX</span>
                            </div>
                          </div>
                        </div>

                        {/* Instant Quick Tip Micro-Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickGiveToPlayer(p.name, 500, 0)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition cursor-pointer"
                            title={`Tip 500 Coins to ${p.name}`}
                          >
                            +500 🪙
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickGiveToPlayer(p.name, 0, 50)}
                            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold transition cursor-pointer"
                            title={`Tip 50 TIX to ${p.name}`}
                          >
                            +50 🎟️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLobbyPlayer(p.name);
                              setCustomPlayerName('');
                              setGiveTargetType('lobby');
                              showToast(`Target set to ${p.name}`);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                            title={`Select ${p.name} as target for custom amount`}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
