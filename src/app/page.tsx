'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import CustomersView from '@/components/views/CustomersView';
import DashboardView from '@/components/views/DashboardView';
import InventoryView from '@/components/views/InventoryView';
import OrdersView from '@/components/views/OrdersView';
import POSView from '@/components/views/POSView';
import ReportsView from '@/components/views/ReportsView';
import SettingsView from '@/components/views/SettingsView';
import SuppliersView from '@/components/views/SuppliersView';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { ToastTone, View } from '@/types';

type ViewComponentProps = {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
};

const VIEWS: Record<View, React.ComponentType<ViewComponentProps>> = {
  dashboard: DashboardView,
  pos: POSView,
  inventory: InventoryView,
  orders: OrdersView,
  customers: CustomersView,
  reports: ReportsView,
  suppliers: SuppliersView,
  settings: SettingsView,
};

export default function Home() {
  return (
    <AppStateProvider>
      <HomeShell />
    </AppStateProvider>
  );
}

function HomeShell() {
  const { backendError } = useAppState();
  const [view, setView] = useState<View>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const ActiveView = VIEWS[view];
  const activeToast = toast ?? (backendError ? { message: backendError, tone: 'info' as const } : null);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleNotify = (message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone });
  };

  const handleNav = (nextView: View) => {
    setView(nextView);
    setMobileNavOpen(false);
  };

  const handleAction = () => {
    if (view === 'dashboard') {
      handleNav('orders');
      handleNotify('Opened the live order queue.', 'info');
      return;
    }

    if (view === 'inventory') {
      handleNotify('Product intake drawer is ready for API wiring.', 'info');
      return;
    }

    if (view === 'orders') {
      handleNotify('Picklist sent to the back-office printer.', 'success');
      return;
    }

    if (view === 'customers') {
      handleNotify('Customer intake form primed for a new trade account.', 'info');
      return;
    }

    if (view === 'reports') {
      handleNotify('PDF export queued. Replace with your reporting endpoint when the API is ready.', 'success');
      return;
    }

    if (view === 'suppliers') {
      handleNotify('Draft purchase order created for Hager Electric.', 'success');
      return;
    }

    if (view === 'settings') {
      handleNotify('Supabase-backed settings are ready for updates.', 'success');
      return;
    }

    handleNotify('Register note added to the current session.', 'success');
  };

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)]">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}
      <Sidebar active={view} onNav={handleNav} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <Topbar view={view} onAction={handleAction} onMenu={() => setMobileNavOpen(true)} />
      <main className="h-screen pt-[52px] lg:pl-[220px]">
        <div key={view} className="h-[calc(100vh-52px)] animate-view">
          <ActiveView onNav={handleNav} onNotify={handleNotify} />
        </div>
      </main>
      {activeToast ? (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-sm border border-[var(--border2)] bg-[var(--bg2)] px-4 py-3">
          {activeToast.tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[var(--green)]" />
          ) : (
            <Info className="h-4 w-4 text-[var(--blue)]" />
          )}
          <span className="text-[13px] text-[var(--text)]">{activeToast.message}</span>
        </div>
      ) : null}
    </div>
  );
}
