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
    } else if (preset === 'garden') {
      this.generateGrowAGarden();
    } else if (preset === 'doors') {
      this.generateDoorsHotel();
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

  // ================= ROBLOX EXPERIENCES ================= //

  /**
   * Roblox: Grow a Garden
   * Peaceful agrarian farming paradise with lush crop plots, giant pumpkins,
   * watermelon groves, flower beds, greenhouse, windmill, and irrigation ponds.
   */
  private generateGrowAGarden() {
    this.name = 'Roblox: Grow a Garden';
    this.checkpoints = [];
    this.spawnPoint = [0, 1.1, 0];

    // 1. Base Green Grass Rolling Valley (-24 to 24)
    for (let x = -24; x <= 24; x++) {
      for (let z = -24; z <= 24; z++) {
        this.setBlock(x, 0, z, 'grass');
      }
    }

    // Cobblestone Garden Pathways crossing the world
    for (let i = -24; i <= 24; i++) {
      // Main North-South & East-West paths
      this.setBlock(0, 0, i, 'stone');
      this.setBlock(1, 0, i, 'stone');
      this.setBlock(-1, 0, i, 'stone');
      this.setBlock(i, 0, 0, 'stone');
      this.setBlock(i, 0, 1, 'stone');
      this.setBlock(i, 0, -1, 'stone');
    }

    // Outer perimeter wooden fence
    for (let i = -24; i <= 24; i++) {
      if (Math.abs(i) > 2) {
        this.setBlock(i, 1, -24, 'wood');
        this.setBlock(i, 1, 24, 'wood');
        this.setBlock(-24, 1, i, 'wood');
        this.setBlock(24, 1, i, 'wood');
      }
    }

    // 2. Central Farm Gazebo & Welcome Pavilion (x: -3..3, z: -3..3)
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        this.setBlock(x, 0, z, 'wood');
      }
    }
    // Corner posts
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([cx, cz]) => {
      for (let y = 1; y <= 4; y++) {
        this.setBlock(cx, y, cz, 'wood');
      }
    });
    // Canopy roof of leaves with glass skylight
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        this.setBlock(x, 5, z, (Math.abs(x) <= 1 && Math.abs(z) <= 1) ? 'glass' : 'leaves');
      }
    }
    // Hanging flower basket & glowstone sun-lamp
    this.setBlock(0, 4, 0, 'glowstone');
    this.setBlock(0, 3, 0, 'flower');

    // Stage 1 Checkpoint: Central Gazebo
    this.setBlock(0, 0, 0, 'checkpoint');
    this.checkpoints.push([0, 1.1, 0]);

    // 3. Plot 1: The Floral Nursery (x: 6..18, z: -6..6)
    // Raised planters
    for (let x = 6; x <= 18; x++) {
      for (let z = -6; z <= 6; z++) {
        const isBorder = x === 6 || x === 18 || z === -6 || z === 6;
        if (isBorder) {
          this.setBlock(x, 1, z, 'wood');
        } else {
          this.setBlock(x, 1, z, 'dirt');
          // Colorful flower rows
          if ((x + z) % 2 === 0) {
            this.setBlock(x, 2, z, 'flower');
          }
        }
      }
    }
    // Decorative flower archway
    this.setBlock(6, 2, 0, 'wood');
    this.setBlock(6, 3, 0, 'leaves');
    this.setBlock(6, 4, 0, 'flower');
    // Speed pads along pathway
    this.setBlock(4, 0, 0, 'speedpad');
    this.setBlock(5, 0, 0, 'speedpad');

    // Stage 2 Checkpoint: Floral Nursery
    this.setBlock(12, 1, 0, 'checkpoint');
    this.checkpoints.push([12, 2.1, 0]);

    // 4. Plot 2: Giant Pumpkin Patch (x: 6..18, z: 8..20)
    for (let x = 6; x <= 18; x++) {
      for (let z = 8; z <= 20; z++) {
        const isBorder = x === 6 || x === 18 || z === 8 || z === 20;
        if (isBorder) {
          this.setBlock(x, 1, z, 'brick');
        } else {
          this.setBlock(x, 1, z, 'dirt');
          // Individual pumpkins
          if (x % 3 === 0 && z % 3 === 0) {
            this.setBlock(x, 2, z, 'pumpkin');
          }
        }
      }
    }
    // The Giant 2x2 Prize Champion Pumpkin!
    for (let px = 11; px <= 12; px++) {
      for (let pz = 13; pz <= 14; pz++) {
        this.setBlock(px, 2, pz, 'pumpkin');
        this.setBlock(px, 3, pz, 'pumpkin');
      }
    }
    this.setBlock(11, 4, 13, 'gold'); // Golden medal stem!

    // Farm Scarecrow
    this.setBlock(15, 2, 11, 'wood');
    this.setBlock(15, 3, 11, 'wood');
    this.setBlock(14, 3, 11, 'wood');
    this.setBlock(16, 3, 11, 'wood');
    this.setBlock(15, 4, 11, 'pumpkin');
    this.setBlock(15, 5, 11, 'leaves');

    // Stage 3 Checkpoint: Pumpkin Patch
    this.setBlock(12, 1, 10, 'checkpoint');
    this.checkpoints.push([12, 2.1, 10]);

    // 5. Plot 3: Watermelon Furrows (x: -18..-6, z: 8..20)
    for (let x = -18; x <= -6; x++) {
      for (let z = 8; z <= 20; z++) {
        const isBorder = x === -18 || x === -6 || z === 8 || z === 20;
        if (isBorder) {
          this.setBlock(x, 1, z, 'wood');
        } else {
          // Irrigation furrows: alternate water channels and melon beds
          if (z % 3 === 0) {
            this.setBlock(x, 1, z, 'water');
          } else {
            this.setBlock(x, 1, z, 'dirt');
            if (x % 2 === 0) {
              this.setBlock(x, 2, z, 'melon');
            }
          }
        }
      }
    }

    // Stage 4 Checkpoint: Watermelon Farm
    this.setBlock(-12, 1, 14, 'checkpoint');
    this.checkpoints.push([-12, 2.1, 14]);

    // 6. Plot 4: The Country Windmill & Star Summit (x: -18..-8, z: -6..6)
    const wx = -13;
    const wz = 0;
    // Stone base tower
    for (let x = wx - 3; x <= wx + 3; x++) {
      for (let z = wz - 3; z <= wz + 3; z++) {
        for (let y = 1; y <= 9; y++) {
          const isEdge = x === wx - 3 || x === wx + 3 || z === wz - 3 || z === wz + 3;
          if (isEdge) {
            this.setBlock(x, y, z, y <= 4 ? 'stone' : 'brick');
          }
        }
      }
    }
    // Observation deck platform (y = 10)
    for (let x = wx - 4; x <= wx + 4; x++) {
      for (let z = wz - 4; z <= wz + 4; z++) {
        this.setBlock(x, 10, z, 'wood');
      }
    }
    // Windmill Sails (cross of wood and leaves)
    for (let dy = -4; dy <= 4; dy++) {
      this.setBlock(wx + 4, 10 + dy, wz, 'wood');
      this.setBlock(wx + 4, 10 + dy, wz + 1, 'leaves');
      this.setBlock(wx + 4, 10, wz + dy, 'wood');
      this.setBlock(wx + 4, 11, wz + dy, 'leaves');
    }
    // Trampoline launcher at base to bounce straight onto observation deck!
    this.setBlock(wx, 1, wz + 4, 'trampoline');

    // Star Trophy at Windmill Summit!
    this.setBlock(wx, 11, wz, 'trophy');
    this.setBlock(wx, 12, wz, 'glowstone');

    // Stage 5 Checkpoint: Windmill Summit
    this.setBlock(wx, 10, wz + 2, 'checkpoint');
    this.checkpoints.push([wx, 11.1, wz + 2]);

    // 7. Plot 5: The Crystal Greenhouse (x: -6..6, z: -18..-7)
    for (let x = -6; x <= 6; x++) {
      for (let z = -18; z <= -7; z++) {
        // Floor
        this.setBlock(x, 1, z, 'brick');
        // Glass walls & arched roof
        const isWall = x === -6 || x === 6 || z === -18 || z === -7;
        if (isWall) {
          const isDoor = Math.abs(x) <= 1 && z === -7;
          if (!isDoor) {
            for (let y = 2; y <= 5; y++) {
              this.setBlock(x, y, z, (x === -6 || x === 6) && y === 2 ? 'wood' : 'glass');
            }
          }
        }
      }
    }
    // Arched glass ceiling
    for (let x = -5; x <= 5; x++) {
      for (let z = -17; z <= -8; z++) {
        this.setBlock(x, 6, z, 'glass');
      }
    }
    // Greenhouse interior: Exotic flower beds and glowing lamps
    for (let x = -4; x <= 4; x += 2) {
      this.setBlock(x, 2, -13, 'dirt');
      this.setBlock(x, 3, -13, 'flower');
    }
    this.setBlock(0, 5, -13, 'glowstone');

    // Stage 6 Checkpoint: Crystal Greenhouse
    this.setBlock(0, 1, -10, 'checkpoint');
    this.checkpoints.push([0, 2.1, -10]);

    // 8. Scenic Irrigation Pond with Water Lilies (x: 8..18, z: -18..-9)
    for (let x = 8; x <= 18; x++) {
      for (let z = -18; z <= -9; z++) {
        const isPondEdge = x === 8 || x === 18 || z === -18 || z === -9;
        if (isPondEdge) {
          this.setBlock(x, 1, z, 'stone');
        } else {
          this.setBlock(x, 1, z, 'water');
          // Stepping stones and water lily pads
          if ((x === 11 || x === 15) && z === -13) {
            this.setBlock(x, 1, z, 'leaves');
          }
        }
      }
    }
    // Wooden arched pond bridge
    for (let z = -18; z <= -9; z++) {
      this.setBlock(13, 2, z, 'wood');
    }
  }

  /**
   * Roblox: DOORS (The Hotel)
   * Atmospheric, tense hotel interior featuring Room 0000 Reception,
   * crimson runner carpets, Victorian wallpaper, chandeliers, Seek chase corridor,
   * Figure's towering library, electrical basement, and exit elevator.
   */
  private generateDoorsHotel() {
    this.name = 'Roblox: DOORS (The Hotel)';
    this.checkpoints = [];
    this.spawnPoint = [0, 1.1, -13];

    // Helper: generate enclosed room box
    const buildRoom = (
      minX: number,
      maxX: number,
      minZ: number,
      maxZ: number,
      floorBlock: BlockId = 'wood',
      wallBlock: BlockId = 'wallpaper',
      ceilingBlock: BlockId = 'wood',
      height: number = 4
    ) => {
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          // Floor
          this.setBlock(x, 0, z, floorBlock);
          // Ceiling
          this.setBlock(x, height, z, ceilingBlock);

          // Walls
          const isWall = x === minX || x === maxX || z === minZ || z === maxZ;
          if (isWall) {
            for (let y = 1; y < height; y++) {
              this.setBlock(x, y, z, wallBlock);
            }
          }
        }
      }
    };

    // Helper: carve door opening with doorblock
    const carveDoor = (x: number, z: number, axis: 'x' | 'z' = 'z') => {
      this.setBlock(x, 1, z, 'doorblock');
      this.setBlock(x, 2, z, 'doorblock');
      this.setBlock(x, 3, z, 'gold'); // Golden transom above door
    };

    // 1. Room 0000: The Reception & Elevator Lobby (x: -5..5, z: -16..0, height: 4)
    buildRoom(-5, 5, -16, 0, 'wood', 'wallpaper', 'wood', 4);

    // Elevator shaft at back where player spawns (z: -15..-13)
    for (let x = -2; x <= 2; x++) {
      for (let z = -15; z <= -13; z++) {
        this.setBlock(x, 0, z, 'obsidian');
        this.setBlock(x, 4, z, 'gold');
      }
    }
    // Elevator sliding grill doors
    this.setBlock(-2, 1, -13, 'gold');
    this.setBlock(-2, 2, -13, 'gold');
    this.setBlock(2, 1, -13, 'gold');
    this.setBlock(2, 2, -13, 'gold');

    // Reception Front Desk (x: -3..1, z: -6)
    for (let x = -3; x <= 1; x++) {
      this.setBlock(x, 1, -6, 'wood');
    }
    this.setBlock(-1, 2, -6, 'gold'); // Golden desk bell!
    this.setBlock(-3, 2, -6, 'bookshelf'); // Hotel guest register

    // Lobby Waiting Lounge Chairs
    this.setBlock(4, 1, -8, 'carpet');
    this.setBlock(4, 1, -10, 'carpet');
    this.setBlock(3, 1, -9, 'wood');

    // Overhead Glowstone Chandeliers
    this.setBlock(0, 4, -10, 'glowstone');
    this.setBlock(0, 4, -4, 'glowstone');

    // Stage 1 Checkpoint: Reception Lobby Desk
    this.setBlock(0, 0, -6, 'checkpoint');
    this.checkpoints.push([0, 1.1, -6]);

    // Door 0001 entrance archway (z = 0)
    carveDoor(0, 0, 'z');

    // 2. Room 0001: The Portrait Corridor (x: -3..3, z: 1..16, height: 4)
    buildRoom(-3, 3, 1, 16, 'wood', 'wallpaper', 'wood', 4);
    // Remove partition between Room 0 and Room 1 door
    this.removeBlock(0, 1, 0);
    this.removeBlock(0, 2, 0);

    // Crimson runner carpet down the center of the hallway
    for (let z = 1; z <= 15; z++) {
      this.setBlock(0, 0, z, 'carpet');
    }
    // Wall sconces
    this.setBlock(-2, 2, 4, 'glowstone');
    this.setBlock(2, 2, 8, 'glowstone');
    this.setBlock(-2, 2, 12, 'glowstone');

    // Side tables with drawers
    this.setBlock(-2, 1, 6, 'bookshelf');
    this.setBlock(2, 1, 10, 'bookshelf');

    // Door 0002 at z = 16
    carveDoor(0, 16, 'z');
    this.removeBlock(0, 1, 16);
    this.removeBlock(0, 2, 16);

    // 3. Room 0002: The Parlor & Grand Fireplace (x: -6..6, z: 17..31, height: 4)
    buildRoom(-6, 6, 17, 31, 'wood', 'wallpaper', 'wood', 4);

    // Central ornate crimson carpet
    for (let x = -2; x <= 2; x++) {
      for (let z = 20; z <= 28; z++) {
        this.setBlock(x, 0, z, 'carpet');
      }
    }

    // Grand Brick Fireplace on Left Wall (x: -5, z: 22..26)
    for (let z = 22; z <= 26; z++) {
      for (let y = 1; y <= 3; y++) {
        this.setBlock(-5, y, z, 'brick');
      }
    }
    // Glowing hearth fire
    this.setBlock(-5, 1, 24, 'glowstone');
    this.setBlock(-4, 1, 24, 'tnt'); // Decorative hearth log

    // Shelves with hidden gold coins loot
    this.setBlock(5, 1, 22, 'bookshelf');
    this.setBlock(5, 2, 22, 'gold'); // Hotel coins!
    this.setBlock(5, 1, 26, 'bookshelf');
    this.setBlock(5, 2, 26, 'gold');

    // Overhead chandelier
    this.setBlock(0, 4, 24, 'glowstone');

    // Stage 2 Checkpoint: The Parlor Fireplace
    this.setBlock(0, 0, 24, 'checkpoint');
    this.checkpoints.push([0, 1.1, 24]);

    // Door 0003 at z = 31
    carveDoor(0, 31, 'z');
    this.removeBlock(0, 1, 31);
    this.removeBlock(0, 2, 31);

    // 4. Room 0003: Seek's Chase Corridor (x: -2..2, z: 32..54, height: 4)
    buildRoom(-2, 2, 32, 54, 'wood', 'wallpaper', 'wood', 4);

    // Speed boost pads hidden on floor to outrun Seek!
    for (let z = 33; z <= 53; z += 4) {
      this.setBlock(0, 0, z, 'speedpad');
    }

    // Vaulting obstacles & fallen furniture
    this.setBlock(-1, 1, 38, 'bookshelf');
    this.setBlock(0, 1, 38, 'wood');
    this.setBlock(0, 1, 44, 'bookshelf');
    this.setBlock(1, 1, 44, 'wood');

    // Seek's Menacing Red Eyes / Killbrick Hands along the walls!
    this.setBlock(-2, 2, 36, 'killbrick');
    this.setBlock(2, 2, 41, 'killbrick');
    this.setBlock(-2, 2, 47, 'killbrick');
    this.setBlock(2, 2, 50, 'killbrick');

    // Door 0004 at z = 54
    carveDoor(0, 54, 'z');
    this.removeBlock(0, 1, 54);
    this.removeBlock(0, 2, 54);

    // 5. Room 0004: Figure's Grand Library (x: -8..8, z: 55..77, height: 7)
    buildRoom(-8, 8, 55, 77, 'wood', 'bookshelf', 'wood', 7);

    // Towering interior bookshelves forming a spooky maze
    for (let z = 58; z <= 74; z += 4) {
      for (let x = -6; x <= 6; x++) {
        if (Math.abs(x) !== 0 && Math.abs(x) !== 4) {
          for (let y = 1; y <= 4; y++) {
            this.setBlock(x, y, z, 'bookshelf');
          }
        }
      }
    }

    // Second-Floor Mezzanine Walkway (y = 4)
    for (let z = 56; z <= 76; z++) {
      this.setBlock(-7, 4, z, 'wood');
      this.setBlock(7, 4, z, 'wood');
      // Glass railing
      this.setBlock(-6, 5, z, 'glass');
      this.setBlock(6, 5, z, 'glass');
    }

    // Trampoline disguised as library ladder to bounce up to the 2nd floor mezzanine!
    this.setBlock(-7, 1, 60, 'trampoline');
    this.setBlock(7, 1, 70, 'trampoline');

    // Central Library Desk & Stage 3 Checkpoint
    this.setBlock(-1, 1, 66, 'wood');
    this.setBlock(0, 1, 66, 'bookshelf');
    this.setBlock(1, 1, 66, 'wood');
    this.setBlock(0, 2, 66, 'glowstone'); // Desk lamp
    this.setBlock(0, 0, 64, 'checkpoint');
    this.checkpoints.push([0, 1.1, 64]);

    // Door 0005 at z = 77
    carveDoor(0, 77, 'z');
    this.removeBlock(0, 1, 77);
    this.removeBlock(0, 2, 77);

    // 6. Room 0005: The Dark Electrical Catwalk (x: -4..4, z: 78..92, height: 4)
    buildRoom(-4, 4, 78, 92, 'obsidian', 'brick', 'obsidian', 4);

    // Narrow catwalk over the dark void!
    for (let x = -3; x <= 3; x++) {
      for (let z = 79; z <= 91; z++) {
        if (x !== 0) {
          // Void pit around the catwalk
          this.removeBlock(x, 0, z);
        }
      }
    }

    // Fading crumbling platform segments along the catwalk!
    this.setBlock(0, 0, 83, 'fadeblock');
    this.setBlock(0, 0, 87, 'fadeblock');

    // Glowing breaker panels on side walls
    this.setBlock(-4, 2, 85, 'gold');
    this.setBlock(4, 2, 85, 'glowstone');

    // Stage 4 Checkpoint: Electrical Room
    this.setBlock(0, 0, 85, 'checkpoint');
    this.checkpoints.push([0, 1.1, 85]);

    // Door 0100 exit at z = 92
    carveDoor(0, 92, 'z');
    this.removeBlock(0, 1, 92);
    this.removeBlock(0, 2, 92);

    // 7. Room 0100: The Grand Elevator & Golden Finish Star (x: -5..5, z: 93..105, height: 5)
    buildRoom(-5, 5, 93, 105, 'wood', 'wallpaper', 'wood', 5);

    // Velvet crimson carpet leading to the exit
    for (let x = -2; x <= 2; x++) {
      for (let z = 94; z <= 104; z++) {
        this.setBlock(x, 0, z, 'carpet');
      }
    }

    // Golden Gilded Escape Elevator at end (z: 102..104)
    for (let x = -2; x <= 2; x++) {
      this.setBlock(x, 1, 104, 'gold');
      this.setBlock(x, 2, 104, 'gold');
      this.setBlock(x, 3, 104, 'gold');
    }
    this.setBlock(0, 4, 100, 'glowstone');

    // Golden Finish Star Trophy on velvet pedestal!
    this.setBlock(0, 1, 100, 'gold');
    this.setBlock(0, 2, 100, 'trophy');

    // Final Victory Checkpoint
    this.setBlock(0, 0, 99, 'checkpoint');
    this.checkpoints.push([0, 1.1, 99]);
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
