"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SiteLogo } from "@/components/app/site-logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { AddTransactionButton } from "@/components/expense/add-transaction-button";
import { isActivePath, NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg py-1 pr-2 transition-colors duration-200 hover:opacity-80"
        >
          <SiteLogo />
          <span className="hidden text-[0.95rem] font-semibold tracking-tight sm:inline">Spendly</span>
          <span className="sr-only">Spendly home</span>
        </Link>

        <nav aria-label="Primary" className="mx-auto hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors duration-200",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <AddTransactionButton className="mr-1 hidden sm:inline-flex" />
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(88vw,20rem)] gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <SiteLogo />
            Spendly
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-200",
                  active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <item.icon className="mt-0.5 size-4 text-muted-foreground" />
                <span className="min-w-0">
                  <span className={cn("block text-sm", active ? "font-medium" : "font-normal")}>
                    {item.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-4">
          <AddTransactionButton fullWidth className="sm:hidden" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
