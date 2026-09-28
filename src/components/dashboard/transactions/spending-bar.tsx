"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { FormatOptions } from "@/lib/format";
import type { CategorySlice } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Thin stacked bar showing how spending splits across categories,
 * with a floating label on hover — the hero element of the reference design.
 */
export function SpendingBar({
  slices,
  total,
  format,
  className,
}: {
  slices: CategorySlice[];
  total: number;
  format: FormatOptions;
  className?: string;
}) {
  const [hovered, setHovered] = useState<CategorySlice | null>(null);
  const visible = slices.filter((slice) => slice.share > 0.4);

  if (total <= 0) {
    return (
      <div className={cn("flex h-1.5 w-full items-center rounded-full bg-muted", className)}>
        <span className="sr-only">No spending recorded for this period</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="relative flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`Spending distribution: ${visible
          .map((slice) => `${slice.label} ${formatPercent(slice.share)}`)
          .join(", ")}`}
      >
        {visible.map((slice) => (
          <Tooltip key={slice.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onMouseEnter={() => setHovered(slice)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(slice)}
                onBlur={() => setHovered(null)}
                style={{ width: `${slice.share}%`, backgroundColor: slice.color }}
                className="h-full rounded-full transition-[opacity,transform] duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <span className="sr-only">
                  {slice.label}: {formatCurrency(slice.total, format)} ({formatPercent(slice.share)})
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-lg px-2.5 py-1.5 text-xs">
              <span className="block font-medium">{slice.label}</span>
              <span className="tabular block opacity-80">{formatPercent(slice.share)}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {visible.map((slice) => (
          <li
            key={slice.id}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-opacity duration-200",
              hovered && hovered.id !== slice.id ? "opacity-50" : "opacity-100",
            )}
          >
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="tabular font-medium">{formatPercent(slice.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal category bars — used on the reports screen. */
export function CategoryBars({
  slices,
  total,
  format,
  limit = 8,
}: {
  slices: CategorySlice[];
  total: number;
  format: FormatOptions;
  limit?: number;
}) {
  const rows = slices.slice(0, limit);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((slice) => (
        <li key={slice.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden>{slice.emoji}</span>
              <span className="truncate">{slice.label}</span>
              <span className="tabular text-xs text-muted-foreground">
                {slice.count} {slice.count === 1 ? "entry" : "entries"}
              </span>
            </span>
            <span className="tabular shrink-0 font-medium">{formatCurrency(slice.total, format)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, slice.share)}%`, backgroundColor: slice.color }}
              />
            </div>
            <span className="tabular w-10 shrink-0 text-right text-xs text-muted-foreground">
              {formatPercent(slice.share)}
            </span>
          </div>
        </li>
      ))}
      {total <= 0 && (
        <li className="text-sm text-muted-foreground">Nothing spent in this period yet.</li>
      )}
    </ul>
  );
}
