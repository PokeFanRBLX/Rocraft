import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RocraftGameEngine } from './engine/gameEngine';
import { HUD } from './components/HUD';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { WorldBrowserModal } from './components/WorldBrowserModal';
import { InventoryModal } from './components/InventoryModal';
import { ControlsModal } from './components/ControlsModal';
import { VictoryModal } from './components/VictoryModal';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { OwnerPanelModal } from './components/OwnerPanelModal';
import { ChatWindow } from './components/ChatWindow';
import { FriendsModal } from './components/FriendsModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { AvatarConfig, HotbarSlot, WorldPreset, BlockId, LobbyInfo, HatType, DailyRewardState } from './types';
import { soundEngine } from './utils/audio';
import { isOwnerName } from './utils/ranks';
import { loadStoredFriends } from './utils/friendsStorage';
import { recordUserLogin, loadDailyRewardState, addCoinsToBalance, addTixToBalance } from './utils/dailyRewardStorage';

const DEFAULT_AVATAR: AvatarConfig = {
  name: 'PokeFan_',
  headColor: '#facc15',
  torsoColor: '#0284c7',
  leftArmColor: '#facc15',
  rightArmColor: '#facc15',
  leftLegColor: '#16a34a',
  rightLegColor: '#16a34a',
  face: 'chill',
  hat: 'crown'
};

