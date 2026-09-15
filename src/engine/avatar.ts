import * as THREE from 'three';
import { AvatarConfig, FaceType, HatType, ToolId, BlockId } from '../types';
import { getAvatarFaceTexture } from './textures';
import { BLOCK_DEFINITIONS } from './blocks';
import { soundEngine } from '../utils/audio';
import { isOwnerName } from '../utils/ranks';

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

  // ================= WOBBLY LIFE JELLY PHYSICS STATE ================= //
  public squashStretch: number = 1.0;
  private squashStretchVel: number = 0.0;
  private targetSquash: number = 1.0;
  private wobbleTime: number = 0;
  private turnLean: number = 0;
  private accelPitch: number = 0;
  private accelPitchVel: number = 0;
  private headBobble: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private headBobbleVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private prevYaw: number = 0;
  private lastStepPhase: number = 0;
  private inAirTime: number = 0;
  public isPlayerControlled: boolean = true;

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

    const isOwner = isOwnerName(text);
    const canvas = document.createElement('canvas');
    canvas.width = isOwner ? 320 : 256;
    canvas.height = isOwner ? 76 : 64;
    const ctx = canvas.getContext('2d')!;

    if (isOwner) {
      // Background capsule for Owner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.roundRect(8, 6, 304, 64, 14);
      ctx.fill();

      // Rainbow Border
      const rainbowGrad = ctx.createLinearGradient(10, 0, 310, 0);
      rainbowGrad.addColorStop(0.0, '#ff1a53');
      rainbowGrad.addColorStop(0.18, '#ff7700');
      rainbowGrad.addColorStop(0.36, '#ffea00');
      rainbowGrad.addColorStop(0.52, '#00ff66');
      rainbowGrad.addColorStop(0.70, '#00e5ff');
      rainbowGrad.addColorStop(0.85, '#7000ff');
      rainbowGrad.addColorStop(1.0, '#ff00b7');

      ctx.strokeStyle = rainbowGrad;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Top line: Rainbow OWNER rank badge
      ctx.fillStyle = rainbowGrad;
      ctx.font = '900 16px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑 OWNER', 160, 24);

      // Bottom line: Player name in bright crisp text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Fredoka, sans-serif';
      ctx.fillText(text || 'PokeFan_', 160, 49);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(2.0, 0.475, 1);
      group.add(sprite);
    } else {
      // Standard member capsule
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

  public triggerWobblyJump(strength: number = 1.0) {
    // Forceful jelly stretch upward
    this.squashStretch = 1.28;
    this.squashStretchVel = 7.0 * (strength / 8.8);
    this.headBobbleVel.x = -6.0; // Head snaps backward with inertia
    this.accelPitch = -0.32; // Torso tilts slightly back
    this.targetSquash = 1.0;
    this.inAirTime = 0;
  }

  public triggerWobblyLanding(impactForce: number = 1.0) {
    // Squelchy jelly squash on ground contact
    const normalizedImpact = THREE.MathUtils.clamp(impactForce, 0.4, 2.5);
    const targetCompression = Math.max(0.58, 1.0 - normalizedImpact * 0.3);
    this.squashStretch = targetCompression;
    this.squashStretchVel = -normalizedImpact * 9.5;
    this.targetSquash = 1.0;

    // Head compresses down onto neck then spring bounces
    this.headBobbleVel.x = 5.0 * normalizedImpact;
    this.accelPitch = 0.38 * normalizedImpact;
  }

  public triggerWobblyBump(impulseX: number, impulseZ: number) {
    this.turnLean += impulseX * 0.4;
    this.accelPitch += impulseZ * 0.4;
    this.headBobbleVel.z += impulseX * 8.0;
    this.headBobbleVel.x += impulseZ * 8.0;
    this.squashStretch = 0.82;
    this.squashStretchVel = 5.0;
  }

  public updateAnimation(
    delta: number,
    isMoving: boolean,
    isGrounded: boolean,
    velocity?: THREE.Vector3,
    currentYaw?: number
  ) {
    if (this.isRagdoll) {
      this.updateRagdoll(delta);
      return;
    }

    this.wobbleTime += delta;

    // 1. SQUASH & STRETCH JELLY SPRING DAMPER
    const springK = 145.0;
    const damping = 11.5;
    const squashForce = -springK * (this.squashStretch - this.targetSquash) - damping * this.squashStretchVel;
    this.squashStretchVel += squashForce * delta;
    this.squashStretch += this.squashStretchVel * delta;
    this.squashStretch = THREE.MathUtils.clamp(this.squashStretch, 0.52, 1.52);

    // Volume-preserving scale on root group: when height squashes, width bulges outward!
    const invScale = 1.0 / Math.sqrt(Math.max(0.1, this.squashStretch));
    this.parts.root.scale.set(invScale, this.squashStretch, invScale);

    // 2. YAW LEAN & INERTIAL TILT
    if (currentYaw !== undefined) {
      let yawDelta = currentYaw - this.prevYaw;
      while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
      while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
      this.prevYaw = currentYaw;
      // Lean into sharp turns (motorcycle/weeble wobble style)
      const targetLean = THREE.MathUtils.clamp(-yawDelta * 4.5, -0.45, 0.45);
      this.turnLean = THREE.MathUtils.lerp(this.turnLean, targetLean, 0.2);
    } else {
      this.turnLean = THREE.MathUtils.lerp(this.turnLean, 0, 0.1);
    }

    // Spring decay on acceleration pitch
    this.accelPitch = THREE.MathUtils.lerp(this.accelPitch, 0, delta * 5.0);

    const groundSpeed = velocity
      ? Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
      : (isMoving ? 6.2 : 0);
    const vertSpeed = velocity ? velocity.y : 0;

    // 3. GAIT & MODES
    if (isGrounded) {
      this.inAirTime = 0;

      if (isMoving && groundSpeed > 0.3) {
        // ---- WOBBLY DUCK-WADDLE WALKING ----
        const speedMultiplier = 9.5 + groundSpeed * 0.7;
        this.walkTime += delta * speedMultiplier;

        // Step footstrike sound & gentle bounce
        const currentStepSine = Math.sin(this.walkTime);
        if (
          (this.lastStepPhase <= 0 && currentStepSine > 0) ||
          (this.lastStepPhase >= 0 && currentStepSine < 0)
        ) {
          if (this.isPlayerControlled) {
            const pitch = currentStepSine > 0 ? 1.05 : 0.95;
            soundEngine.playWobbleStep(pitch);
          }
          // Slight downstep compression
          this.squashStretchVel -= 0.8;
        }
        this.lastStepPhase = currentStepSine;

        // Waddle sway and hip bounce
        const waddleRoll = Math.sin(this.walkTime) * 0.22;
        const hipBounce = Math.abs(Math.sin(this.walkTime * 2)) * 0.11;
        const hipSway = Math.sin(this.walkTime) * 0.08;

        // Torso: wobbles side to side, leans forward into speed, counter-twists with steps
        this.parts.torso.position.set(hipSway, 1.0 - hipBounce, 0);
        this.parts.torso.rotation.z = waddleRoll + this.turnLean;
        this.parts.torso.rotation.x = this.accelPitch + 0.14 + Math.sin(this.walkTime * 2) * 0.05;
        this.parts.torso.rotation.y = -Math.sin(this.walkTime) * 0.16;

        // Legs: comical wide stance, high bouncy stepping, snappy kick out
        this.parts.leftLeg.rotation.z = -0.14;
        this.parts.rightLeg.rotation.z = 0.14;

        const leftLegSwing = Math.sin(this.walkTime) * 0.82;
        const rightLegSwing = -leftLegSwing;
        this.parts.leftLeg.rotation.x = leftLegSwing;
        this.parts.rightLeg.rotation.x = rightLegSwing;

        // Knee high lift
        this.parts.leftLeg.position.y = 0.5 + Math.max(0, -leftLegSwing * 0.14);
        this.parts.rightLeg.position.y = 0.5 + Math.max(0, -rightLegSwing * 0.14);

        // Arms: floppy noodle flailing! Wide outward cartoon spread + rubbery swing
        const armSwingLeft = -Math.sin(this.walkTime - 0.35) * 0.95;
        const armSwingRight = Math.sin(this.walkTime - 0.35) * (this.heldToolId ? 0.45 : 0.95);
        const armFlailOut = Math.cos(this.walkTime * 2) * 0.12;

        this.parts.leftArm.rotation.x = armSwingLeft;
        this.parts.leftArm.rotation.z = -0.48 - armFlailOut;
        this.parts.leftArm.rotation.y = Math.sin(this.walkTime) * 0.28;

        if (!this.isSlashing) {
          this.parts.rightArm.rotation.x = armSwingRight;
          this.parts.rightArm.rotation.z = 0.48 + (this.heldToolId ? 0.15 : armFlailOut);
          this.parts.rightArm.rotation.y = -Math.sin(this.walkTime) * (this.heldToolId ? 0.12 : 0.28);
        }
      } else {
        // ---- IDLE JELLY BREATHING WOBBLE ----
        const idleBreath = Math.sin(this.wobbleTime * 2.8) * 0.035;
        this.targetSquash = 1.0 + idleBreath;

        this.parts.torso.position.set(0, 1.0, 0);
        this.parts.torso.rotation.set(
          idleBreath * 0.4 + this.accelPitch,
          0,
          Math.sin(this.wobbleTime * 1.4) * 0.02 + this.turnLean
        );

        // Relaxed cute wide stance
        this.parts.leftLeg.rotation.set(0, 0, -0.08);
        this.parts.rightLeg.rotation.set(0, 0, 0.08);
        this.parts.leftLeg.position.y = 0.5;
        this.parts.rightLeg.position.y = 0.5;

        // Comfy relaxed floppy arms
        this.parts.leftArm.rotation.set(0, 0, -0.32 + idleBreath);
        if (!this.isSlashing) {
          this.parts.rightArm.rotation.set(0, 0, 0.32 - idleBreath);
        }
      }
    } else {
      // ---- WOBBLY JUMP / IN-AIR FLUTTER PHYSICS ----
      this.inAirTime += delta;
      const airFlutter = Math.sin(this.wobbleTime * 15.0) * 0.14;

      if (vertSpeed > 1.2) {
        // RISING UP: Arms shoot overhead in panic, legs trail/tuck!
        this.parts.leftArm.rotation.x = -2.15 + airFlutter;
        this.parts.leftArm.rotation.z = -0.68;
        this.parts.leftArm.rotation.y = 0.15;

        if (!this.isSlashing) {
          this.parts.rightArm.rotation.x = -2.15 + airFlutter;
          this.parts.rightArm.rotation.z = 0.68;
          this.parts.rightArm.rotation.y = -0.15;
        }

        // Tucked / dangling legs
        this.parts.leftLeg.rotation.x = 0.42 + Math.sin(this.wobbleTime * 7.0) * 0.18;
        this.parts.rightLeg.rotation.x = -0.25 - Math.sin(this.wobbleTime * 7.0) * 0.18;
        this.parts.leftLeg.rotation.z = -0.22;
        this.parts.rightLeg.rotation.z = 0.22;

        this.parts.torso.rotation.x = -0.16 + this.accelPitch;
        this.parts.torso.rotation.z = this.turnLean * 1.4;
      } else {
        // FALLING DOWN: Airplane wing flailing, comedic bicycle flutter kicks!
        this.parts.leftArm.rotation.x = -0.75 + airFlutter;
        this.parts.leftArm.rotation.z = -1.15 - airFlutter;
        this.parts.leftArm.rotation.y = 0.3;

        if (!this.isSlashing) {
          this.parts.rightArm.rotation.x = -0.75 + airFlutter;
          this.parts.rightArm.rotation.z = 1.15 + airFlutter;
          this.parts.rightArm.rotation.y = -0.3;
        }

        // Mid-air bicycle kick flutter
        const kickCycle = Math.sin(this.wobbleTime * 13.0) * 0.55;
        this.parts.leftLeg.rotation.x = kickCycle;
        this.parts.rightLeg.rotation.x = -kickCycle;
        this.parts.leftLeg.rotation.z = -0.28;
        this.parts.rightLeg.rotation.z = 0.28;

        this.parts.torso.rotation.x = 0.22 + this.accelPitch;
        this.parts.torso.rotation.z = this.turnLean * 1.5;
      }
    }

    // 4. BOBBLEHEAD SECONDARY SPRING PHYSICS (HEAD & HAT)
    const headSpring = 95.0;
    const headDamp = 9.5;
    const targetHeadX = -this.parts.torso.rotation.x * 0.65;
    const targetHeadZ = -this.parts.torso.rotation.z * 0.75;

    this.headBobbleVel.x += (-headSpring * (this.headBobble.x - targetHeadX) - headDamp * this.headBobbleVel.x) * delta;
    this.headBobbleVel.z += (-headSpring * (this.headBobble.z - targetHeadZ) - headDamp * this.headBobbleVel.z) * delta;
    this.headBobble.x += this.headBobbleVel.x * delta;
    this.headBobble.z += this.headBobbleVel.z * delta;

    this.parts.head.rotation.x = this.headBobble.x;
    this.parts.head.rotation.z = this.headBobble.z;
    // Compress head onto neck during squash
    this.parts.head.position.y = 1.82 - (1.0 - this.squashStretch) * 0.25;

    // 5. ATTACK / SLASH OVERRIDE
    if (this.isSlashing) {
      this.slashProgress += delta * 7.5;
      if (this.slashProgress < 1.0) {
        const slashAngle = Math.sin(this.slashProgress * Math.PI) * 1.6;
        this.parts.rightArm.rotation.x = -slashAngle;
        this.parts.rightArm.rotation.z = -slashAngle * 0.4;
      } else {
        this.isSlashing = false;
        this.slashProgress = 0;
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

    // Reset wobbly jelly scale and physics state
    this.squashStretch = 1.0;
    this.squashStretchVel = 0;
    this.targetSquash = 1.0;
    this.parts.root.scale.set(1, 1, 1);
    this.turnLean = 0;
    this.accelPitch = 0;
    this.headBobble.set(0, 0, 0);
    this.headBobbleVel.set(0, 0, 0);

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
