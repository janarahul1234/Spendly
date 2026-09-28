"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { TransactionFormDialog } from "@/components/dashboard/transactions/transaction-form-dialog";
import { cn } from "@/lib/utils";

/** `+ Add Transaction` — the same trigger is used in the header and on pages. */
export function AddTransactionButton({
  className,
  fullWidth,
  label = "Add Transaction",
  variant = "default",
  size = "default",
}: {
  className?: string;
  fullWidth?: boolean;
  label?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={cn(fullWidth && "w-full", className)}
      >
        <Plus />
        {label}
      </Button>
      <TransactionFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
