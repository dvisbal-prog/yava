"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { colors, formatCOP } from "@yava/shared";

export interface WaterfallStep {
  label: string;
  value: number; // positivo suma, negativo resta
  kind: "in" | "out" | "total";
}

interface Row {
  label: string;
  base: number;
  delta: number;
  kind: WaterfallStep["kind"];
  real: number;
}

function buildRows(steps: WaterfallStep[]): Row[] {
  let running = 0;
  return steps.map((s) => {
    if (s.kind === "total") {
      running = s.value;
      return { label: s.label, base: 0, delta: Math.max(0, s.value), kind: s.kind, real: s.value };
    }
    const prev = running;
    running += s.value;
    return { label: s.label, base: Math.max(0, Math.min(prev, running)), delta: Math.abs(s.value), kind: s.kind, real: s.value };
  });
}

/** Gráfica de cascada simple (Ingresos → descuentos → pasarela → gastos → resultado). */
export function WaterfallChart({ steps }: { steps: WaterfallStep[] }) {
  const rows = buildRows(steps);

  return (
    <div className="h-64 w-full" role="img" aria-label="Composición del resultado operativo">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke={colors.gray200} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.gray500 }} interval={0} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.gray500 }} tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)} M` : `${Math.round(v / 1000)} mil`)} width={56} />
          <Tooltip
            cursor={{ fill: colors.gray100 }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${colors.gray200}`, fontSize: 12 }}
            formatter={(_v, _n, item) => {
              const real = (item.payload as { real: number }).real;
              return [formatCOP(real, true), "Monto"];
            }}
          />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="delta" stackId="w" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.kind === "total" ? colors.blue : r.kind === "in" ? colors.green : colors.red} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
