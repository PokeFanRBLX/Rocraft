import { DailyRewardState, DailyRewardTier, HatType } from '../types';

export const DAILY_REWARD_TIERS: DailyRewardTier[] = [
  {
    day: 1,
    coins: 200,
    tix: 15,
    title: 'Day 1: Rookie Stash',
    badge: 'Common',
    perkDescription: 'Welcome back bonus to kick off your streak with Blox Coins & TIX!'
  },
  {
    day: 2,
    coins: 350,
    tix: 25,
    hatReward: 'dino_hood',
    hatName: 'Chomper Dino Hood',
    hatDescription: 'Cute green dinosaur hood with razor-sharp blocky teeth and dorsal spikes!',
    title: 'Day 2: Prehistoric Bite',
    badge: 'Rare',
    perkDescription: 'Unlocks exclusive Chomper Dino Hood accessory + 25 TIX'
  },
  {
    day: 3,
    coins: 500,
    tix: 40,
    title: 'Day 3: Adventurer Cache',
    badge: 'Rare',
    perkDescription: 'Mid-week coin & TIX boost for the avatar shop'
  },
  {
    day: 4,
    coins: 750,
    tix: 60,
    hatReward: 'cyber_visor',
    hatName: 'Cyber Neon Visor',
    hatDescription: 'Futuristic high-tech HUD visor emitting brilliant cyan neon energy!',
    title: 'Day 4: Cyber Overdrive',
    badge: 'Epic',
    perkDescription: 'Unlocks exclusive Cyber Neon Visor accessory + 60 TIX'
  },
  {
    day: 5,
    coins: 1000,
    tix: 80,
    title: 'Day 5: Vault Breaker',
    badge: 'Epic',
    perkDescription: 'Massive coin & TIX jackpot to spend on luxury gear'
  },
  {
    day: 6,
    coins: 1500,
    tix: 100,
    hatReward: 'wizard_hat',
    hatName: 'Mystic Wizard Hat',
    hatDescription: 'Midnight purple arcane wizard hat adorned with celestial stars and a golden buckle!',
    title: 'Day 6: Sorcerer Spire',
    badge: 'Legendary',
    perkDescription: 'Unlocks exclusive Mystic Wizard Hat accessory + 100 TIX'
  },
  {
    day: 7,
    coins: 3000,
    tix: 250,
    hatReward: 'dominus',
    hatName: 'Dominus Aureus & Halo',
    hatDescription: 'The ultimate Roblox mythic status symbol: a shadowy cowl with glowing eyes, golden horns, and radiant angel halo!',
    title: 'Day 7: Grand Mythic Finale',
    badge: 'Mythic',
    perkDescription: 'Unlocks ultra-rare Dominus Aureus & Golden Halo + 250 TIX!'
  }
];

const STORAGE_KEY = 'rocraft_daily_rewards_v1';

// Base starter hats that every player starts with
export const BASE_HATS: HatType[] = ['none', 'top_hat', 'builder_helmet', 'crown', 'viking', 'valkyrie', 'cap'];

export const EXCLUSIVE_HATS_INFO: Record<
  HatType,
  { name: string; icon: string; unlockDay: number; coinPrice?: number; tixPrice?: number; description: string; rarity: string }
