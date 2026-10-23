"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colors, formatCOP } from "@yava/shared";

export interface DailyPoint {
  day: string; // etiqueta corta (d MMM)
  ingresos: number;
  contribucion: number;
  ventas?: number;
}

function short(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)} mil`;
  return String(n);
}

export function DailyChart({ data, showSales = false }: { data: DailyPoint[]; showSales?: boolean }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Ingresos de YAVA por día">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.gray200} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.gray500 }} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.gray500 }} tickFormatter={short} width={56} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${colors.gray200}`, fontSize: 12 }}
            formatter={(value, name) => [formatCOP(typeof value === "number" ? value : Number(value ?? 0), true), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {showSales ? <Line type="monotone" dataKey="ventas" name="Ventas de comercios" stroke={colors.gray400} strokeWidth={2} dot={false} strokeDasharray="4 4" /> : null}
          <Line type="monotone" dataKey="ingresos" name="Ingresos YAVA" stroke={colors.blue} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="contribucion" name="Contribución" stroke={colors.green} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
