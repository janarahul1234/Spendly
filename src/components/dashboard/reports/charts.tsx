"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { accentHex } from "@/services/supabase/data/categories";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/services/supabase/utils/format";
import type { FormatOptions } from "@/services/supabase/utils/format";
import type { CategorySlice, SavingsPoint, TrendPoint } from "@/services/supabase/utils/analytics";

/**
 * Recharts wrappers tuned for the light/dark tokens. Colours are resolved in
 * JS because SVG presentation attributes cannot read CSS custom properties —
 * keep these hexes in sync with globals.css (see scripts/contrast.mjs).
 */

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return {
    grid: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    axis: dark ? "#a8a49c" : "#706b63",
    tooltipBg: dark ? "#232323" : "#ffffff",
    tooltipBorder: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    tooltipText: dark ? "#f2f2f2" : "#1a1a1a",
    income: dark ? "#4dc588" : "#067d4d",
    expense: dark ? "#fa706a" : "#c52b30",
    savings: dark ? "#e7b551" : "#986603",
    goal: dark ? "#9b8df5" : "#5d4dbe",
  };
}

function tooltipStyle(theme: ReturnType<typeof useChartTheme>) {
  return {
    contentStyle: {
      background: theme.tooltipBg,
      border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 12,
      fontSize: 12,
      padding: "6px 10px",
      boxShadow: "0 2px 12px -4px rgba(0,0,0,0.15)",
    },
    labelStyle: { color: theme.tooltipText, fontWeight: 500, marginBottom: 2 },
    itemStyle: { color: theme.tooltipText, padding: 0 },
  } as const;
}

/**
 * Recharts types tooltip values loosely, so every formatter goes through here
 * and coerces before formatting.
 */
function currencyTooltip(
  format: FormatOptions,
  rename?: (name: string) => string,
): (value: unknown, name: unknown) => [string, string] {
  return (value, name) => {
    const label = String(name ?? "");
    return [formatCurrency(Number(value ?? 0), format), rename ? rename(label) : label];
  };
}

interface FrameProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartCard({ title, description, action, children }: FrameProps) {
  return (
    <Card className="gap-3">
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const axisProps = (theme: ReturnType<typeof useChartTheme>) => ({
  tick: { fontSize: 11, fill: theme.axis },
  tickLine: false,
  axisLine: false,
});

export function IncomeVsExpenseChart({
  data,
  format,
}: {
  data: { label: string; income: number; expense: number }[];
  format: FormatOptions;
}) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis dataKey="label" {...axisProps(theme)} />
        <YAxis {...axisProps(theme)} tickFormatter={(value) => formatCompactCurrency(Number(value), format)} width={64} />
        <Tooltip
          cursor={{ fill: theme.grid }}
          {...tooltipStyle(theme)}
          formatter={currencyTooltip(format)}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: theme.axis }}
        />
        <Bar dataKey="income" name="Income" fill={theme.income} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expense" name="Expenses" fill={theme.expense} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SpendingTrendChart({
  data,
  format,
}: {
  data: TrendPoint[];
  format: FormatOptions;
}) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.expense} stopOpacity={0.28} />
            <stop offset="100%" stopColor={theme.expense} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis dataKey="label" {...axisProps(theme)} />
        <YAxis {...axisProps(theme)} tickFormatter={(value) => formatCompactCurrency(Number(value), format)} width={64} />
        <Tooltip
          cursor={{ stroke: theme.grid }}
          {...tooltipStyle(theme)}
          formatter={currencyTooltip(format, () => "Spent")}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke={theme.expense}
          strokeWidth={2}
          fill="url(#spendFill)"
          activeDot={{ r: 3.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SavingsTrendChart({
  data,
  format,
}: {
  data: (SavingsPoint & { label: string })[];
  format: FormatOptions;
}) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis dataKey="label" {...axisProps(theme)} />
        <YAxis {...axisProps(theme)} tickFormatter={(value) => formatCompactCurrency(Number(value), format)} width={64} />
        <Tooltip
          cursor={{ stroke: theme.grid }}
          {...tooltipStyle(theme)}
          formatter={currencyTooltip(format, (name) =>
            name === "cumulative" ? "Total saved" : "Saved this month",
          )}
        />
        <Line
          type="monotone"
          dataKey="saved"
          stroke={theme.savings}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3.5 }}
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke={theme.goal}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  slices,
  total,
  format,
}: {
  slices: CategorySlice[];
  total: number;
  format: FormatOptions;
}) {
  const theme = useChartTheme();
  const gradientId = useId();
  const top = slices.slice(0, 6);
  const rest = slices.slice(6);
  const data = rest.length
    ? [
        ...top,
        {
          id: "rest",
          label: "Everything else",
          emoji: "✨",
          color: accentHex("gray"),
          total: rest.reduce((sum, slice) => sum + slice.total, 0),
          share: rest.reduce((sum, slice) => sum + slice.share, 0),
          count: rest.reduce((sum, slice) => sum + slice.count, 0),
        },
      ]
    : top;

  if (total <= 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No data for this period yet.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-50 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              {...tooltipStyle(theme)}
              formatter={(value: unknown, _name: unknown, item: unknown) => {
                const payload = (item as { payload?: CategorySlice } | undefined)?.payload;
                const share = payload?.share;
                const amount = formatCurrency(Number(value ?? 0), format);
                return [share ? `${amount} · ${formatPercent(share)}` : amount, payload?.label ?? ""];
              }}
            />
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              strokeWidth={0}
              cornerRadius={4}
              animationDuration={500}
            >
              {data.map((slice) => (
                <Cell key={`${gradientId}-${slice.id}`} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[0.7rem] text-muted-foreground">Total spent</p>
            <p className="tabular text-lg font-semibold">{formatCompactCurrency(total, format)}</p>
          </div>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.slice(0, 6).map((slice) => (
          <li key={slice.id} className="flex items-center gap-1.5 truncate">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="truncate text-muted-foreground">{slice.label}</span>
            <span className="tabular ml-auto shrink-0 font-medium">{formatPercent(slice.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
