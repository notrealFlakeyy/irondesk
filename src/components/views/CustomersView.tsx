'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Badge, Btn, Input, Mono, Select, Table, TD, TR } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { fmt } from '@/lib/utils';
import { Customer, ToastTone, View } from '@/types';

type CustomerFilter = 'all' | 'trade' | 'retail';

const purchaseTone = {
  paid: 'green',
  invoice: 'blue',
  processing: 'amber',
} as const;

const emptyCustomer = (): Customer => ({
  id: '',
  name: '',
  email: '',
  type: 'retail',
  totalSpent: 0,
  lastPurchase: 'No purchases yet',
  balance: 0,
  creditLimit: 0,
  loyaltyPoints: 0,
  terms: '',
});

export default function CustomersView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { customers, customerPurchases, addCustomer } = useAppState();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? '');
  const [draftCustomer, setDraftCustomer] = useState<Customer>(emptyCustomer);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const activeSelectedId = customers.some((customer) => customer.id === selectedId) ? selectedId : (customers[0]?.id ?? '');

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || customer.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [customers, deferredSearch, filter]);

  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === activeSelectedId) ??
    customers.find((customer) => customer.id === activeSelectedId) ??
    customers[0];

  const purchases = selectedCustomer ? customerPurchases[selectedCustomer.id] ?? [] : [];

  const openAddCustomer = () => {
    setDraftCustomer(emptyCustomer());
    setAddingCustomer(true);
  };

  const saveCustomer = () => {
    if (!draftCustomer.name.trim() || !draftCustomer.email.trim()) {
      onNotify('Customer name and email are required.', 'info');
      return;
    }

    const nextCustomer: Customer = {
      ...draftCustomer,
      id: `c${Date.now()}`,
      name: draftCustomer.name.trim(),
      email: draftCustomer.email.trim(),
      terms: draftCustomer.type === 'trade' ? draftCustomer.terms || 'Net 30' : undefined,
      creditLimit: draftCustomer.type === 'trade' ? Number(draftCustomer.creditLimit ?? 0) : undefined,
      loyaltyPoints: Number(draftCustomer.loyaltyPoints ?? 0),
      totalSpent: 0,
      balance: 0,
      lastPurchase: 'No purchases yet',
    };

    setSavingCustomer(true);
    void (async () => {
      try {
        await addCustomer(nextCustomer);
        setSelectedId(nextCustomer.id);
        setAddingCustomer(false);
        onNotify(`Added customer ${nextCustomer.name}.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to add the customer.', 'info');
      } finally {
        setSavingCustomer(false);
      }
    })();
  };

  if (!selectedCustomer) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col gap-2.5 border-b bg-[var(--bg2)] px-5 py-3.5 xl:flex-row xl:items-center">
        <Input
          placeholder="Search customers by name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full xl:max-w-[320px]"
        />
        <Select value={filter} onChange={(event) => setFilter(event.target.value as CustomerFilter)}>
          <option value="all">All Customers</option>
          <option value="trade">Trade Accounts</option>
          <option value="retail">Retail</option>
        </Select>
        <Btn variant="primary" className="ml-auto" onClick={openAddCustomer}>
          Add Customer
        </Btn>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
        <div className="flex-1 overflow-y-auto">
          <Table headers={['Customer', 'Type', 'Total Spent', 'Last Purchase', 'Balance']}>
            {filteredCustomers.map((customer) => (
              <TR key={customer.id} selected={selectedCustomer.id === customer.id} onClick={() => setSelectedId(customer.id)}>
                <TD>
                  <div className="text-[13px] text-[var(--text)]">{customer.name}</div>
                  <div className="mt-1 font-mono-iron text-[11px] text-[var(--text3)]">{customer.email}</div>
                </TD>
                <TD>
                  <Badge variant={customer.type === 'trade' ? 'trade' : 'green'}>
                    {customer.type === 'trade' ? 'Trade' : 'Retail'}
                  </Badge>
                </TD>
                <TD>
                  <Mono className="text-[var(--accent)]">{fmt(customer.totalSpent)}</Mono>
                </TD>
                <TD>
                  <Mono className="text-[11px] text-[var(--text3)]">{customer.lastPurchase}</Mono>
                </TD>
                <TD>
                  <Mono className={customer.balance < 0 ? 'text-[var(--red)]' : 'text-[var(--green)]'}>
                    {fmt(customer.balance)}
                  </Mono>
                </TD>
              </TR>
            ))}
          </Table>
        </div>

        <aside className="w-full border-l bg-[var(--bg2)] p-5 xl:w-[360px]">
          <div className="border-b pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] font-display text-[22px] font-bold text-[var(--accent)]">
                {selectedCustomer.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <div className="font-display text-[20px] font-bold uppercase tracking-[0.05em] text-[var(--text)]">
                  {selectedCustomer.name}
                </div>
                <div className="mt-2">
                  <Badge variant={selectedCustomer.type === 'trade' ? 'trade' : 'green'}>
                    {selectedCustomer.type === 'trade'
                      ? `Trade Account ${selectedCustomer.terms ? `/ ${selectedCustomer.terms}` : ''}`
                      : 'Retail'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-sm border bg-[var(--bg3)] p-3">
              <div className="font-mono-iron text-[9px] uppercase tracking-[0.16em] text-[var(--text3)]">Total Spent YTD</div>
              <div className="mt-2 text-[14px] text-[var(--accent)]">{fmt(selectedCustomer.totalSpent)}</div>
            </div>
            <div className="rounded-sm border bg-[var(--bg3)] p-3">
              <div className="font-mono-iron text-[9px] uppercase tracking-[0.16em] text-[var(--text3)]">Open Balance</div>
              <div className={`mt-2 text-[14px] ${selectedCustomer.balance < 0 ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                {fmt(selectedCustomer.balance)}
              </div>
            </div>
            <div className="rounded-sm border bg-[var(--bg3)] p-3">
              <div className="font-mono-iron text-[9px] uppercase tracking-[0.16em] text-[var(--text3)]">Credit Limit</div>
              <div className="mt-2 text-[14px] text-[var(--text)]">{fmt(selectedCustomer.creditLimit ?? 0)}</div>
            </div>
            <div className="rounded-sm border bg-[var(--bg3)] p-3">
              <div className="font-mono-iron text-[9px] uppercase tracking-[0.16em] text-[var(--text3)]">Loyalty Points</div>
              <div className="mt-2 text-[14px] text-[var(--green)]">{selectedCustomer.loyaltyPoints ?? 0} pts</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
              Recent Purchases
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Order ID', 'Date', 'Amount', 'Status'].map((header) => (
                    <th
                      key={header}
                      className="border-b bg-[var(--bg3)] px-3 py-2 text-left font-mono-iron text-[10px] uppercase tracking-[0.16em] text-[var(--text3)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b last:border-b-0 hover:bg-[var(--bg3)]">
                    <td className="px-3 py-2 font-mono-iron text-[12px] text-[var(--accent)]">{purchase.id}</td>
                    <td className="px-3 py-2 font-mono-iron text-[11px] text-[var(--text3)]">{purchase.date}</td>
                    <td className="px-3 py-2 font-mono-iron text-[13px] text-[var(--accent)]">{fmt(purchase.amount)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={purchaseTone[purchase.status]}>{purchase.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      {addingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[560px] rounded-sm border bg-[var(--bg2)]">
            <div className="border-b px-5 py-4 font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
              Add Customer
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Input
                placeholder="Customer name"
                value={draftCustomer.name}
                onChange={(event) => setDraftCustomer((current) => ({ ...current, name: event.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Email"
                value={draftCustomer.email}
                onChange={(event) => setDraftCustomer((current) => ({ ...current, email: event.target.value }))}
                className="sm:col-span-2"
              />
              <Select
                value={draftCustomer.type}
                onChange={(event) =>
                  setDraftCustomer((current) => ({
                    ...current,
                    type: event.target.value as Customer['type'],
                  }))
                }
              >
                <option value="retail">Retail</option>
                <option value="trade">Trade</option>
              </Select>
              <div className="rounded-sm border border-[var(--border2)] bg-[var(--bg3)] px-3 py-2 font-mono-iron text-[12px] text-[var(--text2)]">
                New customers start with zero balance and no purchase history.
              </div>
              {draftCustomer.type === 'trade' ? (
                <>
                  <Input
                    placeholder="Credit limit"
                    type="number"
                    min="0"
                    value={String(draftCustomer.creditLimit ?? 0)}
                    onChange={(event) =>
                      setDraftCustomer((current) => ({ ...current, creditLimit: Number(event.target.value) }))
                    }
                  />
                  <Input
                    placeholder="Terms"
                    value={draftCustomer.terms ?? ''}
                    onChange={(event) => setDraftCustomer((current) => ({ ...current, terms: event.target.value }))}
                  />
                </>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={() => setAddingCustomer(false)} disabled={savingCustomer}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={saveCustomer} disabled={savingCustomer}>
                {savingCustomer ? 'Saving...' : 'Save Customer'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
