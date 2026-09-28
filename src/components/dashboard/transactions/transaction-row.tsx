"use client";

import { useState } from "react";
import { Ellipsis, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AmountBadge, CategoryPill } from "@/components/dashboard/transactions/category-pill";
import { TransactionFormDialog } from "@/components/dashboard/transactions/transaction-form-dialog";
import { getCategory, getPaymentMethod } from "@/services/supabase/data/categories";
import { formatCurrency } from "@/services/supabase/utils/format";
import { cn } from "@/lib/utils";
import { useData } from "@/services/supabase/contexts/data-provider";
import { toast } from "sonner";
import type { Transaction } from "@/services/supabase/types/transaction";

export function TransactionRow({
  transaction,
  className,
  showMeta = true,
}: {
  transaction: Transaction;
  className?: string;
  showMeta?: boolean;
}) {
  const { format, deleteTransaction } = useData();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const category = getCategory(transaction.category);

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    toast.success("Transaction deleted");
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-muted/60 after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border/50 last:after:hidden",
          className,
        )}
      >
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-sm">
          {category.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{transaction.note || category.label}</p>
          {showMeta && (
            <p className="truncate text-xs text-muted-foreground">
              {category.label}
              <span aria-hidden className="mx-1.5 opacity-50">
                ·
              </span>
              {getPaymentMethod(transaction.paymentMethod).label}
            </p>
          )}
        </div>

        <CategoryPill categoryId={transaction.category} className="hidden lg:inline-flex" />

        <AmountBadge
          amount={transaction.amount}
          type={transaction.type}
          formatted={formatCurrency(transaction.amount, format)}
          className="w-fit text-right"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${transaction.note || category.label}`}
              className="shrink-0 opacity-60 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Trash className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionFormDialog
        open={editing}
        onOpenChange={setEditing}
        transaction={transaction}
      />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {transaction.note || category.label} of {formatCurrency(transaction.amount, format)} will be removed.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-white hover:bg-expense/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
