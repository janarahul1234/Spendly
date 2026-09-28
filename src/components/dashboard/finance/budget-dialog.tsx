"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_GROUPS } from "@/services/supabase/data/categories";
import { useData } from "@/services/supabase/contexts/data-provider";
import { toast } from "sonner";
import type { Budget } from "@/services/supabase/types/budget";

const OVERALL = "overall";

/** Create or update the monthly limit for a category (or for all spending). */
export function BudgetDialog({
  open,
  onOpenChange,
  budget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <BudgetForm budget={budget} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function BudgetForm({ budget, onClose }: { budget?: Budget | null; onClose: () => void }) {
  const { budgets, setBudget, deleteBudget } = useData();
  const [category, setCategory] = useState(budget?.category ?? OVERALL);
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  /** Categories already covered by another budget. */
  const taken = new Set(budgets.filter((entry) => entry.id !== budget?.id).map((entry) => entry.category));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Budget must be greater than 0");
      return;
    }
    if (taken.has(category)) {
      setError("This category already has a budget");
      return;
    }

    setPending(true);
    try {
      await setBudget(category, value);
      toast.success(budget ? "Budget updated" : "Budget added");
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{budget ? "Edit budget" : "Add budget"}</DialogTitle>
        <DialogDescription>Set a monthly limit and we will nudge you when you get close.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="budget-category" className="text-xs font-medium text-muted-foreground">
            Category
          </Label>
          <Select value={category} onValueChange={setCategory} disabled={Boolean(budget)}>
            <SelectTrigger id="budget-category" className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectGroup>
                <SelectLabel>Everything</SelectLabel>
                <SelectItem value={OVERALL}>💰 Monthly budget (all expenses)</SelectItem>
              </SelectGroup>
              {CATEGORY_GROUPS.filter((group) => group !== "Income").map((group) => {
                const items = CATEGORIES.filter((item) => item.group === group && item.kind !== "income");
                if (items.length === 0) return null;
                return (
                  <SelectGroup key={group}>
                    <SelectLabel>{group}</SelectLabel>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id} disabled={taken.has(item.id)}>
                        <span aria-hidden className="mr-1.5">
                          {item.emoji}
                        </span>
                        {item.label}
                        {taken.has(item.id) && (
                          <span className="ml-1 text-xs text-muted-foreground">(set)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="budget-amount" className="text-xs font-medium text-muted-foreground">
            Monthly limit
          </Label>
          <Input
            id="budget-amount"
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            className="tabular text-base"
          />
          {error && <p className="text-xs text-expense">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          {budget && (
            <Button type="button" variant="ghost" onClick={() => setConfirmingRemove(true)}>
              Remove budget
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {budget ? "Save changes" : "Set budget"}
            </Button>
          </div>
        </DialogFooter>
      </form>

      {/* Deleting a budget is destructive, so it gets the same confirm step as
          transactions and goals. Rendered after the form so the alert stacks
          above this dialog. */}
      <AlertDialog open={confirmingRemove} onOpenChange={setConfirmingRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              You will stop seeing spent vs remaining for this category until you set a new limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-white hover:bg-expense/90"
              onClick={async () => {
                if (!budget) return;
                await deleteBudget(budget.id);
                toast.success("Budget removed");
                setConfirmingRemove(false);
                onClose();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
