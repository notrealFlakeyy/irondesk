'use client';

import { useMemo, useState } from 'react';
import { Printer, Truck } from 'lucide-react';
import { Badge, Btn, Mono } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { fmt, orderStatusLabel } from '@/lib/utils';
import { ToastTone, View } from '@/types';

const orderTone = {
  ready: 'green',
  paid: 'blue',
  pending: 'amber',
  processing: 'gray',
} as const;

const lineTone = {
  reserved: 'blue',
  ready: 'green',
  backorder: 'amber',
} as const;

export default function OrdersView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { orders, orderItems, orderTimelines, updateOrderStatus } = useAppState();
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? '');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const activeSelectedId = orders.some((order) => order.id === selectedId) ? selectedId : (orders[0]?.id ?? '');

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === activeSelectedId) ?? orders[0],
    [activeSelectedId, orders]
  );

  const lineItems = selectedOrder ? orderItems[selectedOrder.id] ?? [] : [];
  const timeline = selectedOrder ? orderTimelines[selectedOrder.id] ?? [] : [];

  if (!selectedOrder) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <aside className="w-full border-r bg-[var(--bg2)] lg:w-[300px]">
        <div className="border-b bg-[var(--bg3)] px-4 py-3 font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]">
          Customer Orders ({orders.length})
        </div>
        <div className="overflow-y-auto lg:h-[calc(100vh-104px)]">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full border-b border-l-2 px-4 py-3 text-left transition-colors ${
                activeSelectedId === order.id
                  ? 'border-l-[var(--accent)] bg-[rgba(232,160,32,0.10)]'
                  : 'border-l-transparent hover:bg-[var(--bg3)]'
              }`}
            >
              <div className="font-mono-iron text-[12px] uppercase tracking-[0.14em] text-[var(--accent)]">
                {order.id}
              </div>
              <div className="mt-1 text-[13px] text-[var(--text)]">{order.customer}</div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={orderTone[order.status]}>{orderStatusLabel(order.status)}</Badge>
                <Mono className="text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                  {order.date}
                </Mono>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 border-b pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="font-mono-iron text-[11px] uppercase tracking-[0.14em] text-[var(--text3)]">
              Customer Order
            </div>
            <div className="mt-1 font-display text-[28px] font-bold uppercase tracking-[0.05em] text-[var(--accent)]">
              {selectedOrder.id}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={orderTone[selectedOrder.status]} className="px-3 py-1 text-[11px]">
              {orderStatusLabel(selectedOrder.status)}
            </Badge>
            <Btn size="sm" onClick={() => onNotify(`Print job queued for ${selectedOrder.id}.`, 'success')}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Btn>
            <Btn
              size="sm"
              variant="success"
              disabled={selectedOrder.status === 'paid' || updatingStatus}
              onClick={() => {
                setUpdatingStatus(true);
                void (async () => {
                  try {
                    await updateOrderStatus(selectedOrder.id, 'paid');
                    onNotify(`${selectedOrder.id} marked as collected.`, 'success');
                  } catch (error) {
                    onNotify(error instanceof Error ? error.message : 'Failed to update the order.', 'info');
                  } finally {
                    setUpdatingStatus(false);
                  }
                })();
              }}
            >
              <Truck className="h-3.5 w-3.5" />
              {updatingStatus ? 'Updating...' : 'Mark Collected'}
            </Btn>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-sm border bg-[var(--bg2)] p-4">
            <div className="font-mono-iron text-[9px] uppercase tracking-[0.18em] text-[var(--text3)]">Customer</div>
            <div className="mt-2 text-[15px] text-[var(--text)]">{selectedOrder.customer}</div>
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              {selectedOrder.customerId ? 'Trade account enabled with monthly billing' : 'Walk-in / counter order'}
            </div>
          </div>
          <div className="rounded-sm border bg-[var(--bg2)] p-4">
            <div className="font-mono-iron text-[9px] uppercase tracking-[0.18em] text-[var(--text3)]">Order Date</div>
            <div className="mt-2 text-[15px] text-[var(--text)]">{selectedOrder.date}</div>
            <div className="mt-1 text-[12px] text-[var(--text3)]">Due: {selectedOrder.due}</div>
          </div>
          <div className="rounded-sm border bg-[var(--bg2)] p-4">
            <div className="font-mono-iron text-[9px] uppercase tracking-[0.18em] text-[var(--text3)]">Order Total</div>
            <div className="mt-2 text-[15px] text-[var(--accent)]">{fmt(selectedOrder.total)}</div>
            <div className="mt-1 text-[12px] text-[var(--text3)]">
              Deposit: {fmt(selectedOrder.deposit ?? 0)}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border bg-[var(--bg2)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['SKU', 'Product', 'Qty', 'Unit Price', 'Total', 'Status'].map((header) => (
                  <th
                    key={header}
                    className="border-b bg-[var(--bg3)] px-4 py-2 text-left font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.sku} className="border-b last:border-b-0 hover:bg-[var(--bg3)]">
                  <td className="px-4 py-2.5 font-mono-iron text-[11px] text-[var(--text3)]">{item.sku}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--text)]">{item.name}</td>
                  <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--text2)]">{item.qty}</td>
                  <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--text2)]">{fmt(item.unitPrice)}</td>
                  <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--accent)]">
                    {fmt(item.qty * item.unitPrice)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={lineTone[item.status]}>{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <div className="mb-3 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Timeline
          </div>
          <div className="space-y-0">
            {timeline.map((event, index) => (
              <div key={`${event.label}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                {index < timeline.length - 1 ? (
                  <div className="absolute left-[5px] top-4 h-[calc(100%-4px)] w-px bg-[var(--border)]" />
                ) : null}
                <div
                  className={`relative z-10 mt-1 h-3 w-3 rounded-full border ${
                    event.state === 'done'
                      ? 'border-[var(--green)] bg-[var(--green)]'
                      : event.state === 'active'
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--border2)] bg-[var(--bg)]'
                  }`}
                />
                <div>
                  <div className="text-[13px] text-[var(--text)]">{event.label}</div>
                  {event.time ? (
                    <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                      {event.time}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
