"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Route-level error boundary. Next 16 passes `retry`; older typings use
 * `reset`, so both are accepted to keep this resilient.
 */
export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const attempt = retry ?? reset;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-16">
      <Card className="gap-4">
        <span className="grid size-9 place-items-center rounded-lg bg-expense/10 text-expense">
          <TriangleAlert className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-base font-medium">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error interrupted this view."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {attempt && (
            <Button onClick={attempt}>
              <RotateCcw />
              Try again
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
        {error.digest && <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
      </Card>
    </div>
  );
}
