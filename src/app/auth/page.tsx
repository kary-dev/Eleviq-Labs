import { AuthCard } from "@/components/AuthCard";
import { ThemeToggle } from "@/components/theme";
import { MegaphoneIcon, WalletIcon } from "@/components/icons";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const discordEnabled = !!(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET);

  return (
    <main className="relative min-h-screen">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        {/* Left — auth card */}
        <div className="flex justify-center lg:justify-start">
          <AuthCard discordEnabled={discordEnabled} refCode={ref} />
        </div>

        {/* Right — marketing */}
        <div className="order-first lg:order-last">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Make the clips.
            <br />
            Rack up the views.
            <br />
            Keep the earnings.
          </h2>
          <p className="mt-5 max-w-md text-lg text-muted">
            Eleviq Labs pairs creators with brand campaigns — you post the content,
            we handle the payouts.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Feature
              icon={<MegaphoneIcon className="h-5 w-5 text-accent" />}
              title="Always-on campaigns"
              body="Fresh brand briefs drop on a steady cadence, so there's never a shortage of content to make and submit."
            />
            <Feature
              icon={<WalletIcon className="h-5 w-5 text-accent" />}
              title="Earnings that scale"
              body="Your payout grows with every view you drive — check exactly where you stand whenever you want."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-5">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{body}</p>
    </div>
  );
}
