"use client";

import { useState } from "react";
import { Check, Ellipsis, Pencil, Plus, Target, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { AddFundsDialog } from "@/components/goals/add-funds-dialog";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { goalColorClasses } from "@/lib/goal-colors";
import { daysUntil, formatCurrency, formatFullDate, formatPercent, round2 } from "@/lib/format";
import { useData } from "@/providers/data-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/types";

export function GoalCard({ goal }: { goal: Goal }) {
  const { format, deleteGoal } = useData();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const colors = goalColorClasses(goal.color);
  const percent = goal.targetAmount > 0 ? round2((goal.savedAmount / goal.targetAmount) * 100) : 0;
  const complete = goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0;
  const remaining = Math.max(0, round2(goal.targetAmount - goal.savedAmount));
  const days = goal.targetDate ? daysUntil(goal.targetDate) : null;
  const overdue = days !== null && days < 0 && !complete;

  const handleDelete = async () => {
    await deleteGoal(goal.id);
    toast.success("Goal deleted");
  };

  return (
    <>
      <Card
        className={cn(
          "gap-4 transition-shadow duration-200 hover:shadow-raised",
          complete && "ring-income/40",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", colors.soft)}>
              {complete ? <Check className={cn("size-4", colors.text)} /> : <Target className={cn("size-4", colors.text)} />}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-heading text-sm font-medium">{goal.name}</h3>
              <p className="truncate text-xs text-muted-foreground">
                {goal.targetDate
                  ? overdue
                    ? `Overdue by ${Math.abs(days ?? 0)} days`
                    : days === 0
                      ? "Due today"
                      : `${days} days left`
                  : "No target date"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Actions for ${goal.name}`}
                className="shrink-0"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => setAdding(true)}>
                <Plus className="size-4" />
                Add money
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil className="size-4" />
                Edit goal
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
                <Trash className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-500 ease-out", colors.bar)}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="tabular font-medium">{formatCurrency(goal.savedAmount, format)}</span>
            <span className="tabular text-xs text-muted-foreground">
              of {formatCurrency(goal.targetAmount, format)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div className="min-w-0 text-xs">
            {complete ? (
              <span className={cn("font-medium", colors.text)}>
                Goal reached · {formatFullDate(goal.targetDate || new Date().toISOString().slice(0, 10), format.locale)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                <span className="tabular font-medium text-foreground">{formatPercent(percent)}</span> saved ·{" "}
                {formatCurrency(remaining, format)} to go
              </span>
            )}
          </div>
          <Button variant="outline" size="xs" onClick={() => setAdding(true)} disabled={complete}>
            <Plus />
            Add
          </Button>
        </div>
      </Card>

      <AddFundsDialog goal={goal} open={adding} onOpenChange={setAdding} />
      <GoalFormDialog goal={goal} open={editing} onOpenChange={setEditing} />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{goal.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatCurrency(goal.savedAmount, format)} saved towards this goal will be removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-expense text-white hover:bg-expense/90" onClick={handleDelete}>
              Delete goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