> = {
  none: { name: 'No Hat', icon: '🚫', unlockDay: 0, description: 'Natural blocky avatar head', rarity: 'Common' },
  top_hat: { name: 'Blox Top Hat', icon: '🎩', unlockDay: 0, description: 'Classic Victorian gentleman hat', rarity: 'Common' },
  builder_helmet: { name: 'Builder Hardhat', icon: '👷', unlockDay: 0, description: 'Safety-certified constructor helmet', rarity: 'Common' },
  crown: { name: 'Royal Crown', icon: '👑', unlockDay: 0, description: 'Polished gold crown with crimson cushions', rarity: 'Rare' },
  viking: { name: 'Viking Horns', icon: '⚔️', unlockDay: 0, description: 'Sturdy battle helmet with ancient horns', rarity: 'Rare' },
  valkyrie: { name: 'Valkyrie Helm', icon: '🛡️', unlockDay: 0, description: 'Mythological silver helm with majestic wings', rarity: 'Epic' },
  cap: { name: 'Red Blox Cap', icon: '🧢', unlockDay: 0, description: 'Retro forward-facing trucker cap', rarity: 'Common' },
  dino_hood: {
    name: 'Chomper Dino Hood',
    icon: '🦖',
    unlockDay: 2,
    coinPrice: 500,
    tixPrice: 40,
    description: 'Exclusive Day 2 daily login reward! Cute green dinosaur hood with tooth fringe.',
    rarity: 'Rare'
  },
  cyber_visor: {
    name: 'Cyber Neon Visor',
    icon: '👓',
    unlockDay: 4,
    coinPrice: 900,
    tixPrice: 75,
    description: 'Exclusive Day 4 daily login reward! Glowing cyberpunk neon laser visor.',
    rarity: 'Epic'
  },
  wizard_hat: {
    name: 'Mystic Wizard Hat',
    icon: '🧙‍♂️',
    unlockDay: 6,
    coinPrice: 1500,
    tixPrice: 120,
    description: 'Exclusive Day 6 daily login reward! Celestial starry pointed wizard hat.',
    rarity: 'Legendary'
  },
  dominus: {
    name: 'Dominus Aureus',
    icon: '👑',
    unlockDay: 7,
    coinPrice: 3500,
    tixPrice: 300,
    description: 'Exclusive Day 7 Grand Prize! The iconic Roblox Dominus cowl with glowing eyes & golden horns.',
    rarity: 'Mythic'
  },
  halo: {
    name: 'Golden Angel Halo',
    icon: '😇',
    unlockDay: 7,
    coinPrice: 2000,
    tixPrice: 180,
    description: 'Glowing golden halo floating serenely above the player.',
    rarity: 'Mythic'
  }
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultDailyRewardState(): DailyRewardState {
  return {
    lastLoginDate: getTodayDateString(),
    lastClaimDate: '', // Has not claimed today yet
    currentStreak: 1,
    totalLogins: 1,
    coins: 350, // Starter Blox Coins balance
    tix: 50,    // Starter TIX (Tickets) balance
    unlockedHats: [...BASE_HATS],
    claimedCycleDays: [],
    streakCycle: 1
  };
}

export function loadDailyRewardState(): DailyRewardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = getDefaultDailyRewardState();
      saveDailyRewardState(defaultState);
      return defaultState;
    }
    const parsed: DailyRewardState = JSON.parse(raw);
    // Ensure array fields exist
    if (!Array.isArray(parsed.unlockedHats)) {
      parsed.unlockedHats = [...BASE_HATS];
    }
    if (!Array.isArray(parsed.claimedCycleDays)) {
      parsed.claimedCycleDays = [];
    }
    if (typeof parsed.coins !== 'number') {
      parsed.coins = 350;
    }
    if (typeof parsed.tix !== 'number') {
      parsed.tix = 50;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to parse daily reward state from localStorage:', err);
    return getDefaultDailyRewardState();
  }
}

export function saveDailyRewardState(state: DailyRewardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Dispatch storage event so other components stay in sync
    window.dispatchEvent(new Event('rocraft-daily-reward-update'));
  } catch (err) {
    console.error('Failed to save daily reward state:', err);
  }
}

/**
 * Checks login status on app startup:
 * - If today is new day:
 *   - If yesterday was logged in, streak maintained!
 *   - If gap > 1 day, streak resets to 1 (or restarts 7-day cycle if already completed).
 */
