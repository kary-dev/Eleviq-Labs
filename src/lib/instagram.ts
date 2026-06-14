/**
 * Instagram data provider.
 *
 * Reading an arbitrary Instagram profile's bio / account type, or a post's view
 * count, is NOT possible with the official API — so we go through a third-party
 * scraper. This module abstracts that behind a small interface:
 *
 *   - getProfile(username)  -> profile incl. biography (for bio-code checks),
 *                              account type, avatar, follower count
 *   - getPost(url)          -> owner handle + play/view count (for clip stats
 *                              and ownership verification)
 *
 * If RAPIDAPI_KEY is set we hit a real scraper; otherwise a deterministic mock
 * runs so the whole flow is testable without any external dependency.
 */

export type IgProfile = {
  username: string;
  fullName: string | null;
  biography: string;
  avatarUrl: string | null;
  followers: number;
  isProfessional: boolean; // business or creator account
  isPrivate: boolean;
  userId: string | null; // instagram numeric id (pk)
};

export type IgPost = {
  url: string;
  shortcode: string | null;
  ownerUsername: string;
  views: number; // play count for video/reel; falls back to likes-based estimate
  likes: number;
  caption: string | null;
  thumbnailUrl: string | null;
};

export interface InstagramProvider {
  readonly mode: "live" | "mock";
  getProfile(username: string): Promise<IgProfile | null>;
  getPost(url: string): Promise<IgPost | null>;
}

// --- helpers ---------------------------------------------------------------

export function normalizeHandle(input: string): string {
  return input
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export function extractShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

// --- Mock provider ---------------------------------------------------------

function seeded(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic fake data. The mock includes a bio that always contains the
 * verification code passed in env-less testing IF the username starts with
 * "verified" — and otherwise echoes a code via the MOCK_BIO_CODE hook used by
 * the bio checker so verification can be exercised end-to-end.
 */
class MockInstagram implements InstagramProvider {
  readonly mode = "mock" as const;

  async getProfile(username: string): Promise<IgProfile | null> {
    const u = normalizeHandle(username);
    if (!u || u.length < 2) return null;
    const h = seeded(u);
    // The mock injects whatever code the bio-checker is looking for via a
    // module-level register, so "Check bio" succeeds in mock mode.
    const injected = MOCK_BIO_REGISTER.get(u);
    return {
      username: u,
      fullName: u.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      biography: `Creator • DM for collabs ${injected ?? ""}`.trim(),
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/png?seed=${encodeURIComponent(u)}`,
      followers: 1500 + (h % 250000),
      isProfessional: h % 5 !== 0, // ~80% professional in mock
      isPrivate: false,
      userId: String(100000000 + (h % 900000000)),
    };
  }

  async getPost(url: string): Promise<IgPost | null> {
    const code = extractShortcode(url);
    if (!code) return null;
    const h = seeded(code);
    // Owner is registered so ownership checks can pass in mock mode.
    const owner = MOCK_POST_OWNER.get(code) ?? "democreator";
    return {
      url,
      shortcode: code,
      ownerUsername: owner,
      views: 5000 + (h % 200000),
      likes: 200 + (h % 12000),
      caption: "Mock fetched caption for " + code,
      thumbnailUrl: `https://api.dicebear.com/9.x/shapes/png?seed=${encodeURIComponent(code)}`,
    };
  }
}

/**
 * In mock mode we can't read a real bio, so the bio checker registers the code
 * it expects here and the mock profile includes it. In live mode these are unused.
 */
export const MOCK_BIO_REGISTER = new Map<string, string>();
export const MOCK_POST_OWNER = new Map<string, string>();

// --- RapidAPI provider -----------------------------------------------------

/**
 * Adapter for an Instagram scraper on RapidAPI. Defaults target the popular
 * "instagram-scraper-api2" shape; override host/paths via env if you subscribe
 * to a different one.
 */
class RapidApiInstagram implements InstagramProvider {
  readonly mode = "live" as const;
  private key: string;
  private host: string;

  constructor(key: string, host: string) {
    this.key = key;
    this.host = host;
  }

  private async call(path: string): Promise<any | null> {
    const res = await fetch(`https://${this.host}${path}`, {
      headers: { "x-rapidapi-key": this.key, "x-rapidapi-host": this.host },
      // Avoid Next caching live social stats.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  }

  async getProfile(username: string): Promise<IgProfile | null> {
    const u = normalizeHandle(username);
    const json = await this.call(`/v1/info?username_or_id_or_url=${encodeURIComponent(u)}`);
    const d = json?.data ?? json;
    if (!d || !(d.username || d.pk)) return null;
    return {
      username: (d.username ?? u).toLowerCase(),
      fullName: d.full_name ?? null,
      biography: d.biography ?? "",
      avatarUrl: d.profile_pic_url_hd ?? d.profile_pic_url ?? null,
      followers: Number(d.follower_count ?? d.followers ?? 0),
      isProfessional: Boolean(d.is_business ?? d.is_professional_account ?? d.is_business_account ?? false),
      isPrivate: Boolean(d.is_private ?? false),
      userId: d.id ? String(d.id) : d.pk ? String(d.pk) : null,
    };
  }

  async getPost(url: string): Promise<IgPost | null> {
    const json = await this.call(`/v1/post_info?code_or_id_or_url=${encodeURIComponent(url)}`);
    const d = json?.data ?? json;
    if (!d) return null;
    const owner = (d.owner?.username ?? d.user?.username ?? "").toLowerCase();
    if (!owner) return null;
    return {
      url,
      shortcode: d.code ?? d.shortcode ?? extractShortcode(url),
      ownerUsername: owner,
      views: Number(d.play_count ?? d.video_play_count ?? d.view_count ?? d.like_count ?? 0),
      likes: Number(d.like_count ?? 0),
      caption: d.caption_text ?? d.caption?.text ?? null,
      thumbnailUrl: d.thumbnail_url ?? d.display_url ?? null,
    };
  }
}

// --- Factory ---------------------------------------------------------------

let cached: InstagramProvider | null = null;

export function instagram(): InstagramProvider {
  if (cached) return cached;
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST || "instagram-scraper-api2.p.rapidapi.com";
  cached = key ? new RapidApiInstagram(key, host) : new MockInstagram();
  return cached;
}
