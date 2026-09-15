/**
 * Player rank and permission helper for Rocraft.
 * Checks player names for the special "PokeFan_" prefix to grant OWNER rank.
 */

export function isOwnerName(name?: string | null): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // Matches if it starts with PokeFan_ (e.g. PokeFan_, PokeFan_Dev, pokefan_admin)
  // or contains PokeFan_, or equals PokeFan
  return (
    lower.startsWith('pokefan_') ||
    lower.includes('pokefan_') ||
    lower === 'pokefan'
  );
}

export interface PlayerRankInfo {
  isOwner: boolean;
  rankTitle: string;
  badgeText: string;
  colorClass: string;
}

export function getPlayerRank(name?: string | null): PlayerRankInfo {
  const isOwner = isOwnerName(name);

  if (isOwner) {
    return {
      isOwner: true,
      rankTitle: 'OWNER',
      badgeText: '👑 OWNER',
      colorClass: 'rainbow-text font-black'
    };
  }

  return {
    isOwner: false,
    rankTitle: 'PLAYER',
    badgeText: 'MEMBER',
    colorClass: 'text-slate-300 font-semibold'
  };
}
