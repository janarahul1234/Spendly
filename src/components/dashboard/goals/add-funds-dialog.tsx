"use client";

import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { formatCurrency, round2 } from "@/lib/format";
import { useData } from "@/providers/data-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/types";

const QUICK = [50, 100, 250, 500];

/** Add or withdraw money from a goal in one step. */
export function AddFundsDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && goal && <AddFundsForm goal={goal} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AddFundsForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { format, contributeToGoal } = useData();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [pending, setPending] = useState(false);

  const value = Number(amount.replace(",", "."));
  const signed = Number.isFinite(value) ? (mode === "add" ? value : -value) : 0;
  const nextSaved = Math.max(0, round2(goal.savedAmount + signed));
  const nextPercent =
    goal.targetAmount > 0 ? Math.min(100, round2((nextSaved / goal.targetAmount) * 100)) : 0;
  const invalid =
    !Number.isFinite(value) || value <= 0 || (mode === "withdraw" && value > goal.savedAmount);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    setPending(true);
    try {
      await contributeToGoal(goal.id, signed);
      toast.success(mode === "add" ? "Added to goal" : "Withdrawn from goal", {
        description: `${goal.name} · ${formatCurrency(nextSaved, format)} saved`,
      });
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Move money · {goal.name}</DialogTitle>
        <DialogDescription>
          Currently {formatCurrency(goal.savedAmount, format)} of {formatCurrency(goal.targetAmount, format)}.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Direction">
          {(["add", "withdraw"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                mode === option ? "bg-card font-medium shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "add" ? <Plus className="size-3.5" /> : <Minus className="size-3.5" />}
              {option === "add" ? "Add money" : "Withdraw"}
            </button>
          ))}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="funds-amount" className="text-xs font-medium text-muted-foreground">
            Amount
          </Label>
          <Input
            id="funds-amount"
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={amount !== "" && invalid}
            className="tabular text-base"
          />
          {amount !== "" && invalid && (
            <p className="text-xs text-expense">
              {mode === "withdraw"
                ? `Enter an amount up to ${formatCurrency(goal.savedAmount, format)}`
                : "Enter an amount greater than 0"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((quick) => (
            <Button
              key={quick}
              type="button"
              variant="outline"
              size="xs"
              className="tabular rounded-full"
              onClick={() => setAmount(String(quick))}
            >
              {mode === "withdraw" ? "-" : "+"}
              {quick}
            </Button>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">New saved amount</span>
            <span className="tabular font-medium">{formatCurrency(nextSaved, format)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-goal transition-[width] duration-300 ease-out"
              style={{ width: `${nextPercent}%` }}
            />
          </div>
          <p className="tabular text-xs text-muted-foreground">{nextPercent}% of target</p>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={invalid || pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {mode === "add" ? "Add money" : "Withdraw"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
