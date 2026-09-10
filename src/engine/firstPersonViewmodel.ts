import * as THREE from 'three';
import { HotbarSlot, ToolId, BlockId } from '../types';
import { BLOCK_DEFINITIONS, getBlockMaterials } from './blocks';

export class FirstPersonViewmodel {
  public group: THREE.Group;
  private armGroup: THREE.Group;
  private armMesh: THREE.Mesh;
  private itemHolder: THREE.Group;

  private basePos: THREE.Vector3 = new THREE.Vector3(0.34, -0.28, -0.52);
  private swingProgress: number = 0;
  private walkTimer: number = 0;
  private currentArmColor: string = '#facc15';

  constructor(armColor: string = '#facc15') {
    this.currentArmColor = armColor;
    this.group = new THREE.Group();
    this.group.position.copy(this.basePos);

    this.armGroup = new THREE.Group();
    this.group.add(this.armGroup);

    // Blocky Right Arm (Roblox/Minecraft hybrid)
    const armGeom = new THREE.BoxGeometry(0.12, 0.38, 0.12);
    const armMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.currentArmColor),
      roughness: 0.5,
      metalness: 0.1
    });
    this.armMesh = new THREE.Mesh(armGeom, armMat);
    this.armMesh.position.set(0, -0.15, 0.1);
    this.armMesh.rotation.set(-0.35, 0.1, -0.15);
    this.armGroup.add(this.armMesh);

    // Held Item Mount at the tip of the hand
    this.itemHolder = new THREE.Group();
    this.itemHolder.position.set(0, 0.05, -0.12);
    this.armGroup.add(this.itemHolder);
  }

  public updateArmColor(color: string) {
    this.currentArmColor = color;
    (this.armMesh.material as THREE.MeshStandardMaterial).color.set(color);
  }

  public setHeldItem(slot: HotbarSlot) {
    // Clear previous item
    while (this.itemHolder.children.length > 0) {
      const child = this.itemHolder.children[0];
      this.itemHolder.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    if (slot.type === 'block') {
      const blockDef = BLOCK_DEFINITIONS[slot.id as BlockId];
      if (!blockDef) return;

      const miniBlockGeom = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const materials = getBlockMaterials(slot.id as BlockId);
      const miniBlock = new THREE.Mesh(miniBlockGeom, materials);
      miniBlock.rotation.set(0.2, -0.4, 0.15);
      this.itemHolder.add(miniBlock);
    } else if (slot.type === 'tool') {
      this.buildToolModel(slot.id as ToolId);
    }
  }

  private buildToolModel(toolId: ToolId) {
    switch (toolId) {
      case 'pickaxe': {
        const toolGroup = new THREE.Group();
        // Handle
        const handleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
        const handle = new THREE.Mesh(handleGeom, handleMat);
        handle.rotation.z = Math.PI / 4;
        toolGroup.add(handle);

        // Pickaxe Head
        const headGeom = new THREE.BoxGeometry(0.28, 0.04, 0.04);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.set(0.14, 0.14, 0);
        head.rotation.z = -Math.PI / 4;
        toolGroup.add(head);

        toolGroup.rotation.set(0.3, -0.3, 0);
        toolGroup.scale.set(1.1, 1.1, 1.1);
        this.itemHolder.add(toolGroup);
        break;
      }

      case 'sword': {
        const toolGroup = new THREE.Group();
        // Hilt
        const hiltGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 6);
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const hilt = new THREE.Mesh(hiltGeom, hiltMat);
        hilt.position.y = -0.12;
        toolGroup.add(hilt);

        // Crossguard
        const guardGeom = new THREE.BoxGeometry(0.16, 0.02, 0.04);
        const guardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });
        const guard = new THREE.Mesh(guardGeom, guardMat);
        guard.position.y = -0.05;
        toolGroup.add(guard);

        // Blade
        const bladeGeom = new THREE.BoxGeometry(0.05, 0.46, 0.015);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);
        blade.position.y = 0.2;
        toolGroup.add(blade);

        toolGroup.rotation.set(-0.2, 0.3, -0.4);
        this.itemHolder.add(toolGroup);
        break;
      }

      case 'rocket_launcher': {
        const tubeGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.48, 8);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
        const tube = new THREE.Mesh(tubeGeom, tubeMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.05, -0.05);
        this.itemHolder.add(tube);
        break;
      }

      case 'gravity_coil': {
        const coilGeom = new THREE.TorusGeometry(0.09, 0.02, 8, 24);
        const coilMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          metalness: 0.4
        });
        const coil = new THREE.Mesh(coilGeom, coilMat);
        coil.rotation.x = Math.PI / 2;
        this.itemHolder.add(coil);
        break;
      }

      case 'speed_coil': {
        const coilGeom = new THREE.TorusGeometry(0.09, 0.02, 8, 24);
        const coilMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 0.6,
          metalness: 0.4
        });
        const coil = new THREE.Mesh(coilGeom, coilMat);
        coil.rotation.x = Math.PI / 2;
        this.itemHolder.add(coil);
        break;
      }

      case 'boombox': {
        const boomboxGroup = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.2,
          emissive: 0x78350f,
          emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.12), goldMat);
        boomboxGroup.add(body);

        const speakerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
        const leftSpk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12), speakerMat);
        leftSpk.rotation.x = Math.PI / 2;
        leftSpk.position.set(-0.09, 0, 0.065);
        boomboxGroup.add(leftSpk);

        const rightSpk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12), speakerMat);
        rightSpk.rotation.x = Math.PI / 2;
        rightSpk.position.set(0.09, 0, 0.065);
        boomboxGroup.add(rightSpk);

        const handleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 });
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 12, Math.PI), handleMat);
        handle.position.set(0, 0.09, 0);
        boomboxGroup.add(handle);

        boomboxGroup.position.set(0, 0.02, -0.05);
        boomboxGroup.rotation.set(0.1, -0.2, 0.1);
        this.itemHolder.add(boomboxGroup);
        break;
      }

      default: {
        // Simple tool handle/gadget fallback
        const toolGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6);
        const toolMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const tool = new THREE.Mesh(toolGeom, toolMat);
        this.itemHolder.add(tool);
        break;
      }
    }
  }

  public triggerSwing() {
    this.swingProgress = 1.0;
  }

  public update(delta: number, isMoving: boolean, isGrounded: boolean) {
    // 1. Swing Animation
    if (this.swingProgress > 0) {
      this.swingProgress = Math.max(0, this.swingProgress - delta * 6.5);
      const curve = Math.sin(this.swingProgress * Math.PI);
      this.armGroup.rotation.x = -curve * 0.85;
      this.armGroup.rotation.y = curve * 0.4;
      this.armGroup.rotation.z = -curve * 0.3;
      this.armGroup.position.z = curve * 0.12;
      this.armGroup.position.y = -curve * 0.08;
    } else {
      this.armGroup.rotation.set(0, 0, 0);
      this.armGroup.position.set(0, 0, 0);
    }

    // 2. Walking Bobbing
    if (isMoving && isGrounded) {
      this.walkTimer += delta * 9.5;
      const bobY = Math.sin(this.walkTimer) * 0.016;
      const bobX = Math.cos(this.walkTimer * 0.5) * 0.012;
      this.group.position.set(
        this.basePos.x + bobX,
        this.basePos.y + bobY,
        this.basePos.z
      );
    } else {
      this.group.position.lerp(this.basePos, 0.15);
    }
  }
}
