import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

/**
 * Small pill-shaped category tag, e.g. `🍜 Restaurant`.
 * `muted` matches the reference design: hairline border, no fill.
 */
export function CategoryPill({
  categoryId,
  className,
  variant = "outline",
}: {
  categoryId: string;
  className?: string;
  variant?: "outline" | "soft";
}) {
  const category = getCategory(categoryId);

  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-200",
        variant === "outline"
          ? "border border-border/80 bg-card text-foreground"
          : "border border-transparent bg-muted text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden className="text-[0.8rem] leading-none">
        {category.emoji}
      </span>
      <span className="truncate">{category.label}</span>
    </span>
  );
}

/** Income / expense marker used next to amounts. */
export function AmountBadge({
  amount,
  type,
  formatted,
  className,
}: {
  amount: number;
  type: "income" | "expense";
  formatted: string;
  className?: string;
}) {
  const isIncome = type === "income";
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "tabular flex items-center gap-1 text-sm font-medium whitespace-nowrap",
        isIncome ? "text-income" : "text-foreground",
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0 opacity-80" />
      <span>
        {isIncome ? "+" : "-"}
        {formatted}
      </span>
      <span className="sr-only">{` ${isIncome ? "income" : "expense"} of ${amount}`}</span>
    </span>
  );
}
