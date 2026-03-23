'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Btn, Input } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { fmt } from '@/lib/utils';
import { Supplier, ToastTone, View } from '@/types';

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

export default function SuppliersView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { suppliers, addSupplier } = useAppState();
  const [search, setSearch] = useState('');
  const [draftSupplier, setDraftSupplier] = useState<Supplier>(emptySupplier);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
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
          <Btn onClick={() => onNotify('Purchase order generation will be connected to supplier APIs next.', 'info')}>
            Create Purchase Order
          </Btn>
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

            return (
              <article key={supplier.id} className="rounded-sm border bg-[var(--bg2)] p-4">
                <div className="font-display text-[16px] font-bold uppercase tracking-[0.05em] text-[var(--text)]">
                  {supplier.name}
                </div>
                <div className="mt-2 font-mono-iron text-[11px] uppercase tracking-[0.12em] text-[var(--text3)]">
                  {supplier.category} / lead {supplier.leadDays}d / {supplier.account}
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
                <div className="mt-4 flex gap-2">
                  <Btn
                    size="sm"
                    variant="primary"
                    onClick={() => onNotify(`New purchase order started for ${supplier.name}.`, 'success')}
                  >
                    New PO
                  </Btn>
                  <Btn
                    size="sm"
                    onClick={() => onNotify(`Viewing open orders for ${supplier.name}.`, 'info')}
                  >
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

      {addingSupplier && (
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
                onChange={(event) =>
                  setDraftSupplier((current) => ({ ...current, category: event.target.value }))
                }
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
                onChange={(event) =>
                  setDraftSupplier((current) => ({ ...current, leadDays: Number(event.target.value) }))
                }
              />
              <Input
                placeholder="Active SKUs"
                type="number"
                min="0"
                value={String(draftSupplier.skus)}
                onChange={(event) =>
                  setDraftSupplier((current) => ({ ...current, skus: Number(event.target.value) }))
                }
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
      )}
    </div>
  );
}
