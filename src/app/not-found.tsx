import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-24">
      <Card className="gap-3">
        <p className="tabular text-xs font-medium text-muted-foreground">404</p>
        <h1 className="font-heading text-lg font-medium">This page does not exist</h1>
        <p className="text-sm text-muted-foreground">
          The link may be outdated, or the page was moved.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/transactions">View transactions</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