const DEFAULT_HOTBAR: HotbarSlot[] = [
  { type: 'tool', id: 'pickaxe' },
  { type: 'tool', id: 'sword' },
  { type: 'tool', id: 'boombox' },
  { type: 'tool', id: 'gravity_coil' },
  { type: 'tool', id: 'speed_coil' },
  { type: 'tool', id: 'rocket_launcher' },
  { type: 'tool', id: 'paint_gun' },
  { type: 'tool', id: 'tnt_detonator' },
  { type: 'block', id: 'grass' }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RocraftGameEngine | null>(null);

  // Avatar Configuration
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('rocraft_avatar');
      return saved ? JSON.parse(saved) : DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  // Hotbar state
  const [hotbarSlots, setHotbarSlots] = useState<HotbarSlot[]>(DEFAULT_HOTBAR);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  // Gameplay HUD state
  const [health, setHealth] = useState<number>(100);
  const [maxHealth] = useState<number>(100);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [deaths, setDeaths] = useState<number>(0);
  const [worldPreset, setWorldPreset] = useState<WorldPreset>('obby');
  const [worldName, setWorldName] = useState<string>('Rocraft Mega Obby');
  const [isFirstPerson, setIsFirstPerson] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [targetedBlockId, setTargetedBlockId] = useState<string | null>(null);
  const [activeEffects, setActiveEffects] = useState({ lowGravity: false, speedBoost: false });
  const [checkpointMessage, setCheckpointMessage] = useState<string | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  // Modals state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [isWorldModalOpen, setIsWorldModalOpen] = useState<boolean>(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState<boolean>(false);
  const [isControlsModalOpen, setIsControlsModalOpen] = useState<boolean>(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState<boolean>(false);
  const [isOwnerPanelOpen, setIsOwnerPanelOpen] = useState<boolean>(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [isDailyRewardModalOpen, setIsDailyRewardModalOpen] = useState<boolean>(false);
  const [dailyRewardState, setDailyRewardState] = useState<DailyRewardState>(() => loadDailyRewardState());
  const [currentLobby, setCurrentLobby] = useState<LobbyInfo | null>(null);
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
  const [onlineFriendsCount, setOnlineFriendsCount] = useState<number>(() => {
    try {
      return loadStoredFriends().filter((f) => f.status !== 'offline').length;
    } catch {
      return 6;
    }
  });
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(soundEngine.isMusicActive());
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [chatNotification, setChatNotification] = useState<string | null>(null);

  const isOwner = isOwnerName(avatarConfig.name);

  // Subscribe to music state changes
  useEffect(() => {
    const unsub = soundEngine.subscribeMusicState(() => {
      setIsMusicPlaying(soundEngine.isMusicActive());
      setIsMuted(soundEngine.getMuted());
    });
    return unsub;
  }, []);

  // Autoplay music upon first user interaction (satisfies browser audio restrictions)
  useEffect(() => {
    const startAudioOnFirstInteraction = () => {
      if (!soundEngine.isMusicActive() && !soundEngine.getMuted()) {
        soundEngine.startMusic();
      }
      window.removeEventListener('click', startAudioOnFirstInteraction);
      window.removeEventListener('keydown', startAudioOnFirstInteraction);
    };

    window.addEventListener('click', startAudioOnFirstInteraction, { once: true });
    window.addEventListener('keydown', startAudioOnFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', startAudioOnFirstInteraction);
      window.removeEventListener('keydown', startAudioOnFirstInteraction);
    };
  }, []);

  // Track daily login streak on mount and auto-prompt if reward is ready
  useEffect(() => {
    const loginResult = recordUserLogin();
    setDailyRewardState(loginResult);

    // If today's login reward is ready, gently open the daily reward window
    if (loginResult.canClaimToday) {
      const timer = setTimeout(() => {
        setIsDailyRewardModalOpen(true);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }, 750);
      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new RocraftGameEngine(canvasRef.current, avatarConfig, worldPreset);
    engineRef.current = engine;

    // Connect Engine Callbacks
    engine.physics.onHealthChange = (hp) => {
      setHealth(hp);
      setDeaths(engine.physics.deaths);
    };

    engine.physics.onStageChange = (stage) => {
      setCurrentStage(stage);
      const msg = stage === 1 ? '★ Spawn Checkpoint Set!' : `★ Stage ${stage} Checkpoint Saved!`;
      setCheckpointMessage(msg);
      setChatNotification(msg);
      setTimeout(() => setCheckpointMessage(null), 3200);
    };

    engine.onPointerLockChange = (locked) => {
      setIsPointerLocked(locked);
    };

    engine.physics.onVictory = () => {
      setIsVictoryModalOpen(true);
      setChatNotification(`🏆 ${avatarConfig.name} completed the obby!`);
    };

    engine.onDayTimeChange = (_time, night) => {
      setIsNight(night);
    };

    engine.onTargetBlockChange = (blockId) => {
      setTargetedBlockId(blockId);
    };

    const handleResize = () => {
      engine.handleResize();
    };
    window.addEventListener('resize', handleResize);

    // Initial slot setup
    engine.setActiveItem(hotbarSlots[activeSlotIndex]);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  // Update engine active slot when state changes
  useEffect(() => {
    if (!engineRef.current) return;
    const slot = hotbarSlots[activeSlotIndex];
    if (slot) {
      engineRef.current.setActiveItem(slot);
      setActiveEffects({
        lowGravity: slot.type === 'tool' && slot.id === 'gravity_coil',
        speedBoost: slot.type === 'tool' && slot.id === 'speed_coil'
      });
    }
  }, [activeSlotIndex, hotbarSlots]);

  // Global keybinds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is currently typing in an input or textarea, ignore game hotkeys
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        // If typing in input and presses ']' when empty, toggle close chat
        if ((e.key === ']' || e.code === 'BracketRight') && (document.activeElement as HTMLInputElement).value === '') {
          e.preventDefault();
          (document.activeElement as HTMLElement).blur();
          setIsChatOpen(false);
        }
        return;
      }

      // ']' Key toggles Multiplayer Chat (Open/Close)
      if (e.key === ']' || e.code === 'BracketRight') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        return;
      }

      // '/' Key opens Multiplayer Chat (Classic Roblox & Minecraft muscle memory)
      if (e.key === '/') {
        e.preventDefault();
        setIsChatOpen(true);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        return;
      }

      // '#' Key toggle for Owner Control Panel (works even if other modals are closed)
      if (e.key === '#' || (e.shiftKey && e.code === 'Digit3')) {
        // Prevent typing into gameplay
        if (isOwnerName(avatarConfig.name)) {
          e.preventDefault();
          setIsOwnerPanelOpen((prev) => {
            const next = !prev;
            if (next) {
              soundEngine.playOwnerFanfare();
              if (document.pointerLockElement) {
                document.exitPointerLock();
              }
            }
            return next;
          });
          return;
        } else {
          setCheckpointMessage('🔒 ACCESS DENIED: Owner Rank Required (Name must be "PokeFan_")');
          setTimeout(() => setCheckpointMessage(null), 3000);
          soundEngine.playOof();
          return;
        }
      }

      if (
        isAvatarModalOpen ||
        isWorldModalOpen ||
        isInventoryModalOpen ||
        isControlsModalOpen ||
        isVictoryModalOpen ||
        isMusicModalOpen ||
        isOwnerPanelOpen ||
        isFriendsModalOpen ||
        isDailyRewardModalOpen
      ) {
        if (e.key === 'Escape') {
          setIsAvatarModalOpen(false);
          setIsWorldModalOpen(false);
          setIsInventoryModalOpen(false);
          setIsControlsModalOpen(false);
          setIsVictoryModalOpen(false);
          setIsMusicModalOpen(false);
          setIsOwnerPanelOpen(false);
          setIsFriendsModalOpen(false);
          setIsDailyRewardModalOpen(false);
        }
        return;
      }

      // Hotbar selection 1-9
      if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9) {
          setActiveSlotIndex(digit - 1);
        }
      }

      // 'G' Key opens Daily Login Rewards & Streaks
      if (e.code === 'KeyG') {
        setIsDailyRewardModalOpen(true);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }

      // 'F' Key opens Friends & Multiplayer Lobbies
      if (e.code === 'KeyF') {
        setIsFriendsModalOpen(true);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }

      // 'B' Key opens Boombox & Soundtrack Player
      if (e.code === 'KeyB') {
        setIsMusicModalOpen(true);
      }

      // 'E' Key opens Inventory Catalog
      if (e.code === 'KeyE') {
        setIsInventoryModalOpen(true);
      }

      // 'V' Key updates perspective state
      if (e.code === 'KeyV' || e.code === 'F5') {
        if (engineRef.current) {
          setIsFirstPerson(engineRef.current.isFirstPerson);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAvatarModalOpen,
    isWorldModalOpen,
    isInventoryModalOpen,
    isControlsModalOpen,
    isVictoryModalOpen,
    isMusicModalOpen,
    isOwnerPanelOpen,
    isFriendsModalOpen,
    isDailyRewardModalOpen,
    avatarConfig.name
  ]);

  // Update online friends count periodically or when storage updates
  useEffect(() => {
    const updateCount = () => {
      try {
        const count = loadStoredFriends().filter((f) => f.status !== 'offline').length;
        setOnlineFriendsCount(count);
      } catch {}
    };

    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 12000);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  // Actions
  const handleTogglePerspective = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePerspective();
      setIsFirstPerson(engineRef.current.isFirstPerson);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleResetCharacter = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.physics.killPlayer();
    }
  }, []);

  const handleSaveAvatar = (newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    try {
      localStorage.setItem('rocraft_avatar', JSON.stringify(newConfig));
    } catch {}
    if (engineRef.current) {
      engineRef.current.avatar.updateConfig(newConfig);
      engineRef.current.firstPersonViewmodel.updateArmColor(newConfig.rightArmColor || newConfig.headColor);
    }
  };

  const handleEquipHat = useCallback((hat: HatType) => {
    setAvatarConfig((prev) => {
      const next = { ...prev, hat };
      try {
        localStorage.setItem('rocraft_avatar', JSON.stringify(next));
      } catch {}
      if (engineRef.current) {
        engineRef.current.avatar.updateConfig(next);
      }
      return next;
    });
    setChatNotification(`👒 Equipped exclusive accessory: ${hat.replace('_', ' ')}!`);
    setTimeout(() => setChatNotification(null), 4000);
  }, []);

  const handleSelectPreset = (preset: WorldPreset) => {
    setWorldPreset(preset);
    if (engineRef.current) {
      engineRef.current.loadPreset(preset);
      const newName = engineRef.current.world.name;
      setWorldName(newName);
      setCurrentStage(1);
      setChatNotification(`World loaded: ${newName}`);
    }
  };

  const handleJoinLobby = useCallback((lobby: LobbyInfo, friendName?: string) => {
    setCurrentLobby(lobby);
    handleSelectPreset(lobby.preset);
    soundEngine.playJoinLobby();
    const friendLabel = friendName ? `${friendName}'s ` : '';
    setChatNotification(`🚀 Connected to ${friendLabel}lobby "${lobby.name}"! (${lobby.playersCount + 1}/${lobby.maxPlayers} Players • ${lobby.pingMs}ms)`);
    setCheckpointMessage(`★ Joined Lobby: ${lobby.name}`);
    setTimeout(() => setCheckpointMessage(null), 4000);
  }, []);

  const handleExportWorld = () => {
    if (engineRef.current) {
      return engineRef.current.world.exportJSON();
    }
    return '{}';
  };

  const handleImportWorld = (jsonStr: string) => {
    if (engineRef.current) {
      engineRef.current.world.importJSON(jsonStr);
      engineRef.current.physics.resetPlayerToSpawn();
      setWorldName(engineRef.current.world.name);
    }
  };

  const handleResetWorld = () => {
    if (engineRef.current) {
      engineRef.current.loadPreset(worldPreset);
    }
  };

  const handleAssignToSlot = (slotIndex: number, item: HotbarSlot) => {
    setHotbarSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = item;
      return next;
    });
    setActiveSlotIndex(slotIndex);
  };

  // Mobile action controls
  const handleMobileAttack = () => {
    if (engineRef.current) {
      engineRef.current.handlePrimaryAction();
    }
  };

  const handleMobilePlace = () => {
    if (engineRef.current) {
      engineRef.current.handleSecondaryAction();
    }
  };

  const handleMobileJump = () => {
    if (engineRef.current) {
      if (engineRef.current.physics.isGrounded) {
        const hasGrav = engineRef.current.avatar.heldToolId === 'gravity_coil';
        engineRef.current.physics.playerVel.y = hasGrav ? 14.0 : 8.8;
        engineRef.current.physics.isGrounded = false;
        if (hasGrav) soundEngine.playGravityBoing();
        else soundEngine.playJump();
      }
    }
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
        try {
          const trackName = await soundEngine.loadCustomTrackFile(file);
          setCheckpointMessage(`★ Soundtrack Loaded: "${trackName}"`);
          setTimeout(() => setCheckpointMessage(null), 4000);
          setIsMusicPlaying(true);
        } catch (err) {
          console.error('Failed to load dropped soundtrack', err);
        }
      }
    }
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGlobalDrop}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair focus:outline-none"
        tabIndex={0}
      />

      {/* In-Game HUD (Roblox topbar + Minecraft hotbar & health) */}
      <HUD
        health={health}
        maxHealth={maxHealth}
        currentStage={currentStage}
        deaths={deaths}
        worldName={worldName}
        isFirstPerson={isFirstPerson}
        isPointerLocked={isPointerLocked}
        checkpointMessage={checkpointMessage}
        isMuted={isMuted}
        isNight={isNight}
        isMusicPlaying={isMusicPlaying}
        activeSlot={hotbarSlots[activeSlotIndex] || hotbarSlots[0]}
        hotbarSlots={hotbarSlots}
        activeEffects={activeEffects}
        targetedBlockId={targetedBlockId}
        onTogglePerspective={handleTogglePerspective}
        onToggleMute={handleToggleMute}
        onOpenMusicModal={() => setIsMusicModalOpen(true)}
        onResetCharacter={handleResetCharacter}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
        onOpenWorldModal={() => setIsWorldModalOpen(true)}
        onOpenInventoryModal={() => setIsInventoryModalOpen(true)}
        onOpenControlsModal={() => setIsControlsModalOpen(true)}
        onSelectSlot={(idx) => {
          setActiveSlotIndex(idx);
          if (hotbarSlots[idx]?.type === 'tool' && hotbarSlots[idx]?.id === 'boombox') {
            soundEngine.startMusic();
          }
        }}
        onMobileJump={handleMobileJump}
        onMobileAttack={handleMobileAttack}
        onMobilePlace={handleMobilePlace}
        isOwner={isOwner}
        playerName={avatarConfig.name}
        activeAnnouncement={activeAnnouncement}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onOpenFriendsModal={() => {
          setIsFriendsModalOpen(true);
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }}
        onlineFriendsCount={onlineFriendsCount}
        currentLobbyName={currentLobby?.name}
        coins={dailyRewardState.coins}
        tix={dailyRewardState.tix}
        onOpenDailyRewardModal={() => {
          setIsDailyRewardModalOpen(true);
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }}
        canClaimDailyReward={dailyRewardState.canClaimToday}
        currentStreak={dailyRewardState.currentStreak}
        onOpenOwnerPanel={() => {
          setIsOwnerPanelOpen(true);
          soundEngine.playOwnerFanfare();
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }}
      />

      {/* Multiplayer Chat Window with Rainbow-Text for OWNER Messages */}
      <ChatWindow
        playerName={avatarConfig.name}
        isOwner={isOwner}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen((prev) => !prev)}
        systemNotification={chatNotification}
        worldName={worldName}
        onOpenOwnerPanel={() => {
          setIsOwnerPanelOpen(true);
          soundEngine.playOwnerFanfare();
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }}
        onOpenFriendsModal={() => {
          setIsFriendsModalOpen(true);
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }}
        whisperTarget={whisperTarget}
        onClearWhisper={() => setWhisperTarget(null)}
        onExecuteCommand={(cmd) => {
          if (cmd === 'oof' || cmd === 'die' || cmd === 'reset') {
            handleResetCharacter();
          }
        }}
      />

      {/* Friends & Multiplayer Lobbies Modal (Key: F) */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        currentPreset={worldPreset}
        currentLobby={currentLobby}
        onJoinLobby={handleJoinLobby}
        onOpenChatWithWhisper={(targetPlayer) => {
          setWhisperTarget(targetPlayer);
          setIsChatOpen(true);
        }}
      />

      {/* Owner Control Panel Modal (Opened by # or topbar button) */}
      <OwnerPanelModal
        isOpen={isOwnerPanelOpen}
        onClose={() => setIsOwnerPanelOpen(false)}
        physics={engineRef.current?.physics ?? null}
        gameEngine={engineRef.current}
        avatarConfig={avatarConfig}
        onUpdateAvatarConfig={handleSaveAvatar}
        onBroadcastAnnouncement={(msg) => {
          setActiveAnnouncement(msg);
          setTimeout(() => setActiveAnnouncement(null), 8000);
        }}
        currentLobby={currentLobby}
        myCoins={dailyRewardState.coins}
        myTix={dailyRewardState.tix || 0}
        onGiveMyCurrency={(coinsDelta, tixDelta) => {
          let newCoins = dailyRewardState.coins;
          let newTix = dailyRewardState.tix || 0;
          if (coinsDelta > 0) {
            newCoins = addCoinsToBalance(coinsDelta);
          }
          if (tixDelta > 0) {
            newTix = addTixToBalance(tixDelta);
          }
          setDailyRewardState((prev) => ({
            ...prev,
            coins: newCoins,
            tix: newTix
          }));
        }}
        onSendChatMessage={(msg) => {
          setChatNotification(msg);
          setTimeout(() => {
            setChatNotification((prev) => (prev === msg ? null : prev));
          }, 4000);
        }}
      />

      {/* Boombox & Soundtrack Modal */}
      <MusicPlayerModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
      />

      {/* Avatar Customizer Modal */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        currentConfig={avatarConfig}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleSaveAvatar}
        onOpenDailyRewards={() => {
          setIsAvatarModalOpen(false);
          setIsDailyRewardModalOpen(true);
        }}
        onCoinsChanged={(newBalance) => {
          setDailyRewardState((prev) => ({ ...prev, coins: newBalance }));
        }}
        onTixChanged={(newTix) => {
          setDailyRewardState((prev) => ({ ...prev, tix: newTix }));
        }}
      />

      {/* Daily Login Rewards & Streaks Modal (Key: G) */}
      <DailyRewardModal
        isOpen={isDailyRewardModalOpen}
        onClose={() => setIsDailyRewardModalOpen(false)}
        onEquipHat={handleEquipHat}
        onCoinsChanged={(newBalance) => {
          setDailyRewardState((prev) => ({ ...prev, coins: newBalance }));
        }}
        onTixChanged={(newTix) => {
          setDailyRewardState((prev) => ({ ...prev, tix: newTix }));
        }}
      />

      {/* World Browser Modal */}
      <WorldBrowserModal
        isOpen={isWorldModalOpen}
        currentPreset={worldPreset}
        onClose={() => setIsWorldModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        onExportWorld={handleExportWorld}
        onImportWorld={handleImportWorld}
        onResetWorld={handleResetWorld}
      />

      {/* Inventory & Gear Catalog Modal */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onAssignToSlot={handleAssignToSlot}
      />

      {/* Keybinds & Controls Guide Modal */}
      <ControlsModal
        isOpen={isControlsModalOpen}
        onClose={() => setIsControlsModalOpen(false)}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        stage={currentStage}
        deaths={deaths}
        onClose={() => setIsVictoryModalOpen(false)}
        onPlayAgain={() => {
          if (engineRef.current) {
            engineRef.current.physics.resetPlayerToSpawn();
            setCurrentStage(1);
          }
        }}
        onOpenWorlds={() => setIsWorldModalOpen(true)}
      />
    </main>
  );
}
