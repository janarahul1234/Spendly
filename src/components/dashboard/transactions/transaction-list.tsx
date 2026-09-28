"use client";

import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/state-views";
import { TransactionRow } from "@/components/expense/transaction-row";
import { groupByDate, type DateGroup } from "@/lib/analytics";
import { relativeDayLabel } from "@/lib/format";
import { useData } from "@/providers/data-provider";
import type { Transaction } from "@/lib/types";

export function TransactionList({
  transactions,
  grouped = true,
  pageSize = 12,
  empty,
}: {
  transactions: Transaction[];
  /** Collapse rows under Today / Yesterday / date headings. */
  grouped?: boolean;
  pageSize?: number;
  empty?: { title: string; description: string; action?: React.ReactNode };
}) {
  const { settings } = useData();
  const [visible, setVisible] = useState(pageSize);

  const { groups, hasMore } = useMemo(() => {
    const all = grouped
      ? groupByDate(transactions, (iso) =>
          relativeDayLabel(iso, settings.locale),
        )
      : [{ key: "all", label: "", items: transactions }];

    const page: DateGroup[] = [];
    let remaining = visible;
    for (const group of all) {
      if (remaining <= 0) break;
      const items = group.items.slice(0, remaining);
      remaining -= items.length;
      if (items.length > 0) page.push({ ...group, items });
    }
    return { groups: page, hasMore: visible < transactions.length };
  }, [transactions, grouped, settings.locale, visible]);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="size-4" />}
        title={empty?.title ?? "No transactions yet"}
        description={
          empty?.description ??
          "Add your first income or expense to see it here."
        }
        action={empty?.action}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.key} aria-label={group.label || undefined}>
            {group.label && (
              <h3 className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
            )}
            <div className="flex flex-col">
              {group.items.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisible((value) => value + pageSize)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
