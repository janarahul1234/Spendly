import { createId } from "@/services/supabase/utils/id";
import { toISODate } from "@/services/supabase/utils/format";
import type { AppData } from "@/services/supabase/types/app-data";
import type { AppNotification } from "@/services/supabase/types/notification";
import type { Budget } from "@/services/supabase/types/budget";
import type { Goal } from "@/services/supabase/types/goal";
import type { PaymentMethod, Transaction, TransactionDraft } from "@/services/supabase/types/transaction";
import type { Settings } from "@/services/supabase/types/settings";

/**
 * Deterministic sample data so the dashboard, charts and budgets always look
 * realistic — even before a Supabase project is connected.
 */

/** mulberry32: tiny seeded PRNG, stable output for a given seed. */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Two full years of history keeps year-on-year comparisons meaningful.
const MONTHS_OF_HISTORY = 26;

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Alex Morgan",
  email: "alex.morgan@example.com",
  currency: "USD",
  locale: "en-US",
  weekStartsOn: 1,
  reminders: {
    dailyLogging: true,
    budgetAlerts: true,
    goalUpdates: true,
  },
};

type Spec = {
  category: string;
  type: "income" | "expense";
  notes: string[];
  count: [number, number];
  amount: [number, number];
  /** Fixed day of month when set, otherwise spread across the month. */
  fixedDay?: number;
  methods: PaymentMethod[];
};

