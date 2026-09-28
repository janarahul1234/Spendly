"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS, CATEGORY_GROUPS, categoriesForType, getCategory } from "@/lib/categories";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useData } from "@/providers/data-provider";
import type { PaymentMethod, Transaction, TransactionDraft, TransactionType } from "@/lib/types";

interface FormState {
  type: TransactionType;
  amount: string;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  note: string;
}

const BLANK: FormState = {
  type: "expense",
  amount: "",
  category: "groceries",
  date: todayISO(),
  paymentMethod: "debit_card",
  note: "",
};

function fromTransaction(transaction: Transaction): FormState {
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    category: transaction.category,
    date: transaction.date,
    paymentMethod: transaction.paymentMethod,
    note: transaction.note,
  };
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  const amount = Number(form.amount.replace(",", "."));

  if (!form.amount.trim()) errors.amount = "Enter an amount";
  else if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Amount must be greater than 0";
  else if (amount > 1_000_000_000) errors.amount = "That looks too large";

  if (!form.category) errors.category = "Pick a category";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.date = "Pick a date";

  return errors;
}

/**
 * Create or edit a transaction. The form lives in a child that only mounts
 * while the dialog is open, so every open starts from a clean slate.
 */
export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a transaction to edit it, omit to create one. */
  transaction?: Transaction | null;
  defaultDate?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <TransactionForm
            transaction={transaction}
            defaultDate={defaultDate}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  transaction,
  defaultDate,
  onClose,
}: {
  transaction?: Transaction | null;
  defaultDate?: string;
  onClose: () => void;
}) {
  const { addTransaction, updateTransaction } = useData();
  const [form, setForm] = useState<FormState>(() =>
    transaction ? fromTransaction(transaction) : { ...BLANK, date: defaultDate ?? todayISO() },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [pending, setPending] = useState(false);

  const isEdit = Boolean(transaction);
  const options = useMemo(() => categoriesForType(form.type), [form.type]);

  /** Editing a field clears that field's error so feedback never goes stale. */
  const patch = (next: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...next }));
    setErrors((prev) => {
      const touched = Object.keys(next) as (keyof FormState)[];
      if (!touched.some((key) => prev[key])) return prev;
      const cleared = { ...prev };
      for (const key of touched) delete cleared[key];
      return cleared;
    });
  };

  const changeType = (type: TransactionType) => {
    const allowed = categoriesForType(type).map((category) => category.id);
    patch({ type, category: allowed.includes(form.category) ? form.category : allowed[0] });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const draft: TransactionDraft = {
      type: form.type,
      amount: Math.round(Number(form.amount.replace(",", ".")) * 100) / 100,
      category: form.category,
      date: form.date,
      paymentMethod: form.paymentMethod,
      note: form.note.trim(),
    };

    setPending(true);
    try {
      if (transaction) {
        await updateTransaction(transaction.id, draft);
        toast.success("Transaction updated");
      } else {
        await addTransaction(draft);
        toast.success(
          `${draft.type === "income" ? "Income" : "Expense"} · ${getCategory(draft.category).label} added`,
        );
      }
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the details of this record."
            : "Log what you spent or earned in a few seconds."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["expense", "income"] as const).map((type) => {
            const active = form.type === type;
            const Icon = type === "expense" ? ArrowDownRight : ArrowUpRight;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeType(type)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm capitalize transition-all duration-200",
                  active ? "bg-card font-medium shadow-soft" : "text-muted-foreground hover:text-foreground",
                  active && type === "income" && "text-income",
                  active && type === "expense" && "text-expense",
                )}
              >
                <Icon className="size-3.5" />
                {type}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="amount" label="Amount" error={errors.amount}>
            <Input
              id="amount"
              autoFocus
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) => patch({ amount: event.target.value })}
              aria-invalid={Boolean(errors.amount)}
              className="tabular"
            />
          </Field>

          <Field id="date" label="Date" error={errors.date}>
            <Input
              id="date"
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(event) => patch({ date: event.target.value })}
              aria-invalid={Boolean(errors.date)}
            />
          </Field>

          <Field id="category" label="Category" error={errors.category}>
            <Select value={form.category} onValueChange={(value) => patch({ category: value })}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CATEGORY_GROUPS.map((group) => {
                  const items = options.filter((option) => option.group === group);
                  if (items.length === 0) return null;
                  return (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {items.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <span aria-hidden className="mr-1.5">
                            {option.emoji}
                          </span>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field id="payment" label="Payment method">
            <Select
              value={form.paymentMethod}
              onValueChange={(value) => patch({ paymentMethod: value as PaymentMethod })}
            >
              <SelectTrigger id="payment" className="w-full">
                <SelectValue placeholder="Choose a method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <span aria-hidden className="mr-1.5">
                      {method.emoji}
                    </span>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field id="note" label="Note" hint="Shown in your transaction list">
          <Input
            id="note"
            maxLength={120}
            placeholder={form.type === "expense" ? "e.g. Weekly groceries" : "e.g. October salary"}
            value={form.note}
            onChange={(event) => patch({ note: event.target.value })}
          />
        </Field>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? "Save changes" : "Add transaction"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-expense">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground/80">{hint}</p>
      ) : null}
    </div>
  );
}
