'use client';

import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { SectionLabel } from '@/components/ui';
import { cn } from '@/lib/utils';
import { View } from '@/types';

const navItems: { id: View; label: string; badge?: number; section: string }[] = [
  { id: 'dashboard', label: 'Dashboard', section: 'ops' },
  { id: 'pos', label: 'Point of Sale', section: 'ops' },
  { id: 'orders', label: 'Orders', section: 'ops', badge: 3 },
  { id: 'inventory', label: 'Inventory', section: 'stock' },
  { id: 'suppliers', label: 'Suppliers', section: 'stock' },
  { id: 'customers', label: 'Customers', section: 'biz' },
  { id: 'reports', label: 'Reports', section: 'biz' },
  { id: 'settings', label: 'Settings', section: 'biz' },
];

const navIcons = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  orders: ClipboardList,
  inventory: Boxes,
  suppliers: Truck,
  customers: Users,
  reports: BarChart3,
  settings: Settings2,
} as const;

interface SidebarProps {
  active: View;
  onNav: (view: View) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ active, onNav, open, onClose }: SidebarProps) {
  const sections = [
    { key: 'ops', label: 'Operations' },
    { key: 'stock', label: 'Stock' },
    { key: 'biz', label: 'Business' },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r bg-[var(--bg2)] transition-transform duration-150 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex items-start justify-between border-b px-[18px] pb-4 pt-5 lg:block">
        <div>
          <div className="font-display text-[22px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            IronDesk
          </div>
          <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.15em] text-[var(--text3)]">
            POS / DEMO BUILD
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border border-[var(--border2)] bg-[var(--bg4)] p-2 text-[var(--text2)] lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.key} className="border-b py-2">
            <SectionLabel>{section.label}</SectionLabel>
            {navItems
              .filter((item) => item.section === section.key)
              .map((item) => {
                const Icon = navIcons[item.id];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNav(item.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 border-l-2 px-[18px] py-[9px] text-left text-[13px] font-medium transition-colors',
                      active === item.id
                        ? 'border-l-[var(--accent)] bg-[rgba(232,160,32,0.12)] text-[var(--accent)]'
                        : 'border-l-transparent text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-sm border border-[#6c3030] bg-[#251313] px-1.5 py-0.5 font-mono-iron text-[10px] text-[#ef7676]">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="border-t px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] font-display text-[13px] font-bold text-[var(--accent)]">
            MJ
          </div>
          <div>
            <div className="text-[13px] font-medium text-[var(--text)]">Marcus J.</div>
            <div className="font-mono-iron text-[10px] uppercase tracking-[0.14em] text-[var(--text3)]">
              MANAGER
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
