import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const buttonStyles = {
  primary:
    "bg-gold text-white hover:bg-gold-dim disabled:bg-gold/40 disabled:text-white/70",
  secondary:
    "bg-raised text-ink ring-1 ring-inset ring-line hover:bg-canvas hover:ring-ink/15 disabled:opacity-40",
  danger:
    "bg-danger text-white hover:bg-[#a8382e] disabled:bg-danger/40 disabled:text-white/70",
  ghost: "text-mute hover:bg-canvas hover:text-ink disabled:opacity-40",
  outline:
    "bg-transparent text-gold ring-1 ring-inset ring-gold/30 hover:bg-gold/10 disabled:opacity-40",
};

export function buttonClass(
  variant: keyof typeof buttonStyles = "primary",
  className = ""
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-150 disabled:cursor-not-allowed",
    buttonStyles[variant],
    className
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
}) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Input({
  className = "",
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-md border bg-raised px-3 py-2.5 text-sm text-ink placeholder:text-mute/70 transition-colors duration-150",
        "border-line hover:border-ink/20 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger/50 focus:border-danger/60 focus:ring-danger/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full rounded-md border bg-raised px-3 py-2.5 text-sm text-ink placeholder:text-mute/70 transition-colors duration-150",
        "border-line hover:border-ink/20 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger/50 focus:border-danger/60 focus:ring-danger/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className = "",
  invalid,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full appearance-none rounded-md border bg-raised px-3 py-2.5 pr-9 text-sm text-ink transition-colors duration-150",
        "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27none%27 stroke=%27%236a645c%27 stroke-width=%271.6%27%3E%3Cpath d=%27M2.4 4.4 6 8l3.6-3.6%27/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat",
        "border-line hover:border-ink/20 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger/50 focus:border-danger/60 focus:ring-danger/20",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
        {label}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs leading-relaxed text-mute">{hint}</span>
      ) : null}
    </label>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "rose" | "slate" | "indigo";
  children: React.ReactNode;
}) {
  const styles = {
    green: "bg-success/10 text-success ring-success/20",
    amber: "bg-gold/10 text-gold ring-gold/20",
    rose: "bg-danger/10 text-danger ring-danger/20",
    slate: "bg-canvas text-mute ring-line",
    indigo: "bg-canvas text-ink ring-line",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        styles
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("surface overflow-hidden rounded-xl", className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold leading-none tracking-tight text-ink">{title}</h2>
            {description ? <p className="mt-1.5 text-sm text-mute">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function Alert({
  tone = "rose",
  children,
}: {
  tone?: "rose" | "emerald" | "amber";
  children: React.ReactNode;
}) {
  const styles = {
    rose: "border-danger/25 bg-danger/[0.08] text-danger",
    emerald: "border-success/25 bg-success/[0.08] text-success",
    amber: "border-gold/25 bg-gold/[0.08] text-gold",
  }[tone];

  return (
    <div className={cn("rounded-md border px-3.5 py-2.5 text-sm leading-relaxed", styles)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        ) : null}
        <h1 className="text-4xl font-semibold leading-none tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-2.5 text-sm leading-relaxed text-mute">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-[12px] font-medium transition-colors duration-150",
        active
          ? "bg-gold text-white"
          : "bg-raised text-mute ring-1 ring-inset ring-line hover:bg-canvas hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-[11px]",
    lg: "h-14 w-14 text-sm",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gold/10 font-semibold text-gold ring-1 ring-gold/20",
        sizes
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-line/80", className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 h-px w-10 bg-gold/50" />
      <p className="text-2xl font-semibold text-ink">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-mute">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("min-w-full text-left text-sm", className)} {...props} />;
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-mute",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle", className)} {...props} />;
}
