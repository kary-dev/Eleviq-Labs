import { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
);
export const MegaphoneIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15 8a4 4 0 0 1 0 8" /><path d="M11 18.5V21" /></svg>
);
export const WalletIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M3 10h18" /><circle cx="17" cy="14" r="1.2" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" /><path d="m9.5 12 1.8 1.8L15 10" /></svg>
);
export const ChartIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 4v16h16" /><rect x="7" y="11" width="3" height="6" rx="0.6" /><rect x="12.5" y="7" width="3" height="10" rx="0.6" /><rect x="18" y="13" width="3" height="4" rx="0.6" /></svg>
);
export const BankIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M19 10v8M9 10v8M15 10v8" /><path d="M3 21h18" /></svg>
);
export const GiftIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="9" width="18" height="12" rx="1.5" /><path d="M3 13h18M12 9v12" /><path d="M12 9S10.5 4 8 4a2 2 0 0 0 0 4h4Zm0 0s1.5-5 4-5a2 2 0 0 1 0 4h-4Z" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="m5 12 4.5 4.5L19 7" /></svg>
);
export const XIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const LogoutIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
);
export const UsersIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 5.2A3.2 3.2 0 0 1 16 11M21 20c0-2.6-1.6-4.5-4-5.2" /></svg>
);
export const LinkIcon = (p: P) => (
  <svg {...base(p)}><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
);
export const UploadIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></svg>
);
export const EyeIcon = (p: P) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const RefreshIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" /></svg>
);
export const KeyIcon = (p: P) => (
  <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2" /><path d="m17 5 2.5 2.5M14 8l2.5 2.5" /></svg>
);
export const ArrowLeftIcon = (p: P) => (
  <svg {...base(p)}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
);
export const SparkleIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" /></svg>
);

// --- Social / brand icons ---
export const DiscordIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19.27 5.33A16.5 16.5 0 0 0 15.1 4l-.2.42a14.6 14.6 0 0 1 3.65 1.17A14.46 14.46 0 0 0 12 4.94c-2.3 0-4.5.36-6.55 1.17A14.6 14.6 0 0 1 9.1 4.42L8.9 4a16.5 16.5 0 0 0-4.17 1.33C2 9.45 1.27 13.46 1.6 17.4A16.6 16.6 0 0 0 6.7 20l.6-1.07a10.8 10.8 0 0 1-1.7-.82l.42-.32c3.27 1.5 6.8 1.5 10 0l.42.32c-.54.32-1.1.6-1.7.82L15.3 20a16.6 16.6 0 0 0 5.1-2.6c.4-4.57-.66-8.55-1.13-12.07ZM8.5 15c-.8 0-1.45-.74-1.45-1.65 0-.92.64-1.66 1.45-1.66s1.46.74 1.45 1.66c0 .91-.64 1.65-1.45 1.65Zm7 0c-.8 0-1.45-.74-1.45-1.65 0-.92.64-1.66 1.45-1.66s1.46.74 1.45 1.66c0 .91-.64 1.65-1.45 1.65Z" />
  </svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></svg>
);
export const YoutubeIcon = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="6" width="19" height="12" rx="3.5" /><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" /></svg>
);
export const TiktokIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.7c-1.3.1-2.5-.3-3.6-1v5.8a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a3 3 0 1 0 2.1 2.8V3h2.8Z" />
  </svg>
);
export const XSocialIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.6-6-5.3 6H3l7-8L2.6 3h6l4.2 5.5L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z" />
  </svg>
);
