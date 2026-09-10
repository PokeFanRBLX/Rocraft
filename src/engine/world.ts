import * as THREE from 'three';
import { BlockId, WorldData, WorldPreset } from '../types';
import { BLOCK_DEFINITIONS, getBlockMaterials } from './blocks';

export class VoxelWorld {
  public scene: THREE.Scene;
  public blocks: Map<string, BlockId> = new Map();
  public meshMap: Map<string, THREE.Mesh> = new Map();
  public worldGroup: THREE.Group;
  public sharedGeometry: THREE.BoxGeometry;
  public checkpoints: [number, number, number][] = [];
  public spawnPoint: [number, number, number] = [0, 2, 0];
  public preset: WorldPreset = 'obby';
  public name: string = 'Rocraft Obby';

  // Fading blocks state
  private fadingBlocks: Map<string, { timer: number; mesh: THREE.Mesh; blockId: BlockId }> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
  }

  public static key(x: number, y: number, z: number): string {
    return `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
  }

  public static parseKey(key: string): [number, number, number] {
    const parts = key.split(',').map(Number);
    return [parts[0], parts[1], parts[2]];
  }

  public clear() {
    this.meshMap.forEach((mesh) => {
      this.worldGroup.remove(mesh);
    });
    this.meshMap.clear();
    this.blocks.clear();
    this.fadingBlocks.clear();
    this.checkpoints = [];
  }

  public setBlock(x: number, y: number, z: number, blockId: BlockId): THREE.Mesh {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = VoxelWorld.key(rx, ry, rz);

    // If block exists at this pos, remove old mesh
    if (this.meshMap.has(key)) {
      const oldMesh = this.meshMap.get(key)!;
      this.worldGroup.remove(oldMesh);
      this.meshMap.delete(key);
    }

    this.blocks.set(key, blockId);

    const materials = getBlockMaterials(blockId);
    const mesh = new THREE.Mesh(this.sharedGeometry, materials);
    mesh.position.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { blockId, rx, ry, rz, key };

    this.worldGroup.add(mesh);
    this.meshMap.set(key, mesh);

    return mesh;
  }

  public removeBlock(x: number, y: number, z: number): BlockId | null {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = VoxelWorld.key(rx, ry, rz);

    if (this.blocks.has(key)) {
      const blockId = this.blocks.get(key)!;
      this.blocks.delete(key);

      if (this.meshMap.has(key)) {
        const mesh = this.meshMap.get(key)!;
        this.worldGroup.remove(mesh);
        this.meshMap.delete(key);
      }
      return blockId;
    }
    return null;
  }

  public getBlock(x: number, y: number, z: number): BlockId | null {
    return this.blocks.get(VoxelWorld.key(x, y, z)) || null;
  }

  public hasBlock(x: number, y: number, z: number): boolean {
    return this.blocks.has(VoxelWorld.key(x, y, z));
  }

  /**
   * Handle fading platform when player steps on it
   */
  public triggerFadeBlock(x: number, y: number, z: number) {
    const key = VoxelWorld.key(x, y, z);
    if (this.fadingBlocks.has(key)) return;

    const mesh = this.meshMap.get(key);
    const blockId = this.blocks.get(key);
    if (!mesh || !blockId) return;

    this.fadingBlocks.set(key, {
      timer: 0.8, // 0.8 seconds before vanishing
      mesh,
      blockId
    });
  }

  public update(delta: number) {
    // Update disappearing/fading blocks
    if (this.fadingBlocks.size > 0) {
      this.fadingBlocks.forEach((info, key) => {
        info.timer -= delta;
        const scale = Math.max(0, info.timer / 0.8);
        info.mesh.scale.set(scale, scale, scale);

        if (info.timer <= 0) {
          const [bx, by, bz] = VoxelWorld.parseKey(key);
          this.removeBlock(bx, by, bz);
          this.fadingBlocks.delete(key);

          // Respawn the fading block after 3.5 seconds
          setTimeout(() => {
            this.setBlock(bx, by, bz, info.blockId);
          }, 3500);
        }
      });
    }
  }

  /**
   * Explode a spherical radius of blocks (for TNT & Rockets)
   */
  public explode(centerX: number, centerY: number, centerZ: number, radius: number = 3): [number, number, number, BlockId][] {
    const destroyed: [number, number, number, BlockId][] = [];
    const minX = Math.floor(centerX - radius);
    const maxX = Math.ceil(centerX + radius);
    const minY = Math.floor(centerY - radius);
    const maxY = Math.ceil(centerY + radius);
    const minZ = Math.floor(centerZ - radius);
    const maxZ = Math.ceil(centerZ + radius);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const distSq = (x - centerX) ** 2 + (y - centerY) ** 2 + (z - centerZ) ** 2;
          if (distSq <= radius ** 2) {
            const block = this.getBlock(x, y, z);
            // Obsidian is blast resistant!
            if (block && block !== 'obsidian') {
              this.removeBlock(x, y, z);
              destroyed.push([x, y, z, block]);
            }
          }
        }
      }
    }
    return destroyed;
  }

  // ================= PRESET GENERATORS ================= //

  public generatePreset(preset: WorldPreset) {
    this.clear();
    this.preset = preset;

    if (preset === 'obby') {
      this.generateMegaObby();
    } else if (preset === 'survival') {
      this.generateSurvivalWilderness();
    } else if (preset === 'arena') {
      this.generateCastleArena();
    } else {
      this.generateFlatCanvas();
    }
  }

  private generateMegaObby() {
    this.name = 'Rocraft Mega Obby';
    this.checkpoints = [];

    // Stage 1: Spawn Island (0, 0, 0)
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        this.setBlock(x, 0, z, 'wood');
      }
    }
    // Checkpoint 1 (embedded in floor)
    this.setBlock(0, 0, 0, 'checkpoint');
    this.checkpoints.push([0, 1.1, 0]);
    this.spawnPoint = [0, 1.1, 0];

    // Welcome archway
    this.setBlock(-3, 1, 0, 'gold');
    this.setBlock(-3, 2, 0, 'gold');
    this.setBlock(-3, 3, 0, 'gold');
    this.setBlock(3, 1, 0, 'gold');
    this.setBlock(3, 2, 0, 'gold');
    this.setBlock(3, 3, 0, 'gold');
    for (let x = -3; x <= 3; x++) {
      this.setBlock(x, 4, 0, 'glowstone');
    }

    // Stage 2: Stepping Stones over void
    const jumps1 = [
      [0, 1, 6],
      [2, 1, 9],
      [-1, 2, 12],
      [1, 2, 15],
      [0, 3, 18],
      [-2, 3, 21],
      [0, 4, 25]
    ];
    jumps1.forEach(([x, y, z]) => {
      this.setBlock(x, y, z, 'stone');
    });

    // Checkpoint 2 platform
    for (let x = -2; x <= 2; x++) {
      for (let z = 27; z <= 31; z++) {
        this.setBlock(x, 4, z, 'brick');
      }
    }
    this.setBlock(0, 4, 29, 'checkpoint');
    this.checkpoints.push([0, 5.1, 29]);

    // Stage 3: Killbrick Laser Jump Ropes! (Red neon blocks you must hop over)
    for (let z = 33; z <= 50; z++) {
      // Runway path
      this.setBlock(-1, 4, z, 'stone');
      this.setBlock(0, 4, z, 'stone');
      this.setBlock(1, 4, z, 'stone');

      // Hazard lasers every 4 blocks
      if (z === 36 || z === 41 || z === 46) {
        this.setBlock(-1, 5, z, 'killbrick');
        this.setBlock(0, 5, z, 'killbrick');
        this.setBlock(1, 5, z, 'killbrick');
      }
    }

    // Checkpoint 3 platform
    for (let x = -2; x <= 2; x++) {
      for (let z = 52; z <= 56; z++) {
        this.setBlock(x, 4, z, 'wood');
      }
    }
    this.setBlock(0, 4, 54, 'checkpoint');
    this.checkpoints.push([0, 5.1, 54]);

    // Stage 4: Trampoline Bounce Mega Leap
    this.setBlock(0, 4, 58, 'trampoline');
    this.setBlock(0, 4, 59, 'trampoline');

    // Floating sky island waiting high above at Y=14, Z=75
    for (let x = -3; x <= 3; x++) {
      for (let z = 73; z <= 79; z++) {
        this.setBlock(x, 14, z, 'grass');
        this.setBlock(x, 13, z, 'dirt');
      }
    }
    this.setBlock(0, 14, 76, 'checkpoint');
    this.checkpoints.push([0, 15.1, 76]);

    // Stage 5: Disappearing / Fading Platforms
    const faders = [
      [0, 14, 82],
      [-2, 15, 85],
      [1, 15, 88],
      [-1, 16, 91],
      [2, 16, 94],
      [0, 17, 98]
    ];
    faders.forEach(([x, y, z]) => {
      this.setBlock(x, y, z, 'fadeblock');
      this.setBlock(x + 1, y, z, 'fadeblock');
    });

    // Checkpoint 5
    for (let x = -2; x <= 2; x++) {
      for (let z = 101; z <= 105; z++) {
        this.setBlock(x, 17, z, 'gold');
      }
    }
    this.setBlock(0, 17, 103, 'checkpoint');
    this.checkpoints.push([0, 18.1, 103]);

    // Stage 6: Speed Pad Slippery Ice Runway
    this.setBlock(0, 18, 107, 'speedpad');
    for (let z = 108; z <= 135; z++) {
      this.setBlock(-1, 18, z, 'ice');
      this.setBlock(0, 18, z, 'ice');
      this.setBlock(1, 18, z, 'ice');

      // Floating hazards on the runway
      if (z === 116 || z === 124 || z === 130) {
        this.setBlock(0, 19, z, 'killbrick');
      }
    }

    // Final Stage 7: Victory Summit & Golden Trophy Star!
    for (let x = -5; x <= 5; x++) {
      for (let z = 138; z <= 148; z++) {
        this.setBlock(x, 18, z, 'obsidian');
        this.setBlock(x, 19, z, 'gold');
      }
    }

    // Victory Pedestal
    for (let y = 20; y <= 23; y++) {
      this.setBlock(0, y, 143, 'glowstone');
      this.setBlock(-1, y, 143, 'diamond');
      this.setBlock(1, y, 143, 'diamond');
      this.setBlock(0, y, 142, 'diamond');
      this.setBlock(0, y, 144, 'diamond');
    }
    // Trophy star on top
    this.setBlock(0, 24, 143, 'trophy');
  }

  private generateSurvivalWilderness() {
    this.name = 'Voxel Wilderness Sandbox';
    this.checkpoints = [];
    this.spawnPoint = [0, 6, 0];

    const size = 20;
    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        // Procedural rolling terrain
        const height = Math.round(
          Math.sin(x * 0.18) * 2.5 +
          Math.cos(z * 0.18) * 2.5 +
          Math.sin((x + z) * 0.1) * 1.5 +
          4
        );

        // Bedrock / deep stone
        for (let y = 0; y < height - 2; y++) {
          if (y <= 1 && Math.random() < 0.1) {
            this.setBlock(x, y, z, 'diamond');
          } else if (y <= 2 && Math.random() < 0.15) {
            this.setBlock(x, y, z, 'gold');
          } else {
            this.setBlock(x, y, z, 'stone');
          }
        }

        // Subsurface dirt
        this.setBlock(x, height - 2, z, 'dirt');
        this.setBlock(x, height - 1, z, 'dirt');

        // Surface grass
        this.setBlock(x, height, z, 'grass');

        // Plant trees occasionally
        if (x > -size + 4 && x < size - 4 && z > -size + 4 && z < size - 4) {
          if ((x * 17 + z * 31) % 43 === 0 && Math.abs(x) > 3) {
            this.buildTree(x, height + 1, z);
          }
        }
      }
    }

    // Starter wooden cottage near spawn
    this.buildStarterCabin(3, 5, 3);
  }

  private buildTree(x: number, y: number, z: number) {
    // 4 trunk blocks
    for (let ty = 0; ty < 4; ty++) {
      this.setBlock(x, y + ty, z, 'wood');
    }
    // Foliage canopy
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = 3; ly <= 5; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 5) continue;
          if (!this.hasBlock(x + lx, y + ly, z + lz)) {
            this.setBlock(x + lx, y + ly, z + lz, 'leaves');
          }
        }
      }
    }
  }

  private buildStarterCabin(ox: number, oy: number, oz: number) {
    for (let x = 0; x <= 4; x++) {
      for (let z = 0; z <= 4; z++) {
        // Floor
        this.setBlock(ox + x, oy, oz + z, 'wood');
        // Roof
        this.setBlock(ox + x, oy + 4, oz + z, 'wood');

        // Walls
        if (x === 0 || x === 4 || z === 0 || z === 4) {
          for (let y = 1; y <= 3; y++) {
            // Doorway
            if (x === 2 && z === 0 && (y === 1 || y === 2)) continue;
            // Windows
            if ((x === 2 && z === 4 && y === 2) || (z === 2 && (x === 0 || x === 4) && y === 2)) {
              this.setBlock(ox + x, oy + y, oz + z, 'glass');
            } else {
              this.setBlock(ox + x, oy + y, oz + z, 'brick');
            }
          }
        }
      }
    }
    // Interior bookshelf & lantern
    this.setBlock(ox + 1, oy + 1, oz + 3, 'bookshelf');
    this.setBlock(ox + 2, oy + 3, oz + 2, 'glowstone');
  }

  private generateCastleArena() {
    this.name = 'Castle Battle Arena';
    this.checkpoints = [];
    this.spawnPoint = [0, 2, -16];

    // Arena courtyard floor
    for (let x = -20; x <= 20; x++) {
      for (let z = -20; z <= 20; z++) {
        if (Math.abs(x) === 20 || Math.abs(z) === 20) {
          // Perimeter wall
          for (let y = 0; y <= 4; y++) {
            this.setBlock(x, y, z, 'brick');
          }
        } else {
          this.setBlock(x, 0, z, (x + z) % 2 === 0 ? 'stone' : 'grass');
        }
      }
    }

    // Four corner fortress towers
    const corners = [
      [-16, -16],
      [16, -16],
      [-16, 16],
      [16, 16]
    ];
    corners.forEach(([cx, cz]) => {
      for (let x = cx - 2; x <= cx + 2; x++) {
        for (let z = cz - 2; z <= cz + 2; z++) {
          for (let y = 1; y <= 8; y++) {
            this.setBlock(x, y, z, 'brick');
          }
        }
      }
      // Trampoline in front of each tower to jump to roof
      this.setBlock(cx, 1, cz + (cz > 0 ? -4 : 4), 'trampoline');
      this.setBlock(cx, 9, cz, 'glowstone');
    });

    // Central battlefield keep & TNT cache
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        this.setBlock(x, 1, z, 'stone');
        this.setBlock(x, 2, z, 'wood');
      }
    }
    this.setBlock(0, 3, 0, 'tnt');
    this.setBlock(1, 3, 0, 'tnt');
    this.setBlock(-1, 3, 0, 'tnt');
    this.setBlock(0, 3, 1, 'tnt');
  }

  private generateFlatCanvas() {
    this.name = 'Creative Studio Grid';
    this.checkpoints = [];
    this.spawnPoint = [0, 2, 0];

    for (let x = -16; x <= 16; x++) {
      for (let z = -16; z <= 16; z++) {
        this.setBlock(x, 0, z, (Math.abs(x) + Math.abs(z)) % 2 === 0 ? 'grass' : 'wood');
      }
    }
  }

  // ================= EXPORT / IMPORT ================= //

  public exportJSON(): string {
    const data: WorldData = {
      version: 1,
      name: this.name,
      preset: this.preset,
      spawnPoint: this.spawnPoint,
      checkpoints: this.checkpoints,
      blocks: Object.fromEntries(this.blocks.entries())
    };
    return JSON.stringify(data);
  }

  public importJSON(jsonStr: string) {
    try {
      const data: WorldData = JSON.parse(jsonStr);
      this.clear();
      this.name = data.name || 'Custom World';
      this.preset = data.preset || 'flat';
      this.spawnPoint = data.spawnPoint || [0, 2, 0];
      this.checkpoints = data.checkpoints || [];

      if (data.blocks) {
        Object.entries(data.blocks).forEach(([key, blockId]) => {
          const [x, y, z] = VoxelWorld.parseKey(key);
          this.setBlock(x, y, z, blockId as BlockId);
        });
      }
    } catch (e) {
      console.error('Failed to import Rocraft world JSON', e);
    }
  }
}
