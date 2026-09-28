"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/services/supabase/utils/format";

export type StatAccent = "income" | "expense" | "savings" | "goal" | "neutral";

const ACCENT_TEXT: Record<StatAccent, string> = {
  income: "text-income",
  expense: "text-expense",
  savings: "text-savings",
  goal: "text-goal",
  neutral: "text-foreground",
};

export function StatCard({
  label,
  value,
  accent = "neutral",
  share,
  delta,
  deltaLabel = "vs last month",
  hint,
  className,
}: {
  label: string;
  value: string;
  accent?: StatAccent;
  /** Optional percentage shown next to the label, e.g. expenses as % of income. */
  share?: number;
  /** Percentage change versus the previous period. */
  delta?: number | null;
  deltaLabel?: string;
  hint?: string;
  className?: string;
}) {
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  // Spending more is bad, earning more is good — colour follows intent.
  const goodChange =
    accent === "expense" ? !positive : accent === "income" || accent === "savings" ? positive : positive;

  return (
    <Card
      className={cn("gap-1 transition-shadow duration-200 hover:shadow-raised", className)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className={cn("text-xs font-medium", ACCENT_TEXT[accent])}>{label}</p>
        {typeof share === "number" && (
          <span className="tabular text-xs text-muted-foreground">{formatPercent(share)}</span>
        )}
      </div>
      <p className="tabular truncate text-xl font-semibold tracking-tight sm:text-[1.6rem]">{value}</p>
      {showDelta || hint ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {showDelta && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    goodChange ? "text-income" : "text-expense",
                  )}
                >
                  {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {formatPercent(Math.abs(delta ?? 0), 1)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {deltaLabel}
              </TooltipContent>
            </Tooltip>
          )}
          <span className="truncate">{showDelta ? deltaLabel : hint}</span>
        </p>
      ) : null}
    </Card>
  );
}