export function recordUserLogin(): { state: DailyRewardState; isNewDay: boolean; canClaimToday: boolean } {
  const state = loadDailyRewardState();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let isNewDay = false;

  if (state.lastLoginDate !== today) {
    isNewDay = true;
    state.totalLogins += 1;

    if (state.lastLoginDate === yesterday) {
      // Consecutive login! If previous cycle completed (7 days), start cycle 2 at day 1
      if (state.claimedCycleDays.length >= 7) {
        state.claimedCycleDays = [];
        state.currentStreak = 1;
        state.streakCycle += 1;
      } else {
        state.currentStreak = Math.min(7, state.currentStreak + 1);
      }
    } else {
      // Login streak broken (missed at least one day)
      // If player already claimed some days, reset to Day 1
      if (state.claimedCycleDays.length >= 7) {
        state.claimedCycleDays = [];
        state.streakCycle += 1;
      }
      state.currentStreak = 1;
    }

    state.lastLoginDate = today;
    saveDailyRewardState(state);
  }

  const canClaimToday = state.lastClaimDate !== today && !state.claimedCycleDays.includes(state.currentStreak);

  return { state, isNewDay, canClaimToday };
}

/**
 * Claim the reward for the current active streak day.
 */
export function claimDailyReward(): {
  success: boolean;
  reward?: DailyRewardTier;
  updatedState: DailyRewardState;
  unlockedHat?: HatType;
  alreadyClaimed?: boolean;
} {
  const state = loadDailyRewardState();
  const today = getTodayDateString();

  // Check if already claimed today
  if (state.lastClaimDate === today || state.claimedCycleDays.includes(state.currentStreak)) {
    return { success: false, updatedState: state, alreadyClaimed: true };
  }

  const rewardIndex = state.currentStreak - 1;
  const reward = DAILY_REWARD_TIERS[rewardIndex] || DAILY_REWARD_TIERS[0];

  // Add coins and TIX
  state.coins += reward.coins;
  state.tix += (reward.tix || 15);
  state.lastClaimDate = today;
  if (!state.claimedCycleDays.includes(state.currentStreak)) {
    state.claimedCycleDays.push(state.currentStreak);
  }

  // Unlock exclusive hat if reward includes one
  let newlyUnlockedHat: HatType | undefined;
  if (reward.hatReward && !state.unlockedHats.includes(reward.hatReward)) {
    state.unlockedHats.push(reward.hatReward);
    newlyUnlockedHat = reward.hatReward;
  }
  // On day 7 also unlock halo if not unlocked
  if (state.currentStreak === 7 && !state.unlockedHats.includes('halo')) {
    state.unlockedHats.push('halo');
  }

  saveDailyRewardState(state);
  return {
    success: true,
    reward,
    updatedState: state,
    unlockedHat: newlyUnlockedHat
  };
}

/**
 * Debug / Testing: Simulate advancing 1 day into the future.
 * Allows users and reviewers to test Day 2, Day 3, ..., Day 7 immediately!
 */
export function simulateAdvanceDay(): DailyRewardState {
  const state = loadDailyRewardState();
  
  // Set lastClaimDate to yesterday so player can claim today
  const fakeYesterday = '2026-01-01';
  state.lastClaimDate = fakeYesterday;
  state.lastLoginDate = fakeYesterday;
  state.totalLogins += 1;

  if (state.currentStreak >= 7) {
    state.currentStreak = 1;
    state.claimedCycleDays = [];
    state.streakCycle += 1;
  } else {
    state.currentStreak += 1;
  }

  saveDailyRewardState(state);
  return state;
}

/**
 * Reset streak back to Day 1 for testing
 */
export function resetStreakDebug(): DailyRewardState {
  const state = loadDailyRewardState();
  state.currentStreak = 1;
  state.claimedCycleDays = [];
  state.lastClaimDate = '';
  saveDailyRewardState(state);
  return state;
}

/**
 * Spend Blox Coins to unlock a hat directly in the Avatar Customizer catalog
 */
