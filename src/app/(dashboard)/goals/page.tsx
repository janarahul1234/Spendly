"use client";

import { useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardSkeleton, EmptyState, ErrorState } from "@/components/app/state-views";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { formatCurrency, round2 } from "@/lib/format";
import { useData } from "@/providers/data-provider";

export default function GoalsPage() {
  const { status, error, reload, goals, format } = useData();
  const [creating, setCreating] = useState(false);

  const summary = useMemo(() => {
    const target = round2(goals.reduce((sum, goal) => sum + goal.targetAmount, 0));
    const saved = round2(goals.reduce((sum, goal) => sum + Math.min(goal.savedAmount, goal.targetAmount), 0));
    const completed = goals.filter((goal) => goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0).length;
    return {
      target,
      saved,
      completed,
      percent: target > 0 ? round2((saved / target) * 100) : 0,
    };
  }, [goals]);

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "error") return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">
            {goals.length === 0
              ? "Set a target and watch it fill up."
              : `${goals.length} goal${goals.length === 1 ? "" : "s"} · ${summary.completed} completed`}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus />
          New goal
        </Button>
      </div>

      {goals.length > 0 && (
        <Card className="gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted-foreground">Total saved across all goals</p>
            <p className="tabular text-2xl font-semibold tracking-tight">
              {formatCurrency(summary.saved, format)}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                / {formatCurrency(summary.target, format)}
              </span>
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-goal transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(100, summary.percent)}%` }}
            />
          </div>
          <p className="tabular text-xs text-muted-foreground">{summary.percent}% funded</p>
        </Card>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="size-4" />}
          title="No savings goals yet"
          description="Emergency fund, a trip, a new laptop — give yourself something to save for."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              Create your first goal
            </Button>
          }
          className="border-0 py-16"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <GoalFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