const SPECS: Spec[] = [
  {
    category: "salary",
    type: "income",
    notes: ["Monthly salary"],
    count: [1, 1],
    amount: [4820, 4980],
    fixedDay: 25,
    methods: ["bank_transfer"],
  },
  {
    category: "freelance",
    type: "income",
    notes: ["Landing page project", "Design retainer", "Consulting call", "Logo refresh"],
    count: [0, 2],
    amount: [320, 1750],
    methods: ["paypal", "bank_transfer"],
  },
  {
    category: "investment",
    type: "income",
    notes: ["Dividend payout", "Interest", "Rental income"],
    count: [0, 1],
    amount: [60, 420],
    methods: ["bank_transfer"],
  },
  {
    category: "gift",
    type: "income",
    notes: ["Birthday gift", "Cashback reward"],
    count: [0, 1],
    amount: [40, 220],
    methods: ["cash"],
  },
  {
    category: "rent",
    type: "expense",
    notes: ["Apartment rent"],
    count: [1, 1],
    amount: [1420, 1420],
    fixedDay: 1,
    methods: ["bank_transfer"],
  },
  {
    category: "groceries",
    type: "expense",
    notes: ["Weekly groceries", "Farmers market", "Supermarket run", "Bulk shopping"],
    count: [3, 5],
    amount: [38, 164],
    methods: ["debit_card", "credit_card", "cash"],
  },
  {
    category: "restaurant",
    type: "expense",
    notes: ["Dinner with friends", "Sushi night", "Brunch", "Takeaway"],
    count: [3, 8],
    amount: [14, 92],
    methods: ["credit_card", "debit_card"],
  },
  {
    category: "coffee",
    type: "expense",
    notes: ["Flat white", "Espresso & croissant", "Cold brew"],
    count: [5, 12],
    amount: [3.2, 9.4],
    methods: ["debit_card", "upi"],
  },
  {
    category: "streaming",
    type: "expense",
    notes: ["Netflix", "Spotify", "Disney+", "YouTube Premium"],
    count: [2, 3],
    amount: [5.99, 17.99],
    fixedDay: 8,
    methods: ["credit_card"],
  },
  {
    category: "utilities",
    type: "expense",
    notes: ["Electricity bill", "Water bill", "Gas bill"],
    count: [2, 3],
    amount: [42, 148],
    fixedDay: 15,
    methods: ["bank_transfer", "credit_card"],
  },
  {
    category: "internet",
    type: "expense",
    notes: ["Fibre broadband"],
    count: [1, 1],
    amount: [49.99, 49.99],
    fixedDay: 12,
    methods: ["credit_card"],
  },
  {
    category: "insurance",
    type: "expense",
    notes: ["Health insurance", "Contents insurance"],
    count: [1, 1],
    amount: [88, 96],
    fixedDay: 10,
    methods: ["bank_transfer"],
  },
  {
    category: "car",
    type: "expense",
    notes: ["Car payment", "Servicing", "Parking permit"],
    count: [1, 2],
    amount: [120, 340],
    fixedDay: 5,
    methods: ["credit_card", "debit_card"],
  },
  {
    category: "fuel",
    type: "expense",
    notes: ["Fill up", "Diesel", "Charge card"],
    count: [2, 4],
    amount: [34, 88],
    methods: ["credit_card", "cash"],
  },
  {
    category: "transport",
    type: "expense",
    notes: ["Metro card top-up", "Bus pass", "Rideshare"],
    count: [1, 4],
    amount: [8, 62],
    methods: ["debit_card", "upi"],
  },
  {
    category: "shopping",
    type: "expense",
    notes: ["New sneakers", "Winter jacket", "Desk lamp", "Headphones", "Books"],
    count: [1, 5],
    amount: [18, 245],
    methods: ["credit_card", "debit_card"],
  },
  {
    category: "travel",
    type: "expense",
    notes: ["Flight to Lisbon", "Hotel weekend", "Train tickets", "Airbnb stay"],
    count: [0, 2],
    amount: [120, 980],
    methods: ["credit_card"],
  },
  {
    category: "fitness",
    type: "expense",
    notes: ["Gym membership", "Yoga classes"],
    count: [1, 2],
    amount: [29, 68],
    fixedDay: 3,
    methods: ["credit_card", "debit_card"],
  },
  {
    category: "medical",
    type: "expense",
    notes: ["Pharmacy", "Dentist check-up", "Doctor visit"],
    count: [0, 2],
    amount: [16, 210],
    methods: ["debit_card", "cash"],
  },
  {
    category: "education",
    type: "expense",
    notes: ["Online course", "UX research workshop", "Technical book"],
    count: [0, 2],
    amount: [19, 180],
    methods: ["credit_card"],
  },
  {
    category: "subscriptions",
    type: "expense",
    notes: ["iCloud storage", "Figma", "News subscription"],
    count: [1, 2],
    amount: [9.99, 24],
    fixedDay: 20,
    methods: ["credit_card"],
  },
];

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function lastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Builds the transaction list for the trailing `MONTHS_OF_HISTORY` months. */
export function createSampleTransactions(): Transaction[] {
  const random = createRandom(20260927);
  const transactions: Transaction[] = [];
  const now = new Date();

  for (let offset = MONTHS_OF_HISTORY - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const isCurrentMonth = offset === 0;
    const daysInMonth = lastDayOfMonth(cursor);
    // Older months get a gentle raise so year-on-year comparisons move.
    const growth = 1 + (MONTHS_OF_HISTORY - 1 - offset) * 0.004;

    for (const spec of SPECS) {
      const [minCount, maxCount] = spec.count;
      const count = Math.round(between(random, minCount, maxCount));
      if (count === 0) continue;

      for (let index = 0; index < count; index += 1) {
        const day =
          spec.fixedDay !== undefined
            ? Math.min(spec.fixedDay + index, daysInMonth)
            : Math.max(1, Math.round(between(random, 1, daysInMonth)));
        const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
        if (isCurrentMonth && date.getTime() > now.getTime()) continue;

        const [low, high] = spec.amount;
        const jitter = low === high ? 1 : between(random, 0.85, 1.15);
        const raw = low === high ? low * growth : between(random, low, high) * growth * jitter;

        const draft: TransactionDraft = {
          category: spec.category,
          type: spec.type,
          amount: Math.round(raw * 100) / 100,
          date: toISODate(date),
          paymentMethod: pick(random, spec.methods),
          note: pick(random, spec.notes),
        };
        transactions.push({ ...draft, id: createId("tx"), createdAt: date.toISOString() });
      }
    }
  }

  return transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function createSampleGoals(): Goal[] {
  const now = new Date();
  const inMonths = (months: number, day = 12) =>
    toISODate(new Date(now.getFullYear(), now.getMonth() + months, day));

  return [
    {
      id: createId("goal"),
      name: "Emergency fund",
      targetAmount: 15000,
      savedAmount: 9400,
      targetDate: inMonths(8),
      color: "green",
      note: "Six months of essential expenses.",
      createdAt: new Date(now.getFullYear() - 1, 2, 4).toISOString(),
    },
    {
      id: createId("goal"),
      name: "Japan trip",
      targetAmount: 6500,
      savedAmount: 2150,
      targetDate: inMonths(11),
      color: "purple",
      note: "Flights, ryokan and a lot of ramen.",
      createdAt: new Date(now.getFullYear(), 0, 18).toISOString(),
    },
    {
      id: createId("goal"),
      name: "New laptop",
      targetAmount: 2400,
      savedAmount: 2400,
      targetDate: inMonths(2),
      color: "yellow",
      note: "14-inch machine for design work.",
      createdAt: new Date(now.getFullYear(), 3, 2).toISOString(),
    },
    {
      id: createId("goal"),
      name: "Wedding gift",
      targetAmount: 1200,
      savedAmount: 380,
      targetDate: inMonths(-1),
      color: "red",
      note: "Overdue — top up this month.",
      createdAt: new Date(now.getFullYear(), 4, 9).toISOString(),
    },
  ];
}

export function createSampleBudgets(): Budget[] {
  return [
    { id: createId("bud"), category: "overall", amount: 3600 },
    { id: createId("bud"), category: "groceries", amount: 520 },
    { id: createId("bud"), category: "restaurant", amount: 300 },
    { id: createId("bud"), category: "coffee", amount: 70 },
    { id: createId("bud"), category: "shopping", amount: 260 },
    { id: createId("bud"), category: "transport", amount: 240 },
    { id: createId("bud"), category: "utilities", amount: 320 },
    { id: createId("bud"), category: "subscriptions", amount: 60 },
  ];
}

export function createSampleNotifications(): AppNotification[] {
  const now = Date.now();
  const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();

  // Only informational items live here. Budget and goal alerts are derived from
  // the data on load (see `services/supabase/data/reminders.ts`), so seeding them would duplicate.
  return [
    {
      id: createId("ntf"),
      title: "Salary received",
      body: "Your monthly salary was added to this month's income.",
      tone: "success",
      read: false,
      createdAt: hoursAgo(20),
    },
    {
      id: createId("ntf"),
      title: "Weekly summary",
      body: "Dining out was your fastest-growing category this week.",
      tone: "info",
      read: false,
      createdAt: hoursAgo(52),
    },
    {
      id: createId("ntf"),
      title: "Time for a backup",
      body: "Export a CSV from Profile → Data at the end of every month.",
      tone: "info",
      read: true,
      createdAt: hoursAgo(124),
    },
  ];
}

export function createSampleData(): AppData {
  return {
    transactions: createSampleTransactions(),
    goals: createSampleGoals(),
    budgets: createSampleBudgets(),
    notifications: createSampleNotifications(),
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Empty workspace used when a user signs in without any stored data. */
export function createEmptyData(settings: Settings): AppData {
  return { transactions: [], goals: [], budgets: [], notifications: [], settings };
}
