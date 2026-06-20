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
  const m = url.match(/instagram\.com\/(?:[^/]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

/** Some IG share links include the owner: instagram.com/<user>/reel/CODE */
export function extractOwnerFromUrl(url: string): string | null {
  const m = url.match(/instagram\.com\/([^/]+)\/(?:reel|reels|p|tv)\//i);
  const u = m?.[1]?.toLowerCase();
  if (!u || ["reel", "reels", "p", "tv"].includes(u)) return null;
  return u;
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
    // Owner resolution for mock: explicit register > username in the URL >
    // default. Paste instagram.com/<yourhandle>/reel/CODE to test the happy path.
    const owner = MOCK_POST_OWNER.get(code) ?? extractOwnerFromUrl(url) ?? "democreator";
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
      isProfessional:
        Boolean(d.is_business) ||
        Boolean(d.is_professional_account) ||
        Boolean(d.is_business_account) ||
        Boolean(d.category) ||
        Boolean(d.business_category_name),
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

// --- Apify provider --------------------------------------------------------

/**
 * Apify Instagram scrapers via the run-sync API (waits for the run and returns
 * dataset items in one call). Generous free tier (~$5 monthly credits).
 *   - profiles: apify/instagram-profile-scraper  (input { usernames: [...] })
 *   - posts:    apify/instagram-scraper          (input { directUrls, resultsType: "posts" })
 * Actor ids are overridable via env in case you fork/swap actors.
 */
// ---------------------------------------------------------------------------
// Direct fast-path for Instagram profile data (~200ms vs 20-45s via Apify).
// Uses Instagram's internal web endpoint — no API key needed.
// Returns null if blocked/rate-limited so callers can fall back to Apify.
// ---------------------------------------------------------------------------
async function tryIgDirectProfile(username: string): Promise<IgProfile | null> {
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram/303.0.0.30.109",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "X-IG-App-ID": "936619743392459",
          Referer: "https://www.instagram.com/",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6_000),
      }
    );
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const d = json?.data?.user;
    if (!d?.username) return null;
    return {
      username: String(d.username).toLowerCase(),
      fullName: d.full_name ?? null,
      biography: d.biography ?? "",
      avatarUrl: d.profile_pic_url_hd ?? d.profile_pic_url ?? null,
      followers: Number(d.edge_followed_by?.count ?? d.follower_count ?? 0),
      isProfessional: Boolean(d.is_business_account || d.is_professional_account),
      isPrivate: Boolean(d.is_private),
      userId: d.id ? String(d.id) : null,
    };
  } catch {
    return null;
  }
}

class ApifyInstagram implements InstagramProvider {
  readonly mode = "live" as const;
  private token: string;
  private profileActor: string;
  private postActor: string;

  constructor(token: string) {
    this.token = token;
    this.profileActor = process.env.APIFY_PROFILE_ACTOR || "apify~instagram-profile-scraper";
    this.postActor = process.env.APIFY_POST_ACTOR || "apify~instagram-scraper";
  }

