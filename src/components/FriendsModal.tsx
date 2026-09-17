import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  UserPlus,
  Compass,
  Search,
  Check,
  Star,
  Trash2,
  MessageSquare,
  Sparkles,
  Crown,
  Play,
  Share2,
  Signal,
  Plus,
  Shield,
  Sprout,
  DoorClosed,
  Trees,
  Box,
  Gamepad2,
  Send,
  UserCheck
} from 'lucide-react';
import { Friend, LobbyInfo, FriendRequest, WorldPreset } from '../types';
import {
  loadStoredFriends,
  saveStoredFriends,
  loadStoredRequests,
  saveStoredRequests,
  addFriendByName,
  getLobbiesWithFriends,
  SUGGESTED_PLAYERS,
  saveCustomLobbies,
  loadCustomLobbies
} from '../utils/friendsStorage';
import { soundEngine } from '../utils/audio';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: WorldPreset;
  currentLobby: LobbyInfo | null;
  onJoinLobby: (lobby: LobbyInfo, friendName?: string) => void;
  onOpenChatWithWhisper?: (friendName: string) => void;
}

type TabType = 'friends' | 'add' | 'lobbies';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentPreset,
  currentLobby,
  onJoinLobby,
  onOpenChatWithWhisper
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>(() => loadStoredFriends());
  const [requests, setRequests] = useState<FriendRequest[]>(() => loadStoredRequests());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'favorites'>('all');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedWorldFilter, setSelectedWorldFilter] = useState<string>('all');
  const [copiedLobbyId, setCopiedLobbyId] = useState(false);

  // Custom Lobby Creator State
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [newLobbyName, setNewLobbyName] = useState('');
  const [newLobbyPreset, setNewLobbyPreset] = useState<WorldPreset>('obby');
  const [newLobbyMaxPlayers, setNewLobbyMaxPlayers] = useState<number>(12);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const onlineFriendsCount = useMemo(() => {
    return friends.filter((f) => f.status !== 'offline').length;
  }, [friends]);

  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      if (searchQuery.trim()) {
        const matchesName = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLobby = f.currentLobby?.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesName && !matchesLobby) return false;
      }
      if (filterMode === 'online') {
        return f.status !== 'offline';
      }
      if (filterMode === 'favorites') {
        return !!f.isFavorite;
      }
      return true;
    });
  }, [friends, searchQuery, filterMode]);

  const lobbies = useMemo(() => {
    return getLobbiesWithFriends(friends);
  }, [friends]);

  const filteredLobbies = useMemo(() => {
    return lobbies.filter((l) => {
      if (selectedWorldFilter !== 'all' && l.preset !== selectedWorldFilter) {
        return false;
      }
      return true;
    });
  }, [lobbies, selectedWorldFilter]);

  if (!isOpen) return null;

  const handleToggleFavorite = (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = friends.map((f) =>
      f.id === friendId ? { ...f, isFavorite: !f.isFavorite } : f
    );
    setFriends(updated);
    saveStoredFriends(updated);
    soundEngine.playCollectCoin();
  };

  const handleRemoveFriend = (friendId: string, friendName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) {
      const updated = friends.filter((f) => f.id !== friendId);
      setFriends(updated);
      saveStoredFriends(updated);
      showToast(`Removed ${friendName} from friends.`);
    }
  };

  const handleAddFriendSubmit = (nameToAdd?: string) => {
    const target = nameToAdd || newFriendInput;
    if (!target.trim()) return;

    const res = addFriendByName(friends, target);
    if (res.success) {
      setFriends(res.updatedFriends);
      setNewFriendInput('');
      soundEngine.playFriendSuccess();
      showToast(`✨ ${res.message}`);
    } else {
      showToast(`⚠️ ${res.message}`);
    }
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    const res = addFriendByName(friends, req.fromName);
    if (res.success) {
      setFriends(res.updatedFriends);
      const updatedReqs = requests.filter((r) => r.id !== req.id);
      setRequests(updatedReqs);
      saveStoredRequests(updatedReqs);
      soundEngine.playFriendSuccess();
      showToast(`🤝 Accepted friend request from ${req.fromName}!`);
    }
  };

  const handleDeclineRequest = (reqId: string) => {
    const updatedReqs = requests.filter((r) => r.id !== reqId);
    setRequests(updatedReqs);
    saveStoredRequests(updatedReqs);
    showToast('Friend request declined.');
  };

  const handleCreateLobbySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLobbyName.trim() || `My ${newLobbyPreset.toUpperCase()} Lobby`;
    const newLobby: LobbyInfo = {
      id: `custom-lobby-${Date.now()}`,
      name,
      preset: newLobbyPreset,
      playersCount: 1,
      maxPlayers: newLobbyMaxPlayers,
      pingMs: 14,
      region: 'Local / Dedicated',
      hostName: 'You'
    };

    const currentCustom = loadCustomLobbies();
    saveCustomLobbies([newLobby, ...currentCustom]);
    setShowCreateLobby(false);
    setNewLobbyName('');
    showToast(`🎉 Created lobby "${name}"! Connecting...`);
    onJoinLobby(newLobby);
    onClose();
  };

  const getWorldIcon = (preset: WorldPreset) => {
    switch (preset) {
      case 'doors':
        return <DoorClosed className="w-4 h-4 text-amber-500" />;
      case 'garden':
        return <Sprout className="w-4 h-4 text-lime-400" />;
      case 'obby':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'arena':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'survival':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'flat':
      default:
        return <Box className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toast alert inside modal */}
        {toastMessage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Fredoka'] flex items-center gap-2">
                Friends & Multiplayer Lobbies
              </h2>
              <p className="text-[11px] text-slate-400">
                Join friends in their active lobbies, send requests, or explore public game servers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-5 pt-2 border-b border-slate-800 bg-slate-950/40 gap-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'friends'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {onlineFriendsCount}/{friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer relative ${
              activeTab === 'add'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Friends</span>
            {requests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('lobbies')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'lobbies'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Browse Lobbies</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {lobbies.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ================= TAB 1: FRIENDS LIST ================= */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends or lobby..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center gap-1 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-slate-700 text-white shadow'
                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({friends.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('online')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      filterMode === 'online'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow'
                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online ({onlineFriendsCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('favorites')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      filterMode === 'favorites'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Favorites
                  </button>
                </div>
              </div>

              {/* Friends Cards */}
              {filteredFriends.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6">
                  <Users className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No friends found</p>
                  <p className="text-xs text-slate-500">
                    {searchQuery ? 'Try matching another name or filter' : 'Add friends from the Add Friends tab to play together!'}
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow"
                  >
                    Add New Friends
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredFriends.map((f) => {
                    const isOnline = f.status !== 'offline';
                    const hasLobby = isOnline && !!f.currentLobby;

                    return (
                      <div
                        key={f.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          f.isFavorite
                            ? 'bg-slate-800/60 border-amber-500/30 hover:border-amber-400/50'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Avatar & Name Details */}
                        <div className="flex items-center gap-3">
                          {/* Mini Blocky Avatar Visual */}
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shadow border border-white/10"
                              style={{ backgroundColor: f.avatarColors.torso }}
                            >
                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center shadow-inner"
                                style={{ backgroundColor: f.avatarColors.head }}
                              >
                                <span className="text-[10px] select-none font-mono">^‿^</span>
                              </div>
                            </div>
                            {/* Online / Offline status dot */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                                isOnline ? 'bg-emerald-400 ring-2 ring-emerald-500/40 animate-pulse' : 'bg-slate-600'
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-100 font-['Fredoka']">
                                {f.name}
                              </span>

                              {/* Rank / Role badge */}
                              {f.badge && (
                                <span
                                  className={`text-[10px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                    f.badge.includes('OWNER')
                                      ? 'rainbow-text border-amber-400 bg-amber-500/20'
                                      : f.badge === 'VIP'
                                      ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
                                      : f.badge === 'CREATOR'
                                      ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                                      : f.badge === 'BUILDER'
                                      ? 'text-orange-300 border-orange-500/40 bg-orange-500/10'
                                      : 'text-slate-300 border-slate-700 bg-slate-800'
                                  }`}
                                >
                                  {f.badge}
                                </span>
                              )}

                              {/* Favorite star */}
                              <button
                                onClick={(e) => handleToggleFavorite(f.id, e)}
                                className="p-0.5 rounded text-slate-500 hover:text-amber-400 transition cursor-pointer"
                                title={f.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    f.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-amber-400'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Lobby presence description */}
                            {hasLobby && f.currentLobby ? (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                <span className="text-emerald-400 font-medium flex items-center gap-1">
                                  {getWorldIcon(f.currentLobby.preset)}
                                  <span>{f.currentLobby.name}</span>
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400 text-[11px]">
                                  {f.currentLobby.playersCount}/{f.currentLobby.maxPlayers} Players
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-sky-400 text-[10px] font-mono">
                                  {f.currentLobby.pingMs}ms ({f.currentLobby.region})
                                </span>
                              </div>
                            ) : isOnline ? (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Online in Main Studio
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Offline {f.lastSeen ? `• Last seen ${f.lastSeen}` : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {/* Join Lobby Primary Button */}
                          {hasLobby && f.currentLobby && (
                            <button
                              onClick={() => {
                                onJoinLobby(f.currentLobby!, f.name);
                                onClose();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition cursor-pointer ring-1 ring-emerald-400/50"
                              title={`Join ${f.name}'s lobby`}
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Join Lobby</span>
                            </button>
                          )}

                          {/* Invite to My Lobby */}
                          {isOnline && currentLobby && (
                            <button
                              onClick={() => {
                                soundEngine.playFriendSuccess();
                                showToast(`📩 Sent lobby invite to ${f.name}!`);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer shadow"
                              title="Invite to your current lobby"
                            >
                              Invite
                            </button>
                          )}

                          {/* Whisper / Chat */}
                          <button
                            onClick={() => {
                              if (onOpenChatWithWhisper) {
                                onOpenChatWithWhisper(f.name);
                                onClose();
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                            title={`Send message to ${f.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove friend */}
                          <button
                            onClick={(e) => handleRemoveFriend(f.id, f.name, e)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                            title="Remove friend"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: ADD FRIENDS ================= */}
          {activeTab === 'add' && (
            <div className="space-y-5">
              {/* Search & Add by Username input */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-slate-300 block font-['Fredoka']">
                  Add Player by Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFriendInput}
                    onChange={(e) => setNewFriendInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddFriendSubmit();
                    }}
                    placeholder="Enter Roblox username (e.g. PokeFan_Pro, SpeedyBlox)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => handleAddFriendSubmit()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shadow-emerald-950"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Friend</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: Adding a friend allows you to track which game experiences they are playing and join their server lobbies with one click!
                </p>
              </div>

              {/* Pending Friend Requests */}
              {requests.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-['Fredoka']">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pending Friend Requests ({requests.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xs shadow"
                            style={{ backgroundColor: req.avatarHeadColor }}
                          >
                            {req.fromName.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200">
                              {req.fromName}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Sent {req.timestamp} {req.mutualFriends ? `• ${req.mutualFriends} mutual friends` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Players in Server */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Fredoka']">
                  Suggested Players in Current Universe
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED_PLAYERS.map((p) => {
                    const isAlreadyFriend = friends.some(
                      (f) => f.name.toLowerCase() === p.name.toLowerCase()
                    );

                    return (
                      <div
                        key={p.name}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xs shadow"
                            style={{ backgroundColor: p.headColor }}
                          >
                            {p.name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200">
                                {p.name}
                              </span>
                              <span className="text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {p.badge}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-400/80">
                              {p.statusDesc}
                            </div>
                          </div>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Friends
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddFriendSubmit(p.name)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: BROWSE LOBBIES ================= */}
          {activeTab === 'lobbies' && (
            <div className="space-y-4">
              {/* Category Filter & Create Lobby button */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Lobbies' },
                    { id: 'doors', label: 'DOORS Hotel' },
                    { id: 'garden', label: 'Grow a Garden' },
                    { id: 'obby', label: 'Mega Obby' },
                    { id: 'arena', label: 'Castle Arena' },
                    { id: 'survival', label: 'Wilderness' },
                    { id: 'flat', label: 'Sandbox' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedWorldFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedWorldFilter === filter.id
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow'
                          : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCreateLobby(!showCreateLobby)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shadow-sky-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Host New Lobby</span>
                </button>
              </div>

              {/* Create Lobby Form Drawer */}
              {showCreateLobby && (
                <form
                  onSubmit={handleCreateLobbySubmit}
                  className="p-4 bg-slate-950 border border-sky-500/40 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-150"
                >
                  <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider font-['Fredoka']">
                    Create Custom Multiplayer Lobby
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Lobby Name:
                      </label>
                      <input
                        type="text"
                        value={newLobbyName}
                        onChange={(e) => setNewLobbyName(e.target.value)}
                        placeholder="e.g. Seek Speedrun Pro Lobby..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                        maxLength={40}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        World Experience:
                      </label>
                      <select
                        value={newLobbyPreset}
                        onChange={(e) => setNewLobbyPreset(e.target.value as WorldPreset)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                      >
                        <option value="doors">Roblox: DOORS (The Hotel)</option>
                        <option value="garden">Roblox: Grow a Garden</option>
                        <option value="obby">Mega Rocraft Obby</option>
                        <option value="arena">Castle Battle Arena</option>
                        <option value="survival">Voxel Wilderness</option>
                        <option value="flat">Creative Studio Canvas</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-300">Max Players:</label>
                      <div className="flex gap-1">
                        {[4, 8, 12, 16, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setNewLobbyMaxPlayers(num)}
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              newLobbyMaxPlayers === num
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateLobby(false)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow"
                      >
                        Launch Lobby
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lobbies Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {filteredLobbies.map((lobby) => {
                  const isCurrent = currentLobby?.id === lobby.id || (!currentLobby && currentPreset === lobby.preset);
                  const hasFriends = lobby.friendsInside && lobby.friendsInside.length > 0;

                  return (
                    <div
                      key={lobby.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md'
                          : hasFriends
                          ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-400/60'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60 shadow text-slate-200">
                          {getWorldIcon(lobby.preset)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-100 font-['Fredoka']">
                              {lobby.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>Host: {lobby.hostName || 'Server'}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 font-semibold">
                              {lobby.playersCount}/{lobby.maxPlayers} Players
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-sky-400 font-mono text-[10px]">
                              {lobby.pingMs}ms ({lobby.region})
                            </span>
                          </div>

                          {/* Friends Inside Callout Banner */}
                          {hasFriends && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                              <span>Friends here: {lobby.friendsInside!.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {isCurrent ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onJoinLobby(lobby);
                              onClose();
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer ${
                              hasFriends
                                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950 ring-1 ring-amber-400/50'
                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>{hasFriends ? 'Join Friends' : 'Join Lobby'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Connected to:{' '}
              <strong className="text-slate-100 font-['Fredoka']">
                {currentLobby?.name || `Local World: ${currentPreset.toUpperCase()}`}
              </strong>
            </span>
          </div>

          <button
            onClick={() => {
              const text = `rocraft://join/${currentLobby?.id || currentPreset}`;
              navigator.clipboard?.writeText(text).catch(() => {});
              setCopiedLobbyId(true);
              soundEngine.playCollectCoin();
              setTimeout(() => setCopiedLobbyId(false), 2000);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
            title="Copy Lobby Invite link to clipboard"
          >
            {copiedLobbyId ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
            <span>{copiedLobbyId ? 'Link Copied!' : 'Share Lobby Invite'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
