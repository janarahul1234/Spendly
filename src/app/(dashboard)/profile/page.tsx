"use client";

import { useState } from "react";
import { Check, Database, Download, LogOut, RotateCcw, Trash } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DashboardSkeleton, ErrorState } from "@/components/dashboard/state-views";
import { CURRENCIES } from "@/services/supabase/utils/format";
import { exportBackupJson, exportTransactionsCsv } from "@/services/supabase/utils/export";
import { sortNewestFirst } from "@/services/supabase/utils/analytics";
import { useAuth } from "@/services/supabase/contexts/auth-provider";
import { useData } from "@/services/supabase/contexts/data-provider";
import type { CurrencyCode } from "@/services/supabase/types/settings";

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-SG", label: "English (Singapore)" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "id-ID", label: "Indonesian" },
  { value: "ja-JP", label: "Japanese" },
];

/**
 * Guarantees the currently stored locale is always selectable. Choosing a
 * currency can set a locale that is not in the curated list, which would
 * otherwise render the select blank. Labels stay in English because that is the
 * language of the surrounding UI.
 */
function localeOptionsFor(locale: string) {
  if (LOCALES.some((entry) => entry.value === locale)) return LOCALES;
  let label = locale;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(locale.split("-")[0]);
    if (name && name.toLowerCase() !== locale.split("-")[0].toLowerCase()) {
      label = `${name} (${locale})`;
    }
  } catch {
    // Fall back to the raw tag if the runtime cannot describe it.
  }
  return [{ value: locale, label }, ...LOCALES];
}

export default function ProfilePage() {
  const { session, signOut } = useAuth();
  const {
    status,
    error,
    reload,
    settings,
    updateSettings,
    transactions,
    goals,
    budgets,
    format,
    loadSampleData,
    clearAllData,
  } = useData();

  const [name, setName] = useState<string | null>(null);

  if (status === "loading") return <DashboardSkeleton />;
  if (status === "error") return <ErrorState message={error} onRetry={reload} />;

  const displayName = name ?? settings.displayName ?? session?.name ?? "You";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const saveName = () => {
    if (name === null) return;
    updateSettings({ displayName: name.trim() || "You" });
    setName(null);
    toast.success("Profile updated");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Account, preferences and your data.</p>
      </div>

      <Card className="gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-12">
            {session?.avatarUrl ? <AvatarImage src={session.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-muted text-sm font-semibold">{initials || "S"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.email ?? settings.email ?? "No email on file"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-income/10 px-2.5 py-1 text-xs font-medium text-income">
            <Check className="size-3" />
            Google account
          </span>
          <Button variant="outline" size="sm" onClick={() => void signOut().catch(() => toast.error("Could not sign out"))}>
            <LogOut />
            Sign out
          </Button>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-name" className="text-xs font-medium text-muted-foreground">
              Display name
            </Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
              />
              <Button variant="outline" onClick={saveName} disabled={name === null}>
                Save
              </Button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="currency" className="text-xs font-medium text-muted-foreground">
              Currency
            </Label>
            <Select
              value={settings.currency}
              onValueChange={(value) =>
                updateSettings({
                  currency: value as CurrencyCode,
                  // Amount formatting follows the currency's home region; the
                  // "Language & region" control below can override it again.
                  locale: CURRENCIES.find((entry) => entry.code === value)?.locale ?? settings.locale,
                })
              }
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} — {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground/80">
              Picking a currency also switches number formatting to that region.
            </p>
          </div>
        </div>
      </Card>

      <section id="settings" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>

        <Card className="gap-4">
          <CardHeader className="gap-1">
            <CardTitle>Formatting</CardTitle>
            <CardDescription>Controls how amounts and dates appear across the app.</CardDescription>
          </CardHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="locale" className="text-xs font-medium text-muted-foreground">
                Language & region
              </Label>
              <Select
                value={settings.locale}
                onValueChange={(value) => updateSettings({ locale: value })}
              >
                <SelectTrigger id="locale" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localeOptionsFor(settings.locale).map((locale) => (
                    <SelectItem key={locale.value} value={locale.value}>
                      {locale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="week-start" className="text-xs font-medium text-muted-foreground">
                Week starts on
              </Label>
              <Select
                value={String(settings.weekStartsOn)}
                onValueChange={(value) => updateSettings({ weekStartsOn: Number(value) as 0 | 1 })}
              >
                <SelectTrigger id="week-start" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Notifications & reminders</p>
            <ToggleRow
              label="Daily logging reminder"
              description="A nudge in the notification tray when nothing was logged today."
              checked={settings.reminders.dailyLogging}
              onChange={(checked) => updateSettings({ reminders: { ...settings.reminders, dailyLogging: checked } })}
            />
            <ToggleRow
              label="Budget alerts"
              description="Warn when a category passes 100% of its monthly budget."
              checked={settings.reminders.budgetAlerts}
              onChange={(checked) => updateSettings({ reminders: { ...settings.reminders, budgetAlerts: checked } })}
            />
            <ToggleRow
              label="Goal updates"
              description="Celebrate milestones and flag overdue goals."
              checked={settings.reminders.goalUpdates}
              onChange={(checked) => updateSettings({ reminders: { ...settings.reminders, goalUpdates: checked } })}
            />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Data</h2>
        <Card className="gap-4">
          <CardHeader className="gap-1">
            <CardTitle>Export & reset</CardTitle>
            <CardDescription>
              {transactions.length} transactions · {goals.length} goals · {budgets.length} budgets. Stored in your
              Supabase database.
            </CardDescription>
          </CardHeader>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const count = exportTransactionsCsv(sortNewestFirst(transactions), { format });
                toast.success(`Exported ${count} transactions`);
              }}
            >
              <Download />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportBackupJson({
                  exportedAt: new Date().toISOString(),
                  settings,
                  transactions,
                  goals,
                  budgets,
                });
                toast.success("Backup downloaded");
              }}
            >
              <Database />
              Download backup
            </Button>
            <Button variant="outline" size="sm" onClick={() => void loadSampleData()}>
              <RotateCcw />
              Restore sample data
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash />
                  Clear all data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete every record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Transactions, goals and budgets will be removed from this workspace. Export a backup first if
                    you might want them back.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-expense text-white hover:bg-expense/90"
                    onClick={() => void clearAllData()}
                  >
                    Delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  const inputId = id ?? `toggle-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={inputId} className="cursor-pointer text-sm font-normal">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={inputId} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
