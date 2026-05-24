"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#1a6ee8", "#f59e0b", "#6d28d9", "#10b981", "#ef4444"];

type RevenueDay = {
  day: string;
  thisWeek: number;
  lastWeek: number;
};

type NamedValue = {
  name: string;
  value: number;
};

type TopClient = {
  name: string;
  spend: number;
};

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
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 lg:col-span-2">
        <h2 className="mb-4 font-semibold">Revenue this week vs last week</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="thisWeek" name="This week" fill="#1a6ee8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lastWeek" name="Last week" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Bookings by service (revenue)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByService} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#6d28d9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Busiest hours</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={busiestHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Booking health</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bookingHealth} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                {bookingHealth.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Top clients by spend</h2>
        {topClients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid bookings yet.</p>
        ) : (
          <ol className="space-y-3">
            {topClients.map((client, index) => (
              <li key={client.name} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{client.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(client.spend)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
