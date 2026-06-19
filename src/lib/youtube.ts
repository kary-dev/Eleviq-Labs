/**
 * YouTube Data API v3 provider. Free with an API key (YOUTUBE_API_KEY).
 *  - getProfile(handle) -> channel snippet (description used for bio-code checks)
 *  - getVideo(url)      -> view count + owning channelId (for ownership)
 * Falls back to a deterministic mock when no key is set (dev / ALLOW_MOCK).
 */

export type YtProfile = {
  handle: string;
  channelId: string;
  title: string;
  description: string;
  subscribers: number;
  avatarUrl: string | null;
};

export type YtVideo = {
  url: string;
  videoId: string;
  channelId: string;
  channelTitle: string;
  views: number;
  title: string | null;
  thumbnailUrl: string | null;
};

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/live\/([A-Za-z0-9_-]{6,})/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function normalizeYouTubeHandle(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, "")
    .replace(/^@/, "")
    .replace(/^(c|channel|user)\//i, "")
    .replace(/\/.*$/, "");
}

export interface YouTubeProvider {
  readonly mode: "live" | "mock";
  getProfile(handle: string): Promise<YtProfile | null>;
  getVideo(url: string): Promise<YtVideo | null>;
}

class YouTubeApi implements YouTubeProvider {
  readonly mode = "live" as const;
  constructor(private key: string) {}

  private async call(path: string): Promise<any | null> {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}&key=${this.key}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  }

  async getProfile(handleOrId: string): Promise<YtProfile | null> {
    const h = normalizeYouTubeHandle(handleOrId);
    if (!h) return null;
    // Try handle, then channel id, then legacy username.
    let item =
      (await this.call(`channels?part=snippet,statistics&forHandle=@${encodeURIComponent(h)}`))?.items?.[0] ??
      (await this.call(`channels?part=snippet,statistics&id=${encodeURIComponent(h)}`))?.items?.[0] ??
      (await this.call(`channels?part=snippet,statistics&forUsername=${encodeURIComponent(h)}`))?.items?.[0];
    if (!item) return null;
    return {
      handle: (item.snippet?.customUrl ?? h).replace(/^@/, ""),
      channelId: item.id,
      title: item.snippet?.title ?? "",
      description: item.snippet?.description ?? "",
      subscribers: Number(item.statistics?.subscriberCount ?? 0),
      avatarUrl: item.snippet?.thumbnails?.default?.url ?? null,
    };
  }

  async getVideo(url: string): Promise<YtVideo | null> {
    const id = extractYouTubeVideoId(url);
    if (!id) return null;
    const item = (await this.call(`videos?part=snippet,statistics&id=${id}`))?.items?.[0];
    if (!item) return null;
    return {
      url,
      videoId: id,
      channelId: item.snippet?.channelId ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      views: Number(item.statistics?.viewCount ?? 0),
      title: item.snippet?.title ?? null,
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    };
  }
}

function seeded(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export const MOCK_YT_BIO = new Map<string, string>();

class MockYouTube implements YouTubeProvider {
  readonly mode = "mock" as const;
  async getProfile(handle: string): Promise<YtProfile | null> {
    const h = normalizeYouTubeHandle(handle);
    if (!h) return null;
    const injected = MOCK_YT_BIO.get(h.toLowerCase());
    return {
      handle: h,
      channelId: "UC" + seeded(h).toString(36).padStart(10, "0").slice(0, 22),
      title: h,
      description: `Creator channel ${injected ?? ""}`.trim(),
      subscribers: 1000 + (seeded(h) % 500000),
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/png?seed=${encodeURIComponent(h)}`,
    };
  }
  async getVideo(url: string): Promise<YtVideo | null> {
    const id = extractYouTubeVideoId(url) ?? "mock";
    const h = seeded(id);
    return {
      url, videoId: id,
      channelId: "UC" + h.toString(36).padStart(10, "0").slice(0, 22),
      channelTitle: "Mock Channel",
      views: 4000 + (h % 300000),
      title: "Mock YouTube video " + id,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    };
  }
}

class UnconfiguredYouTube implements YouTubeProvider {
  readonly mode = "live" as const;
  async getProfile() { return null; }
  async getVideo() { return null; }
}

let cached: YouTubeProvider | null = null;
export function youtube(): YouTubeProvider {
  if (cached) return cached;
  const key = process.env.YOUTUBE_API_KEY;
  if (key) cached = new YouTubeApi(key);
  else if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_INSTAGRAM !== "true") {
    cached = new UnconfiguredYouTube();
  } else cached = new MockYouTube();
  return cached;
}
