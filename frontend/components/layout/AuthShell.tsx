import { Brand } from "@/components/layout/Brand";

export function AuthShell({
  kicker,
  headline,
  lede,
  children,
}: {
  kicker: string;
  headline: React.ReactNode;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="auth-glow relative hidden flex-col justify-between overflow-hidden px-12 py-12 lg:flex xl:px-16">
        <div className="pointer-events-none absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
        <Brand />
        <div className="max-w-lg">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">{kicker}</p>
          <div className="mt-5 text-[4.4rem] font-semibold leading-[0.92] tracking-tight text-ink">
            {headline}
          </div>
          <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-mute">{lede}</p>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-medium uppercase tracking-[0.2em] text-mute">
          <span>Approve</span>
          <span className="h-px w-6 bg-gold/40" />
          <span>Record</span>
          <span className="h-px w-6 bg-gold/40" />
          <span>Revoke</span>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col bg-raised px-6 py-10 sm:px-10 lg:border-l lg:border-line">
        <div className="mb-10 lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
