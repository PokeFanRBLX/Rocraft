import { Friend, LobbyInfo, FriendRequest, WorldPreset } from '../types';
import { isOwnerName } from './ranks';

const STORAGE_KEY_FRIENDS = 'rocraft_friends_list_v1';
const STORAGE_KEY_REQUESTS = 'rocraft_friend_requests_v1';
const STORAGE_KEY_CUSTOM_LOBBIES = 'rocraft_custom_lobbies_v1';

export const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'friend-builderman',
    name: 'Builderman',
    avatarColors: { head: '#f59e0b', torso: '#0284c7' },
    badge: 'CREATOR',
    status: 'in_lobby',
    isFavorite: true,
    currentLobby: {
      id: 'lobby-garden-1',
      name: 'Roblox: Grow a Garden',
      preset: 'garden',
      playersCount: 7,
      maxPlayers: 12,
      pingMs: 18,
      region: 'US-East',
      hostName: 'Builderman'
    }
  },
  {
    id: 'friend-noobslayer',
    name: 'NoobSlayer99',
    avatarColors: { head: '#eab308', torso: '#16a34a' },
    badge: 'VIP',
    status: 'in_lobby',
    isFavorite: true,
    currentLobby: {
      id: 'lobby-doors-2',
      name: 'Roblox: DOORS (The Hotel)',
      preset: 'doors',
      playersCount: 10,
      maxPlayers: 12,
      pingMs: 24,
      region: 'US-East',
      hostName: 'SeekMaster'
    }
  },
  {
    id: 'friend-blockydave',
    name: 'BlockyDave',
    avatarColors: { head: '#fbbf24', torso: '#dc2626' },
    badge: 'MEMBER',
    status: 'in_lobby',
    currentLobby: {
      id: 'lobby-obby-1',
      name: 'Mega Rocraft Obby [Stage 4]',
      preset: 'obby',
      playersCount: 5,
      maxPlayers: 16,
      pingMs: 22,
      region: 'US-West',
      hostName: 'BlockyDave'
    }
  },
  {
    id: 'friend-voxelqueen',
    name: 'VoxelQueen',
    avatarColors: { head: '#f43f5e', torso: '#8b5cf6' },
    badge: 'VIP',
    status: 'in_lobby',
    currentLobby: {
      id: 'lobby-arena-3',
      name: 'Castle Battle Fortress',
      preset: 'arena',
      playersCount: 8,
      maxPlayers: 10,
      pingMs: 35,
      region: 'EU-Central',
      hostName: 'VoxelQueen'
    }
  },
  {
    id: 'friend-skycrafter',
    name: 'SkyCrafter',
    avatarColors: { head: '#38bdf8', torso: '#059669' },
    badge: 'MEMBER',
    status: 'in_lobby',
    currentLobby: {
      id: 'lobby-survival-9',
      name: 'Diamond Wilderness Survival',
      preset: 'survival',
      playersCount: 4,
      maxPlayers: 8,
      pingMs: 38,
      region: 'US-Central',
      hostName: 'DiamondKing'
    }
  },
  {
    id: 'friend-pixelbuilder',
    name: 'PixelBuilder',
    avatarColors: { head: '#a855f7', torso: '#ea580c' },
    badge: 'BUILDER',
    status: 'in_lobby',
    currentLobby: {
      id: 'lobby-flat-1',
      name: 'Creative Studio Canvas',
      preset: 'flat',
      playersCount: 2,
      maxPlayers: 20,
      pingMs: 16,
      region: 'US-East',
      hostName: 'PixelBuilder'
    }
  },
  {
    id: 'friend-farmerbob',
    name: 'FarmerBob',
    avatarColors: { head: '#84cc16', torso: '#ca8a04' },
    badge: 'MEMBER',
    status: 'offline',
    lastSeen: '15m ago'
  }
];

export const INITIAL_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    fromName: 'SpeedyBlox',
    timestamp: '5m ago',
    avatarHeadColor: '#38bdf8',
    mutualFriends: 2
  },
  {
    id: 'req-2',
    fromName: 'DiamondMiner',
    timestamp: '12m ago',
    avatarHeadColor: '#06b6d4',
    mutualFriends: 1
  }
];

export const SUGGESTED_PLAYERS: { name: string; headColor: string; badge: string; statusDesc: string }[] = [
  { name: 'PokeFan_Pro', headColor: '#ef4444', badge: '👑 OWNER', statusDesc: 'In Lobby: DOORS Hotel' },
  { name: 'SpeedyBlox', headColor: '#38bdf8', badge: 'VIP', statusDesc: 'In Lobby: Mega Obby' },
  { name: 'DiamondMiner', headColor: '#06b6d4', badge: 'MEMBER', statusDesc: 'In Lobby: Wilderness' },
  { name: 'EnderKnight', headColor: '#9333ea', badge: 'VIP', statusDesc: 'In Lobby: Castle Arena' },
  { name: 'Robloxian_2026', headColor: '#f59e0b', badge: 'MEMBER', statusDesc: 'In Lobby: Grow a Garden' },
  { name: 'BloxMaster', headColor: '#10b981', badge: 'BUILDER', statusDesc: 'In Lobby: Creative Canvas' },
  { name: 'EmeraldFox', headColor: '#22c55e', badge: 'MEMBER', statusDesc: 'Online' }
];

