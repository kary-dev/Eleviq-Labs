import type { Platform } from "@prisma/client";
import { instagram, extractShortcode, normalizeHandle as igNorm, MOCK_BIO_REGISTER } from "./instagram";
import { youtube, extractYouTubeVideoId, normalizeYouTubeHandle, MOCK_YT_BIO } from "./youtube";
import { tiktok, extractTikTokVideoId, normalizeTikTokUsername, MOCK_TT_BIO } from "./tiktok";

/** Normalized profile across providers (Instagram, YouTube, TikTok). */
export type VProfile = {
  handle: string;
  canonicalId: string | null; // platform account id (channelId for YouTube)
  bio: string; // biography / channel description / signature — holds the bio code
  isPrivate: boolean;
  isProfessional: boolean;
  followers: number;
  avatarUrl: string | null;
};

/** Normalized post across providers. Ownership is by handle (IG/TikTok) or id (YT). */
export type VPost = {
  views: number;
  title: string | null;
  thumbnailUrl: string | null;
  ownerHandle: string | null;
  ownerId: string | null;
};

/** Platforms we can fetch real data for. X is manual-only. */
export function platformHasProvider(p: Platform): boolean {
  return p === "INSTAGRAM" || p === "YOUTUBE" || p === "TIKTOK";
}

export function providerMode(p: Platform): "live" | "mock" | null {
  if (p === "INSTAGRAM") return instagram().mode;
  if (p === "YOUTUBE") return youtube().mode;
  if (p === "TIKTOK") return tiktok().mode;
  return null;
}

export function normalizeHandleFor(p: Platform, raw: string): string {
  if (p === "YOUTUBE") return normalizeYouTubeHandle(raw);
  if (p === "TIKTOK") return normalizeTikTokUsername(raw);
  return igNorm(raw);
}

export async function getProfileFor(p: Platform, handle: string): Promise<VProfile | null> {
  if (p === "INSTAGRAM") {
    const x = await instagram().getProfile(handle);
    return x && {
      handle: x.username, canonicalId: x.userId, bio: x.biography,
      isPrivate: x.isPrivate, isProfessional: x.isProfessional, followers: x.followers, avatarUrl: x.avatarUrl,
    };
  }
  if (p === "YOUTUBE") {
    const x = await youtube().getProfile(handle);
    return x && {
      handle: x.handle, canonicalId: x.channelId, bio: x.description,
      isPrivate: false, isProfessional: true, followers: x.subscribers, avatarUrl: x.avatarUrl,
    };
  }
  if (p === "TIKTOK") {
    const x = await tiktok().getProfile(handle);
    return x && {
      handle: x.username, canonicalId: x.userId, bio: x.bio,
      isPrivate: false, isProfessional: true, followers: x.followers, avatarUrl: x.avatarUrl,
    };
  }
  return null;
}

export async function getPostFor(p: Platform, url: string): Promise<VPost | null> {
  if (p === "INSTAGRAM") {
    const x = await instagram().getPost(url);
    return x && { views: x.views, title: x.caption, thumbnailUrl: x.thumbnailUrl, ownerHandle: x.ownerUsername.toLowerCase(), ownerId: null };
  }
  if (p === "YOUTUBE") {
    const x = await youtube().getVideo(url);
    if (!x) return null;
    // YouTube ownership is by channelId, but display channel by handle. Fetch profile to get handle.
    const profile = await youtube().getProfile(x.channelId.startsWith("UC") ? x.channelId : x.channelTitle);
    return {
      views: x.views,
      title: x.title,
      thumbnailUrl: x.thumbnailUrl,
      ownerHandle: profile?.handle ?? x.channelTitle,
      ownerId: x.channelId,
    };
  }
  if (p === "TIKTOK") {
    const x = await tiktok().getVideo(url);
    return x && { views: x.views, title: x.title, thumbnailUrl: x.thumbnailUrl, ownerHandle: x.ownerUsername.toLowerCase(), ownerId: null };
  }
  return null;
}

/** True when the URL looks like a real post/video link for the platform. */
export function isValidPostUrl(p: Platform, url: string): boolean {
  if (p === "INSTAGRAM") return /instagram\.com\//i.test(url) && !!extractShortcode(url);
  if (p === "YOUTUBE") return !!extractYouTubeVideoId(url);
  if (p === "TIKTOK") return /tiktok\.com\//i.test(url) && (!!extractTikTokVideoId(url) || /\/(video|photo)\//i.test(url));
  return false;
}

/** In mock mode, register/clear the expected bio code so "check bio" can pass. */
export function registerMockBio(p: Platform, handle: string, code: string) {
  if (p === "INSTAGRAM" && instagram().mode === "mock") MOCK_BIO_REGISTER.set(igNorm(handle), code);
  if (p === "YOUTUBE" && youtube().mode === "mock") MOCK_YT_BIO.set(normalizeYouTubeHandle(handle).toLowerCase(), code);
  if (p === "TIKTOK" && tiktok().mode === "mock") MOCK_TT_BIO.set(normalizeTikTokUsername(handle), code);
}
export function clearMockBio(p: Platform, handle: string) {
  MOCK_BIO_REGISTER.delete(igNorm(handle));
  MOCK_YT_BIO.delete(normalizeYouTubeHandle(handle).toLowerCase());
  MOCK_TT_BIO.delete(normalizeTikTokUsername(handle));
}
