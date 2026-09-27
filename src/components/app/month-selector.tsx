"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useState } from "react";

/** Month + year picker used across the dashboard, finance and reports views. */
export function MonthSelector({
  monthKey,
  onChange,
  locale = "en-US",
  align = "end",
}: {
  monthKey: string;
  onChange: (monthKey: string) => void;
  locale?: string;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const initialYear = Number(monthKey.slice(0, 4));
  const [year, setYear] = useState(initialYear);
  const thisYear = Number(currentMonthKey().slice(0, 4));
  const isCurrentMonth = monthKey === currentMonthKey();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous month"
        onClick={() => onChange(addMonthsToKey(monthKey, -1))}
      >
        <ChevronLeft />
      </Button>

      <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setYear(Number(monthKey.slice(0, 4))); }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="min-w-38 justify-between px-2 font-medium">
            {formatMonthLabel(monthKey, locale)}
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align={align} className="w-64 gap-2 p-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous year"
              disabled={year <= thisYear - 8}
              onClick={() => setYear((value) => value - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="tabular text-sm font-medium">{year}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next year"
              disabled={year >= thisYear}
              onClick={() => setYear((value) => value + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, index) => {
              const key = `${year}-${String(index + 1).padStart(2, "0")}`;
              const selected = key === monthKey;
              const future = key > currentMonthKey();
              return (
                <button
                  key={key}
                  type="button"
                  disabled={future}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-xs transition-colors duration-200 disabled:opacity-30",
                    selected ? "bg-foreground font-medium text-background" : "hover:bg-muted",
                  )}
                >
                  {formatMonthLabel(key, locale, "short").replace(/\s\d{4}$/, "")}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next month"
        disabled={isCurrentMonth}
        onClick={() => onChange(addMonthsToKey(monthKey, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
