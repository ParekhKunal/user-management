import { cn } from "@/lib/cn";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gold text-[17px] font-semibold leading-none text-white">
        A
      </span>
      <div className={cn(compact && "sr-only sm:not-sr-only sm:block")}>
        <p className="text-[19px] font-semibold leading-none tracking-tight text-ink">Admin</p>
        <p className="mt-1 text-[10px] font-medium tracking-[0.22em] text-mute">OPERATIONS</p>
      </div>
    </div>
  );
}
