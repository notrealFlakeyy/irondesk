'use client';

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { ClipboardList, PackageCheck, Plus, Printer } from 'lucide-react';
import { Badge, Btn, Input, Mono, Select } from '@/components/ui';
import { openPrintWindow } from '@/lib/browser-utils';
import { useAppState } from '@/lib/app-state';
import { fmt, stockStatus } from '@/lib/utils';
import { PurchaseOrder, PurchaseOrderItem, Supplier, ToastTone, View } from '@/types';

const emptySupplier = (): Supplier => ({
  id: '',
  name: '',
  category: '',
  leadDays: 2,
  account: '',
  skus: 0,
  monthlySpend: 0,
  onTimeRate: 95,
});

const poStatusTone = {
  draft: 'gray',
  sent: 'blue',
  received: 'green',
} as const;

export default function SuppliersView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const {
    suppliers,
    products,
    purchaseOrders,
    purchaseOrderItems,
    addSupplier,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
  } = useAppState();
  const [search, setSearch] = useState('');
  const [draftSupplier, setDraftSupplier] = useState<Supplier>(emptySupplier);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [submittingPo, setSubmittingPo] = useState(false);
  const [ordersSupplierId, setOrdersSupplierId] = useState<string | null>(null);
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filteredSuppliers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return suppliers;

    return suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.category.toLowerCase().includes(query) ||
        supplier.account.toLowerCase().includes(query)
      );
    });
  }, [deferredSearch, suppliers]);

  const selectedPoSupplier = suppliers.find((supplier) => supplier.id === poSupplierId) ?? null;
  const supplierOrders = useMemo(() => {
    if (!ordersSupplierId) return [];
    return purchaseOrders.filter((order) => order.supplierId === ordersSupplierId);
  }, [ordersSupplierId, purchaseOrders]);

  const buildSuggestedItems = (supplierId: string) => {
    const supplier = suppliers.find((entry) => entry.id === supplierId);
    if (!supplier) return [];

    const matchingProducts = products
      .filter((product) => product.supplier === supplier.name)
      .map((product) => ({
        ...product,
        stockState: stockStatus(product.stock, product.min),
      }))
      .sort((left, right) => {
        const priority = { out: 0, low: 1, ok: 2 };
        return priority[left.stockState] - priority[right.stockState];
      });

    const urgentItems = matchingProducts.filter((product) => product.stockState !== 'ok');
    const sourceItems = urgentItems.length > 0 ? urgentItems : matchingProducts.slice(0, 4);

    return sourceItems.map((product) => ({
      sku: product.sku,
      name: product.name,
      qty: Math.max(product.min * 2 - product.stock, product.min - product.stock, 1),
      unitCost: Number((product.price * 0.6).toFixed(2)),
    }));
  };

  const openPurchaseOrderModal = (supplierId?: string) => {
    const nextSupplierId = supplierId ?? suppliers[0]?.id ?? '';
    setPoSupplierId(nextSupplierId);
    setPoItems(buildSuggestedItems(nextSupplierId));
    setPoModalOpen(true);
  };

  const printPurchaseOrder = (order: PurchaseOrder) => {
    const items = purchaseOrderItems[order.id] ?? [];
    openPrintWindow(
      order.id,
      `
        <h1>Purchase Order ${order.id}</h1>
        <p class="meta">Supplier: ${order.supplierName}</p>
        <p class="meta">Expected: ${order.expectedDate} / Status: ${order.status}</p>
        <p class="meta">Total: <span class="accent">${fmt(order.total)}</span></p>
        <div class="section">
          <h2>Items</h2>
          <table>
            <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
            <tbody>
              ${items
                .map(
                  (item) =>
                    `<tr><td class="mono">${item.sku}</td><td>${item.name}</td><td class="mono">${item.qty}</td><td class="mono">${fmt(item.unitCost)}</td><td class="mono accent">${fmt(item.qty * item.unitCost)}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
    );
    onNotify(`Opened a printable purchase order for ${order.id}.`, 'success');
  };

  const saveSupplier = () => {
    if (!draftSupplier.name.trim() || !draftSupplier.account.trim()) {
      onNotify('Supplier name and account number are required.', 'info');
      return;
    }

    const supplier: Supplier = {
      ...draftSupplier,
      id: `s${Date.now()}`,
      name: draftSupplier.name.trim(),
      category: draftSupplier.category.trim(),
      account: draftSupplier.account.trim().toUpperCase(),
      leadDays: Number(draftSupplier.leadDays),
      skus: Number(draftSupplier.skus),
      monthlySpend: Number(draftSupplier.monthlySpend),
      onTimeRate: Number(draftSupplier.onTimeRate),
    };

    setSavingSupplier(true);
    void (async () => {
      try {
        await addSupplier(supplier);
        setAddingSupplier(false);
        setDraftSupplier(emptySupplier());
        onNotify(`Added supplier ${supplier.name}.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to add the supplier.', 'info');
      } finally {
        setSavingSupplier(false);
      }
    })();
  };

  const submitPurchaseOrder = () => {
    const validItems = poItems.filter((item) => item.qty > 0);
    if (!poSupplierId) {
      onNotify('Select a supplier before creating a purchase order.', 'info');
      return;
    }
    if (validItems.length === 0) {
      onNotify('Add at least one line item to the purchase order.', 'info');
      return;
    }

    setSubmittingPo(true);
    void (async () => {
      try {
        const { purchaseOrderId } = await createPurchaseOrder({
          supplierId: poSupplierId,
          status: 'sent',
          items: validItems,
        });
        setPoModalOpen(false);
        setOrdersSupplierId(poSupplierId);
        onNotify(`Created purchase order ${purchaseOrderId}.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to create the purchase order.', 'info');
      } finally {
        setSubmittingPo(false);
      }
    })();
  };

  const onContextAction = useEffectEvent((view?: View) => {
    if (view === 'suppliers') {
      openPurchaseOrderModal();
    }
  });

  useEffect(() => {
    const handleContextAction = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: View }>).detail;
      onContextAction(detail?.view);
    };

    window.addEventListener('irondesk:context-action', handleContextAction);
    return () => window.removeEventListener('irondesk:context-action', handleContextAction);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col gap-2.5 border-b bg-[var(--bg2)] px-5 py-3.5 xl:flex-row xl:items-center">
        <Input
          placeholder="Search suppliers, category or account number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full xl:max-w-[320px]"
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn variant="primary" onClick={() => setAddingSupplier(true)}>
            Add Supplier
          </Btn>
          <Btn onClick={() => openPurchaseOrderModal()}>Create Purchase Order</Btn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {filteredSuppliers.map((supplier) => {
            const onTimeClass =
              supplier.onTimeRate >= 95
                ? 'text-[var(--green)]'
                : supplier.onTimeRate >= 90
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--red)]';
            const openCount = purchaseOrders.filter(
              (order) => order.supplierId === supplier.id && order.status !== 'received'
            ).length;
            const lowStockCount = products.filter(
              (product) => product.supplier === supplier.name && stockStatus(product.stock, product.min) !== 'ok'
            ).length;

            return (
              <article key={supplier.id} className="rounded-sm border bg-[var(--bg2)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-[16px] font-bold uppercase tracking-[0.05em] text-[var(--text)]">
                      {supplier.name}
                    </div>
                    <div className="mt-2 font-mono-iron text-[11px] uppercase tracking-[0.12em] text-[var(--text3)]">
                      {supplier.category} / lead {supplier.leadDays}d / {supplier.account}
                    </div>
                  </div>
                  {openCount > 0 ? <Badge variant="blue">{openCount} OPEN</Badge> : null}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <div className="font-display text-[18px] font-bold uppercase text-[var(--text)]">{supplier.skus}</div>
                    <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">Active SKUs</div>
                  </div>
                  <div>
                    <div className="font-display text-[18px] font-bold uppercase text-[var(--accent)]">
                      {fmt(supplier.monthlySpend)}
                    </div>
                    <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">This Month</div>
                  </div>
                  <div>
                    <div className={`font-display text-[18px] font-bold uppercase ${onTimeClass}`}>
                      {supplier.onTimeRate}%
                    </div>
                    <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">On Time</div>
                  </div>
                </div>
                <div className="mt-4 rounded-sm border bg-[var(--bg3)] px-3 py-2">
                  <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">
                    Procurement Snapshot
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--text2)]">
                    <span>Low-stock SKUs</span>
                    <Mono className={lowStockCount > 0 ? 'text-[var(--accent)]' : 'text-[var(--green)]'}>
                      {lowStockCount}
                    </Mono>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[12px] text-[var(--text2)]">
                    <span>Open POs</span>
                    <Mono>{openCount}</Mono>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Btn size="sm" variant="primary" onClick={() => openPurchaseOrderModal(supplier.id)}>
                    New PO
                  </Btn>
                  <Btn size="sm" onClick={() => setOrdersSupplierId(supplier.id)}>
                    View Orders
                  </Btn>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            onClick={() => setAddingSupplier(true)}
            className="flex min-h-[188px] flex-col items-center justify-center rounded-sm border border-dashed bg-[var(--bg2)] text-[var(--text3)] transition-colors hover:border-[var(--border2)] hover:text-[var(--text2)]"
          >
            <Plus className="h-6 w-6" />
            <div className="mt-2 font-display text-[16px] font-bold uppercase tracking-[0.05em]">Add Supplier</div>
          </button>
        </div>
      </div>

      {addingSupplier ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[560px] rounded-sm border bg-[var(--bg2)]">
            <div className="border-b px-5 py-4 font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
              Add Supplier
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Input
                placeholder="Supplier name"
                value={draftSupplier.name}
                onChange={(event) => setDraftSupplier((current) => ({ ...current, name: event.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Category"
                value={draftSupplier.category}
                onChange={(event) => setDraftSupplier((current) => ({ ...current, category: event.target.value }))}
              />
              <Input
                placeholder="Account ID"
                value={draftSupplier.account}
                onChange={(event) => setDraftSupplier((current) => ({ ...current, account: event.target.value }))}
              />
              <Input
                placeholder="Lead days"
                type="number"
                min="1"
                value={String(draftSupplier.leadDays)}
                onChange={(event) => setDraftSupplier((current) => ({ ...current, leadDays: Number(event.target.value) }))}
              />
              <Input
                placeholder="Active SKUs"
                type="number"
                min="0"
                value={String(draftSupplier.skus)}
                onChange={(event) => setDraftSupplier((current) => ({ ...current, skus: Number(event.target.value) }))}
              />
              <Input
                placeholder="Monthly spend"
                type="number"
                min="0"
                step="0.01"
                value={String(draftSupplier.monthlySpend)}
                onChange={(event) =>
                  setDraftSupplier((current) => ({ ...current, monthlySpend: Number(event.target.value) }))
                }
              />
              <Input
                placeholder="On-time rate"
                type="number"
                min="0"
                max="100"
                value={String(draftSupplier.onTimeRate)}
                onChange={(event) =>
                  setDraftSupplier((current) => ({ ...current, onTimeRate: Number(event.target.value) }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={() => setAddingSupplier(false)} disabled={savingSupplier}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={saveSupplier} disabled={savingSupplier}>
                {savingSupplier ? 'Saving...' : 'Save Supplier'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {poModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[860px] rounded-sm border bg-[var(--bg2)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                  Create Purchase Order
                </div>
                <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
                  Auto-built from supplier low stock recommendations
                </div>
              </div>
              <Btn onClick={() => setPoModalOpen(false)} disabled={submittingPo}>
                Cancel
              </Btn>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-[1.5fr,1fr,1fr]">
                <Select
                  value={poSupplierId}
                  onChange={(event) => {
                    setPoSupplierId(event.target.value);
                    setPoItems(buildSuggestedItems(event.target.value));
                  }}
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Select>
                <div className="rounded-sm border bg-[var(--bg3)] px-3 py-2">
                  <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">
                    Lead Time
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--text)]">{selectedPoSupplier?.leadDays ?? 0} days</div>
                </div>
                <div className="rounded-sm border bg-[var(--bg3)] px-3 py-2">
                  <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">
                    Supplier Account
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--text)]">{selectedPoSupplier?.account ?? '-'}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-sm border">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['SKU', 'Product', 'Qty', 'Unit Cost', 'Total'].map((header) => (
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
                    {poItems.map((item, index) => (
                      <tr key={`${item.sku}-${index}`} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5 font-mono-iron text-[11px] text-[var(--text3)]">{item.sku}</td>
                        <td className="px-4 py-2.5 text-[13px] text-[var(--text)]">{item.name}</td>
                        <td className="px-4 py-2.5">
                          <Input
                            type="number"
                            min="0"
                            value={String(item.qty)}
                            onChange={(event) =>
                              setPoItems((current) =>
                                current.map((entry, currentIndex) =>
                                  currentIndex === index ? { ...entry, qty: Number(event.target.value) } : entry
                                )
                              )
                            }
                            className="h-8 w-20"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={String(item.unitCost)}
                            onChange={(event) =>
                              setPoItems((current) =>
                                current.map((entry, currentIndex) =>
                                  currentIndex === index
                                    ? { ...entry, unitCost: Number(event.target.value) }
                                    : entry
                                )
                              )
                            }
                            className="h-8 w-24"
                          />
                        </td>
                        <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--accent)]">
                          {fmt(item.qty * item.unitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="font-mono-iron text-[11px] uppercase tracking-[0.14em] text-[var(--text3)]">
                  {poItems.filter((item) => item.qty > 0).length} active lines
                </div>
                <div className="font-display text-[20px] font-bold uppercase text-[var(--accent)]">
                  {fmt(poItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn
                onClick={() => {
                  if (poSupplierId) {
                    setPoItems(buildSuggestedItems(poSupplierId));
                  }
                }}
                disabled={submittingPo}
              >
                Refresh Suggestions
              </Btn>
              <Btn variant="primary" onClick={submitPurchaseOrder} disabled={submittingPo}>
                {submittingPo ? 'Creating...' : 'Create PO'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {ordersSupplierId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[920px] rounded-sm border bg-[var(--bg2)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                  Supplier Purchase Orders
                </div>
                <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
                  {suppliers.find((supplier) => supplier.id === ordersSupplierId)?.name ?? 'Supplier'}
                </div>
              </div>
              <Btn onClick={() => setOrdersSupplierId(null)}>Close</Btn>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              {supplierOrders.length === 0 ? (
                <div className="rounded-sm border bg-[var(--bg3)] px-4 py-8 text-center">
                  <ClipboardList className="mx-auto h-6 w-6 text-[var(--text3)]" />
                  <div className="mt-3 font-display text-[16px] font-bold uppercase tracking-[0.05em] text-[var(--text)]">
                    No Purchase Orders Yet
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--text3)]">
                    Create the first purchase order to track incoming supplier stock.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {supplierOrders.map((order) => {
                    const items = purchaseOrderItems[order.id] ?? [];
                    return (
                      <article key={order.id} className="rounded-sm border bg-[var(--bg2)]">
                        <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-display text-[18px] font-bold uppercase tracking-[0.05em] text-[var(--accent)]">
                              {order.id}
                            </div>
                            <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
                              Expected {order.expectedDate} / {order.itemCount} units
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={poStatusTone[order.status]}>{order.status}</Badge>
                            <Btn size="sm" onClick={() => printPurchaseOrder(order)}>
                              <Printer className="h-3.5 w-3.5" />
                              Print
                            </Btn>
                            <Btn
                              size="sm"
                              variant="success"
                              disabled={order.status === 'received' || receivingPoId === order.id}
                              onClick={() => {
                                setReceivingPoId(order.id);
                                void (async () => {
                                  try {
                                    await updatePurchaseOrderStatus(order.id, 'received');
                                    onNotify(`${order.id} marked as received and stock was updated.`, 'success');
                                  } catch (error) {
                                    onNotify(
                                      error instanceof Error
                                        ? error.message
                                        : 'Failed to receive the purchase order.',
                                      'info'
                                    );
                                  } finally {
                                    setReceivingPoId(null);
                                  }
                                })();
                              }}
                            >
                              <PackageCheck className="h-3.5 w-3.5" />
                              {receivingPoId === order.id ? 'Receiving...' : 'Mark Received'}
                            </Btn>
                          </div>
                        </div>
                        <div className="overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                {['SKU', 'Product', 'Qty', 'Unit Cost', 'Total'].map((header) => (
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
                              {items.map((item) => (
                                <tr key={`${order.id}-${item.sku}`} className="border-b last:border-b-0">
                                  <td className="px-4 py-2.5 font-mono-iron text-[11px] text-[var(--text3)]">{item.sku}</td>
                                  <td className="px-4 py-2.5 text-[13px] text-[var(--text)]">{item.name}</td>
                                  <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--text2)]">{item.qty}</td>
                                  <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--text2)]">{fmt(item.unitCost)}</td>
                                  <td className="px-4 py-2.5 font-mono-iron text-[13px] text-[var(--accent)]">
                                    {fmt(item.qty * item.unitCost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
