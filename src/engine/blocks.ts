import * as THREE from 'three';
import { BlockDef, BlockId, ToolDef, ToolId } from '../types';
import { getBlockTexture } from './textures';

export const BLOCK_DEFINITIONS: Record<BlockId, BlockDef> = {
  grass: {
    id: 'grass',
    name: 'Grass Block',
    category: 'minecraft',
    description: 'Classic lush voxel soil block with grass top.',
    color: '#22c55e',
    soundType: 'grass'
  },
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    category: 'minecraft',
    description: 'Rich fertile ground block for farming and landscaping.',
    color: '#78350f',
    soundType: 'grass'
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    category: 'minecraft',
    description: 'Solid foundation rock found deep beneath the surface.',
    color: '#71717a',
    soundType: 'stone'
  },
  wood: {
    id: 'wood',
    name: 'Wood Planks',
    category: 'minecraft',
    description: 'Standard wooden building material crafted from logs.',
    color: '#b45309',
    soundType: 'wood'
  },
  leaves: {
    id: 'leaves',
    name: 'Oak Leaves',
    category: 'minecraft',
    description: 'Crisp green tree canopy block.',
    color: '#16a34a',
    transparent: true,
    opacity: 0.9,
    soundType: 'grass'
  },
  brick: {
    id: 'brick',
    name: 'Red Bricks',
    category: 'minecraft',
    description: 'Sturdy kiln-fired clay bricks for houses and castles.',
    color: '#b91c1c',
    soundType: 'stone'
  },
  glass: {
    id: 'glass',
    name: 'Glass Window',
    category: 'minecraft',
    description: 'See-through transparent glass pane.',
    color: '#bae6fd',
    transparent: true,
    opacity: 0.45,
    soundType: 'glass'
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Ore',
    category: 'minecraft',
    description: 'Precious sparkling blue gemstone ore.',
    color: '#06b6d4',
    soundType: 'stone'
  },
  gold: {
    id: 'gold',
    name: 'Gold Block',
    category: 'minecraft',
    description: 'Heavy solid gold block with brilliant luster.',
    color: '#fbbf24',
    soundType: 'metal'
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    category: 'minecraft',
    description: 'Blast-resistant volcanic rock forged from lava and water.',
    color: '#18181b',
    soundType: 'stone'
  },
  tnt: {
    id: 'tnt',
    name: 'TNT Explosive',
    category: 'minecraft',
    description: 'High-yield explosive block. Detonate with tool or click!',
    color: '#ef4444',
    soundType: 'wood'
  },
  glowstone: {
    id: 'glowstone',
    name: 'Glowstone Lamp',
    category: 'minecraft',
    description: 'Radiant luminous crystal block that shines in darkness.',
    color: '#fde047',
    emissive: '#facc15',
    soundType: 'glass'
  },
  bookshelf: {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'minecraft',
    description: 'Scholarly shelf stocked with ancient spell tomes.',
    color: '#78350f',
    soundType: 'wood'
  },
  killbrick: {
    id: 'killbrick',
    name: 'Roblox Killbrick',
    category: 'roblox',
    description: 'Iconic glowing red hazard block! Instant OOF on touch.',
    color: '#ff0033',
    emissive: '#ff0033',
    isHazard: true,
    soundType: 'metal'
  },
  trampoline: {
    id: 'trampoline',
    name: 'Bounce Trampoline',
    category: 'roblox',
    description: 'High-power spring block that launches players into the sky!',
    color: '#0284c7',
    emissive: '#0369a1',
    isBouncy: true,
    soundType: 'wood'
  },
  speedpad: {
    id: 'speedpad',
    name: 'Speed Boost Pad',
    category: 'roblox',
    description: 'Roblox obby booster pad that accelerates you forward!',
    color: '#eab308',
    emissive: '#ca8a04',
    isSpeedPad: true,
    soundType: 'stone'
  },
  checkpoint: {
    id: 'checkpoint',
    name: 'Stage Checkpoint',
    category: 'roblox',
    description: 'Green glowing pad that saves your stage & respawn point.',
    color: '#22c55e',
    emissive: '#16a34a',
    isCheckpoint: true,
    soundType: 'stone'
  },
  fadeblock: {
    id: 'fadeblock',
    name: 'Disappearing Platform',
    category: 'roblox',
    description: 'Classic obby puzzle block that crumbles and vanishes!',
    color: '#a855f7',
    isFading: true,
    soundType: 'glass'
  },
  ice: {
    id: 'ice',
    name: 'Slippery Ice',
    category: 'minecraft',
    description: 'Low-friction ice surface for drifting and speed running.',
    color: '#7dd3fc',
    transparent: true,
    opacity: 0.85,
    isSlippery: true,
    soundType: 'glass'
  },
  trophy: {
    id: 'trophy',
    name: 'Finish Star Trophy',
    category: 'roblox',
    description: 'The ultimate Obby victory goal! Complete the course to win.',
    color: '#eab308',
    emissive: '#facc15',
    isTrophy: true,
    soundType: 'metal'
  }
};

