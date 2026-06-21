import { Suspense } from "react";
import { cachedUnreadCount } from "@/lib/queries";

async function Inner({ userId }: { userId: string }) {
  try {
    const count = await cachedUnreadCount(userId)();
    if (!count) return null;
    return (
      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
        {count > 9 ? "9+" : count}
      </span>
    );
  } catch {
    return null;
  }
}

export function UnreadBadge({ userId }: { userId: string }) {
  return (
    <Suspense fallback={null}>
      <Inner userId={userId} />
    </Suspense>
  );
}
