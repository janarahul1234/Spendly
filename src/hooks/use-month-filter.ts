"use client";

import { useCallback, useMemo, useState } from "react";
import { addMonthsToKey, currentMonthKey } from "@/services/supabase/utils/format";

/**
 * Selected month, shared across screens for the whole SPA session.
 * Module scope (not localStorage) keeps the first render identical on the
 * server and the client, so there is nothing to re-sync after hydration.
 */
let sharedMonthKey: string | null = null;

export function useMonthFilter() {
  const [monthKey, setMonth] = useState(() => sharedMonthKey ?? currentMonthKey());

  const update = useCallback((next: string) => {
    sharedMonthKey = next;
    setMonth(next);
  }, []);

  const shift = useCallback(
    (amount: number) => update(addMonthsToKey(monthKey, amount)),
    [monthKey, update],
  );

  const isCurrentMonth = monthKey === currentMonthKey();

  return useMemo(
    () => ({
      monthKey,
      setMonthKey: update,
      goPreviousMonth: () => shift(-1),
      goNextMonth: () => shift(1),
      canGoNext: !isCurrentMonth,
      isCurrentMonth,
      resetToCurrentMonth: () => update(currentMonthKey()),
    }),
    [monthKey, update, shift, isCurrentMonth],
  );
}