  private async run(
    actor: string,
    input: unknown,
    { memory = 256, timeout = 45 }: { memory?: number; timeout?: number } = {}
  ): Promise<any[] | null> {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${this.token}&timeout=${timeout}&memory=${memory}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json) ? json : null;
  }

  async getProfile(username: string): Promise<IgProfile | null> {
    const u = normalizeHandle(username);

    // Fast path: Instagram's internal endpoint (~200ms, no credits used).
    const fast = await tryIgDirectProfile(u);
    if (fast) return fast;

    // Slow fallback: Apify actor. Use 128 MB (lighter = faster cold start).
    const items = await this.run(this.profileActor, { usernames: [u] }, { memory: 128, timeout: 30 });
    const d = items?.[0];
    if (!d || !(d.username || d.id)) return null;
    return {
      username: (d.username ?? u).toLowerCase(),
      fullName: d.fullName ?? d.full_name ?? null,
      biography: d.biography ?? d.bio ?? "",
      avatarUrl: d.profilePicUrlHD ?? d.profilePicUrl ?? d.profile_pic_url ?? null,
      followers: Number(d.followersCount ?? d.followers ?? 0),
      // Professional = Business OR Creator. The scraper only sets isBusinessAccount
      // for business accounts, so a non-empty business category catches creators.
      isProfessional:
        Boolean(d.isBusinessAccount) ||
        Boolean(d.is_business_account) ||
        Boolean(d.isProfessionalAccount) ||
        Boolean(d.is_professional_account) ||
        Boolean(d.businessCategoryName) ||
        Boolean(d.businessCategory) ||
        Boolean(d.category),
      isPrivate: Boolean(d.private ?? d.isPrivate ?? d.is_private ?? false),
      userId: d.id ? String(d.id) : null,
    };
  }

  async getPost(url: string): Promise<IgPost | null> {
    const isReel = /instagram\.com\/(?:reel|reels)\//i.test(url);
    const expectedCode = extractShortcode(url);

    if (isReel) {
      const reelActor = process.env.APIFY_REEL_ACTOR || "clockworks~instagram-reels-scraper";
      const items = await this.run(reelActor, { reelUrls: [url], resultsLimit: 1 });
      const d = items?.[0];
      if (d) {
        // Guard: discard if the actor returned data for the wrong reel.
        const returnedCode = d.shortCode ?? d.shortcode ?? extractShortcode(d.url ?? "");
        const codeMatch = !expectedCode || !returnedCode || returnedCode === expectedCode;
        const owner = String(d.ownerUsername ?? d.ownerName ?? d.owner?.username ?? "").toLowerCase();
        if (owner && codeMatch) {
          return {
            url,
            shortcode: returnedCode ?? expectedCode,
            ownerUsername: owner,
            views: Number(d.videoPlayCount ?? d.videoViewCount ?? d.playCount ?? d.play_count ?? d.viewCount ?? 0),
            likes: Number(d.likesCount ?? d.likeCount ?? 0),
            caption: d.caption ?? d.captionText ?? null,
            // Prefer coverUrl / thumbnailUrl — displayUrl on reels often returns wrong CDN image.
            thumbnailUrl: d.coverUrl ?? d.videoPreviewImageUrl ?? d.thumbnailUrl ?? d.displayUrl ?? null,
          };
        }
      }
    }

    // Regular posts (/p/ /tv/) and reel fallback.
    const items = await this.run(this.postActor, {
      directUrls: [url],
      resultsType: "posts",
      resultsLimit: 1,
      addParentData: false,
    });
    const d = items?.[0];
    if (!d) return null;
    const owner = String(d.ownerUsername ?? d.owner?.username ?? "").toLowerCase();
    if (!owner) return null;
    return {
      url,
      shortcode: d.shortCode ?? d.shortcode ?? expectedCode,
      ownerUsername: owner,
      views: Number(
        d.videoViewCount ?? d.videoPlayCount ?? d.playCount ?? d.play_count ??
        d.video_view_count ?? d.viewCount ?? d.view_count ?? 0
      ),
      likes: Number(d.likesCount ?? d.likeCount ?? 0),
      caption: d.caption ?? d.captionText ?? null,
      thumbnailUrl: d.thumbnailUrl ?? d.displayUrl ?? null,
    };
  }
}

// --- Factory ---------------------------------------------------------------

/**
 * Provider that refuses to answer — used in production when no real key is set,
 * so we never fake-verify accounts on a live site.
 */
class UnconfiguredInstagram implements InstagramProvider {
  readonly mode = "live" as const;
  async getProfile() { return null; }
  async getPost() { return null; }
}

let cached: InstagramProvider | null = null;

export function instagram(): InstagramProvider {
  if (cached) return cached;
  const apifyToken = process.env.APIFY_TOKEN;
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST || "instagram-scraper-api2.p.rapidapi.com";

  if (apifyToken) {
    cached = new ApifyInstagram(apifyToken);
  } else if (key) {
    cached = new RapidApiInstagram(key, host);
  } else if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_INSTAGRAM !== "true") {
    // No real key in production and mock not explicitly allowed → don't fake-verify.
    cached = new UnconfiguredInstagram();
  } else {
    cached = new MockInstagram();
  }
  return cached;
}
