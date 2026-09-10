import * as THREE from 'three';
import { AvatarConfig, FaceType, HatType, ToolId, BlockId } from '../types';
import { getAvatarFaceTexture } from './textures';
import { BLOCK_DEFINITIONS } from './blocks';

export interface AvatarParts {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hatGroup: THREE.Group;
  toolGroup: THREE.Group;
  nametagGroup: THREE.Group;
}

export class CharacterAvatar {
  public group: THREE.Group;
  public parts: AvatarParts;
  public config: AvatarConfig;
  public heldToolId: ToolId | null = null;
  public heldBlockId: BlockId | null = null;

  // Animation state
  private walkTime: number = 0;
  private isSlashing: boolean = false;
  private slashProgress: number = 0;

  // Ragdoll disintegration state
  public isRagdoll: boolean = false;
  private ragdollVelocities: { mesh: THREE.Object3D; vel: THREE.Vector3; rotVel: THREE.Vector3 }[] = [];

  constructor(config: AvatarConfig) {
    this.config = { ...config };
    this.group = new THREE.Group();
    this.parts = this.buildModel();
    this.group.add(this.parts.root);
  }

  private buildModel(): AvatarParts {
    const root = new THREE.Group();

    // Materials
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.torsoColor),
      roughness: 0.4,
      metalness: 0.1
    });

    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.headColor),
      roughness: 0.4
    });

    const leftArmMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.leftArmColor),
      roughness: 0.4
    });

    const rightArmMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.rightArmColor),
      roughness: 0.4
    });

    const leftLegMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.leftLegColor),
      roughness: 0.4
    });

    const rightLegMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.rightLegColor),
      roughness: 0.4
    });

    // 1. Torso: W 1.0, H 1.0, D 0.5
    const torsoGeom = new THREE.BoxGeometry(1.0, 1.0, 0.5);
    const torso = new THREE.Mesh(torsoGeom, torsoMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    // 2. Head: W 0.6, H 0.6, D 0.6
    // Front face has the face texture!
    const faceTex = getAvatarFaceTexture(this.config.face);
    const headFaceMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.headColor),
      map: faceTex,
      roughness: 0.4
    });

    // Materials order: +X, -X, +Y, -Y, +Z (front), -Z (back)
    const headMaterials = [
      headMat, // +X
      headMat, // -X
      headMat, // +Y
      headMat, // -Y
      headFaceMat, // +Z (Front face)
      headMat  // -Z
    ];

    const headGeom = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    const head = new THREE.Mesh(headGeom, headMaterials);
    head.position.y = 1.82;
    head.castShadow = true;
    root.add(head);

    // Head Top Stud (classic Roblox cylinder stud on top of head)
    const studGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
    const stud = new THREE.Mesh(studGeom, headMat);
    stud.position.y = 0.36;
    head.add(stud);

    // 3. Hat Group attached to head
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 0.35;
    head.add(hatGroup);
    this.updateHatMesh(hatGroup, this.config.hat);

    // 4. Left Arm (pivot at shoulder)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.75, 1.45, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), leftArmMat);
    leftArmMesh.position.y = -0.45;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);
    root.add(leftArmGroup);

    // 5. Right Arm (pivot at shoulder)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.75, 1.45, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), rightArmMat);
    rightArmMesh.position.y = -0.45;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);
    root.add(rightArmGroup);

    // Tool holder in right hand
    const toolGroup = new THREE.Group();
    toolGroup.position.set(0, -0.85, 0.3);
    rightArmGroup.add(toolGroup);

    // 6. Left Leg (pivot at hip)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.26, 0.5, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.0, 0.48), leftLegMat);
    leftLegMesh.position.y = -0.5;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);
    root.add(leftLegGroup);

    // 7. Right Leg (pivot at hip)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.26, 0.5, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.0, 0.48), rightLegMat);
    rightLegMesh.position.y = -0.5;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);
    root.add(rightLegGroup);

    // 8. Overhead Nametag Billboard
    const nametagGroup = new THREE.Group();
    nametagGroup.position.y = 2.4;
    this.createNametag(nametagGroup, this.config.name);
    root.add(nametagGroup);

    return {
      root,
      head,
      torso,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      hatGroup,
      toolGroup,
      nametagGroup
    };
  }

  private createNametag(group: THREE.Group, text: string) {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Background capsule
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.roundRect(8, 8, 240, 48, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || 'Player', 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.4, 1);
    group.add(sprite);
  }

  private updateHatMesh(group: THREE.Group, hatType: HatType) {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (hatType === 'none') return;

    if (hatType === 'top_hat') {
      // Classic Roblox Top Hat
      const hatMeshGroup = new THREE.Group();
      const brimMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16), brimMat);
      hatMeshGroup.add(brim);

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.55, 16), brimMat);
      crown.position.y = 0.28;
      hatMeshGroup.add(crown);

      // Red band
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.08, 16), bandMat);
      band.position.y = 0.08;
      hatMeshGroup.add(band);

      group.add(hatMeshGroup);
    } else if (hatType === 'builder_helmet') {
      // Construction hardhat
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), yellowMat);
      dome.position.y = -0.05;
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 16), yellowMat);
      brim.position.y = -0.05;
      group.add(dome);
      group.add(brim);
    } else if (hatType === 'crown') {
      // Royal gold crown
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.15, 8), goldMat);
      base.position.y = 0.08;
      group.add(base);

      // Spikes
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), goldMat);
        spike.position.set(Math.cos(angle) * 0.34, 0.22, Math.sin(angle) * 0.34);
        group.add(spike);
      }
    } else if (hatType === 'cap') {
      // Baseball cap
      const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), redMat);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.35), redMat);
      visor.position.set(0, 0, 0.3);
      visor.rotation.x = 0.2;
      group.add(dome);
      group.add(visor);
    } else if (hatType === 'viking') {
      // Viking Horns
      const helmMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.6 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), helmMat);
      group.add(dome);

      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
      [-1, 1].forEach((dir) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 8), hornMat);
        horn.position.set(dir * 0.36, 0.2, 0);
        horn.rotation.z = dir * -0.7;
        horn.rotation.x = -0.3;
        group.add(horn);
      });
    } else if (hatType === 'valkyrie') {
      // Valkyrie silver helm with wings
      const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16), silverMat);
      group.add(band);

      [-1, 1].forEach((dir) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.25), silverMat);
        wing.position.set(dir * 0.45, 0.3, 0);
        wing.rotation.z = dir * -0.3;
        group.add(wing);
      });
    }
  }

  public updateConfig(newConfig: Partial<AvatarConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Update body colors
    if (newConfig.torsoColor) {
      (this.parts.torso.material as THREE.MeshStandardMaterial).color.set(this.config.torsoColor);
    }
    if (newConfig.headColor) {
      const mats = this.parts.head.material as THREE.MeshStandardMaterial[];
      mats.forEach((m) => m.color.set(this.config.headColor));
    }
    if (newConfig.face) {
      const mats = this.parts.head.material as THREE.MeshStandardMaterial[];
      mats[4].map = getAvatarFaceTexture(this.config.face);
      mats[4].needsUpdate = true;
    }
    if (newConfig.hat !== undefined) {
      this.updateHatMesh(this.parts.hatGroup, this.config.hat);
    }
    if (newConfig.name) {
      this.createNametag(this.parts.nametagGroup, this.config.name);
    }
  }

  public setHeldItem(toolId: ToolId | null, blockId: BlockId | null) {
    this.heldToolId = toolId;
    this.heldBlockId = blockId;

    const group = this.parts.toolGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (toolId === 'sword') {
      // Roblox classic sword model
      const swordGroup = new THREE.Group();
      swordGroup.rotation.x = Math.PI / 2;

      // Handle
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), handleMat);
      handle.position.y = -0.2;
      swordGroup.add(handle);

      // Crossguard
      const guardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 });
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.1), guardMat);
      guard.position.y = -0.02;
      swordGroup.add(guard);

      // Blade
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.03), bladeMat);
      blade.position.y = 0.55;
      swordGroup.add(blade);

      group.add(swordGroup);
    } else if (toolId === 'gravity_coil' || toolId === 'speed_coil') {
      // Iconic Roblox Coil
      const coilGroup = new THREE.Group();
      const isGrav = toolId === 'gravity_coil';
      const coilMat = new THREE.MeshStandardMaterial({
        color: isGrav ? 0x38bdf8 : 0xef4444,
        emissive: isGrav ? 0x0284c7 : 0xdc2626,
        emissiveIntensity: 0.5,
        metalness: 0.6
      });

      // Handle
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), handleMat);
      handle.position.y = -0.2;
      coilGroup.add(handle);

      // Spiral Torus rings
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), coilMat);
        ring.position.y = i * 0.12;
        ring.rotation.x = Math.PI / 2;
        coilGroup.add(ring);
      }

      group.add(coilGroup);
    } else if (toolId === 'rocket_launcher') {
      // Classic rocket launcher tube
      const rocketGroup = new THREE.Group();
      rocketGroup.rotation.x = Math.PI / 2;

      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.4 });
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 16), tubeMat);
      tube.position.y = 0.2;
      rocketGroup.add(tube);

      // Rocket tip protruding
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12), tipMat);
      tip.position.y = 0.85;
      rocketGroup.add(tip);

      group.add(rocketGroup);
    } else if (toolId === 'pickaxe') {
      // Minecraft Pickaxe
      const pickGroup = new THREE.Group();
      pickGroup.rotation.x = Math.PI / 2;

      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), shaftMat);
      shaft.position.y = 0.2;
      pickGroup.add(shaft);

      const headMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8 });
      const head = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 16, Math.PI), headMat);
      head.position.set(0, 0.65, 0);
      head.rotation.z = -Math.PI / 2;
      pickGroup.add(head);

      group.add(pickGroup);
    } else if (toolId === 'paint_gun') {
      // Paint spray gun
      const gunGroup = new THREE.Group();
      gunGroup.rotation.x = Math.PI / 2;
      const gunMat = new THREE.MeshStandardMaterial({ color: 0xec4899 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.2), gunMat);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
      nozzle.position.y = 0.25;
      gunGroup.add(body);
      gunGroup.add(nozzle);
      group.add(gunGroup);
    } else if (toolId === 'tnt_detonator') {
      // TNT Detonator handle
      const detGroup = new THREE.Group();
      detGroup.rotation.x = Math.PI / 2;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.15), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x111827 }));
      plunger.position.y = 0.2;
      detGroup.add(box);
      detGroup.add(plunger);
      group.add(detGroup);
    } else if (toolId === 'boombox') {
      // Iconic Roblox Golden Boombox!
      const boomboxGroup = new THREE.Group();
      boomboxGroup.position.set(0, 0.1, 0.15);
      boomboxGroup.rotation.set(0.1, 0.2, -0.1);

      // Main Gold Body
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0x78350f,
        emissiveIntensity: 0.3
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.36, 0.24), goldMat);
      boomboxGroup.add(body);

      // Black Speaker Cones
      const speakerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
      const leftSpeaker = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), speakerMat);
      leftSpeaker.rotation.x = Math.PI / 2;
      leftSpeaker.position.set(-0.2, 0, 0.125);
      boomboxGroup.add(leftSpeaker);

      const rightSpeaker = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), speakerMat);
      rightSpeaker.rotation.x = Math.PI / 2;
      rightSpeaker.position.set(0.2, 0, 0.125);
      boomboxGroup.add(rightSpeaker);

      // Cassette Deck
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.02), deckMat);
      deck.position.set(0, 0, 0.125);
      boomboxGroup.add(deck);

      // Handle on Top
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 16, Math.PI), handleMat);
      handle.position.set(0, 0.18, 0);
      boomboxGroup.add(handle);

      group.add(boomboxGroup);
    } else if (blockId) {
      // Miniature voxel cube held in hand!
      const def = BLOCK_DEFINITIONS[blockId];
      const miniCubeGeom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const miniMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(def ? def.color : 0x22c55e),
        roughness: 0.5
      });
      const miniBlock = new THREE.Mesh(miniCubeGeom, miniMat);
      miniBlock.position.set(0, 0, 0.25);
      group.add(miniBlock);
    }
  }

  public triggerSlash() {
    this.isSlashing = true;
    this.slashProgress = 0;
  }

  public updateAnimation(delta: number, isMoving: boolean, isGrounded: boolean) {
    if (this.isRagdoll) {
      this.updateRagdoll(delta);
      return;
    }

    if (isMoving && isGrounded) {
      this.walkTime += delta * 11;
      const legSwing = Math.sin(this.walkTime) * 0.65;
      this.parts.leftLeg.rotation.x = legSwing;
      this.parts.rightLeg.rotation.x = -legSwing;

      if (!this.isSlashing) {
        this.parts.leftArm.rotation.x = -legSwing;
        this.parts.rightArm.rotation.x = legSwing * 0.8;
      }
    } else if (!isGrounded) {
      // In air jump pose
      this.parts.leftLeg.rotation.x = 0.35;
      this.parts.rightLeg.rotation.x = -0.35;
      if (!this.isSlashing) {
        this.parts.leftArm.rotation.x = -0.6;
        this.parts.rightArm.rotation.x = -0.6;
      }
    } else {
      // Idle breathing pose
      this.walkTime = 0;
      this.parts.leftLeg.rotation.x = 0;
      this.parts.rightLeg.rotation.x = 0;
      this.parts.leftArm.rotation.x = 0;
      if (!this.isSlashing) {
        this.parts.rightArm.rotation.x = 0;
      }
    }

    // Slash animation
    if (this.isSlashing) {
      this.slashProgress += delta * 6.5;
      if (this.slashProgress < 1.0) {
        const slashAngle = Math.sin(this.slashProgress * Math.PI) * 1.5;
        this.parts.rightArm.rotation.x = -slashAngle;
        this.parts.rightArm.rotation.z = -slashAngle * 0.4;
      } else {
        this.isSlashing = false;
        this.slashProgress = 0;
        this.parts.rightArm.rotation.x = 0;
        this.parts.rightArm.rotation.z = 0;
      }
    }
  }

  /**
   * Classic Roblox "Break apart on death" ragdoll effect!
   */
  public triggerDisintegration() {
    this.isRagdoll = true;
    this.ragdollVelocities = [];

    const pieces = [
      this.parts.head,
      this.parts.torso,
      this.parts.leftArm,
      this.parts.rightArm,
      this.parts.leftLeg,
      this.parts.rightLeg
    ];

    pieces.forEach((piece) => {
      this.ragdollVelocities.push({
        mesh: piece,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 8 + 4,
          (Math.random() - 0.5) * 8
        ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        )
      });
    });
  }

  private updateRagdoll(delta: number) {
    this.ragdollVelocities.forEach((item) => {
      item.vel.y -= 25 * delta; // Gravity
      item.mesh.position.addScaledVector(item.vel, delta);
      item.mesh.rotation.x += item.rotVel.x * delta;
      item.mesh.rotation.y += item.rotVel.y * delta;
      item.mesh.rotation.z += item.rotVel.z * delta;

      if (item.mesh.position.y < 0) {
        item.mesh.position.y = 0;
        item.vel.y = -item.vel.y * 0.3;
        item.vel.x *= 0.6;
        item.vel.z *= 0.6;
      }
    });
  }

  public resetFromRagdoll() {
    this.isRagdoll = false;
    this.ragdollVelocities = [];

    // Reset local piece positions and rotations
    this.parts.torso.position.set(0, 1.0, 0);
    this.parts.torso.rotation.set(0, 0, 0);

    this.parts.head.position.set(0, 1.82, 0);
    this.parts.head.rotation.set(0, 0, 0);

    this.parts.leftArm.position.set(-0.75, 1.45, 0);
    this.parts.leftArm.rotation.set(0, 0, 0);

    this.parts.rightArm.position.set(0.75, 1.45, 0);
    this.parts.rightArm.rotation.set(0, 0, 0);

    this.parts.leftLeg.position.set(-0.26, 0.5, 0);
    this.parts.leftLeg.rotation.set(0, 0, 0);

    this.parts.rightLeg.position.set(0.26, 0.5, 0);
    this.parts.rightLeg.rotation.set(0, 0, 0);
  }

  public triggerSwing() {
    this.triggerSlash();
  }
}
