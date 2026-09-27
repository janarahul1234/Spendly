"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading / empty / error views so every screen behaves the same. */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function ErrorState({
  message,
  onRetry,
  title = "We could not load your data",
}: {
  message?: string | null;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <Card className="flex flex-col items-start gap-3 p-5">
      <span className="grid size-8 place-items-center rounded-lg bg-expense/10 text-expense">
        <AlertTriangle className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {message ?? "Check your connection or try again in a moment."}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Try again
        </Button>
      )}
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-52" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
