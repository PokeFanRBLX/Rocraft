import * as THREE from 'three';
import { BlockId, FaceType } from '../types';

const textureCache = new Map<string, THREE.CanvasTexture>();

function createPixelCanvas(width: number = 64, height: number = 64): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

function wrapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Generate Minecraft & Roblox hybrid procedural textures
 */
export function getBlockTexture(blockId: BlockId, side: 'top' | 'side' | 'bottom' = 'side'): THREE.CanvasTexture {
  const cacheKey = `${blockId}_${side}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const [canvas, ctx] = createPixelCanvas(64, 64);

  switch (blockId) {
    case 'grass':
      if (side === 'top') {
        // Lush green grass top
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, 0, 64, 64);
        for (let x = 0; x < 64; x += 4) {
          for (let y = 0; y < 64; y += 4) {
            const r = Math.random();
            if (r > 0.6) {
              ctx.fillStyle = '#22c55e';
              ctx.fillRect(x, y, 4, 4);
            } else if (r < 0.2) {
              ctx.fillStyle = '#15803d';
              ctx.fillRect(x, y, 4, 4);
            }
          }
        }
      } else if (side === 'bottom') {
        // Dirt bottom
        drawDirt(ctx);
      } else {
        // Grass side with dripping overhang
        drawDirt(ctx);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 0, 64, 16);
        for (let x = 0; x < 64; x += 4) {
          const drip = Math.floor(Math.random() * 4) * 4;
          ctx.fillRect(x, 16, 4, drip);
        }
      }
      break;

    case 'dirt':
      drawDirt(ctx);
      break;

    case 'stone':
      ctx.fillStyle = '#71717a';
      ctx.fillRect(0, 0, 64, 64);
      for (let x = 0; x < 64; x += 4) {
        for (let y = 0; y < 64; y += 4) {
          const r = Math.random();
          if (r > 0.7) {
            ctx.fillStyle = '#52525b';
            ctx.fillRect(x, y, 4, 4);
          } else if (r < 0.25) {
            ctx.fillStyle = '#a1a1aa';
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      break;

    case 'wood':
      // Wooden planks
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(0, 0, 64, 64);
      for (let y = 0; y < 64; y += 16) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, y, 64, 2);
        for (let x = 0; x < 64; x += 4) {
          const r = Math.random();
          ctx.fillStyle = r > 0.5 ? '#b45309' : '#92400e';
          ctx.fillRect(x, y + 2, 4, 14);
        }
      }
      break;

    case 'leaves':
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, 64, 64);
      for (let x = 0; x < 64; x += 4) {
        for (let y = 0; y < 64; y += 4) {
          const r = Math.random();
          if (r > 0.5) {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(x, y, 4, 4);
          } else if (r < 0.25) {
            ctx.fillStyle = '#14532d';
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      break;

    case 'brick':
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#e2e8f0'; // Mortar
      for (let y = 0; y < 64; y += 16) {
        ctx.fillRect(0, y, 64, 2);
        const offset = (y / 16) % 2 === 0 ? 0 : 16;
        for (let x = offset; x < 64; x += 32) {
          ctx.fillRect(x, y, 2, 16);
        }
      }
      break;

    case 'glass':
      ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.fillRect(0, 0, 64, 64);
      // Border
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 60, 60);
      // Diagonal glare streaks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(12, 12, 16, 4);
      ctx.fillRect(36, 12, 8, 4);
      ctx.fillRect(48, 20, 4, 12);
      break;

    case 'diamond':
      // Stone with cyan diamond veins
      ctx.fillStyle = '#71717a';
      ctx.fillRect(0, 0, 64, 64);
      for (let x = 0; x < 64; x += 4) {
        for (let y = 0; y < 64; y += 4) {
          const r = Math.random();
          if (r > 0.7) {
            ctx.fillStyle = '#52525b';
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      // Diamond clusters
      const diamondClusters = [
        [16, 20], [20, 24], [24, 20],
        [40, 36], [44, 40], [48, 36], [44, 32]
      ];
      diamondClusters.forEach(([x, y]) => {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(x, y, 6, 6);
        ctx.fillStyle = '#a5f3fc';
        ctx.fillRect(x + 1, y + 1, 3, 3);
      });
      break;

    case 'gold':
      // Roblox / Minecraft Gold block with beveled look
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(4, 4, 56, 56);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(8, 8, 48, 48);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(12, 12, 40, 40);
      break;

    case 'obsidian':
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 64, 64);
      for (let x = 0; x < 64; x += 4) {
        for (let y = 0; y < 64; y += 4) {
          const r = Math.random();
          if (r > 0.8) {
            ctx.fillStyle = '#581c87';
            ctx.fillRect(x, y, 4, 4);
          } else if (r < 0.2) {
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      break;

    case 'tnt':
      if (side === 'top' || side === 'bottom') {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(32, 32, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(30, 20, 4, 12);
      } else {
        // Red with white band and TNT text
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 20, 64, 24);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 32, 32);
      }
      break;

    case 'glowstone':
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, 64, 64);
      for (let x = 0; x < 64; x += 4) {
        for (let y = 0; y < 64; y += 4) {
          const r = Math.random();
          ctx.fillStyle = r > 0.6 ? '#facc15' : r < 0.3 ? '#fde047' : '#eab308';
          ctx.fillRect(x, y, 4, 4);
        }
      }
      break;

    case 'bookshelf':
      if (side === 'top' || side === 'bottom') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 0, 64, 64);
      } else {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 0, 64, 64);
        const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea'];
        for (let row = 0; row < 2; row++) {
          const y = 8 + row * 28;
          ctx.fillStyle = '#451a03';
          ctx.fillRect(4, y, 56, 20);
          for (let b = 0; b < 7; b++) {
            ctx.fillStyle = bookColors[(b + row * 3) % bookColors.length];
            ctx.fillRect(6 + b * 7, y + 2, 6, 16);
          }
        }
      }
      break;

    case 'killbrick':
      // Roblox iconic red neon killbrick with hazard cross-hatch
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(6, 6, 52, 52);
      ctx.fillStyle = '#ffff00';
      // Warning stripes
      for (let i = -64; i < 128; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 16, 64);
        ctx.lineTo(i + 24, 64);
        ctx.lineTo(i + 8, 0);
        ctx.closePath();
        ctx.fill();
      }
      break;

    case 'trampoline':
      // Roblox bounce pad
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(32, 32, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32, 32, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(32, 32, 6, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'speedpad':
      // Roblox speed boost pad
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(4, 4, 56, 56);
      // Double chevron arrows
      ctx.fillStyle = '#ffffff';
      for (const y of [14, 34]) {
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(16, y + 14);
        ctx.lineTo(22, y + 14);
        ctx.lineTo(32, y + 5);
        ctx.lineTo(42, y + 14);
        ctx.lineTo(48, y + 14);
        ctx.closePath();
        ctx.fill();
      }
      break;

    case 'checkpoint':
      // Roblox green checkpoint pad
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(4, 4, 56, 56);
      // Checkpoint star / emblem
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 32, 32);
      break;

    case 'fadeblock':
      // Obby crumbling/disappearing platform
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(4, 4, 56, 56);
      // Cracks
      ctx.strokeStyle = '#3b0764';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(24, 30);
      ctx.lineTo(40, 20);
      ctx.lineTo(56, 56);
      ctx.moveTo(32, 32);
      ctx.lineTo(12, 52);
      ctx.stroke();
      break;

    case 'ice':
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(4, 4, 56, 56);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 10, 14, 6);
      ctx.fillRect(36, 24, 20, 4);
      ctx.fillRect(16, 44, 18, 5);
      break;

    case 'trophy':
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 4, 56, 56);
      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆', 32, 32);
      break;

    default:
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 64, 64);
      break;
  }

  // If this is the top face of a standard block, add subtle classic Roblox studs!
  if (side === 'top' && (blockId === 'stone' || blockId === 'brick' || blockId === 'gold' || blockId === 'killbrick' || blockId === 'wood')) {
    drawRobloxStuds(ctx);
  }

  const texture = wrapTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

function drawDirt(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 4) {
    for (let y = 0; y < 64; y += 4) {
      const r = Math.random();
      if (r > 0.7) {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x, y, 4, 4);
      } else if (r < 0.2) {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }
}

/**
 * Adds the iconic Roblox 2x2 circular cylinder studs on top of plastic blocks!
 */
function drawRobloxStuds(ctx: CanvasRenderingContext2D) {
  const studPositions = [
    [16, 16],
    [48, 16],
    [16, 48],
    [48, 48]
  ];

  studPositions.forEach(([x, y]) => {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Stud ring
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Center indentation
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Generates iconic Roblox Avatar faces
 */
export function getAvatarFaceTexture(faceType: FaceType): THREE.CanvasTexture {
  const cacheKey = `face_${faceType}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const [canvas, ctx] = createPixelCanvas(128, 128);

  // Transparent background
  ctx.clearRect(0, 0, 128, 128);

  ctx.fillStyle = '#111827';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  switch (faceType) {
    case 'classic_smile':
      // Two dot eyes
      ctx.beginPath();
      ctx.arc(38, 46, 8, 0, Math.PI * 2);
      ctx.arc(90, 46, 8, 0, Math.PI * 2);
      ctx.fill();
      // Curved smile
      ctx.beginPath();
      ctx.arc(64, 62, 34, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
      break;

    case 'chill':
      // Chill eyes (sunglasses)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(24, 38, 32, 20);
      ctx.fillRect(72, 38, 32, 20);
      ctx.fillRect(52, 44, 24, 6);
      // Half smirk
      ctx.beginPath();
      ctx.arc(64, 76, 22, 0.2 * Math.PI, 0.65 * Math.PI);
      ctx.stroke();
      break;

    case 'epic':
      // "Awesome / Epic Face"
      // Big round eyes with shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(38, 44, 16, 0, Math.PI * 2);
      ctx.arc(90, 44, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(38, 44, 9, 0, Math.PI * 2);
      ctx.arc(90, 44, 9, 0, Math.PI * 2);
      ctx.fill();
      // Open grinning mouth with tongue
      ctx.beginPath();
      ctx.arc(64, 72, 30, 0, Math.PI);
      ctx.fillStyle = '#7f1d1d';
      ctx.fill();
      ctx.stroke();
      break;

    case 'xd':
      // > < eyes
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(26, 36);
      ctx.lineTo(44, 46);
      ctx.lineTo(26, 56);

      ctx.moveTo(102, 36);
      ctx.lineTo(84, 46);
      ctx.lineTo(102, 56);
      ctx.stroke();

      // Big D smile
      ctx.beginPath();
      ctx.arc(64, 74, 26, 0, Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      break;

    case 'surprised':
      // Big round O eyes and O mouth
      ctx.beginPath();
      ctx.arc(38, 44, 12, 0, Math.PI * 2);
      ctx.arc(90, 44, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(64, 84, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  const texture = wrapTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
