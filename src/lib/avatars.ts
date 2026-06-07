import { createMediaUrl } from "@/lib/api-client";

const FEMALE_AVATARS = [
  "/images/avatars/multiverse-luna.svg",
  "/images/avatars/multiverse-mira.svg",
  "/images/avatars/multiverse-juno.svg",
  "/images/avatars/multiverse-aria.svg"
] as const;

const MALE_AVATARS = [
  "/images/avatars/multiverse-nova.svg",
  "/images/avatars/multiverse-orion.svg"
] as const;

const NEUTRAL_AVATARS = [...FEMALE_AVATARS, ...MALE_AVATARS] as const;

export const COUPLE_PHOTOS = [
  "/images/couple-park.jpg",
  "/images/couple-golden.jpg",
  "/images/couple-memory.jpg"
] as const;

export const AUTH_BG_PHOTO = "/images/auth-love-bg.jpg";

export type AvatarGender = "male" | "female" | null | undefined;

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function normalizeGender(gender: AvatarGender | string | null | undefined): "male" | "female" | null {
  if (!gender) return null;
  const value = String(gender).toLowerCase();
  if (value === "male" || value === "nam" || value === "m") return "male";
  if (value === "female" || value === "nu" || value === "nữ" || value === "f") return "female";
  return null;
}

export function pickFallbackAvatar(seed: string | number, gender?: AvatarGender | string | null) {
  const key = typeof seed === "number" ? String(seed) : seed;
  const normalized = normalizeGender(gender);
  const pool = normalized === "male" ? MALE_AVATARS : normalized === "female" ? FEMALE_AVATARS : NEUTRAL_AVATARS;
  const index = hashString(key || "couple") % pool.length;
  return pool[index];
}

export function pickCouplePhoto(seed: string | number) {
  const key = typeof seed === "number" ? String(seed) : seed;
  const index = hashString(key || "couple") % COUPLE_PHOTOS.length;

  return COUPLE_PHOTOS[index];
}

export function resolveAvatar(input: {
  avatarUrl?: string | null;
  id?: string | null;
  name?: string | null;
  gender?: AvatarGender | string | null;
}) {
  const uploaded = createMediaUrl(input.avatarUrl ?? null);

  if (uploaded) {
    return uploaded;
  }

  return pickFallbackAvatar(input.id ?? input.name ?? "", input.gender);
}
