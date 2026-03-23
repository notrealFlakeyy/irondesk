'use client';

import { startTransition, useEffect, useState } from 'react';
import { CheckCircle2, DatabaseZap, Info } from 'lucide-react';
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
import { Btn } from '@/components/ui';
import { AppStateProvider, useAppState } from '@/lib/app-state';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
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

export default function HomeShell({ userEmail }: { userEmail: string }) {
  return (
    <AppStateProvider>
      <HomeShellInner userEmail={userEmail} />
    </AppStateProvider>
  );
}

function HomeShellInner({ userEmail }: { userEmail: string }) {
  const { backendError, syncing, dataSource, products, customers, orders, suppliers, transactions, seedDemoData } =
    useAppState();
  const [view, setView] = useState<View>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const ActiveView = VIEWS[view];
  const activeToast = toast ?? (backendError ? { message: backendError, tone: 'info' as const } : null);
  const workspaceHasData =
    products.length + customers.length + orders.length + suppliers.length + transactions.length > 0;

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

  const handleSignOut = () => {
    const supabase = createSupabaseBrowserClient();
    setSigningOut(true);

    void (async () => {
      try {
        await supabase.auth.signOut();
        startTransition(() => {
          window.location.href = '/login';
        });
      } finally {
        setSigningOut(false);
      }
    })();
  };

  const handleSeedDemo = () => {
    setSeedingDemo(true);

    void (async () => {
      try {
        await seedDemoData();
        handleNotify('Loaded the IronDesk demo workspace for this account.', 'success');
      } catch (error) {
        handleNotify(error instanceof Error ? error.message : 'Failed to load demo data.', 'info');
      } finally {
        setSeedingDemo(false);
      }
    })();
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
      <Sidebar
        active={view}
        onNav={handleNav}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
      <Topbar view={view} onAction={handleAction} onMenu={() => setMobileNavOpen(true)} />
      <main className="h-screen pt-[52px] lg:pl-[220px]">
        <div key={view} className="h-[calc(100vh-52px)] animate-view">
          {!syncing && dataSource === 'supabase' && !workspaceHasData && view !== 'settings' ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="w-full max-w-[560px] rounded-sm border bg-[var(--bg2)] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg3)] text-[var(--accent)]">
                    <DatabaseZap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-[20px] font-bold uppercase tracking-[0.06em] text-[var(--text)]">
                      Workspace Ready
                    </div>
                    <div className="mt-1 text-[13px] text-[var(--text3)]">
                      Your account is authenticated, but this store has no live data yet.
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-sm border bg-[var(--bg3)] p-4 text-[13px] text-[var(--text2)]">
                  Load the IronDesk demo dataset to explore the full product, order, customer, and reporting flow,
                  or head to settings and start from an empty workspace.
                </div>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Btn onClick={() => handleNav('settings')}>Open Settings</Btn>
                  <Btn variant="primary" onClick={handleSeedDemo} disabled={seedingDemo}>
                    {seedingDemo ? 'Loading Demo...' : 'Load Demo Data'}
                  </Btn>
                </div>
              </div>
            </div>
          ) : (
            <ActiveView onNav={handleNav} onNotify={handleNotify} />
          )}
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
