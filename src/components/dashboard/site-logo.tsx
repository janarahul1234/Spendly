import { cn } from "@/lib/utils";

/** The black "coin puck" mark used in the header and on the login screen. */
export function SiteLogo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M6 12.5v6.4c0 2.65 4.48 4.8 10 4.8s10-2.15 10-4.8v-6.4"
        className="fill-foreground/35"
      />
      <ellipse cx="16" cy="12.5" rx="10" ry="4.8" className="fill-foreground" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <SiteLogo />
      <span className="text-[0.95rem] font-semibold tracking-tight">Spendly</span>
    </span>
  );
}
