"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Change theme">
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Theme</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-40">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)}>
            <option.icon className="size-4" />
            {option.label}
            <span
              className={cn(
                "ml-auto size-1.5 rounded-full bg-foreground",
                theme === option.value ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
