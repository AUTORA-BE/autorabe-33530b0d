/**
 * Friendly user label — avoids showing useless Apple private relay emails
 * (e.g. "xxxx@privaterelay.appleid.com") in the UI.
 */
import type { User } from "@supabase/supabase-js";

export function isPrivateRelayEmail(email?: string | null): boolean {
  return !!email && /@privaterelay\.appleid\.com$/i.test(email);
}

interface ProfileLike {
  display_name?: string | null;
  garage_name?: string | null;
  phone?: string | null;
}

/**
 * Returns the best human-readable label for a user.
 * Priority: display_name → garage_name → phone → email (if not private relay)
 * → "Utilisateur • XXXXXX" (short id) as last resort.
 */
export function getUserDisplayName(
  user: Pick<User, "id" | "email"> | null | undefined,
  profile?: ProfileLike | null,
): string {
  if (!user) return "";
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (profile?.garage_name?.trim()) return profile.garage_name.trim();
  if (profile?.phone?.trim()) return profile.phone.trim();
  if (user.email && !isPrivateRelayEmail(user.email)) {
    return user.email.split("@")[0];
  }
  return `Utilisateur • ${user.id.slice(0, 6).toUpperCase()}`;
}

export function getUserInitials(
  user: Pick<User, "id" | "email"> | null | undefined,
  profile?: ProfileLike | null,
): string {
  const name = getUserDisplayName(user, profile);
  if (!name) return "U";
  const parts = name.replace(/^Utilisateur • /, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
