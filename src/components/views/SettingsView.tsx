'use client';

import { useEffect, useState } from 'react';
import { Badge, Btn, Input, Select, Toggle } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { SETTINGS_NAV } from '@/lib/data';
import { cn, fmt } from '@/lib/utils';
import { AppSettings, Integration, SettingsSection, ToastTone, View } from '@/types';

export default function SettingsView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { settings, updateSettings, resetData, seedDemoData } = useAppState();
  const [activeSection, setActiveSection] = useState<SettingsSection>('Store Info');
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [seedingDemoData, setSeedingDemoData] = useState(false);

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const toggle = (key: keyof AppSettings['toggles']) => {
    setDraftSettings((current) => ({
      ...current,
      toggles: {
        ...current.toggles,
        [key]: !current.toggles[key],
      },
    }));
  };

  const setStoreField = (key: keyof AppSettings['storeInfo'], value: string) => {
    setDraftSettings((current) => ({
      ...current,
      storeInfo: { ...current.storeInfo, [key]: value },
    }));
  };

  const setIntegrationState = (target: Integration['name']) => {
    setDraftSettings((current) => ({
      ...current,
      integrations: current.integrations.map((integration) =>
        integration.name === target
          ? { ...integration, connected: !integration.connected }
          : integration
      ),
    }));
  };

  const renderRow = (label: string, hint: string, control: React.ReactNode) => (
    <div className="flex flex-col gap-3 border-b px-[18px] py-3.5 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-[380px]">
        <div className="text-[13px] font-medium text-[var(--text)]">{label}</div>
        <div className="mt-0.5 text-[12px] text-[var(--text3)]">{hint}</div>
      </div>
      <div className="lg:min-w-[220px]">{control}</div>
    </div>
  );

  const renderSection = () => {
    if (activeSection === 'Store Info') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Store Information
          </div>
          {renderRow(
            'Store Name',
            'Appears on receipts and customer invoices.',
            <Input
              value={draftSettings.storeInfo.storeName}
              onChange={(event) => setStoreField('storeName', event.target.value)}
            />
          )}
          {renderRow(
            'Address',
            'Shown in printouts, customer emails and VAT exports.',
            <Input
              value={draftSettings.storeInfo.address}
              onChange={(event) => setStoreField('address', event.target.value)}
            />
          )}
          {renderRow(
            'VAT Number',
            'Used in quarterly VAT reporting and compliant receipts.',
            <Input
              value={draftSettings.storeInfo.vatNumber}
              onChange={(event) => setStoreField('vatNumber', event.target.value)}
            />
          )}
          {renderRow(
            'Phone',
            'Store contact number for customer pickups and SMS replies.',
            <Input
              value={draftSettings.storeInfo.phone}
              onChange={(event) => setStoreField('phone', event.target.value)}
            />
          )}
          {renderRow(
            'Currency',
            'Controls currency formatting across POS and reporting.',
            <Select
              value={draftSettings.storeInfo.currency}
              onChange={(event) => setStoreField('currency', event.target.value)}
            >
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Pound Sterling</option>
              <option value="USD">USD - US Dollar</option>
            </Select>
          )}
        </div>
      );
    }

    if (activeSection === 'POS Settings') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            POS Behaviour
          </div>
          {renderRow('Print receipt automatically', 'Immediately print a receipt after a completed sale.', <Toggle on={draftSettings.toggles.autoReceipt} onChange={() => toggle('autoReceipt')} />)}
          {renderRow('Ask for customer on every sale', 'Prompt staff to select a customer before checkout.', <Toggle on={draftSettings.toggles.askCustomer} onChange={() => toggle('askCustomer')} />)}
          {renderRow('Enable offline mode', 'Allow checkout and stock reservations when internet drops.', <Toggle on={draftSettings.toggles.offlineMode} onChange={() => toggle('offlineMode')} />)}
          {renderRow('Require manager PIN for discounts', 'Protect margin on manual price overrides and line discounts.', <Toggle on={draftSettings.toggles.managerPin} onChange={() => toggle('managerPin')} />)}
        </div>
      );
    }

    if (activeSection === 'Payments') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Payments
          </div>
          {renderRow(
            'Default trade terms',
            'Applied to new trade accounts and manual invoices.',
            <Select
              value={draftSettings.defaultTerms}
              onChange={(event) =>
                setDraftSettings((current) => ({ ...current, defaultTerms: event.target.value }))
              }
            >
              <option>Net 14</option>
              <option>Net 30</option>
              <option>Due on Receipt</option>
            </Select>
          )}
          {renderRow('Cash rounding', 'Round cash transactions to the nearest 0.05 when required.', <Toggle on={draftSettings.toggles.cashRounding} onChange={() => toggle('cashRounding')} />)}
          {renderRow('Capture signature on account sales', 'Prompt for a signature when charging trade customers.', <Toggle on={draftSettings.toggles.captureSignature} onChange={() => toggle('captureSignature')} />)}
          {renderRow('Terminal profile', 'Current countertop terminal bound to register 1.', <div className="rounded-sm border bg-[var(--bg3)] px-3 py-2 font-mono-iron text-[12px] text-[var(--text)]">Stripe Terminal / Connected</div>)}
        </div>
      );
    }

    if (activeSection === 'Tax & VAT') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Tax & VAT
          </div>
          {renderRow(
            'Default VAT Rate',
            'Primary sales tax applied to stocked items.',
            <Select
              value={String(draftSettings.vatRate)}
              onChange={(event) =>
                setDraftSettings((current) => ({ ...current, vatRate: Number(event.target.value) }))
              }
            >
              <option value="21">21%</option>
              <option value="9">9%</option>
              <option value="0">0%</option>
            </Select>
          )}
          {renderRow(
            'Filing Cycle',
            'Controls reminders and reporting pack cadence.',
            <Select
              value={draftSettings.filingCycle}
              onChange={(event) =>
                setDraftSettings((current) => ({
                  ...current,
                  filingCycle: event.target.value as AppSettings['filingCycle'],
                }))
              }
            >
              <option>Quarterly</option>
              <option>Monthly</option>
              <option>Annually</option>
            </Select>
          )}
          {renderRow('Show VAT breakdown on receipts', 'Display net, VAT and gross values at the register.', <Toggle on={draftSettings.toggles.showVatBreakdown} onChange={() => toggle('showVatBreakdown')} />)}
        </div>
      );
    }

    if (activeSection === 'Receipts') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Receipts
          </div>
          {renderRow('Print store logo', 'Include the current store mark at the top of each receipt.', <Toggle on={draftSettings.toggles.printLogo} onChange={() => toggle('printLogo')} />)}
          {renderRow('Footer message', 'Closing line printed at the bottom of receipts and invoices.', <Input value={draftSettings.receiptFooter} onChange={(event) => setDraftSettings((current) => ({ ...current, receiptFooter: event.target.value }))} />)}
          {renderRow(
            'Receipt width',
            'Thermal printer paper width profile.',
            <Select
              value={draftSettings.receiptWidth}
              onChange={(event) =>
                setDraftSettings((current) => ({
                  ...current,
                  receiptWidth: event.target.value as AppSettings['receiptWidth'],
                }))
              }
            >
              <option>80mm</option>
              <option>58mm</option>
            </Select>
          )}
        </div>
      );
    }

    if (activeSection === 'Staff & Roles') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)] p-5">
          <div className="mb-4 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Staff & Roles
          </div>
          <div className="space-y-3">
            {[
              { name: 'Marcus J.', role: 'Manager', access: 'Full access / discounts / reports' },
              { name: 'Sarah K.', role: 'Supervisor', access: 'POS / orders / customers' },
              { name: 'Tom B.', role: 'Cashier', access: 'POS only / no manual discounts' },
            ].map((person) => (
              <div key={person.name} className="rounded-sm border bg-[var(--bg3)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] text-[var(--text)]">{person.name}</div>
                    <div className="mt-1 text-[12px] text-[var(--text3)]">{person.access}</div>
                  </div>
                  <Badge variant="gray">{person.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'Integrations') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Integrations
          </div>
          {draftSettings.integrations.map((integration) =>
            renderRow(
              integration.name,
              integration.hint,
              <Btn
                size="sm"
                variant={integration.connected ? 'success' : 'default'}
                onClick={() => {
                  setIntegrationState(integration.name);
                  onNotify(
                    integration.connected
                      ? `${integration.name} disconnected locally.`
                      : `${integration.name} connected locally.`,
                    integration.connected ? 'info' : 'success'
                  );
                }}
              >
                {integration.connected ? 'Connected' : 'Connect'}
              </Btn>
            )
          )}
        </div>
      );
    }

    if (activeSection === 'Notifications') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Notifications
          </div>
          {renderRow('Operations email', 'Primary address for daily summaries and order exceptions.', <Input value={draftSettings.notificationsEmail} onChange={(event) => setDraftSettings((current) => ({ ...current, notificationsEmail: event.target.value }))} />)}
          {renderRow('Email receipts', 'Send a copy of every receipt when a customer email is captured.', <Toggle on={draftSettings.toggles.emailReceipts} onChange={() => toggle('emailReceipts')} />)}
          {renderRow('SMS order ready alerts', 'Notify customers when special orders are available for pickup.', <Toggle on={draftSettings.toggles.smsReadyAlerts} onChange={() => toggle('smsReadyAlerts')} />)}
        </div>
      );
    }

    if (activeSection === 'Backup & Data') {
      return (
        <div className="rounded-sm border bg-[var(--bg2)]">
          <div className="border-b px-[18px] py-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Backup & Data
          </div>
          {renderRow('Nightly backup', 'Run a full encrypted backup after store close.', <Toggle on={draftSettings.toggles.nightlyBackup} onChange={() => toggle('nightlyBackup')} />)}
          {renderRow('Audit log export', 'Attach staff audit history when exporting operational data.', <Toggle on={draftSettings.toggles.includeAuditLog} onChange={() => toggle('includeAuditLog')} />)}
          {renderRow(
            'Retention window',
            'Time period kept in the live SaaS workspace.',
            <Select
              value={String(draftSettings.retentionDays)}
              onChange={(event) =>
                setDraftSettings((current) => ({ ...current, retentionDays: Number(event.target.value) }))
              }
            >
              <option value="180">180 days</option>
              <option value="365">365 days</option>
              <option value="730">730 days</option>
            </Select>
          )}
          {renderRow('Last successful backup', 'Latest verified cloud backup from the local workspace.', <div className="rounded-sm border bg-[var(--bg3)] px-3 py-2 font-mono-iron text-[12px] text-[var(--text)]">23 Mar 2026 / 02:15 / VERIFIED</div>)}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-sm border bg-[var(--bg2)] p-5">
          <div className="mb-3 font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
            Subscription
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            {[
              { name: 'Starter', price: 199, features: '1 register / POS / inventory / basic reports' },
              { name: 'Pro', price: 349, features: 'Orders / trade accounts / suppliers / integrations' },
              { name: 'Enterprise', price: 549, features: 'Multi-location / custom reports / priority onboarding' },
            ].map((plan) => (
              <button
                key={plan.name}
                type="button"
                onClick={() =>
                  setDraftSettings((current) => ({
                    ...current,
                    subscriptionPlan: plan.name as AppSettings['subscriptionPlan'],
                  }))
                }
                className={cn(
                  'rounded-sm border p-4 text-left transition-colors',
                  draftSettings.subscriptionPlan === plan.name
                    ? 'border-[var(--accent)] bg-[rgba(232,160,32,0.12)]'
                    : 'bg-[var(--bg3)] hover:border-[var(--border2)]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-[16px] font-bold uppercase tracking-[0.05em] text-[var(--text)]">
                    {plan.name}
                  </div>
                  {draftSettings.subscriptionPlan === plan.name ? <Badge variant="amber">Current</Badge> : null}
                </div>
                <div className="mt-3 font-display text-[22px] font-bold uppercase text-[var(--accent)]">
                  {fmt(plan.price)}/mo
                </div>
                <div className="mt-2 text-[12px] text-[var(--text3)]">{plan.features}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-sm border bg-[var(--bg2)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-[14px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                Current Commercial Terms
              </div>
              <div className="mt-1 text-[12px] text-[var(--text3)]">
                {draftSettings.subscriptionPlan} plan with onboarding complete and annual billing enabled.
              </div>
            </div>
            <Badge variant="green">ACTIVE</Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <aside className="w-full border-r bg-[var(--bg2)] py-4 lg:w-[200px]">
        {SETTINGS_NAV.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => setActiveSection(section)}
            className={cn(
              'w-full border-l-2 px-5 py-2.5 text-left text-[13px] transition-colors',
              activeSection === section
                ? 'border-l-[var(--accent)] bg-[rgba(232,160,32,0.10)] text-[var(--accent)]'
                : 'border-l-transparent text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]'
            )}
          >
            {section}
          </button>
        ))}
      </aside>

      <section className="flex-1 overflow-y-auto p-5 sm:p-6">
        {renderSection()}
        <div className="mt-5 flex justify-end gap-2">
          <Btn
            disabled={resettingData || savingSettings || seedingDemoData}
            onClick={() => {
              setSeedingDemoData(true);
              void (async () => {
                try {
                  await seedDemoData();
                  onNotify('Loaded the IronDesk demo workspace for this account.', 'success');
                } catch (error) {
                  onNotify(error instanceof Error ? error.message : 'Failed to load demo data.', 'info');
                } finally {
                  setSeedingDemoData(false);
                }
              })();
            }}
          >
            {seedingDemoData ? 'Loading Demo...' : 'Load Demo Data'}
          </Btn>
          <Btn
            disabled={resettingData || savingSettings || seedingDemoData}
            onClick={() => {
              setResettingData(true);
              void (async () => {
                try {
                  await resetData();
                  onNotify('Cleared the current workspace data.', 'success');
                } catch (error) {
                  onNotify(error instanceof Error ? error.message : 'Failed to reset demo data.', 'info');
                } finally {
                  setResettingData(false);
                }
              })();
            }}
          >
            {resettingData ? 'Clearing...' : 'Clear Data'}
          </Btn>
          <Btn
            variant="primary"
            disabled={savingSettings || resettingData || seedingDemoData}
            onClick={() => {
              setSavingSettings(true);
              void (async () => {
                try {
                  await updateSettings(draftSettings);
                  onNotify(`Saved ${activeSection} settings to Supabase.`, 'success');
                } catch (error) {
                  onNotify(error instanceof Error ? error.message : 'Failed to save settings.', 'info');
                } finally {
                  setSavingSettings(false);
                }
              })();
            }}
          >
            {savingSettings ? 'Saving...' : 'Save Changes'}
          </Btn>
        </div>
      </section>
    </div>
  );
}
