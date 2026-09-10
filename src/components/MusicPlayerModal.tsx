import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  RotateCcw,
  Sparkles,
  Radio,
  FileAudio,
  Check
} from 'lucide-react';
import { soundEngine, SoundtrackInfo } from '../utils/audio';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(soundEngine.isMusicActive());
  const [volume, setVolume] = useState<number>(soundEngine.getMusicVolume());
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [trackInfo, setTrackInfo] = useState<SoundtrackInfo>(soundEngine.getCurrentTrackInfo());
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with soundEngine events
  useEffect(() => {
    const unsub = soundEngine.subscribeMusicState(() => {
      setIsPlaying(soundEngine.isMusicActive());
      setVolume(soundEngine.getMusicVolume());
      setIsMuted(soundEngine.getMuted());
      setTrackInfo(soundEngine.getCurrentTrackInfo());
    });
    return unsub;
  }, []);

  // Visualizer animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const render = () => {
      soundEngine.getFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 24) - 2;
      let x = 0;

      for (let i = 0; i < 24; i++) {
        // Boost mid-range slightly for visual aesthetics
        const rawVal = dataArray[i] || 0;
        const val = Math.min(255, rawVal * 1.35);
        const percent = val / 255;
        const barHeight = Math.max(4, percent * canvas.height);

        // Smooth amber to emerald gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#34d399');
        gradient.addColorStop(0.5, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');

        ctx.fillStyle = isPlaying ? gradient : 'rgba(100, 116, 139, 0.4)';
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    soundEngine.toggleMusic();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    soundEngine.setMusicVolume(newVol);
  };

  const handleToggleMute = () => {
    soundEngine.toggleMute();
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      setUploadStatus('Please drop a valid audio file (.mp3, .wav, .ogg, .m4a)');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    try {
      setUploadStatus('Loading soundtrack...');
      const trackName = await soundEngine.loadCustomTrackFile(file);
      setUploadStatus(`Playing "${trackName}"!`);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error('Failed to load file', err);
      setUploadStatus('Failed to load audio file');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleResetTrack = async () => {
    await soundEngine.resetToSynthesizedTrack();
    setUploadStatus('Reset to Track 1: Chill Lofi Boom Bap');
    setTimeout(() => setUploadStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="modal-soundtrack"
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                Rocraft Boombox & Soundtrack
              </h2>
              <p className="text-xs text-slate-400">
                In-game background music & custom audio player
              </p>
            </div>
          </div>
          <button
            id="btn-close-music-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Visualizer & Now Playing Display */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3 relative overflow-hidden shadow-inner">
            {/* Visualizer Canvas */}
            <canvas
              ref={canvasRef}
              width={340}
              height={50}
              className="w-full h-12 rounded opacity-90"
            />

            {/* Now Playing text */}
            <div className="flex items-center justify-between w-full pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPlaying && !isMuted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[280px]">
                    {trackInfo.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {trackInfo.isCustom ? 'Custom Uploaded Soundtrack' : 'Built-in Retro Lofi (84 BPM)'}
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                {isPlaying ? 'PLAYING' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Primary Playback Controls */}
          <div className="flex items-center justify-center gap-4 py-1">
            <button
              id="btn-toggle-music-play"
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause Music' : 'Play Music'}</span>
            </button>

            <button
              id="btn-toggle-music-mute"
              onClick={handleToggleMute}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <div className="flex justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                Music Volume
              </span>
              <span className="text-amber-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              id="input-music-volume"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
          </div>

          {/* Custom Audio Upload / Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-4 transition text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="p-2.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                Drop your soundtrack audio file here or <span className="text-amber-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports MP3, WAV, OGG, M4A • Persists in browser storage
              </p>
            </div>
          </div>

          {/* Status Message */}
          {uploadStatus && (
            <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-2 rounded-lg text-center flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* Actions & Reset */}
          <div className="flex items-center justify-between pt-1">
            <button
              id="btn-reset-to-synth"
              onClick={handleResetTrack}
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Default Track 1</span>
            </button>

            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              Tip: Equip <span className="text-amber-400 font-bold">Golden Boombox (📻)</span> to carry it!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
