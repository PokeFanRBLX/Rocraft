import * as THREE from 'three';
import { VoxelWorld } from './world';
import { CharacterAvatar } from './avatar';
import { PhysicsEngine } from './physics';
import { FirstPersonViewmodel } from './firstPersonViewmodel';
import { AvatarConfig, BlockId, HotbarSlot, ToolId, WorldPreset } from '../types';
import { soundEngine } from '../utils/audio';
import { BLOCK_DEFINITIONS } from './blocks';

export class RocraftGameEngine {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public world: VoxelWorld;
  public avatar: CharacterAvatar;
  public physics: PhysicsEngine;
  public firstPersonViewmodel: FirstPersonViewmodel;

  // Camera settings
  public isFirstPerson: boolean = false;
  public cameraYaw: number = Math.PI; // Face forward (+Z) towards the course by default!
  public cameraPitch: number = 0;
  public cameraDistance: number = 5.5; // 3rd person distance

  // Lighting & Day/Night
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  public dayTime: number = 0.3; // 0.0 to 1.0 (0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 0.0/1.0 = midnight)
  public dayCycleSpeed: number = 0.008; // Day speed

  // Targeted voxel highlight
  public highlightMesh: THREE.LineSegments;
  public targetBlockPos: { x: number; y: number; z: number; normal: THREE.Vector3 } | null = null;
  public raycaster: THREE.Raycaster;
  private centerCoords: THREE.Vector2 = new THREE.Vector2(0, 0);

  // Controls & input
  public keys: Record<string, boolean> = {};
  public isPointerLocked: boolean = false;
  public isMouseDown: boolean = false;
  public lastMouseX: number = 0;
  public lastMouseY: number = 0;

  // Active hotbar item
  public activeSlot: HotbarSlot = { type: 'tool', id: 'pickaxe' };

  // Clock
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  // Callbacks for UI
  public onDayTimeChange?: (time: number, isNight: boolean) => void;
  public onTargetBlockChange?: (blockId: BlockId | null) => void;
  public onPointerLockChange?: (isLocked: boolean) => void;

