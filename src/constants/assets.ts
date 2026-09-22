import eatmOfficialLogo from '../assets/eatm-official-logo.png';
import eatmEmblem from '../assets/eatm-emblem.png';
import eatmLogoSvg from '../assets/eatm-logo.svg';

export const EATM_OFFICIAL_LOGO = eatmOfficialLogo;
export const EATM_EMBLEM = eatmEmblem;
export const EATM_LOGO_SVG = eatmLogoSvg;

/**
 * Checks whether a given string is a real, custom-uploaded user photo.
 * Returns false if it's empty, null, or an old demo placeholder.
 */
export function isCustomPhoto(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('default-eatm-avatar') ||
    lower.includes('default-engineer-avatar') ||
    lower.includes('photo-1534528741775-53994a69daeb') ||
    lower.includes('photo-1535713875002-d1d0cf377fde')
  ) {
    return false;
  }
  return true;
}

/**
 * Helper to determine if an avatar URL is missing, placeholder, or default.
 */
export function isDefaultOrPlaceholderAvatar(url?: string | null): boolean {
  return !isCustomPhoto(url);
}

/**
 * Generates clean uppercase initials from a user's display name.
 * Examples:
 * - "Rahul Kumar" -> "RK"
 * - "Soumyaranjan Sahoo" -> "SS"
 * - "Dr. Subrat Mohapatra" -> "SM"
 * - "Priya" -> "PR"
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim();
  if (!clean) return 'U';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  const initials = (first + last).toUpperCase();
  return initials || 'U';
}

const AVATAR_GRADIENTS = [
  'from-[#0b4627] to-[#042414]', // EATM Forest Green
  'from-[#047857] to-[#064e3b]', // Campus Emerald
  'from-[#0f766e] to-[#134e4a]', // Deep Teal
  'from-[#1e3a8a] to-[#172554]', // Institutional Navy
  'from-[#4338ca] to-[#312e81]', // Academic Indigo
  'from-[#0369a1] to-[#0c4a6e]', // Slate Blue
  'from-[#7c2d12] to-[#451a03]', // Auburn Bronze
  'from-[#854d0e] to-[#583101]', // Warm Gold/Amber
];

/**
 * Deterministically picks a collegiate gradient based on name hash.
 */
export function getAvatarBgGradient(name?: string | null): string {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}
