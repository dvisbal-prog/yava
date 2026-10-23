"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colors } from "@yava/shared";

export interface HourPoint {
  hour: number;
  orders: number;
}

export function HourlyChart({ data }: { data: HourPoint[] }) {
  const byHour = new Map(data.map((d) => [d.hour, d.orders]));
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const nonEmpty = hours.filter((h) => (byHour.get(h) ?? 0) > 0);
  const start = nonEmpty.length ? Math.max(0, Math.min(6, nonEmpty[0])) : 6;
  const end = nonEmpty.length ? Math.min(23, Math.max(22, nonEmpty[nonEmpty.length - 1])) : 22;
  const rows = hours.filter((h) => h >= start && h <= end).map((h) => ({ label: `${String(h).padStart(2, "0")}h`, pedidos: byHour.get(h) ?? 0 }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Pedidos por hora del día">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={colors.gray200} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.gray500 }} interval={1} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.gray500 }} allowDecimals={false} width={40} />
          <Tooltip
            cursor={{ fill: colors.gray100 }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${colors.gray200}`, fontSize: 12 }}
            formatter={(value) => [`${value ?? 0} pedidos`, "Pedidos"]}
          />
          <Bar dataKey="pedidos" fill={colors.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
