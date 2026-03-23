'use client';

import { useMemo, useState } from 'react';
import { Badge, Btn, Mono, Panel, PanelHeader, Select, Table, TD, TR } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { STAFF_PERFORMANCE } from '@/lib/data';
import { fmt } from '@/lib/utils';
import { ToastTone, TopProductRow, View, VatRow } from '@/types';

const reportToneClass = {
  amber: 'text-[var(--accent)]',
  green: 'text-[var(--green)]',
  blue: 'text-[var(--blue)]',
  text: 'text-[var(--text)]',
};

export default function ReportsView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { transactions, transactionLines } = useAppState();
  const [range, setRange] = useState('this-month');

  const { leadRevenue, leadTransactions, leadAverageBasket, summary, vatRows, topProducts } = useMemo(() => {
    const grossRevenue = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const transactionCount = transactions.length;
    const averageBasket = transactionCount > 0 ? grossRevenue / transactionCount : 0;
    const netProfit = grossRevenue * 0.25;

    const groupedByMonth = new Map<string, number>();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.timestamp);
      const label = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(date);
      groupedByMonth.set(label, (groupedByMonth.get(label) ?? 0) + transaction.amount);
    });

    const monthRows: VatRow[] = [...groupedByMonth.entries()]
      .map(([period, total]) => {
        const net = total / 1.21;
        return {
          period,
          net: Number(net.toFixed(2)),
          vat: Number((total - net).toFixed(2)),
          total: Number(total.toFixed(2)),
        };
      })
      .sort((left, right) => (left.period < right.period ? 1 : -1))
      .slice(0, 3);

    const productRevenue = new Map<string, { name: string; units: number; revenue: number }>();
    Object.values(transactionLines).forEach((lines) => {
      lines.forEach((line) => {
        const current = productRevenue.get(line.sku) ?? { name: line.name, units: 0, revenue: 0 };
        productRevenue.set(line.sku, {
          name: line.name,
          units: current.units + line.qty,
          revenue: current.revenue + line.qty * line.price,
        });
      });
    });

    const bestSellers: TopProductRow[] = [...productRevenue.values()]
      .map((entry) => ({
        name: entry.name,
        units: entry.units,
        revenue: Number(entry.revenue.toFixed(2)),
        margin: 40,
      }))
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5);

    return {
      leadRevenue: grossRevenue,
      leadTransactions: transactionCount,
      leadAverageBasket: averageBasket,
      summary: [
        { label: 'Gross Revenue', value: fmt(grossRevenue), tone: 'amber' as const },
        { label: 'Net Profit', value: fmt(netProfit), tone: 'green' as const },
        { label: 'Avg Basket', value: fmt(averageBasket), tone: 'text' as const },
        { label: 'Transactions', value: String(transactionCount), tone: 'blue' as const },
      ],
      vatRows: monthRows,
      topProducts: bestSellers,
    };
  }, [transactionLines, transactions]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col gap-2.5 border-b bg-[var(--bg2)] px-5 py-3.5 sm:flex-row sm:items-center">
        <Select value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="quarter">Quarter to Date</option>
          <option value="year">Year to Date</option>
        </Select>
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn onClick={() => onNotify('CSV export queued for the current reporting range.', 'success')}>
            Export CSV
          </Btn>
          <Btn onClick={() => onNotify('PDF report pack generated from live local data.', 'success')}>
            Export PDF
          </Btn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel>
            <PanelHeader title="Revenue Summary" subtitle="Gross, profit and basket metrics" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {summary.map((stat) => (
                <div key={stat.label} className="rounded-sm border bg-[var(--bg3)] p-3">
                  <div className="font-mono-iron text-[9px] uppercase tracking-[0.16em] text-[var(--text3)]">
                    {stat.label}
                  </div>
                  <div className={`mt-2 font-display text-[22px] font-bold uppercase ${reportToneClass[stat.tone]}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="VAT Report" subtitle="Quarter filing support">
              <Btn size="sm" onClick={() => onNotify('VAT export prepared for your accountant.', 'success')}>
                Export
              </Btn>
            </PanelHeader>
            <Table headers={['Period', 'Net Sales', 'VAT 21%', 'Total']}>
              {vatRows.map((row) => (
                <TR key={row.period}>
                  <TD>{row.period}</TD>
                  <TD>
                    <Mono>{fmt(row.net)}</Mono>
                  </TD>
                  <TD>
                    <Mono className="text-[var(--accent)]">{fmt(row.vat)}</Mono>
                  </TD>
                  <TD>
                    <Mono>{fmt(row.total)}</Mono>
                  </TD>
                </TR>
              ))}
            </Table>
          </Panel>

          <Panel>
            <PanelHeader title="Top Products" subtitle="Best sellers by revenue and margin" />
            <Table headers={['Product', 'Units Sold', 'Revenue', 'Margin %']}>
              {topProducts.map((product) => (
                <TR key={product.name}>
                  <TD>{product.name}</TD>
                  <TD>
                    <Mono>{product.units}</Mono>
                  </TD>
                  <TD>
                    <Mono className="text-[var(--accent)]">{fmt(product.revenue)}</Mono>
                  </TD>
                  <TD>
                    <Badge variant={product.margin >= 35 ? 'green' : 'amber'}>{product.margin}%</Badge>
                  </TD>
                </TR>
              ))}
            </Table>
          </Panel>

          <Panel>
            <PanelHeader title="Staff Performance" subtitle="Counter performance this month" />
            <Table headers={['Staff', 'Transactions', 'Revenue', 'Avg Basket']}>
              {STAFF_PERFORMANCE.map((person, index) => (
                <TR key={person.name}>
                  <TD className="text-[var(--text)]">{person.name}</TD>
                  <TD>
                    <Mono>{index === 0 ? leadTransactions : person.transactions}</Mono>
                  </TD>
                  <TD>
                    <Mono className="text-[var(--accent)]">{fmt(index === 0 ? leadRevenue : person.revenue)}</Mono>
                  </TD>
                  <TD>
                    <Mono>{fmt(index === 0 ? leadAverageBasket : person.averageBasket)}</Mono>
                  </TD>
                </TR>
              ))}
            </Table>
          </Panel>
        </div>
      </div>
    </div>
  );
}
