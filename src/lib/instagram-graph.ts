import { extractShortcode } from "@/lib/instagram";

const GV = "v21.0";

/** Exchange short-lived code for a long-lived user access token (60 days). */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
} | null> {
  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`;

  // Step 1: code → short-lived user token
  const shortRes = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );
  const shortData = await shortRes.json();
  if (!shortData.access_token) return null;

  // Step 2: short-lived → long-lived (60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/${GV}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortData.access_token}`
  );
  const longData = await longRes.json();
  if (!longData.access_token) return null;

  return { accessToken: longData.access_token, expiresIn: longData.expires_in ?? 5183944 };
}

/** Get the Instagram Business Account ID connected to the user's Facebook Pages. */
export async function getInstagramAccountId(userAccessToken: string): Promise<{
  igAccountId: string;
  pageAccessToken: string;
} | null> {
  const pagesRes = await fetch(
    `https://graph.facebook.com/${GV}/me/accounts?fields=id,access_token,instagram_business_account&access_token=${userAccessToken}`
  );
  const pages = await pagesRes.json();
  if (!Array.isArray(pages.data)) return null;

  for (const page of pages.data) {
    if (page.instagram_business_account?.id) {
      return { igAccountId: page.instagram_business_account.id, pageAccessToken: page.access_token };
    }
  }
  return null;
}

/** Fetch the play count for an Instagram post via Graph API. Returns null if not found. */
export async function getPostPlaysFromGraph(
  igAccountId: string,
  postUrl: string,
  accessToken: string
): Promise<number | null> {
  const shortcode = extractShortcode(postUrl);
  if (!shortcode) return null;

  // Paginate through media to find matching post (up to 150 items)
  let url: string | null =
    `https://graph.facebook.com/${GV}/${igAccountId}/media?fields=id,permalink,media_type&limit=50&access_token=${accessToken}`;

  for (let page = 0; page < 3 && url; page++) {
    const res: Response = await fetch(url, { cache: "no-store" });
    const data: { data?: { id: string; permalink?: string }[]; paging?: { next?: string } } = await res.json();
    if (!Array.isArray(data.data)) break;

    const match = data.data.find((m: { permalink?: string }) => {
      const mc = extractShortcode(m.permalink ?? "");
      return mc === shortcode;
    });

    if (match) {
      return fetchMediaPlays(match.id, accessToken);
    }

    url = data.paging?.next ?? null;
  }
  return null;
}

async function fetchMediaPlays(mediaId: string, accessToken: string): Promise<number | null> {
  // Meta renamed the reel play metric to `views` (matches Instagram Insights
  // "Views"). Older media still expose `plays`/`video_views`. A metric invalid
  // for the media type errors the whole call, so query one at a time, in order.
  for (const metric of ["views", "plays", "video_views"]) {
    const endpoint = `https://graph.facebook.com/${GV}/${mediaId}/insights?metric=${metric}&access_token=${accessToken}`;
    const res = await fetch(endpoint, { cache: "no-store" });
    const data: { data?: { name: string; values?: { value: number }[]; value?: number }[] } = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) continue;
    const m = data.data[0];
    const v = m?.values?.[0]?.value ?? m?.value;
    if (typeof v === "number") return v;
  }
  return null;
}
