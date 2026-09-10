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
  | 'trophy';

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
export type HatType = 'none' | 'top_hat' | 'builder_helmet' | 'crown' | 'viking' | 'valkyrie' | 'cap';

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

export type WorldPreset = 'obby' | 'survival' | 'arena' | 'flat';

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
