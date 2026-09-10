import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Check, Sparkles, User, Wand2 } from 'lucide-react';
import { AvatarConfig, FaceType, HatType } from '../types';
import { CharacterAvatar } from '../engine/avatar';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  currentConfig: AvatarConfig;
  onClose: () => void;
  onSave: (config: AvatarConfig) => void;
}

const ROBLOX_COLOR_PALETTE = [
  { name: 'Classic Yellow', hex: '#facc15' },
  { name: 'Bright Blue', hex: '#0284c7' },
  { name: 'Bright Green', hex: '#16a34a' },
  { name: 'Bright Red', hex: '#dc2626' },
  { name: 'Vibrant Orange', hex: '#ea580c' },
  { name: 'Deep Purple', hex: '#9333ea' },
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Pure White', hex: '#f8fafc' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Cyan Teal', hex: '#06b6d4' }
];

const FACES: { id: FaceType; name: string; icon: string }[] = [
  { id: 'classic_smile', name: 'Classic Smile', icon: '🙂' },
  { id: 'chill', name: 'Chill Shades', icon: '😎' },
  { id: 'epic', name: 'Epic Face', icon: '😃' },
  { id: 'xd', name: 'XD Face', icon: '😆' },
  { id: 'surprised', name: 'Surprised :O', icon: '😮' }
];

const HATS: { id: HatType; name: string; icon: string }[] = [
  { id: 'none', name: 'No Hat', icon: '🚫' },
  { id: 'top_hat', name: 'Blox Top Hat', icon: '🎩' },
  { id: 'builder_helmet', name: 'Builder Hardhat', icon: '👷' },
  { id: 'crown', name: 'Royal Crown', icon: '👑' },
  { id: 'viking', name: 'Viking Horns', icon: '⚔️' },
  { id: 'valkyrie', name: 'Valkyrie Helm', icon: '🛡️' },
  { id: 'cap', name: 'Red Cap', icon: '🧢' }
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  currentConfig,
  onClose,
  onSave
}) => {
  const [draft, setDraft] = useState<AvatarConfig>({ ...currentConfig });
  const [activeTab, setActiveTab] = useState<'colors' | 'face' | 'hats'>('colors');
  const [selectedBodyPart, setSelectedBodyPart] = useState<'head' | 'torso' | 'arms' | 'legs'>('torso');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewAvatarRef = useRef<CharacterAvatar | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft({ ...currentConfig });
    }
  }, [isOpen, currentConfig]);

  // Mini 3D preview renderer for avatar
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 1.1, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const avatar = new CharacterAvatar(draft);
    scene.add(avatar.group);
    previewAvatarRef.current = avatar;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      avatar.group.rotation.y += 0.015; // Slow rotation
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [isOpen]);

  // Live update preview avatar
  useEffect(() => {
    if (previewAvatarRef.current) {
      previewAvatarRef.current.updateConfig(draft);
    }
  }, [draft]);

  if (!isOpen) return null;

  const handleApplyColor = (hex: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (selectedBodyPart === 'head') next.headColor = hex;
      if (selectedBodyPart === 'torso') next.torsoColor = hex;
      if (selectedBodyPart === 'arms') {
        next.leftArmColor = hex;
        next.rightArmColor = hex;
      }
      if (selectedBodyPart === 'legs') {
        next.leftLegColor = hex;
        next.rightLegColor = hex;
      }
      return next;
    });
  };

  const applyPresetClassicNoob = () => {
    setDraft({
      ...draft,
      headColor: '#facc15',
      torsoColor: '#0284c7',
      leftArmColor: '#facc15',
      rightArmColor: '#facc15',
      leftLegColor: '#16a34a',
      rightLegColor: '#16a34a',
      face: 'classic_smile'
    });
  };

  const applyPresetShadowKnight = () => {
    setDraft({
      ...draft,
      headColor: '#1e293b',
      torsoColor: '#090d16',
      leftArmColor: '#1e293b',
      rightArmColor: '#1e293b',
      leftLegColor: '#0f172a',
      rightLegColor: '#0f172a',
      face: 'chill',
      hat: 'top_hat'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Fredoka']">
              Avatar Customizer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left: 3D Preview */}
          <div className="w-full md:w-56 bg-slate-950/70 p-4 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Preview
            </div>

            <div className="relative w-44 h-52 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Name Input */}
            <div className="w-full mt-3">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Player Name:
              </label>
              <input
                type="text"
                value={draft.name}
                maxLength={16}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2 mt-3 w-full">
              <button
                type="button"
                onClick={applyPresetClassicNoob}
                className="flex-1 py-1 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded transition cursor-pointer"
              >
                Noob
              </button>
              <button
                type="button"
                onClick={applyPresetShadowKnight}
                className="flex-1 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition cursor-pointer"
              >
                Shadow
              </button>
            </div>
          </div>

          {/* Right: Customization Controls */}
          <div className="flex-1 p-5 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4">
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'colors'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Body Colors
              </button>
              <button
                onClick={() => setActiveTab('face')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'face'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Faces
              </button>
              <button
                onClick={() => setActiveTab('hats')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'hats'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Hats & Accessories
              </button>
            </div>

            {/* TAB 1: Body Colors */}
            {activeTab === 'colors' && (
              <div className="space-y-4 flex-1">
                {/* Body Part Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Select Body Part:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['head', 'torso', 'arms', 'legs'] as const).map((part) => (
                      <button
                        key={part}
                        onClick={() => setSelectedBodyPart(part)}
                        className={`py-1.5 text-xs font-semibold uppercase rounded-lg border transition cursor-pointer ${
                          selectedBodyPart === part
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Pick Color for {selectedBodyPart.toUpperCase()}:
                  </label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {ROBLOX_COLOR_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleApplyColor(c.hex)}
                        className="group flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
                        title={c.name}
                      >
                        <div
                          className="w-8 h-8 rounded-lg shadow-md border border-black/20 group-hover:scale-110 transition"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px] text-slate-400 font-medium text-center truncate w-full">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Face Selector */}
            {activeTab === 'face' && (
              <div className="space-y-3 flex-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Face Expression:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FACES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDraft({ ...draft, face: f.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        draft.face === f.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl">{f.icon}</span>
                      <span className="text-xs font-bold">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Hat Selector */}
            {activeTab === 'hats' && (
              <div className="space-y-3 flex-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Equip Hat / Accessory:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {HATS.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setDraft({ ...draft, hat: h.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        draft.hat === h.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl">{h.icon}</span>
                      <span className="text-xs font-bold">{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Apply Character
          </button>
        </div>
      </div>
    </div>
  );
};
