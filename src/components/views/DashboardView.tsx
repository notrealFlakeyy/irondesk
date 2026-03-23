'use client';

import { useMemo } from 'react';
import { AlertTriangle, ArrowRight, CircleDot, PackageSearch } from 'lucide-react';
import { Badge, Mono, Panel, PanelHeader, Table, TD, TR } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { dayKey, fmt, formatTime, lastNDays, paymentLabel, stockStatus } from '@/lib/utils';
import { View } from '@/types';

const kpiToneClass = {
  amber: 'text-[var(--accent)]',
  green: 'text-[var(--green)]',
  red: 'text-[var(--red)]',
  blue: 'text-[var(--blue)]',
};

const deltaToneClass = {
  green: 'text-[var(--green)]',
  red: 'text-[var(--red)]',
  muted: 'text-[var(--text3)]',
  blue: 'text-[var(--blue)]',
};

const paymentTone = {
  card: 'green',
  cash: 'amber',
  invoice: 'blue',
} as const;

const orderTone = {
  ready: 'green',
  paid: 'blue',
  pending: 'amber',
  processing: 'gray',
} as const;

export default function DashboardView({ onNav }: { onNav: (view: View) => void }) {
  const { transactions, products, orders } = useAppState();

  const {
    kpis,
    recentTransactions,
    lowStockAlerts,
    pendingOrders,
    revenueBars,
  } = useMemo(() => {
    const sortedTransactions = [...transactions].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );
    const latestTimestamp = sortedTransactions[0]?.timestamp ?? new Date().toISOString();
    const days = lastNDays(7, latestTimestamp);
    const todayKey = dayKey(latestTimestamp);
    const yesterdayKey = dayKey(days[days.length - 2] ?? latestTimestamp);

    const revenueByDay = new Map<string, number>();
    sortedTransactions.forEach((transaction) => {
      const key = dayKey(transaction.timestamp);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + transaction.amount);
    });

    const dayValues = days.map((day) => {
      const key = dayKey(day);
      return {
        day: new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(day).toUpperCase(),
        key,
        amount: revenueByDay.get(key) ?? 0,
      };
    });
    const maxRevenue = Math.max(...dayValues.map((entry) => entry.amount), 1);

    const todayRevenue = revenueByDay.get(todayKey) ?? 0;
    const yesterdayRevenue = revenueByDay.get(yesterdayKey) ?? 0;
    const todayTransactions = sortedTransactions.filter((transaction) => dayKey(transaction.timestamp) === todayKey);
    const lowAlerts = products
      .filter((product) => stockStatus(product.stock, product.min) !== 'ok')
      .sort((left, right) => left.stock - right.stock)
      .slice(0, 5)
      .map((product) => ({
        sku: product.sku,
        name: product.name,
        stock: product.stock,
        min: product.min,
        status: stockStatus(product.stock, product.min) as 'low' | 'out',
      }));
    const openOrders = orders.filter((order) => order.status !== 'paid');
    const actionableOrders = openOrders.filter((order) => order.status !== 'paid').slice(0, 2);
    const averageTransactions =
      dayValues.reduce((sum, entry) => sum + sortedTransactions.filter((transaction) => dayKey(transaction.timestamp) === entry.key).length, 0) /
      dayValues.length;

    return {
      kpis: [
        {
          label: "Today's Revenue",
          value: fmt(todayRevenue).replace('.00', ''),
          delta:
            yesterdayRevenue > 0
              ? `Up ${(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)}% vs yesterday`
              : 'No prior-day comparison',
          tone: 'amber' as const,
          deltaTone: todayRevenue >= yesterdayRevenue ? 'green' as const : 'red' as const,
        },
        {
          label: 'Transactions',
          value: String(todayTransactions.length),
          delta: `Up ${Math.max(0, todayTransactions.length - Math.round(averageTransactions))} vs avg`,
          tone: 'green' as const,
          deltaTone: 'green' as const,
        },
        {
          label: 'Low Stock Alerts',
          value: String(products.filter((product) => stockStatus(product.stock, product.min) !== 'ok').length),
          delta: `${lowAlerts.filter((alert) => alert.status === 'out').length} out of stock`,
          tone: 'red' as const,
          deltaTone: 'red' as const,
        },
        {
          label: 'Open Orders',
          value: String(openOrders.length),
          delta: `${openOrders.filter((order) => order.status === 'pending').length} need action`,
          tone: 'blue' as const,
          deltaTone: 'muted' as const,
        },
      ],
      recentTransactions: sortedTransactions.slice(0, 5),
      lowStockAlerts: lowAlerts,
      pendingOrders: actionableOrders,
      revenueBars: dayValues.map((entry, index) => ({
        day: entry.day,
        height: Math.max(20, Math.round((entry.amount / maxRevenue) * 96)),
        active: index === dayValues.length - 1,
      })),
    };
  }, [orders, products, transactions]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="grid border-b bg-[var(--bg2)] sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="border-r border-b px-5 py-4 last:border-r-0 xl:border-b-0">
            <div className="mb-2 font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]">
              {kpi.label}
            </div>
            <div className={`font-display text-[32px] font-bold leading-none ${kpiToneClass[kpi.tone]}`}>
              {kpi.value}
            </div>
            <div className={`mt-1 font-mono-iron text-[11px] uppercase tracking-[0.08em] ${deltaToneClass[kpi.deltaTone]}`}>
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="space-y-4">
            <Panel>
              <PanelHeader title="Revenue - Last 7 Days" subtitle="Daily register intake">
                <Badge variant="green">LIVE</Badge>
              </PanelHeader>
              <div className="flex h-[170px] items-end gap-2 px-4 pb-4 pt-6">
                {revenueBars.map((bar) => (
                  <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
                    <button
                      type="button"
                      className={`w-full rounded-sm border transition-colors ${
                        bar.active
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--bg4)] hover:border-[var(--accent2)] hover:bg-[var(--accent2)]'
                      }`}
                      style={{ height: `${bar.height}px` }}
                    />
                    <span className="font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Recent Transactions" subtitle="Live receipt activity">
                <button
                  type="button"
                  onClick={() => onNav('pos')}
                  className="inline-flex items-center gap-1 font-display text-[12px] uppercase tracking-[0.12em] text-[var(--accent)]"
                >
                  Open POS
                  <ArrowRight className="h-3 w-3" />
                </button>
              </PanelHeader>
              <Table headers={['Receipt', 'Customer', 'Items', 'Amount', 'Method', 'Time']}>
                {recentTransactions.map((transaction) => (
                  <TR key={transaction.id}>
                    <TD>
                      <Mono className="text-[11px] text-[var(--text3)]">{transaction.id}</Mono>
                    </TD>
                    <TD className="text-[var(--text)]">{transaction.customer}</TD>
                    <TD>
                      <Mono>{transaction.items}</Mono>
                    </TD>
                    <TD>
                      <Mono className="text-[var(--accent)]">{fmt(transaction.amount)}</Mono>
                    </TD>
                    <TD>
                      <Badge variant={paymentTone[transaction.method]}>{paymentLabel(transaction.method)}</Badge>
                    </TD>
                    <TD>
                      <Mono className="text-[11px] text-[var(--text3)]">{formatTime(transaction.timestamp)}</Mono>
                    </TD>
                  </TR>
                ))}
              </Table>
            </Panel>
          </div>
        </div>

        <aside className="border-l bg-[var(--bg2)]">
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                  Alerts
                </span>
              </div>
              <Badge variant="red">{lowStockAlerts.length} ACTIVE</Badge>
            </div>
            <div className="border-b">
              {lowStockAlerts.map((alert) => (
                <button
                  key={alert.sku}
                  type="button"
                  onClick={() => onNav('inventory')}
                  className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-[var(--bg3)] last:border-b-0"
                >
                  <CircleDot className={`mt-0.5 h-3.5 w-3.5 ${alert.status === 'out' ? 'text-[var(--red)]' : 'text-[var(--accent)]'}`} />
                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--text)]">{alert.name}</div>
                    <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
                      {alert.sku} / {alert.stock} in stock / min {alert.min}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <PackageSearch className="h-4 w-4 text-[var(--blue)]" />
                <span className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                  Pending Orders
                </span>
              </div>
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onNav('orders')}
                    className="flex w-full items-center gap-3 rounded-sm border bg-[var(--bg3)] px-3 py-3 text-left transition-colors hover:border-[var(--border2)]"
                  >
                    <CircleDot className={`h-3.5 w-3.5 ${order.status === 'ready' ? 'text-[var(--blue)]' : 'text-[var(--accent)]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono-iron text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
                        {order.id}
                      </div>
                      <div className="truncate text-[13px] text-[var(--text)]">{order.customer}</div>
                      <div className="mt-1 text-[12px] text-[var(--text3)]">
                        {order.status === 'ready' ? 'Ready for pickup' : `Due ${order.due}`}
                      </div>
                    </div>
                    <Badge variant={orderTone[order.status]}>{order.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
