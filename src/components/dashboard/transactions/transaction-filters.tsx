"use client";

import { useMemo, useState } from "react";
import { Check, ListFilter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORIES, CATEGORY_GROUPS, getCategory } from "@/services/supabase/data/categories";
import { cn } from "@/lib/utils";

export interface TransactionFilterValue {
  search: string;
  type: "all" | "income" | "expense";
  categories: string[];
}

export const EMPTY_FILTERS: TransactionFilterValue = { search: "", type: "all", categories: [] };

export function countActiveFilters(value: TransactionFilterValue) {
  return (
    (value.search.trim() ? 1 : 0) + (value.type !== "all" ? 1 : 0) + (value.categories.length > 0 ? 1 : 0)
  );
}

/** Search + Type + Category filters, matching the reference dropdown design. */
export function TransactionFilters({
  value,
  onChange,
  onReset,
  /** Set when something outside these filters (e.g. a date scope) is also non-default. */
  extraActive = false,
  className,
}: {
  value: TransactionFilterValue;
  onChange: (next: TransactionFilterValue) => void;
  onReset?: () => void;
  extraActive?: boolean;
  className?: string;
}) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const groups = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    return CATEGORY_GROUPS.map((group) => ({
      group,
      items: CATEGORIES.filter(
        (category) =>
          category.group === group &&
          (term === "" || category.label.toLowerCase().includes(term)),
      ),
    })).filter((entry) => entry.items.length > 0);
  }, [categorySearch]);

  const toggleCategory = (id: string) => {
    const next = value.categories.includes(id)
      ? value.categories.filter((entry) => entry !== id)
      : [...value.categories, id];
    onChange({ ...value, categories: next });
  };

  const active = countActiveFilters(value);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-0 flex-1 sm:max-w-64">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Search transactions"
          aria-label="Search transactions"
          className="h-8 rounded-full pr-8 pl-8 text-sm"
        />
        {value.search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange({ ...value, search: "" })}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <Select
        value={value.type}
        onValueChange={(next) => onChange({ ...value, type: next as TransactionFilterValue["type"] })}
      >
        <SelectTrigger size="sm" aria-label="Filter by type" className="w-30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expenses</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full"
            aria-label="Filter by category"
          >
            <ListFilter className="size-3.5" />
            Category
            {value.categories.length > 0 && (
              <span className="tabular rounded-full bg-foreground px-1.5 text-[0.68rem] font-medium text-background">
                {value.categories.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 gap-0 p-0">
          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Search..."
                aria-label="Search categories"
                className="h-8 rounded-full pl-8 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="max-h-72 px-2 pb-1">
            {groups.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <p className="px-2 pt-2 pb-1 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
                  {group}
                </p>
                <ul className="flex flex-col">
                  {items.map((category) => {
                    const checked = value.categories.includes(category.id);
                    return (
                      <li key={category.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-muted",
                            checked && "bg-muted/70",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleCategory(category.id)}
                            aria-label={category.label}
                          />
                          <span aria-hidden>{category.emoji}</span>
                          <span className="flex-1 truncate">{category.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No category matches “{categorySearch}”.
              </p>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between gap-2 border-t p-2">
            <Button
              variant="ghost"
              size="xs"
              disabled={value.categories.length === 0}
              onClick={() => onChange({ ...value, categories: [] })}
            >
              Clear
            </Button>
            <span className="truncate text-xs text-muted-foreground">
              {value.categories.length === 0
                ? "All categories"
                : value.categories.map((id) => getCategory(id).label).slice(0, 2).join(", ") +
                  (value.categories.length > 2 ? ` +${value.categories.length - 2}` : "")}
            </span>
            {value.categories.length > 0 && <Check className="size-3.5 text-income" />}
          </div>
        </PopoverContent>
      </Popover>

      {(active > 0 || extraActive) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange({ ...EMPTY_FILTERS });
            onReset?.();
          }}
          className="h-8"
        >
          Reset
        </Button>
      )}
    </div>
  );
}
