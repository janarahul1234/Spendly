"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/services/supabase/contexts/auth-provider";
import { useData } from "@/services/supabase/contexts/data-provider";
import { exportBackupJson, exportTransactionsCsv } from "@/services/supabase/utils/export";
import { sortNewestFirst } from "@/services/supabase/utils/analytics";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const { session, signOut } = useAuth();
  const { transactions, goals, budgets, settings, format } = useData();
  const router = useRouter();

  // Prefer the editable profile name so renaming in Settings is reflected in the
  // header straight away; fall back to the identity from the auth provider.
  const name = settings.displayName || session?.name || "Guest";
  const email = session?.email || settings.email || "";

  const handleExportCsv = () => {
    const count = exportTransactionsCsv(sortNewestFirst(transactions), { format });
    toast.success(`Exported ${count} transactions`, { description: "CSV saved to your downloads." });
  };

  const handleExportBackup = () => {
    exportBackupJson({
      exportedAt: new Date().toISOString(),
      settings,
      transactions,
      goals,
      budgets,
    });
    toast.success("Backup downloaded", { description: "A JSON snapshot of your workspace." });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Could not sign out", { description: "Try again or refresh the page." });
      return;
    }
    router.replace("/signin");
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
              <Avatar className="size-7">
                {session?.avatarUrl ? <AvatarImage src={session.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-muted text-[0.7rem] font-semibold">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Account</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile#settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleExportCsv}>
          <Download className="size-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleExportBackup}>
          <Download className="size-4" />
          Export backup (JSON)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