  constructor(canvas: HTMLCanvasElement, avatarConfig: AvatarConfig, initialPreset: WorldPreset = 'obby') {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.012);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 1000);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.set(40, 80, 40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    // Voxel world
    this.world = new VoxelWorld(this.scene);

    // Player Avatar
    this.avatar = new CharacterAvatar(avatarConfig);
    this.scene.add(this.avatar.group);

    // 1st Person Viewmodel (attached directly to camera like Minecraft)
    this.firstPersonViewmodel = new FirstPersonViewmodel(avatarConfig.rightArmColor || avatarConfig.headColor);
    this.camera.add(this.firstPersonViewmodel.group);
    this.firstPersonViewmodel.group.visible = this.isFirstPerson;
    this.avatar.group.visible = !this.isFirstPerson;

    // Physics
    this.physics = new PhysicsEngine(this.world, this.avatar, this.scene);

    // Generate initial world preset
    this.world.generatePreset(initialPreset);
    this.physics.resetPlayerToSpawn();

    if (initialPreset === 'arena') {
      // Spawn some target dummies for fighting!
      this.physics.spawnDummy(0, 1, 0, 'Training Dummy');
      this.physics.spawnDummy(-6, 1, -4, 'Roblox Noob');
      this.physics.spawnDummy(6, 1, 4, 'Roblox Champion');
    }

    // Raycaster & voxel highlight wireframe
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 8.0; // Reach distance (classic 8 voxels)

    const boxGeom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const wireGeom = new THREE.EdgesGeometry(boxGeom);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.highlightMesh = new THREE.LineSegments(wireGeom, wireMat);
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    this.clock = new THREE.Clock();

    // Event listeners
    this.setupListeners();

    // Set initial tool
    this.setActiveItem(this.activeSlot);

    // Start loop
    this.animate();
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    if (this.onPointerLockChange) {
      this.onPointerLockChange(this.isPointerLocked);
    }
  };

  public requestPointerLock() {
    try {
      this.canvas.requestPointerLock();
    } catch {
      // Ignore if browser restricts
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Hotbar selection 1-9
    if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 9) {
        // Handled via React state in App.tsx
      }
    }

    // Perspective toggle key (V)
    if (e.code === 'KeyV' || e.code === 'F5') {
      this.togglePerspective();
    }

    // Quick Reset Character (R)
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
      this.physics.killPlayer();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
    }

    this.isMouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    if (e.button === 0) {
      // Left Click: Action / Mine / Slash / Shoot
      this.handlePrimaryAction();
    } else if (e.button === 2) {
      // Right Click: Place Block / Secondary action
      this.handleSecondaryAction();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.isMouseDown = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    let movementX = e.movementX;
    let movementY = e.movementY;

    // Fallback if not pointer locked but dragging
    if (!this.isPointerLocked) {
      if (!this.isMouseDown && !this.isFirstPerson) return;
      movementX = e.clientX - this.lastMouseX;
      movementY = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }

    const sensitivity = 0.0026;
    this.cameraYaw -= movementX * sensitivity;
    this.cameraPitch -= movementY * sensitivity;

    // Clamp pitch to avoid gimbal flip
    const maxPitch = Math.PI / 2 - 0.06;
    this.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, this.cameraPitch));
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.isFirstPerson) {
      this.cameraDistance = Math.max(1.8, Math.min(14.0, this.cameraDistance + e.deltaY * 0.005));
    }
  };

  public togglePerspective() {
    this.isFirstPerson = !this.isFirstPerson;
    // In 1st person: hide third person avatar completely, show 1st person viewmodel
    this.avatar.group.visible = !this.isFirstPerson;
    this.firstPersonViewmodel.group.visible = this.isFirstPerson;

    if (this.isFirstPerson && !this.isPointerLocked) {
      this.requestPointerLock();
    }
  }

  public setActiveItem(slot: HotbarSlot) {
    this.activeSlot = slot;
    if (slot.type === 'tool') {
      this.avatar.setHeldItem(slot.id as ToolId, null);
    } else {
      this.avatar.setHeldItem(null, slot.id as BlockId);
    }
    this.firstPersonViewmodel.setHeldItem(slot);
  }

  // ================= ACTION HANDLERS ================= //

  public handlePrimaryAction() {
    if (this.physics.isDead) return;

    // Trigger visual swing on both models
    this.avatar.triggerSwing();
    this.firstPersonViewmodel.triggerSwing();

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const origin = this.isFirstPerson
      ? this.camera.position
      : this.physics.playerPos.clone().add(new THREE.Vector3(0, 1.4, 0));

    // 1. Sword: Slash attack
    if (this.activeSlot.type === 'tool' && this.activeSlot.id === 'sword') {
      this.physics.attackWithSword(origin, camDir);
      return;
    }

    // 2. Rocket Launcher: Fire Rocket
    if (this.activeSlot.type === 'tool' && this.activeSlot.id === 'rocket_launcher') {
      const launchPos = origin.clone().addScaledVector(camDir, 0.8);
      this.physics.fireRocket(launchPos, camDir);
      return;
    }

    // 3. Paint Gun: Recolor block
    if (this.activeSlot.type === 'tool' && this.activeSlot.id === 'paint_gun') {
      if (this.targetBlockPos) {
        const colors: BlockId[] = ['gold', 'diamond', 'obsidian', 'glowstone', 'brick', 'wood', 'ice'];
        const current = this.world.getBlock(this.targetBlockPos.x, this.targetBlockPos.y, this.targetBlockPos.z);
        const next = colors[(colors.indexOf(current as BlockId) + 1) % colors.length] || 'gold';
        this.world.setBlock(this.targetBlockPos.x, this.targetBlockPos.y, this.targetBlockPos.z, next);
        soundEngine.playPlaceBlock();
        this.physics.spawnBlockParticles(this.targetBlockPos.x, this.targetBlockPos.y, this.targetBlockPos.z, 0xec4899, 6);
      }
      return;
    }

    // 4. TNT Detonator: Spawn primed TNT
    if (this.activeSlot.type === 'tool' && this.activeSlot.id === 'tnt_detonator') {
      if (this.targetBlockPos) {
        const px = this.targetBlockPos.x + this.targetBlockPos.normal.x;
        const py = this.targetBlockPos.y + this.targetBlockPos.normal.y;
        const pz = this.targetBlockPos.z + this.targetBlockPos.normal.z;
        this.physics.spawnPrimedTNT(px, py, pz);
      }
      return;
    }

    // 5. Pickaxe or Bare Hands: Break targeted voxel
    if (this.targetBlockPos) {
      const { x, y, z } = this.targetBlockPos;
      const blockId = this.world.getBlock(x, y, z);
      if (blockId) {
        const def = BLOCK_DEFINITIONS[blockId];
        soundEngine.playBreakBlock();
        const particleColor = def ? parseInt(def.color.replace('#', '0x'), 16) : 0x888888;
        this.physics.spawnBlockParticles(x, y, z, particleColor, 14);

        if (blockId === 'tnt') {
          // Primed explosion!
          this.world.removeBlock(x, y, z);
          this.physics.spawnPrimedTNT(x, y, z);
        } else {
          this.world.removeBlock(x, y, z);
        }
      }
    }
  }

  public handleSecondaryAction() {
    if (this.physics.isDead) return;

    // Trigger visual swing
    this.avatar.triggerSwing();
    this.firstPersonViewmodel.triggerSwing();

    // Place active block if aiming at a valid block face
    if (this.activeSlot.type === 'block' && this.targetBlockPos) {
      const placeX = this.targetBlockPos.x + this.targetBlockPos.normal.x;
      const placeY = this.targetBlockPos.y + this.targetBlockPos.normal.y;
      const placeZ = this.targetBlockPos.z + this.targetBlockPos.normal.z;

      // Prevent placing inside player bounding box
      const pMinX = this.physics.playerPos.x - 0.35;
      const pMaxX = this.physics.playerPos.x + 0.35;
      const pMinZ = this.physics.playerPos.z - 0.35;
      const pMaxZ = this.physics.playerPos.z + 0.35;
      const pMinY = this.physics.playerPos.y;
      const pMaxY = this.physics.playerPos.y + 1.8;

      const insidePlayer =
        placeX + 0.5 > pMinX &&
        placeX - 0.5 < pMaxX &&
        placeZ + 0.5 > pMinZ &&
        placeZ - 0.5 < pMaxZ &&
        placeY + 0.5 > pMinY &&
        placeY - 0.5 < pMaxY;

      if (!insidePlayer) {
        this.world.setBlock(placeX, placeY, placeZ, this.activeSlot.id as BlockId);
        soundEngine.playPlaceBlock();
        const def = BLOCK_DEFINITIONS[this.activeSlot.id as BlockId];
        const color = def ? parseInt(def.color.replace('#', '0x'), 16) : 0x22c55e;
        this.physics.spawnBlockParticles(placeX, placeY, placeZ, color, 6);
      }
    } else if (this.activeSlot.type === 'tool' && this.activeSlot.id === 'gravity_coil') {
      soundEngine.playGravityBoing();
    } else if (this.activeSlot.type === 'tool' && this.activeSlot.id === 'speed_coil') {
      soundEngine.playSpeedBoost();
    }
  }

  // ================= MAIN ANIMATION LOOP ================= //

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Day / Night cycle progression
    this.updateDayNight(delta);

    // 2. Gather player input
    const forward = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const strafe = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
    const jump = !!this.keys['Space'];

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    // 3. Update Physics & Player
    this.physics.update(delta, { forward, strafe, jump }, this.cameraYaw, camDir);
    this.world.update(delta);

    // 4. Update Camera Position & Orbit
    this.updateCamera(delta);

    // 5. Update Targeted Voxel Raycast
    this.updateTargetRaycast();

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(delta: number) {
    if (this.isFirstPerson) {
      // 1st Person: Camera at player eye level, tracking jelly squash & stretch
      const eyeHeight = 1.62 * (0.5 + 0.5 * this.avatar.squashStretch);
      this.camera.position.set(
        this.physics.playerPos.x,
        this.physics.playerPos.y + eyeHeight,
        this.physics.playerPos.z
      );

      const lookDir = new THREE.Vector3(
        -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
        Math.sin(this.cameraPitch),
        -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
      );
      this.camera.lookAt(this.camera.position.clone().add(lookDir));

      // Keep avatar rotated in look direction for physics consistency
      this.avatar.group.rotation.y = this.cameraYaw + Math.PI;

      // Update 1st person viewmodel bobbing, sway & swinging
      const isMoving = Math.abs(this.physics.playerVel.x) > 0.3 || Math.abs(this.physics.playerVel.z) > 0.3;
      this.firstPersonViewmodel.update(delta, isMoving, this.physics.isGrounded, this.physics.playerVel);
    } else {
      // 3rd Person: Orbit over player's shoulder (classic Roblox camera)
      const targetPos = new THREE.Vector3(
        this.physics.playerPos.x,
        this.physics.playerPos.y + 1.3,
        this.physics.playerPos.z
      );

      const offset = new THREE.Vector3(
        Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance,
        -Math.sin(this.cameraPitch) * this.cameraDistance + 0.4,
        Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance
      );

      this.camera.position.copy(targetPos).add(offset);
      this.camera.lookAt(targetPos);
    }
  }

  private updateTargetRaycast() {
    this.raycaster.setFromCamera(this.centerCoords, this.camera);
    const intersects = this.raycaster.intersectObjects(this.world.worldGroup.children, false);

    if (intersects.length > 0 && intersects[0].distance <= 7.5) {
      const hit = intersects[0];
      const mesh = hit.object as THREE.Mesh;
      if (mesh && mesh.userData && mesh.userData.rx !== undefined) {
        const rx = mesh.userData.rx;
        const ry = mesh.userData.ry;
        const rz = mesh.userData.rz;
        const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

        this.targetBlockPos = { x: rx, y: ry, z: rz, normal };
        this.highlightMesh.position.set(rx, ry, rz);
        this.highlightMesh.visible = true;

        if (this.onTargetBlockChange) {
          const blockId = this.world.getBlock(rx, ry, rz);
          this.onTargetBlockChange(blockId);
        }
        return;
      }
    }

    this.targetBlockPos = null;
    this.highlightMesh.visible = false;
    if (this.onTargetBlockChange) {
      this.onTargetBlockChange(null);
    }
  }

  private updateDayNight(delta: number) {
    this.dayTime = (this.dayTime + delta * this.dayCycleSpeed) % 1.0;

    const angle = this.dayTime * Math.PI * 2;
    const sunDist = 120;
    this.sunLight.position.set(
      Math.cos(angle) * sunDist,
      Math.sin(angle) * sunDist,
      40
    );

    const isNight = this.dayTime < 0.2 || this.dayTime > 0.8;
    if (!isNight) {
      // Daytime
      const skyBlue = new THREE.Color(0x7dd3fc);
      this.scene.background = skyBlue;
      if (this.scene.fog) this.scene.fog.color = skyBlue;
      this.sunLight.intensity = 1.2;
      this.ambientLight.intensity = 0.45;
    } else {
      // Nighttime
      const nightSky = new THREE.Color(0x090d16);
      this.scene.background = nightSky;
      if (this.scene.fog) this.scene.fog.color = nightSky;
      this.sunLight.intensity = 0.15;
      this.ambientLight.intensity = 0.2;
    }

    if (this.onDayTimeChange) {
      this.onDayTimeChange(this.dayTime, isNight);
    }
  }

  public handleResize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.dispose();
  }
}
