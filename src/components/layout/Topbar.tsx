'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Btn } from '@/components/ui';
import { View } from '@/types';

const meta: Record<View, { title: string; sub: string; action: string }> = {
  dashboard: { title: 'Dashboard', sub: "Mon 23 Mar 2026 / Hartmann's Hardware", action: 'New Order' },
  pos: { title: 'Point of Sale', sub: 'Register 1 / Open since 08:00', action: 'Register Note' },
  inventory: { title: 'Inventory', sub: '367 products / 9 active alerts', action: 'Add Product' },
  orders: { title: 'Orders', sub: '12 open orders / 3 need action', action: 'Print Picklist' },
  customers: { title: 'Customers', sub: '148 customers / 12 trade accounts', action: 'Add Customer' },
  reports: { title: 'Reports', sub: 'March 2026 reporting pack', action: 'Export PDF' },
  suppliers: { title: 'Suppliers', sub: '6 active suppliers', action: 'Create PO' },
  settings: { title: 'Settings', sub: 'Operational configuration', action: 'Save Changes' },
};

export default function Topbar({
  view,
  onAction,
  onMenu,
}: {
  view: View;
  onAction: () => void;
  onMenu: () => void;
}) {
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date())
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentMeta = meta[view];

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-[52px] items-center gap-3 border-b bg-[var(--bg2)] px-4 lg:left-[220px] lg:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] text-[var(--text2)] lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>
      <span className="font-display text-[20px] font-bold uppercase tracking-[0.06em] text-[var(--text)]">
        {currentMeta.title}
      </span>
      <div className="hidden h-5 w-px bg-[var(--border)] md:block" />
      <span className="hidden font-mono-iron text-[11px] uppercase tracking-[0.12em] text-[var(--text3)] md:block">
        {currentMeta.sub}
      </span>
      <div className="ml-auto flex items-center gap-2.5">
        <span className="hidden font-mono-iron text-[13px] tracking-[0.1em] text-[var(--text2)] sm:block">{time}</span>
        <Btn size="sm" variant="primary" onClick={onAction}>
          {currentMeta.action}
        </Btn>
      </div>
    </header>
  );
}
