import type { PaymentMethod } from "@/lib/types";

export interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
  /** Tailwind-friendly accent used for charts and pills. */
  accent: AccentToken;
  group: CategoryGroup;
  kind: "expense" | "income" | "both";
}

export type CategoryGroup = "Home" | "Lifestyle" | "Transport" | "Health" | "Income" | "Other";

/** The restrained accents from the design brief. */
export type AccentToken = "green" | "red" | "yellow" | "purple" | "blue" | "gray";

export const CATEGORIES: CategoryDef[] = [
  // Home
  { id: "rent", label: "Rent", emoji: "🏠", accent: "purple", group: "Home", kind: "expense" },
  { id: "groceries", label: "Groceries", emoji: "🛒", accent: "green", group: "Home", kind: "expense" },
  { id: "utilities", label: "Utilities", emoji: "💡", accent: "blue", group: "Home", kind: "expense" },
  { id: "internet", label: "Internet", emoji: "📶", accent: "gray", group: "Home", kind: "expense" },
  { id: "insurance", label: "Insurance", emoji: "🛡️", accent: "red", group: "Home", kind: "expense" },

  // Lifestyle
  { id: "streaming", label: "Streaming", emoji: "📺", accent: "purple", group: "Lifestyle", kind: "expense" },
  { id: "restaurant", label: "Restaurant", emoji: "🍜", accent: "yellow", group: "Lifestyle", kind: "expense" },
  { id: "coffee", label: "Coffee", emoji: "☕", accent: "red", group: "Lifestyle", kind: "expense" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", accent: "green", group: "Lifestyle", kind: "expense" },
  { id: "travel", label: "Travel", emoji: "🧳", accent: "blue", group: "Lifestyle", kind: "expense" },

  // Transport
  { id: "car", label: "Car", emoji: "🚗", accent: "red", group: "Transport", kind: "expense" },
  { id: "fuel", label: "Fuel", emoji: "⛽", accent: "yellow", group: "Transport", kind: "expense" },
  { id: "transport", label: "Public transport", emoji: "🚇", accent: "purple", group: "Transport", kind: "expense" },

  // Health
  { id: "fitness", label: "Fitness", emoji: "🏋️", accent: "green", group: "Health", kind: "expense" },
  { id: "medical", label: "Medical", emoji: "💊", accent: "blue", group: "Health", kind: "expense" },

  // Income
  { id: "salary", label: "Salary", emoji: "💼", accent: "green", group: "Income", kind: "income" },
  { id: "freelance", label: "Freelance", emoji: "🧑‍💻", accent: "purple", group: "Income", kind: "income" },
  { id: "investment", label: "Investment", emoji: "📈", accent: "blue", group: "Income", kind: "income" },
  { id: "gift", label: "Gift", emoji: "🎁", accent: "yellow", group: "Income", kind: "income" },

  // Other
  { id: "education", label: "Education", emoji: "📚", accent: "purple", group: "Other", kind: "expense" },
  { id: "subscriptions", label: "Subscriptions", emoji: "🔔", accent: "gray", group: "Other", kind: "expense" },
  { id: "other", label: "Other", emoji: "🔖", accent: "gray", group: "Other", kind: "both" },
];

const CATEGORY_MAP = new Map(CATEGORIES.map((category) => [category.id, category]));

const FALLBACK: CategoryDef = {
  id: "other",
  label: "Other",
  emoji: "🔖",
  accent: "gray",
  group: "Other",
  kind: "both",
};

export function getCategory(id: string): CategoryDef {
  return CATEGORY_MAP.get(id) ?? { ...FALLBACK, label: id || FALLBACK.label };
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  "Home",
  "Lifestyle",
  "Transport",
  "Health",
  "Income",
  "Other",
];

export function categoriesForType(kind: "income" | "expense"): CategoryDef[] {
  return CATEGORIES.filter((category) => category.kind === kind || category.kind === "both");
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; emoji: string }[] = [
  { id: "debit_card", label: "Debit card", emoji: "💳" },
  { id: "credit_card", label: "Credit card", emoji: "🏦" },
  { id: "bank_transfer", label: "Bank transfer", emoji: "🏧" },
  { id: "cash", label: "Cash", emoji: "💵" },
  { id: "paypal", label: "PayPal", emoji: "🅿️" },
  { id: "upi", label: "UPI", emoji: "📱" },
];

export function getPaymentMethod(id: PaymentMethod) {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? PAYMENT_METHODS[0];
}

/**
 * Chart palette. Hex values keep recharts happy (it cannot read oklch vars
 * reliably across all browsers). These mirror the `--income`, `--expense`,
 * `--savings` and `--goal` tokens in globals.css; regenerate with
 * `node scripts/contrast.mjs` if the tokens change.
 */
export const ACCENT_HEX: Record<string, string> = {
  green: "#067d4d",
  red: "#c52b30",
  yellow: "#986603",
  purple: "#5d4dbe",
  blue: "#006aa0",
  gray: "#706b63",
};

export function accentHex(accent: string): string {
  return ACCENT_HEX[accent] ?? ACCENT_HEX.gray;
}