export const PUBLIC_LOBBIES_BASE: LobbyInfo[] = [
  {
    id: 'lobby-doors-2',
    name: 'Roblox: DOORS (The Hotel) - Lobby #2',
    preset: 'doors',
    playersCount: 10,
    maxPlayers: 12,
    pingMs: 24,
    region: 'US-East',
    hostName: 'SeekMaster'
  },
  {
    id: 'lobby-garden-1',
    name: 'Roblox: Grow a Garden - Farm Server #1',
    preset: 'garden',
    playersCount: 7,
    maxPlayers: 12,
    pingMs: 18,
    region: 'US-East',
    hostName: 'Builderman'
  },
  {
    id: 'lobby-obby-1',
    name: 'Mega Rocraft Obby [15 Stages] #1',
    preset: 'obby',
    playersCount: 5,
    maxPlayers: 16,
    pingMs: 22,
    region: 'US-West',
    hostName: 'BlockyDave'
  },
  {
    id: 'lobby-arena-3',
    name: 'Castle Fortress PvP [TNT & Rockets]',
    preset: 'arena',
    playersCount: 8,
    maxPlayers: 10,
    pingMs: 35,
    region: 'EU-Central',
    hostName: 'VoxelQueen'
  },
  {
    id: 'lobby-survival-9',
    name: 'Voxel Wilderness [Oak Forest & Diamonds]',
    preset: 'survival',
    playersCount: 4,
    maxPlayers: 8,
    pingMs: 38,
    region: 'US-Central',
    hostName: 'DiamondKing'
  },
  {
    id: 'lobby-flat-1',
    name: 'Creative Studio Canvas [Freebuild]',
    preset: 'flat',
    playersCount: 2,
    maxPlayers: 20,
    pingMs: 16,
    region: 'US-East',
    hostName: 'PixelBuilder'
  },
  {
    id: 'lobby-doors-hc',
    name: 'DOORS Hotel: Seek Chase [Hardcore]',
    preset: 'doors',
    playersCount: 6,
    maxPlayers: 12,
    pingMs: 31,
    region: 'US-West',
    hostName: 'GhostHunter'
  },
  {
    id: 'lobby-obby-speedrun',
    name: 'Mega Obby: Stage 1 to Golden Star Speedruns',
    preset: 'obby',
    playersCount: 9,
    maxPlayers: 16,
    pingMs: 27,
    region: 'EU-West',
    hostName: 'ObbyKing'
  }
];

// Helper to generate a random vibrant hex color
const RANDOM_COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
function getRandomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

export function loadStoredFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FRIENDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_FRIENDS;
}

export function saveStoredFriends(friends: Friend[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friends));
  } catch {}
}

export function loadStoredRequests(): FriendRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_REQUESTS;
}

export function saveStoredRequests(requests: FriendRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch {}
}

export function loadCustomLobbies(): LobbyInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_LOBBIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveCustomLobbies(lobbies: LobbyInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_LOBBIES, JSON.stringify(lobbies));
  } catch {}
}

/**
 * Creates or retrieves active lobbies with friend presence mapping
 */
export function getLobbiesWithFriends(friends: Friend[]): LobbyInfo[] {
  const customLobbies = loadCustomLobbies();
  const allLobbies = [...customLobbies, ...PUBLIC_LOBBIES_BASE];

  return allLobbies.map((lobby) => {
    // Find all friends currently inside this lobby
    const friendsInside = friends
      .filter((f) => f.status === 'in_lobby' && f.currentLobby?.preset === lobby.preset)
      .map((f) => f.name);

    return {
      ...lobby,
      friendsInside
    };
  });
}

/**
 * Adds a new friend by username.
 */
export function addFriendByName(
  currentFriends: Friend[],
  name: string,
  badge?: string
): { success: boolean; message: string; updatedFriends: Friend[]; newFriend?: Friend } {
  const cleanName = name.trim();
  if (!cleanName) {
    return { success: false, message: 'Please enter a valid player username.', updatedFriends: currentFriends };
  }

  const existing = currentFriends.find((f) => f.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return { success: false, message: `${cleanName} is already on your friends list!`, updatedFriends: currentFriends };
  }

  const isOwner = isOwnerName(cleanName);
  const resolvedBadge = isOwner ? '👑 OWNER' : badge || (Math.random() < 0.3 ? 'VIP' : 'MEMBER');

  // Randomize initial lobby presence for fun realism
  const presets: WorldPreset[] = ['doors', 'garden', 'obby', 'survival', 'arena', 'flat'];
  const randomPreset = presets[Math.floor(Math.random() * presets.length)];
  const matchedLobby = PUBLIC_LOBBIES_BASE.find((l) => l.preset === randomPreset) || PUBLIC_LOBBIES_BASE[0];

  const newFriend: Friend = {
    id: `friend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    avatarColors: {
      head: getRandomColor(),
      torso: getRandomColor()
    },
    badge: resolvedBadge,
    status: 'in_lobby',
    currentLobby: {
      ...matchedLobby,
      id: `${matchedLobby.id}-${Math.floor(Math.random() * 5) + 1}`,
      hostName: cleanName
    }
  };

  const updatedFriends = [newFriend, ...currentFriends];
  saveStoredFriends(updatedFriends);

  // Remove from requests if pending
  const requests = loadStoredRequests().filter((r) => r.fromName.toLowerCase() !== cleanName.toLowerCase());
  saveStoredRequests(requests);

  return {
    success: true,
    message: `Added ${cleanName} to your friends list!`,
    updatedFriends,
    newFriend
  };
}
