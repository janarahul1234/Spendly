import type { Settings } from "@/services/supabase/types/settings";
import { DEFAULT_SETTINGS } from "@/services/supabase/data/sample";
import { requireClient, type Row } from "./helpers";

/**
 * `profiles` table: the per-user settings row. Reading is intentionally
 * lenient — a missing or unreadable profile falls back to defaults instead
 * of failing the whole dashboard load.
 */

export const profileToSettings = (row: Row | null): Settings => {
  const profile = row ?? {};
  return {
    ...DEFAULT_SETTINGS,
    displayName: String(profile.display_name ?? DEFAULT_SETTINGS.displayName),
    email: String(profile.email ?? DEFAULT_SETTINGS.email),
    currency: (profile.currency ?? DEFAULT_SETTINGS.currency) as Settings["currency"],
    locale: String(profile.locale ?? DEFAULT_SETTINGS.locale),
    weekStartsOn: (profile.week_starts_on ?? DEFAULT_SETTINGS.weekStartsOn) as Settings["weekStartsOn"],
    reminders: { ...DEFAULT_SETTINGS.reminders, ...(profile.reminders as object ?? {}) },
  };
};

export const settingsToProfile = (userId: string, settings: Settings): Row => ({
  id: userId,
  display_name: settings.displayName,
  email: settings.email,
  currency: settings.currency,
  locale: settings.locale,
  week_starts_on: settings.weekStartsOn,
  reminders: settings.reminders,
});

export async function fetchSettings(userId: string): Promise<Settings> {
  const { data } = await requireClient().from("profiles").select("*").eq("id", userId).maybeSingle();
  return profileToSettings((data ?? {}) as Row);
}

/** Upsert the profile row. Errors are surfaced by the caller's `.catch`. */
export async function saveSettings(userId: string, settings: Settings): Promise<void> {
  const { error } = await requireClient().from("profiles").upsert(settingsToProfile(userId, settings));
  if (error) throw new Error(`Could not save settings — ${error.message}`);
}
