"use client";

import { Bell, Check, Trash } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useData } from "@/providers/data-provider";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

const TONE_DOT: Record<AppNotification["tone"], string> = {
  info: "bg-goal",
  success: "bg-income",
  warning: "bg-savings",
  danger: "bg-expense",
};

export function NotificationBell() {
  const { notifications, markAllNotificationsRead, markNotificationRead, deleteNotification } = useData();
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-expense ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,22rem)] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="xs" onClick={markAllNotificationsRead}>
              <Check />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Empty className="border-0 px-4 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bell className="size-4" />
              </EmptyMedia>
              <EmptyTitle>You are all caught up</EmptyTitle>
              <EmptyDescription>Budget alerts and goal reminders show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "group flex gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/60",
                    item.read && "opacity-60",
                  )}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE_DOT[item.tone])} />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => markNotificationRead(item.id)}
                  >
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground/80">
                      {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete notification"
                    className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => deleteNotification(item.id)}
                  >
                    <Trash />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
