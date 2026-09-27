"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { GOAL_COLORS, goalColorClasses } from "@/lib/goal-colors";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useData } from "@/providers/data-provider";
import { toast } from "sonner";
import type { Goal, GoalColor, GoalDraft } from "@/lib/types";

interface FormState {
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string;
  color: GoalColor;
  note: string;
}

const BLANK: FormState = {
  name: "",
  targetAmount: "",
  savedAmount: "0",
  targetDate: "",
  color: "green",
  note: "",
};

function fromGoal(goal: Goal): FormState {
  return {
    name: goal.name,
    targetAmount: String(goal.targetAmount),
    savedAmount: String(goal.savedAmount),
    targetDate: goal.targetDate,
    color: goal.color,
    note: goal.note,
  };
}

/** Create & edit dialog shared by every goal screen. */
export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <GoalForm goal={goal} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while open, so its state always starts from the current goal. */
function GoalForm({ goal, onClose }: { goal?: Goal | null; onClose: () => void }) {
  const { addGoal, updateGoal } = useData();
  const [form, setForm] = useState<FormState>(() => (goal ? fromGoal(goal) : BLANK));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(goal);

  /** Editing a field clears that field's error so feedback never goes stale. */
  const patch = (next: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const touched = Object.keys(next) as (keyof FormState)[];
      if (!touched.some((key) => prev[key])) return prev;
      const cleared = { ...prev };
      for (const key of touched) delete cleared[key];
      return cleared;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = Number(form.targetAmount.replace(",", "."));
    const saved = Number(form.savedAmount.replace(",", ".") || "0");
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Give your goal a name";
    if (!Number.isFinite(target) || target <= 0) nextErrors.targetAmount = "Target must be greater than 0";
    if (!Number.isFinite(saved) || saved < 0) nextErrors.savedAmount = "Saved amount cannot be negative";
    if (form.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.targetDate)) nextErrors.targetDate = "Pick a valid date";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const draft: GoalDraft = {
      name: form.name.trim(),
      targetAmount: Math.round(target * 100) / 100,
      savedAmount: Math.round(saved * 100) / 100,
      targetDate: form.targetDate,
      color: form.color,
      note: form.note.trim(),
    };

    setPending(true);
    try {
      if (goal) {
        await updateGoal(goal.id, draft);
        toast.success("Goal updated");
      } else {
        await addGoal(draft);
        toast.success("Goal created");
      }
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit goal" : "New savings goal"}</DialogTitle>
        <DialogDescription>Set a target, a date, and track your progress.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="goal-name" className="text-xs font-medium text-muted-foreground">
            Goal name
          </Label>
          <Input
            id="goal-name"
            autoFocus
            maxLength={60}
            placeholder="e.g. Emergency fund"
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="text-xs text-expense">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="goal-target" className="text-xs font-medium text-muted-foreground">
              Target amount
            </Label>
            <Input
              id="goal-target"
              inputMode="decimal"
              placeholder="0.00"
              value={form.targetAmount}
              onChange={(event) => patch({ targetAmount: event.target.value })}
              aria-invalid={Boolean(errors.targetAmount)}
              className="tabular"
            />
            {errors.targetAmount && <p className="text-xs text-expense">{errors.targetAmount}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="goal-saved" className="text-xs font-medium text-muted-foreground">
              Already saved
            </Label>
            <Input
              id="goal-saved"
              inputMode="decimal"
              placeholder="0"
              value={form.savedAmount}
              onChange={(event) => patch({ savedAmount: event.target.value })}
              aria-invalid={Boolean(errors.savedAmount)}
              className="tabular"
            />
            {errors.savedAmount && <p className="text-xs text-expense">{errors.savedAmount}</p>}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="goal-date" className="text-xs font-medium text-muted-foreground">
            Target date <span className="font-normal text-muted-foreground/70">(optional)</span>
          </Label>
          <Input
            id="goal-date"
            type="date"
            min={todayISO()}
            value={form.targetDate}
            onChange={(event) => patch({ targetDate: event.target.value })}
            aria-invalid={Boolean(errors.targetDate)}
          />
          {errors.targetDate && <p className="text-xs text-expense">{errors.targetDate}</p>}
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Accent</span>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Goal accent">
            {GOAL_COLORS.map((option) => {
              const active = form.color === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={option.label}
                  onClick={() => patch({ color: option.id })}
                  className={cn(
                    "size-6 rounded-full transition-transform duration-200 hover:scale-110",
                    goalColorClasses(option.id).bar,
                    active && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  )}
                />
              );
            })}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="goal-note" className="text-xs font-medium text-muted-foreground">
            Note
          </Label>
          <Textarea
            id="goal-note"
            rows={2}
            maxLength={160}
            placeholder="Why does this goal matter?"
            value={form.note}
            onChange={(event) => patch({ note: event.target.value })}
          />
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
