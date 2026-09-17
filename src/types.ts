export type BlockId =
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'wood'
  | 'leaves'
  | 'brick'
  | 'glass'
  | 'diamond'
  | 'gold'
  | 'obsidian'
  | 'tnt'
  | 'glowstone'
  | 'bookshelf'
  | 'killbrick'
  | 'trampoline'
  | 'speedpad'
  | 'checkpoint'
  | 'fadeblock'
  | 'ice'
  | 'trophy'
  | 'flower'
  | 'pumpkin'
  | 'melon'
  | 'water'
  | 'carpet'
  | 'wallpaper'
  | 'doorblock';

export interface BlockDef {
  id: BlockId;
  name: string;
  category: 'minecraft' | 'roblox';
  description: string;
  color: string;
  emissive?: string;
  transparent?: boolean;
  opacity?: number;
  isHazard?: boolean;
  isBouncy?: boolean;
  isSpeedPad?: boolean;
  isCheckpoint?: boolean;
  isFading?: boolean;
  isSlippery?: boolean;
  isTrophy?: boolean;
  soundType?: 'grass' | 'stone' | 'wood' | 'metal' | 'glass';
}

export type ToolId =
  | 'pickaxe'
  | 'sword'
  | 'gravity_coil'
  | 'speed_coil'
  | 'rocket_launcher'
  | 'paint_gun'
  | 'tnt_detonator'
  | 'boombox';

export interface ToolDef {
  id: ToolId;
  name: string;
  icon: string;
  origin: 'Minecraft' | 'Roblox';
  description: string;
  color: string;
}

export interface HotbarSlot {
  type: 'tool' | 'block';
  id: ToolId | BlockId;
  count?: number;
}

export type FaceType = 'classic_smile' | 'chill' | 'epic' | 'xd' | 'surprised';
export type HatType =
  | 'none'
  | 'top_hat'
  | 'builder_helmet'
  | 'crown'
  | 'viking'
  | 'valkyrie'
  | 'cap'
  | 'dino_hood'
  | 'cyber_visor'
  | 'wizard_hat'
  | 'dominus'
  | 'halo';

export interface DailyRewardTier {
  day: number;
  coins: number;
  tix: number; // Tickets currency earned each day
  hatReward?: HatType;
  hatName?: string;
  hatDescription?: string;
  title: string;
  badge: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  perkDescription?: string;
}

export interface DailyRewardState {
  lastLoginDate: string; // YYYY-MM-DD
  lastClaimDate: string; // YYYY-MM-DD
  currentStreak: number; // 1 to 7
  totalLogins: number;
  coins: number;
  tix: number; // Classic Tickets currency balance
  unlockedHats: HatType[];
  claimedCycleDays: number[]; // Day numbers claimed in current 7-day cycle e.g. [1, 2]
  streakCycle: number; // How many cycles completed
}

export interface AvatarConfig {
  name: string;
  headColor: string;
  torsoColor: string;
  leftArmColor: string;
  rightArmColor: string;
  leftLegColor: string;
  rightLegColor: string;
  face: FaceType;
  hat: HatType;
}

export type WorldPreset = 'obby' | 'survival' | 'arena' | 'flat' | 'garden' | 'doors';

export interface WorldData {
  version: number;
  name: string;
  preset: WorldPreset;
  blocks: Record<string, BlockId>; // key: "x,y,z"
  spawnPoint: [number, number, number];
  checkpoints?: [number, number, number][];
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  score: number;
  coins: number;
  deaths: number;
  currentStage: number;
  totalStages: number;
  isGrounded: boolean;
  activeEffects: {
    lowGravity: boolean;
    speedBoost: boolean;
  };
}

export interface TargetDummy {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  name: string;
  isHit: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isOwner?: boolean;
  isSystem?: boolean;
  badge?: string;
  channel?: 'all' | 'system' | 'players';
}

export interface LobbyInfo {
  id: string;
  name: string;
  preset: WorldPreset;
  playersCount: number;
  maxPlayers: number;
  pingMs: number;
  region: string;
  hostName?: string;
  isPrivate?: boolean;
  friendsInside?: string[];
}

export interface Friend {
  id: string;
  name: string;
  avatarColors: {
    head: string;
    torso: string;
  };
  badge?: string;
  status: 'in_lobby' | 'online' | 'offline';
  currentLobby?: LobbyInfo;
  lastSeen?: string;
  isFavorite?: boolean;
}

export interface FriendRequest {
  id: string;
  fromName: string;
  timestamp: string;
  avatarHeadColor: string;
  mutualFriends?: number;
}
