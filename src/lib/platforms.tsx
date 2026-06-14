import { InstagramIcon, YoutubeIcon, TiktokIcon, XSocialIcon } from "@/components/icons";

export type PlatformKey = "INSTAGRAM" | "YOUTUBE" | "X" | "TIKTOK";

export const PLATFORMS: Record<
  PlatformKey,
  { label: string; Icon: typeof InstagramIcon; color: string; placeholder: string }
> = {
  INSTAGRAM: { label: "Instagram", Icon: InstagramIcon, color: "#E1306C", placeholder: "https://instagram.com/yourhandle" },
  YOUTUBE: { label: "YouTube", Icon: YoutubeIcon, color: "#FF0033", placeholder: "https://youtube.com/@yourhandle" },
  X: { label: "X (Twitter)", Icon: XSocialIcon, color: "#9CA3AF", placeholder: "https://x.com/yourhandle" },
  TIKTOK: { label: "TikTok", Icon: TiktokIcon, color: "#22D3EE", placeholder: "https://tiktok.com/@yourhandle" },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];