export function purchaseHatWithCoins(hat: HatType, cost: number): { success: boolean; updatedState: DailyRewardState; message: string } {
  const state = loadDailyRewardState();
  if (state.unlockedHats.includes(hat)) {
    return { success: true, updatedState: state, message: 'Already unlocked!' };
  }
  if (state.coins < cost) {
    return { success: false, updatedState: state, message: `Need ${cost - state.coins} more Blox Coins!` };
  }
  state.coins -= cost;
  state.unlockedHats.push(hat);
  saveDailyRewardState(state);
  return { success: true, updatedState: state, message: `Successfully unlocked ${EXCLUSIVE_HATS_INFO[hat]?.name || hat}!` };
}

/**
 * Spend TIX (Tickets) to unlock a hat directly in the Avatar Customizer catalog
 */
export function purchaseHatWithTix(hat: HatType, tixCost: number): { success: boolean; updatedState: DailyRewardState; message: string } {
  const state = loadDailyRewardState();
  if (state.unlockedHats.includes(hat)) {
    return { success: true, updatedState: state, message: 'Already unlocked!' };
  }
  if (state.tix < tixCost) {
    return { success: false, updatedState: state, message: `Need ${tixCost - state.tix} more TIX!` };
  }
  state.tix -= tixCost;
  state.unlockedHats.push(hat);
  saveDailyRewardState(state);
  return { success: true, updatedState: state, message: `Successfully unlocked ${EXCLUSIVE_HATS_INFO[hat]?.name || hat} with ${tixCost} TIX!` };
}

/**
 * Add coins directly (e.g. earned from obby stages or achievements)
 */
export function addCoinsToBalance(amount: number): number {
  const state = loadDailyRewardState();
  state.coins += amount;
  saveDailyRewardState(state);
  return state.coins;
}

/**
 * Add TIX directly (e.g. earned from daily logins or achievements)
 */
export function addTixToBalance(amount: number): number {
  const state = loadDailyRewardState();
  state.tix += amount;
  saveDailyRewardState(state);
  return state.tix;
}

export interface PlayerBalance {
  coins: number;
  tix: number;
}

const STORAGE_KEY_LOBBY_BALANCES = 'rocraft_lobby_balances_v1';

const DEFAULT_LOBBY_BALANCES: Record<string, PlayerBalance> = {
  'NoobSlayer99': { coins: 850, tix: 45 },
  'BlockyDave': { coins: 420, tix: 20 },
  'Builderman': { coins: 99999, tix: 15000 },
  'SeekMaster': { coins: 1200, tix: 80 },
  'FarmerBob': { coins: 310, tix: 15 },
  'VoxelQueen': { coins: 2400, tix: 350 },
  'SkyCrafter': { coins: 650, tix: 50 },
  'PixelBuilder': { coins: 1800, tix: 120 },
  'SpeedyBlox': { coins: 500, tix: 30 },
  'DiamondMiner': { coins: 1100, tix: 95 },
  'EnderKnight': { coins: 1450, tix: 110 },
  'Robloxian_2026': { coins: 380, tix: 25 },
};

export function getLobbyPlayerBalances(): Record<string, PlayerBalance> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOBBY_BALANCES);
    if (raw) {
      return { ...DEFAULT_LOBBY_BALANCES, ...JSON.parse(raw) };
    }
  } catch {
    // fallback to defaults
  }
  return { ...DEFAULT_LOBBY_BALANCES };
}

export function saveLobbyPlayerBalances(balances: Record<string, PlayerBalance>): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOBBY_BALANCES, JSON.stringify(balances));
  } catch (e) {
    console.error('Failed to save lobby balances to localStorage', e);
  }
}

export function giveLobbyPlayerCurrency(playerName: string, coinsDelta: number, tixDelta: number): PlayerBalance {
  const current = getLobbyPlayerBalances();
  if (!current[playerName]) {
    current[playerName] = { coins: 100, tix: 10 };
  }
  current[playerName].coins = Math.max(0, current[playerName].coins + coinsDelta);
  current[playerName].tix = Math.max(0, current[playerName].tix + tixDelta);
  saveLobbyPlayerBalances(current);
  return current[playerName];
}
