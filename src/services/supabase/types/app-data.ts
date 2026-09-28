/**
 * Aggregate of everything the data layer loads for one user in a single
 * round-trip (see `DataPersistence.load` in `services/supabase/data/persistence.ts`).
 */

import type { Budget } from "./budget";
import type { AppNotification } from "./notification";
import type { Settings } from "./settings";
import type { Goal } from "./goal";
import type { Transaction } from "./transaction";

export interface AppData {
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  notifications: AppNotification[];
  settings: Settings;
}
