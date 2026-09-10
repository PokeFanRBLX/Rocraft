import * as THREE from 'three';
import { VoxelWorld } from './world';
import { CharacterAvatar } from './avatar';
import { soundEngine } from '../utils/audio';
import { BLOCK_DEFINITIONS } from './blocks';
import { TargetDummy } from '../types';

export interface RocketProjectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class PhysicsEngine {
  public world: VoxelWorld;
  public avatar: CharacterAvatar;
  public scene: THREE.Scene;

  // Player position & velocity
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  public playerVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public isGrounded: boolean = false;
  public lastCheckpoint: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  public currentStage: number = 1;

  // Health and stats
  public health: number = 100;
  public maxHealth: number = 100;
  public isDead: boolean = false;
  public respawnTimer: number = 0;
  public deaths: number = 0;
  public coins: number = 0;

  // Active projectiles & particles
  public rockets: RocketProjectile[] = [];
  public particles: Particle[] = [];
  public dummyList: { dummy: TargetDummy; avatar: CharacterAvatar }[] = [];

  // Callbacks
  public onStageChange?: (stage: number) => void;
  public onVictory?: () => void;
  public onHealthChange?: (hp: number) => void;

  constructor(world: VoxelWorld, avatar: CharacterAvatar, scene: THREE.Scene) {
    this.world = world;
    this.avatar = avatar;
    this.scene = scene;
    this.resetPlayerToSpawn();
  }

  public resetPlayerToSpawn() {
    this.playerPos.set(
      this.world.spawnPoint[0],
      this.world.spawnPoint[1],
      this.world.spawnPoint[2]
    );
    this.playerVel.set(0, 0, 0);
    this.lastCheckpoint.copy(this.playerPos);
    this.health = this.maxHealth;
    this.isDead = false;
    this.avatar.group.position.copy(this.playerPos);
    this.avatar.resetFromRagdoll();
    if (this.onHealthChange) this.onHealthChange(this.health);
  }

  public respawnAtCheckpoint() {
    this.playerPos.copy(this.lastCheckpoint);
    this.playerPos.y += 0.25;
    this.playerVel.set(0, 0, 0);
    this.health = this.maxHealth;
    this.isDead = false;
    this.isGrounded = true;
    this.avatar.group.position.copy(this.playerPos);
    this.avatar.resetFromRagdoll();
    if (this.onHealthChange) this.onHealthChange(this.health);
  }

  public killPlayer() {
    if (this.isDead) return;
    this.isDead = true;
    this.health = 0;
    this.deaths++;
    this.respawnTimer = 1.4;
    soundEngine.playOof();
    this.avatar.triggerDisintegration();
    if (this.onHealthChange) this.onHealthChange(0);
  }

