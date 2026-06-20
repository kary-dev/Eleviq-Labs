/**
 * TikTok provider via Apify (reuses APIFY_TOKEN).
 *  - getProfile(username) -> signature/bio (for bio-code checks) + follower count
 *  - getVideo(url)        -> play count + author username (for ownership)
 * Actor ids are overridable; field shapes vary between actors, so mappings are
 * defensive. Falls back to a deterministic mock when no token is set.
 */

export type TtProfile = {
  username: string;
  nickname: string | null;
  bio: string;
  followers: number;
  avatarUrl: string | null;
  userId: string | null;
};

export type TtVideo = {
  url: string;
  videoId: string | null;
  ownerUsername: string;
  views: number;
  title: string | null;
  thumbnailUrl: string | null;
};

export function normalizeTikTokUsername(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?tiktok\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export function extractTikTokVideoId(url: string): string | null {
  const m = url.match(/tiktok\.com\/(?:@[^/]+\/)?(?:video|photo)\/(\d+)/i);
  return m ? m[1] : null;
}

export interface TikTokProvider {
  readonly mode: "live" | "mock";
  getProfile(username: string): Promise<TtProfile | null>;
  getVideo(url: string): Promise<TtVideo | null>;
}

async function tryTikTokDirect(username: string): Promise<TtProfile | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(username)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const user =
      data?.props?.pageProps?.userInfo?.user ??
      data?.props?.pageProps?.userDetails?.user;
    if (!user?.uniqueId) return null;
    return {
      username: String(user.uniqueId).toLowerCase(),
      nickname: user.nickname ?? null,
      bio: user.signature ?? "",
      followers: Number(user.followerCount ?? user.stats?.followerCount ?? 0),
      avatarUrl: user.avatarMedium ?? user.avatarLarger ?? null,
      userId: user.id ? String(user.id) : null,
    };
  } catch {
    return null;
  }
}

class TikTokApify implements TikTokProvider {
  readonly mode = "live" as const;
  private profileActor: string;
  private videoActor: string;
  constructor(private token: string) {
    this.profileActor = process.env.APIFY_TIKTOK_PROFILE_ACTOR || "clockworks~tiktok-profile-scraper";
    this.videoActor = process.env.APIFY_TIKTOK_ACTOR || "clockworks~tiktok-scraper";
  }

  private async run(actor: string, input: unknown): Promise<any[] | null> {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${this.token}&timeout=25&memory=128`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json) ? json : null;
  }

  async getProfile(username: string): Promise<TtProfile | null> {
    const u = normalizeTikTokUsername(username);
    if (!u) return null;
    const fast = await tryTikTokDirect(u);
    if (fast) return fast;
    const items = await this.run(this.profileActor, { profiles: [u], resultsPerPage: 1, shouldDownloadVideos: false });
    const d = items?.[0];
    const a = d?.authorMeta ?? d;
    if (!a || !(a.name ?? a.uniqueId ?? a.username)) return null;
    return {
      username: String(a.name ?? a.uniqueId ?? a.username ?? u).toLowerCase(),
      nickname: a.nickName ?? a.nickname ?? null,
      bio: a.signature ?? a.bio ?? "",
      followers: Number(a.fans ?? a.followerCount ?? a.followers ?? 0),
      avatarUrl: a.avatar ?? a.avatarMedium ?? null,
      userId: a.id ? String(a.id) : null,
    };
  }

  async getVideo(url: string): Promise<TtVideo | null> {
    const items = await this.run(this.videoActor, { postURLs: [url], resultsPerPage: 1, shouldDownloadVideos: false });
    const d = items?.[0];
    if (!d) return null;
    const owner = String(d.authorMeta?.name ?? d.authorMeta?.uniqueId ?? d.author ?? "").toLowerCase();
    if (!owner) return null;
    return {
      url,
      videoId: d.id ? String(d.id) : extractTikTokVideoId(url),
      ownerUsername: owner,
      views: Number(d.playCount ?? d.playcount ?? d.stats?.playCount ?? 0),
      title: d.text ?? d.desc ?? null,
      thumbnailUrl: d.videoMeta?.coverUrl ?? d.covers?.[0] ?? null,
    };
  }
}

function seeded(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export const MOCK_TT_BIO = new Map<string, string>();

class MockTikTok implements TikTokProvider {
  readonly mode = "mock" as const;
  async getProfile(username: string): Promise<TtProfile | null> {
    const u = normalizeTikTokUsername(username);
    if (!u) return null;
    const injected = MOCK_TT_BIO.get(u);
    return {
      username: u,
      nickname: u,
      bio: `TikTok creator ${injected ?? ""}`.trim(),
      followers: 800 + (seeded(u) % 400000),
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/png?seed=${encodeURIComponent(u)}`,
      userId: String(seeded(u)),
    };
  }
  async getVideo(url: string): Promise<TtVideo | null> {
    const id = extractTikTokVideoId(url) ?? String(seeded(url));
    const owner = url.match(/tiktok\.com\/@([^/]+)/i)?.[1]?.toLowerCase() ?? "democreator";
    return {
      url, videoId: id, ownerUsername: owner,
      views: 6000 + (seeded(id) % 250000),
      title: "Mock TikTok " + id,
      thumbnailUrl: null,
    };
  }
}

class UnconfiguredTikTok implements TikTokProvider {
  readonly mode = "live" as const;
  async getProfile() { return null; }
  async getVideo() { return null; }
}

let cached: TikTokProvider | null = null;
export function tiktok(): TikTokProvider {
  if (cached) return cached;
  const token = process.env.APIFY_TOKEN;
  if (token) cached = new TikTokApify(token);
  else if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_INSTAGRAM !== "true") {
    cached = new UnconfiguredTikTok();
  } else cached = new MockTikTok();
  return cached;
}