export const TOOL_DEFINITIONS: Record<ToolId, ToolDef> = {
  pickaxe: {
    id: 'pickaxe',
    name: 'Voxel Multi-Tool',
    icon: '⛏️',
    origin: 'Minecraft',
    description: 'Mine blocks with Left Click, place blocks with Right Click.',
    color: '#06b6d4'
  },
  sword: {
    id: 'sword',
    name: 'Classic Rocraft Sword',
    icon: '🗡️',
    origin: 'Roblox',
    description: 'Slash enemies and target dummies with high knockback!',
    color: '#3b82f6'
  },
  gravity_coil: {
    id: 'gravity_coil',
    name: 'Gravity Coil',
    icon: '🌀',
    origin: 'Roblox',
    description: 'Hold to reduce gravity and perform massive lunar jumps!',
    color: '#38bdf8'
  },
  speed_coil: {
    id: 'speed_coil',
    name: 'Speed Coil',
    icon: '⚡',
    origin: 'Roblox',
    description: 'Hold to run 2.2x faster with energetic particle trails!',
    color: '#ef4444'
  },
  rocket_launcher: {
    id: 'rocket_launcher',
    name: 'Rocket Launcher',
    icon: '🚀',
    origin: 'Roblox',
    description: 'Fires explosive rockets that blast voxels and obstacles away!',
    color: '#22c55e'
  },
  paint_gun: {
    id: 'paint_gun',
    name: 'Paint Gun',
    icon: '🎨',
    origin: 'Roblox',
    description: 'Click to spray and change the color/material of blocks.',
    color: '#ec4899'
  },
  tnt_detonator: {
    id: 'tnt_detonator',
    name: 'TNT Remote Detonator',
    icon: '💣',
    origin: 'Minecraft',
    description: 'Place and ignite primed explosive TNT blocks instantly!',
    color: '#dc2626'
  },
  boombox: {
    id: 'boombox',
    name: 'Golden Boombox',
    icon: '📻',
    origin: 'Roblox',
    description: 'Iconic Roblox Golden Boombox! Plays Chill Lofi Boom Bap or custom soundtracks with musical note effects.',
    color: '#f59e0b'
  }
};

// Material Cache for Three.js
const materialCache = new Map<string, THREE.Material[]>();

export function getBlockMaterials(blockId: BlockId): THREE.Material[] {
  if (materialCache.has(blockId)) {
    return materialCache.get(blockId)!;
  }

  const def = BLOCK_DEFINITIONS[blockId] || BLOCK_DEFINITIONS.stone;
  const topTex = getBlockTexture(blockId, 'top');
  const sideTex = getBlockTexture(blockId, 'side');
  const bottomTex = getBlockTexture(blockId, 'bottom');

  const createMat = (tex: THREE.CanvasTexture) => {
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.7,
      metalness: blockId === 'gold' ? 0.8 : 0.1,
      transparent: !!def.transparent,
      opacity: def.opacity ?? 1.0,
      emissive: def.emissive ? new THREE.Color(def.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: def.emissive ? 0.6 : 0
    });
  };

  // Cube materials order: +X, -X, +Y (top), -Y (bottom), +Z, -Z
  const materials = [
    createMat(sideTex),   // +X
    createMat(sideTex),   // -X
    createMat(topTex),    // +Y (top)
    createMat(bottomTex), // -Y (bottom)
    createMat(sideTex),   // +Z
    createMat(sideTex)    // -Z
  ];

  materialCache.set(blockId, materials);
  return materials;
}
