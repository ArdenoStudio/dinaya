"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const HEALTH_COLORS: Record<string, string> = {
  Completed: "#22c55e",
  Cancelled: "#f59e0b",
  "No-show": "#ef4444",
};
const FALLBACK_COLORS = ["#2563eb", "#f59e0b", "#7c3aed", "#10b981", "#ef4444"];
const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
  fontSize: "12px",
};

type RevenueDay = { day: string; thisWeek: number; lastWeek: number };
type NamedValue = { name: string; value: number };
type TopClient = { name: string; spend: number };

type Props = {
  revenueByDay: RevenueDay[];
  revenueByService: NamedValue[];
  busiestHours: NamedValue[];
  bookingHealth: { name: string; value: number }[];
  topClients: TopClient[];
  formatCurrency: (value: number) => string;
};

export function AnalyticsCharts({
  revenueByDay,
  revenueByService,
  busiestHours,
  bookingHealth,
  topClients,
  formatCurrency,
}: Props) {
  const healthTotal = bookingHealth.reduce((s, i) => s + i.value, 0);
  const completedCount = bookingHealth.find((i) => i.name === "Completed")?.value ?? 0;
  const completionRate = healthTotal > 0 ? Math.round((completedCount / healthTotal) * 100) : 0;
  const maxSpend = topClients[0]?.spend || 1;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue area chart */}
      <div className="rounded-xl border bg-white p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Revenue this week vs last week</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-primary" />
              This week
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-slate-300" />
              Last week
            </span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="thisWeekGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={tooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="thisWeek"
                name="This week"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#thisWeekGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="lastWeek"
                name="Last week"
                stroke="#cbd5e1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services by revenue */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Bookings by service (revenue)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByService} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Busiest hours */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Busiest hours</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={busiestHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking health donut */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Booking health</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={bookingHealth}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                strokeWidth={2}
                stroke="#fff"
              >
                {bookingHealth.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={HEALTH_COLORS[entry.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                  />
                ))}
                <Label
                  value={`${completionRate}%`}
                  position="center"
                  style={{ fontSize: "20px", fontWeight: 700, fill: "#0f172a" }}
                />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {bookingHealth.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{
                  backgroundColor:
                    HEALTH_COLORS[entry.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top clients with fill bars */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Top clients by spend</h2>
        {topClients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid bookings yet.</p>
        ) : (
          <ol className="space-y-2.5">
            {topClients.map((client, index) => {
              const fillPct = Math.round((client.spend / maxSpend) * 100);
              const rankColor = RANK_COLORS[index];
              return (
                <li key={client.name} className="relative overflow-hidden rounded-lg border px-4 py-3">
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-lg bg-primary/5"
                    style={{ width: `${fillPct}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={
                          rankColor
                            ? { backgroundColor: rankColor + "22", color: rankColor }
                            : { backgroundColor: "#f1f5f9", color: "#64748b" }
                        }
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{client.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(client.spend)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