  public update(
    delta: number,
    moveInput: { forward: number; strafe: number; jump: boolean },
    cameraYaw: number,
    cameraDirection: THREE.Vector3
  ) {
    // 1. Handle Respawn Timer if dead
    if (this.isDead) {
      this.respawnTimer -= delta;
      this.avatar.updateAnimation(delta, false, false);
      if (this.respawnTimer <= 0) {
        this.respawnAtCheckpoint();
      }
      this.updateParticles(delta);
      this.updateRockets(delta);
      return;
    }

    // 2. Modifiers from held tools
    const hasGravityCoil = this.avatar.heldToolId === 'gravity_coil';
    const hasSpeedCoil = this.avatar.heldToolId === 'speed_coil';

    const baseSpeed = hasSpeedCoil ? 13.5 : 6.2;
    const gravity = hasGravityCoil ? 11.0 : 25.0;
    const jumpStrength = hasGravityCoil ? 14.0 : 8.8;

    // Emit speed coil trail particles
    if (hasSpeedCoil && (moveInput.forward !== 0 || moveInput.strafe !== 0)) {
      if (Math.random() < 0.4) {
        this.spawnParticle(
          this.playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.2, (Math.random() - 0.5) * 0.4)),
          new THREE.Vector3(0, 0.5, 0),
          0xef4444,
          0.12,
          0.3
        );
      }
    }

    // 3. Movement input mapped to camera angle
    const moveVector = new THREE.Vector3();
    if (moveInput.forward !== 0 || moveInput.strafe !== 0) {
      // Forward vector projected on horizontal plane
      const forwardVec = new THREE.Vector3(
        -Math.sin(cameraYaw),
        0,
        -Math.cos(cameraYaw)
      ).normalize();

      const rightVec = new THREE.Vector3(
        Math.cos(cameraYaw),
        0,
        -Math.sin(cameraYaw)
      ).normalize();

      moveVector.addScaledVector(forwardVec, moveInput.forward);
      moveVector.addScaledVector(rightVec, moveInput.strafe);
      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();
      }
    }

    // Check block under feet for surface friction (Ice vs regular)
    const footBlock = this.world.getBlock(
      Math.round(this.playerPos.x),
      Math.round(this.playerPos.y - 0.2),
      Math.round(this.playerPos.z)
    );
    const isIce = footBlock === 'ice';
    const friction = isIce ? 0.96 : this.isGrounded ? 0.72 : 0.92;

    if (moveVector.lengthSq() > 0) {
      this.playerVel.x = THREE.MathUtils.lerp(this.playerVel.x, moveVector.x * baseSpeed, isIce ? 0.08 : 0.35);
      this.playerVel.z = THREE.MathUtils.lerp(this.playerVel.z, moveVector.z * baseSpeed, isIce ? 0.08 : 0.35);
      // Rotate avatar towards movement direction
      const targetAngle = Math.atan2(moveVector.x, moveVector.z);
      this.avatar.group.rotation.y = targetAngle;
    } else {
      this.playerVel.x *= friction;
      this.playerVel.z *= friction;
    }

    // Jump handling
    if (moveInput.jump && this.isGrounded) {
      this.playerVel.y = jumpStrength;
      this.isGrounded = false;
      if (hasGravityCoil) {
        soundEngine.playGravityBoing();
      } else {
        soundEngine.playJump();
      }
    }

    // Gravity
    this.playerVel.y -= gravity * delta;
    if (this.playerVel.y < -35) this.playerVel.y = -35; // Terminal velocity

    // 4. Voxel AABB Collision & Integration
    this.moveWithCollision(delta);

    // 5. Special Block Underneath / Intersections Check
    this.checkBlockInteractions();

    // 6. Void Fall Check
    if (this.playerPos.y < -15) {
      this.killPlayer();
    }

    // 7. Update Avatar position & animation
    this.avatar.group.position.copy(this.playerPos);
    const isMoving = Math.abs(this.playerVel.x) > 0.3 || Math.abs(this.playerVel.z) > 0.3;
    this.avatar.updateAnimation(delta, isMoving, this.isGrounded);

    // 8. Update Projectiles & Particles & Dummies
    this.updateRockets(delta);
    this.updateParticles(delta);
    this.updateDummies(delta);
  }

  private moveWithCollision(delta: number) {
    const halfW = 0.3;
    const height = 1.8;

    // Movement step: Y axis first
    const nextY = this.playerPos.y + this.playerVel.y * delta;
    let collidedY = false;

    // Check vertical collisions
    if (this.playerVel.y < 0) {
      // Moving down: check feet collision
      const checkY = Math.floor(nextY);
      const minX = Math.floor(this.playerPos.x - halfW);
      const maxX = Math.floor(this.playerPos.x + halfW);
      const minZ = Math.floor(this.playerPos.z - halfW);
      const maxZ = Math.floor(this.playerPos.z + halfW);

      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.hasBlock(x, checkY, z)) {
            const blockTop = checkY + 1.0;
            if (nextY <= blockTop && this.playerPos.y >= blockTop - 0.2) {
              this.playerPos.y = blockTop;
              this.playerVel.y = 0;
              this.isGrounded = true;
              collidedY = true;
              break;
            }
          }
        }
        if (collidedY) break;
      }
    } else if (this.playerVel.y > 0) {
      // Moving up: check head collision
      const checkY = Math.floor(nextY + height);
      const minX = Math.floor(this.playerPos.x - halfW);
      const maxX = Math.floor(this.playerPos.x + halfW);
      const minZ = Math.floor(this.playerPos.z - halfW);
      const maxZ = Math.floor(this.playerPos.z + halfW);

      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.hasBlock(x, checkY, z)) {
            this.playerPos.y = checkY - height;
            this.playerVel.y = 0;
            collidedY = true;
            break;
          }
        }
        if (collidedY) break;
      }
    }

    if (!collidedY) {
      this.playerPos.y = nextY;
      this.isGrounded = false;
    }

    // X axis movement & collision
    const nextX = this.playerPos.x + this.playerVel.x * delta;
    let collidedX = false;
    const signX = Math.sign(this.playerVel.x);
    if (signX !== 0) {
      const edgeX = nextX + signX * halfW;
      const checkX = Math.floor(edgeX);
      const minY = Math.floor(this.playerPos.y + 0.1);
      const maxY = Math.floor(this.playerPos.y + height - 0.1);
      const minZ = Math.floor(this.playerPos.z - halfW);
      const maxZ = Math.floor(this.playerPos.z + halfW);

      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.hasBlock(checkX, y, z)) {
            collidedX = true;
            break;
          }
        }
        if (collidedX) break;
      }
    }

    if (collidedX) {
      this.playerVel.x = 0;
    } else {
      this.playerPos.x = nextX;
    }

    // Z axis movement & collision
    const nextZ = this.playerPos.z + this.playerVel.z * delta;
    let collidedZ = false;
    const signZ = Math.sign(this.playerVel.z);
    if (signZ !== 0) {
      const edgeZ = nextZ + signZ * halfW;
      const checkZ = Math.floor(edgeZ);
      const minY = Math.floor(this.playerPos.y + 0.1);
      const maxY = Math.floor(this.playerPos.y + height - 0.1);
      const minX = Math.floor(this.playerPos.x - halfW);
      const maxX = Math.floor(this.playerPos.x + halfW);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.world.hasBlock(x, y, checkZ)) {
            collidedZ = true;
            break;
          }
        }
        if (collidedZ) break;
      }
    }

    if (collidedZ) {
      this.playerVel.z = 0;
    } else {
      this.playerPos.z = nextZ;
    }
  }

  private checkBlockInteractions() {
    // 1. Checkpoint detection against defined world checkpoints
    if (this.world.checkpoints && this.world.checkpoints.length > 0) {
      for (let i = 0; i < this.world.checkpoints.length; i++) {
        const [cpX, cpY, cpZ] = this.world.checkpoints[i];
        const dx = this.playerPos.x - cpX;
        const dy = this.playerPos.y - cpY;
        const dz = this.playerPos.z - cpZ;
        const distSqH = dx * dx + dz * dz;

        // Within 2.2 blocks horizontally and 2.5 blocks vertically
        if (distSqH <= 2.2 * 2.2 && dy >= -1.5 && dy <= 2.5) {
          const stageNumber = i + 1;
          const targetCp = new THREE.Vector3(cpX, cpY, cpZ);

          if (stageNumber > this.currentStage || (stageNumber === 1 && this.currentStage === 1 && this.lastCheckpoint.distanceTo(targetCp) > 0.5)) {
            this.currentStage = stageNumber;
            this.lastCheckpoint.copy(targetCp);
            soundEngine.playCheckpoint();
            this.spawnBlockParticles(cpX, cpY - 0.2, cpZ, 0x22c55e, 35);
            if (this.onStageChange) this.onStageChange(this.currentStage);
          } else if (stageNumber > 1 && this.lastCheckpoint.distanceTo(targetCp) > 1.2) {
            this.currentStage = Math.max(this.currentStage, stageNumber);
            this.lastCheckpoint.copy(targetCp);
            soundEngine.playCheckpoint();
            this.spawnBlockParticles(cpX, cpY - 0.2, cpZ, 0x22c55e, 35);
            if (this.onStageChange) this.onStageChange(this.currentStage);
          }
          break;
        }
      }
    }

    // 2. Sample voxel space intersecting player bounding box
    const minX = Math.floor(this.playerPos.x - 0.35);
    const maxX = Math.floor(this.playerPos.x + 0.35);
    const minZ = Math.floor(this.playerPos.z - 0.35);
    const maxZ = Math.floor(this.playerPos.z + 0.35);
    // Directly beneath feet to torso height
    const feetY = Math.floor(this.playerPos.y - 0.08);
    const bodyY = Math.floor(this.playerPos.y + 0.8);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let y = feetY - 1; y <= bodyY; y++) {
          const blockId = this.world.getBlock(x, y, z);
          if (!blockId) continue;
          const def = BLOCK_DEFINITIONS[blockId];
          if (!def) continue;

          // Killbrick hazard check (any body contact)
          if (def.isHazard) {
            this.killPlayer();
            return;
          }

          // Trophy star check (any contact)
          if (def.isTrophy) {
            if (this.onVictory) {
              this.onVictory();
            }
          }

          // Custom checkpoint block placed in world
          if (def.isCheckpoint && (y === feetY || y === feetY - 1)) {
            const cpTarget = new THREE.Vector3(x, y + 1.1, z);
            if (this.lastCheckpoint.distanceTo(cpTarget) > 1.5) {
              this.lastCheckpoint.copy(cpTarget);
              this.currentStage++;
              soundEngine.playCheckpoint();
              this.spawnBlockParticles(x, y + 0.5, z, 0x22c55e, 30);
              if (this.onStageChange) this.onStageChange(this.currentStage);
            }
          }

          // Trampoline bounce (contact directly beneath feet)
          if (def.isBouncy && (y === feetY || y === feetY - 1) && this.playerVel.y <= 1.0) {
            this.playerVel.y = 20.0;
            this.isGrounded = false;
            soundEngine.playBounce();
            this.spawnBlockParticles(x, y + 0.5, z, 0x38bdf8, 16);
          }

          // Speed boost pad
          if (def.isSpeedPad && (y === feetY || y === feetY - 1)) {
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.avatar.group.rotation.y);
            this.playerVel.addScaledVector(forward, 24);
            soundEngine.playSpeedBoost();
            this.spawnBlockParticles(x, y + 0.5, z, 0xfacc15, 10);
          }

          // Fading/crumbling platform
          if (def.isFading && (y === feetY || y === feetY - 1)) {
            this.world.triggerFadeBlock(x, y, z);
          }
        }
      }
    }
  }

  // ================= PROJECTILES & ROCKETS ================= //

  public fireRocket(origin: THREE.Vector3, direction: THREE.Vector3) {
    const rocketGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
    const rocketMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8
    });
    const mesh = new THREE.Mesh(rocketGeom, rocketMat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    this.scene.add(mesh);

    this.rockets.push({
      mesh,
      position: origin.clone(),
      velocity: direction.clone().multiplyScalar(30),
      life: 4.0
    });

    soundEngine.playRocketLaunch();
  }

  private updateRockets(delta: number) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      rocket.life -= delta;

      const prevPos = rocket.position.clone();
      rocket.position.addScaledVector(rocket.velocity, delta);
      rocket.mesh.position.copy(rocket.position);

      // Rocket flame particles
      if (Math.random() < 0.7) {
        this.spawnParticle(rocket.position.clone(), new THREE.Vector3(0, 0, 0), 0xf97316, 0.1, 0.2);
      }

      // Raycast collision against voxels
      const hitBlock = this.world.getBlock(
        Math.round(rocket.position.x),
        Math.round(rocket.position.y),
        Math.round(rocket.position.z)
      );

      // Check collision against dummies
      let hitDummy = false;
      this.dummyList.forEach((d) => {
        const dummyPos = new THREE.Vector3(d.dummy.position[0], d.dummy.position[1] + 1.0, d.dummy.position[2]);
        if (rocket.position.distanceTo(dummyPos) < 1.2) {
          d.dummy.health -= 100;
          hitDummy = true;
          this.checkDummyDeath(d);
        }
      });

      if (hitBlock || hitDummy || rocket.life <= 0) {
        // Explode!
        this.world.explode(rocket.position.x, rocket.position.y, rocket.position.z, 2.5);
        this.spawnExplosion(rocket.position);
        soundEngine.playExplosion();

        // Player knockback if near explosion
        const distToPlayer = this.playerPos.distanceTo(rocket.position);
        if (distToPlayer < 5.0) {
          const knockbackDir = this.playerPos.clone().sub(rocket.position).normalize();
          this.playerVel.addScaledVector(knockbackDir, (5.0 - distToPlayer) * 5.0);
          this.playerVel.y += 4.0;
        }

        this.scene.remove(rocket.mesh);
        this.rockets.splice(i, 1);
      }
    }
  }

  // ================= PRIMED TNT ================= //

  public spawnPrimedTNT(x: number, y: number, z: number) {
    const geom = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xffffff,
      emissiveIntensity: 0.6
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y + 0.45, z);
    this.scene.add(mesh);

    let flashes = 0;
    const interval = setInterval(() => {
      flashes++;
      mat.emissiveIntensity = flashes % 2 === 0 ? 0.9 : 0.2;
      if (flashes >= 6) {
        clearInterval(interval);
        this.scene.remove(mesh);
        geom.dispose();
        mat.dispose();

        const pos = new THREE.Vector3(x, y + 0.5, z);
        this.world.explode(x, y + 0.5, z, 3.2);
        this.spawnExplosion(pos);
        soundEngine.playExplosion();

        const dist = this.playerPos.distanceTo(pos);
        if (dist < 6.0) {
          const dir = this.playerPos.clone().sub(pos).normalize();
          this.playerVel.addScaledVector(dir, (6.0 - dist) * 6.0);
          this.playerVel.y += 6.0;
        }
      }
    }, 250);
  }

  // ================= SWORD ATTACK ================= //

  public attackWithSword(origin: THREE.Vector3, direction: THREE.Vector3) {
    this.avatar.triggerSlash();
    soundEngine.playSwordSlash();

    // Check hit against dummies in cone
    this.dummyList.forEach((d) => {
      const dummyPos = new THREE.Vector3(d.dummy.position[0], d.dummy.position[1] + 1.0, d.dummy.position[2]);
      const dist = origin.distanceTo(dummyPos);
      if (dist < 3.2) {
        const dirToDummy = dummyPos.clone().sub(origin).normalize();
        const dot = direction.dot(dirToDummy);
        if (dot > 0.4) {
          // Hit dummy!
          d.dummy.health = Math.max(0, d.dummy.health - 35);
          d.dummy.isHit = true;
          soundEngine.playSwordHit();
          this.spawnBlockParticles(dummyPos.x, dummyPos.y, dummyPos.z, 0xef4444, 8);

          // Knockback
          d.dummy.position[0] += dirToDummy.x * 1.5;
          d.dummy.position[2] += dirToDummy.z * 1.5;
          d.avatar.group.position.set(d.dummy.position[0], d.dummy.position[1], d.dummy.position[2]);

          this.checkDummyDeath(d);
        }
      }
    });
  }

  private checkDummyDeath(d: { dummy: TargetDummy; avatar: CharacterAvatar }) {
    if (d.dummy.health <= 0) {
      soundEngine.playOof();
      d.avatar.triggerDisintegration();
      setTimeout(() => {
        // Respawn dummy
        d.dummy.health = d.dummy.maxHealth;
        d.avatar.resetFromRagdoll();
        d.avatar.group.position.set(d.dummy.position[0], d.dummy.position[1], d.dummy.position[2]);
      }, 3000);
    }
  }

  // ================= DUMMY MOBS ================= //

  public spawnDummy(x: number, y: number, z: number, name: string = 'Roblox Noob'): TargetDummy {
    const dummy: TargetDummy = {
      id: `dummy_${Date.now()}_${Math.random()}`,
      position: [x, y, z],
      health: 100,
      maxHealth: 100,
      name,
      isHit: false
    };

    // Create classic Roblox Noob avatar (yellow head, blue torso, green legs)
    const dummyAvatar = new CharacterAvatar({
      name,
      headColor: '#facc15',
      torsoColor: '#0284c7',
      leftArmColor: '#facc15',
      rightArmColor: '#facc15',
      leftLegColor: '#16a34a',
      rightLegColor: '#16a34a',
      face: 'classic_smile',
      hat: 'none'
    });

    dummyAvatar.group.position.set(x, y, z);
    this.scene.add(dummyAvatar.group);

    this.dummyList.push({ dummy, avatar: dummyAvatar });
    return dummy;
  }

  public clearDummies() {
    this.dummyList.forEach((d) => {
      this.scene.remove(d.avatar.group);
    });
    this.dummyList = [];
  }

  private updateDummies(delta: number) {
    this.dummyList.forEach((d) => {
      d.avatar.updateAnimation(delta, false, true);
    });
  }

  // ================= PARTICLES ================= //

  public spawnBlockParticles(x: number, y: number, z: number, colorHex: number, count: number = 8) {
    const geom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.8,
        y + (Math.random() - 0.5) * 0.8,
        z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 4 + 1.5,
          (Math.random() - 0.5) * 4
        ),
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  public spawnExplosion(pos: THREE.Vector3) {
    const geom = new THREE.SphereGeometry(0.2, 6, 6);
    const colors = [0xef4444, 0xf97316, 0xfacc15, 0x475569];

    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 7 + 2,
          Math.sin(angle) * speed
        ),
        life: 0.75,
        maxLife: 0.75
      });
    }
  }

  public spawnParticle(pos: THREE.Vector3, vel: THREE.Vector3, colorHex: number, size: number, life: number) {
    const geom = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: vel,
      life,
      maxLife: life
    });
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.velocity.y -= 12 * delta; // Gravity
      p.mesh.position.addScaledVector(p.velocity, delta);
      const scale = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}
