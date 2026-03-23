'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  FileText,
  Minus,
  NotebookPen,
  Play,
  Plus,
  ScanLine,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { Btn, Input, Select } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { CATEGORIES } from '@/lib/data';
import { cn, fmt } from '@/lib/utils';
import { CartItem, PaymentMethod, ToastTone, View } from '@/types';

const paymentMeta = {
  card: {
    label: 'Card',
    icon: CreditCard,
    ready: 'Card reader ready - tap, insert or swipe',
    processing: 'Authorizing terminal payment and capturing receipt',
  },
  cash: {
    label: 'Cash',
    icon: Wallet,
    ready: 'Cash drawer ready - count change and confirm',
    processing: 'Recording cash tender, change due and till movement',
  },
  invoice: {
    label: 'Invoice',
    icon: FileText,
    ready: 'Invoice will be posted to the customer trade account',
    processing: 'Posting invoice to the customer ledger and audit trail',
  },
} satisfies Record<
  PaymentMethod,
  { label: string; icon: typeof CreditCard; ready: string; processing: string }
>;

type PaymentPhase = 'ready' | 'authorizing' | 'capturing' | 'finalizing';

function pause(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatHeldTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(value))
    .replace(',', '');
}

function formatRegisterStamp(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function normalizeScan(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export default function POSView({
  onNav,
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const {
    customers,
    products,
    heldCarts,
    heldCartItems,
    registerNotes,
    checkoutCart,
    holdCart,
    resumeHeldCart,
    deleteHeldCart,
    createSpecialOrder,
    addRegisterNote,
    settings,
  } = useAppState();
  const [search, setSearch] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [category, setCategory] = useState<'all' | (typeof CATEGORIES)[number]['id']>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>('ready');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [specialOrderSubmitting, setSpecialOrderSubmitting] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdSubmitting, setHoldSubmitting] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');
  const [holdNote, setHoldNote] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [resumeSubmitting, setResumeSubmitting] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [cashTendered, setCashTendered] = useState('');
  const deferredSearch = useDeferredValue(search);

  const selectedCustomerRecord = customers.find((customer) => customer.id === selectedCustomer);
  const canInvoice = selectedCustomerRecord?.type === 'trade';

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.cat === category;
      const query = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, deferredSearch, products]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (sku: string) => {
    const product = products.find((item) => item.sku === sku);
    if (!product || product.stock === 0) return;

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.sku === sku);
      if (existing) {
        return currentCart.map((item) =>
          item.sku === sku ? { ...item, qty: Math.min(item.qty + 1, product.stock) } : item
        );
      }

      return [...currentCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (sku: string, delta: number) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        const latestProduct = products.find((product) => product.sku === item.sku) ?? item;
        if (item.sku !== sku) return [{ ...item, stock: latestProduct.stock }];

        const nextQty = Math.max(0, Math.min(item.qty + delta, latestProduct.stock));
        if (nextQty === 0) return [];
        return [{ ...item, stock: latestProduct.stock, qty: nextQty }];
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountEnabled(false);
  };

  const openHoldDialog = () => {
    const customerLabel = selectedCustomerRecord?.name ?? 'Walk-in';
    const timestamp = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
    setHoldLabel(`${customerLabel} / ${timestamp}`);
    setHoldNote('');
    setHoldOpen(true);
  };

  const openRegisterNoteDialog = () => {
    setNoteBody('');
    setNoteOpen(true);
  };

  useEffect(() => {
    const handleContextAction = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: View }>).detail;
      if (detail?.view !== 'pos') return;
      openRegisterNoteDialog();
    };

    window.addEventListener('irondesk:context-action', handleContextAction);
    return () => window.removeEventListener('irondesk:context-action', handleContextAction);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = discountEnabled ? subtotal * 0.05 : 0;
  const taxable = subtotal - discount;
  const vat = taxable * (settings.vatRate / 100);
  const grandTotal = taxable + vat;
  const cashTenderedAmount = Number(cashTendered || 0);
  const cashChange = paymentMethod === 'cash' ? Math.max(0, cashTenderedAmount - grandTotal) : 0;
  const paymentStatus =
    paymentPhase === 'ready' ? paymentMeta[paymentMethod].ready : paymentMeta[paymentMethod].processing;
  const paymentBlockedReason =
    paymentMethod === 'invoice' && !canInvoice
      ? 'Invoice payments require a selected trade account.'
      : paymentMethod === 'cash' && cashTenderedAmount < grandTotal
        ? 'Cash tendered must cover the full amount due.'
        : null;
  const recentNotes = registerNotes.slice(0, 4);

  const processScan = () => {
    const normalized = normalizeScan(scanCode.trim());
    if (!normalized) {
      onNotify('Enter or scan a SKU first.', 'info');
      return;
    }

    const match =
      products.find((product) => normalizeScan(product.sku) === normalized) ??
      products.find((product) => normalizeScan(product.sku).includes(normalized));

    if (!match) {
      onNotify(`No SKU matched ${scanCode.trim()}.`, 'info');
      return;
    }

    if (match.stock === 0) {
      onNotify(`${match.name} is out of stock.`, 'info');
      return;
    }

    addToCart(match.sku);
    setSearch(match.sku);
    setScanCode('');
    setScanOpen(false);
    onNotify(`Scanned ${match.sku} into the cart.`, 'success');
  };

  const handleHoldCart = () => {
    setHoldSubmitting(true);

    void (async () => {
      try {
        const { heldCartId } = await holdCart({
          cart,
          customerId: selectedCustomer === 'walk-in' ? undefined : selectedCustomer,
          label: holdLabel,
          note: holdNote,
          total: grandTotal,
        });
        clearCart();
        setSelectedCustomer('walk-in');
        setHoldOpen(false);
        onNotify(`Cart parked in hold queue as ${heldCartId}.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to hold the cart.', 'info');
      } finally {
        setHoldSubmitting(false);
      }
    })();
  };

  const handleResumeHeldCart = (heldCartId: string) => {
    setResumeSubmitting(heldCartId);

    void (async () => {
      try {
        const { cart: restoredCart, customerId, label } = await resumeHeldCart(heldCartId);
        setCart(restoredCart);
        setSelectedCustomer(customerId ?? 'walk-in');
        setDiscountEnabled(false);
        onNotify(`Resumed ${label} back onto the register.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to resume the held cart.', 'info');
      } finally {
        setResumeSubmitting(null);
      }
    })();
  };

  const handleDeleteHeldCart = (heldCartId: string) => {
    setDeleteSubmitting(heldCartId);

    void (async () => {
      try {
        await deleteHeldCart(heldCartId);
        onNotify(`Removed ${heldCartId} from the hold queue.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to remove the held cart.', 'info');
      } finally {
        setDeleteSubmitting(null);
      }
    })();
  };

  const handleSaveRegisterNote = () => {
    setNoteSubmitting(true);

    void (async () => {
      try {
        const note = await addRegisterNote({
          body: noteBody,
          author: 'Marcus J.',
          registerLabel: 'Register 1',
        });
        setNoteOpen(false);
        setNoteBody('');
        onNotify(`Register note ${note.id} added to the shift log.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to save the register note.', 'info');
      } finally {
        setNoteSubmitting(false);
      }
    })();
  };

  const handleSpecialOrder = () => {
    setSpecialOrderSubmitting(true);

    void (async () => {
      try {
        const { orderId } = await createSpecialOrder({
          cart,
          customerId: selectedCustomer === 'walk-in' ? undefined : selectedCustomer,
          deposit: grandTotal * 0.2,
        });
        clearCart();
        setSelectedCustomer('walk-in');
        onNav('orders');
        onNotify(`Created special order ${orderId}.`, 'success');
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to create the special order.', 'info');
      } finally {
        setSpecialOrderSubmitting(false);
      }
    })();
  };

  const handleConfirmPayment = () => {
    if (paymentBlockedReason) {
      onNotify(paymentBlockedReason, 'info');
      return;
    }

    setPaymentSubmitting(true);

    void (async () => {
      try {
        setPaymentPhase('authorizing');
        await pause(320);
        setPaymentPhase('capturing');
        await pause(280);
        setPaymentPhase('finalizing');

        const customerName =
          selectedCustomer === 'walk-in'
            ? 'walk-in customer'
            : customers.find((customer) => customer.id === selectedCustomer)?.name ?? 'customer';

        const { receiptId } = await checkoutCart({
          cart,
          customerId: selectedCustomer === 'walk-in' ? undefined : selectedCustomer,
          paymentMethod,
          discountRate: discountEnabled ? 0.05 : 0,
        });

        setPaymentOpen(false);
        clearCart();
        setSelectedCustomer('walk-in');
        setPaymentMethod('card');
        setPaymentPhase('ready');
        setCashTendered('');
        onNotify(`Payment processed for ${customerName}. Receipt ${receiptId} is ready.`, 'success');
      } catch (error) {
        setPaymentPhase('ready');
        onNotify(error instanceof Error ? error.message : 'Failed to process the payment.', 'info');
      } finally {
        setPaymentSubmitting(false);
      }
    })();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden xl:flex-row">
      <section className="flex min-h-0 flex-1 flex-col border-r">
        <div className="border-b bg-[var(--bg2)] px-4 py-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text3)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product name or SKU"
                className="pl-10"
              />
            </div>
            <Btn onClick={() => setScanOpen(true)}>
              <ScanLine className="h-4 w-4" />
              Scan
            </Btn>
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  'rounded-sm border px-3 py-1 font-display text-[12px] uppercase tracking-[0.1em] transition-colors whitespace-nowrap',
                  category === item.id
                    ? 'border-[var(--accent)] bg-[rgba(232,160,32,0.12)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg3)] text-[var(--text3)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] content-start gap-3 overflow-y-auto p-4">
          {filteredProducts.map((product) => {
            const disabled = product.stock === 0;

            return (
              <button
                key={product.sku}
                type="button"
                disabled={disabled}
                onClick={() => addToCart(product.sku)}
                className={cn(
                  'rounded-sm border bg-[var(--bg2)] p-3 text-left transition-all',
                  disabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--bg3)] active:scale-[0.97]'
                )}
              >
                <div className="font-mono-iron text-[9px] uppercase tracking-[0.14em] text-[var(--text3)]">
                  {product.sku}
                </div>
                <div className="mt-1 font-display text-[15px] font-semibold uppercase leading-tight text-[var(--text)]">
                  {product.name}
                </div>
                <div className="mt-3 font-mono-iron text-[16px] text-[var(--accent)]">{fmt(product.price)}</div>
                <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                  {disabled ? 'Out of stock' : `${product.stock} in stock`}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="flex w-full flex-col bg-[var(--bg2)] xl:w-[380px]">
        <div className="flex items-center justify-between border-b px-4 py-3.5">
          <span className="font-display text-[16px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
            Cart
          </span>
          <div className="flex gap-1.5">
            <Btn size="sm" onClick={clearCart} disabled={cart.length === 0}>
              Clear
            </Btn>
            <Btn size="sm" onClick={openHoldDialog} disabled={cart.length === 0}>
              Hold
            </Btn>
          </div>
        </div>

        <div className="border-b px-4 py-3">
          <Select value={selectedCustomer} onChange={(event) => setSelectedCustomer(event.target.value)} className="w-full">
            <option value="walk-in">Walk-in customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.type === 'trade' ? '(Trade)' : '(Retail)'}
              </option>
            ))}
          </Select>
        </div>

        <div className="border-b px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--text)]">
              Held Queue
            </div>
            <div className="font-mono-iron text-[11px] uppercase tracking-[0.14em] text-[var(--text3)]">
              {heldCarts.length} parked
            </div>
          </div>
          <div className="max-h-[150px] space-y-2 overflow-y-auto">
            {heldCarts.length === 0 ? (
              <div className="rounded-sm border border-dashed bg-[var(--bg3)] px-3 py-3 text-[12px] text-[var(--text3)]">
                No held carts waiting at this register.
              </div>
            ) : (
              heldCarts.map((heldCart) => (
                <div key={heldCart.id} className="rounded-sm border bg-[var(--bg3)] px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--text)]">
                        {heldCart.label}
                      </div>
                      <div className="mt-1 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                        {heldCart.customerName} / {heldCart.itemCount} items / {fmt(heldCart.total)}
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--text3)]">{formatHeldTime(heldCart.createdAt)}</div>
                      {heldCart.note ? (
                        <div className="mt-1 text-[11px] text-[var(--text2)]">{heldCart.note}</div>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleResumeHeldCart(heldCart.id)}
                        disabled={resumeSubmitting === heldCart.id || cart.length > 0}
                        className="flex h-7 w-7 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
                        title={cart.length > 0 ? 'Clear or hold the current cart before resuming another one.' : 'Resume held cart'}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHeldCart(heldCart.id)}
                        disabled={deleteSubmitting === heldCart.id}
                        className="flex h-7 w-7 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] text-[var(--text3)] transition-colors hover:bg-[#251313] hover:text-[var(--red)] disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove held cart"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {heldCartItems[heldCart.id]?.length ? (
                    <div className="mt-2 border-t pt-2 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                      {heldCartItems[heldCart.id]
                        .slice(0, 2)
                        .map((item) => `${item.qty}x ${item.sku}`)
                        .join(' / ')}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-b px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--text)]">
              Register Log
            </div>
            <Btn size="sm" onClick={openRegisterNoteDialog}>
              <NotebookPen className="h-4 w-4" />
              New Note
            </Btn>
          </div>
          <div className="max-h-[126px] space-y-2 overflow-y-auto">
            {recentNotes.length === 0 ? (
              <div className="rounded-sm border border-dashed bg-[var(--bg3)] px-3 py-3 text-[12px] text-[var(--text3)]">
                No register notes have been logged this shift.
              </div>
            ) : (
              recentNotes.map((note) => (
                <div key={note.id} className="rounded-sm border bg-[var(--bg3)] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                    <span>{note.author}</span>
                    <span>{formatRegisterStamp(note.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--text2)]">{note.body}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-10 text-center">
              <div className="font-display text-[18px] font-semibold uppercase tracking-[0.08em] text-[var(--text2)]">
                Cart Empty
              </div>
              <div className="text-[13px] text-[var(--text3)]">
                Add products from the left grid, scan a SKU, or resume a held cart.
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.sku} className="flex items-center gap-2.5 border-b px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-[var(--text)]">{item.name}</div>
                  <div className="font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                    {item.sku}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.sku, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] text-[var(--text)]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center font-mono-iron text-[13px] text-[var(--text)]">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.sku, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg4)] text-[var(--text)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="w-20 text-right font-mono-iron text-[13px] text-[var(--accent)]">
                  {fmt(item.price * item.qty)}
                </div>
                <button
                  type="button"
                  onClick={() => updateQty(item.sku, -item.qty)}
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-[var(--text3)] transition-colors hover:bg-[#251313] hover:text-[var(--red)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t px-4 py-3.5">
          <div className="space-y-1.5 text-[13px] text-[var(--text2)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-mono-iron">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>VAT ({settings.vatRate}%)</span>
              <span className="font-mono-iron">{fmt(vat)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span className="font-mono-iron">{discountEnabled ? `-${fmt(discount)}` : fmt(0)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="font-display text-[22px] font-bold uppercase tracking-[0.05em] text-[var(--text)]">
              Grand Total
            </span>
            <span className="font-mono-iron text-[22px] text-[var(--accent)]">{fmt(grandTotal)}</span>
          </div>
        </div>

        <div className="space-y-2 px-3 py-3">
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              setPaymentOpen(true);
              setPaymentMethod(canInvoice ? paymentMethod : paymentMethod === 'invoice' ? 'card' : paymentMethod);
              setPaymentPhase('ready');
              setCashTendered(grandTotal.toFixed(2));
            }}
            className={cn(
              'w-full rounded-sm border py-3.5 font-display text-[18px] font-bold uppercase tracking-[0.08em] transition-colors',
              cart.length === 0
                ? 'cursor-not-allowed border-[var(--border)] bg-[var(--bg4)] text-[var(--text3)]'
                : 'cursor-pointer border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] hover:bg-[#f3ad36]'
            )}
          >
            Charge Customer
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Btn
              className={discountEnabled ? 'border-[var(--accent)] text-[var(--accent)]' : ''}
              onClick={() => setDiscountEnabled((current) => !current)}
              disabled={cart.length === 0}
            >
              {discountEnabled ? 'Remove Discount' : 'Add Discount'}
            </Btn>
            <Btn onClick={handleSpecialOrder} disabled={cart.length === 0 || specialOrderSubmitting}>
              {specialOrderSubmitting ? 'Saving...' : 'Special Order'}
            </Btn>
          </div>
          <div className="font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
            {cartItemCount} units on register / {heldCarts.length} held carts waiting
          </div>
        </div>
      </aside>

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[460px] rounded-sm border bg-[var(--bg2)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                Process Payment
              </span>
              <Btn
                size="sm"
                onClick={() => {
                  if (paymentSubmitting) return;
                  setPaymentOpen(false);
                  setPaymentPhase('ready');
                }}
              >
                Cancel
              </Btn>
            </div>
            <div className="p-5">
              <div className="rounded-sm border bg-[var(--bg3)] p-4 text-center">
                <div className="font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]">
                  Amount Due
                </div>
                <div className="mt-2 font-display text-[40px] font-bold uppercase tracking-[0.04em] text-[var(--accent)]">
                  {fmt(grandTotal)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {(Object.keys(paymentMeta) as PaymentMethod[]).map((method) => {
                  const meta = paymentMeta[method];
                  const Icon = meta.icon;
                  const disabled = method === 'invoice' && !canInvoice;

                  return (
                    <button
                      key={method}
                      type="button"
                      disabled={disabled || paymentSubmitting}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        'rounded-sm border px-3 py-4 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                        paymentMethod === method
                          ? 'border-[var(--accent)] bg-[rgba(232,160,32,0.12)] text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--bg3)] text-[var(--text2)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                      )}
                    >
                      <Icon className="mx-auto h-5 w-5" />
                      <div className="mt-2 font-display text-[12px] font-semibold uppercase tracking-[0.08em]">
                        {meta.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'cash' ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                      Cash Tendered
                    </div>
                    <Input
                      value={cashTendered}
                      onChange={(event) => setCashTendered(event.target.value)}
                      placeholder={grandTotal.toFixed(2)}
                    />
                  </div>
                  <div className="rounded-sm border bg-[var(--bg3)] px-3 py-2.5">
                    <div className="font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                      Change Due
                    </div>
                    <div className="mt-1 font-mono-iron text-[18px] text-[var(--accent)]">{fmt(cashChange)}</div>
                  </div>
                </div>
              ) : null}

              {paymentMethod === 'invoice' ? (
                <div className="mt-4 rounded-sm border bg-[var(--bg3)] px-3 py-3 text-[12px] text-[var(--text2)]">
                  {canInvoice
                    ? `${selectedCustomerRecord?.name} will be charged on ${selectedCustomerRecord.terms ?? settings.defaultTerms}.`
                    : 'Select a trade customer to invoice this sale.'}
                </div>
              ) : null}

              <div className="mt-4 font-mono-iron text-[12px] uppercase tracking-[0.12em] text-[var(--text2)]">
                {paymentStatus}
              </div>
              {paymentBlockedReason ? (
                <div className="mt-2 text-[12px] text-[var(--red)]">{paymentBlockedReason}</div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn
                onClick={() => {
                  if (paymentSubmitting) return;
                  setPaymentOpen(false);
                  setPaymentPhase('ready');
                }}
              >
                Cancel
              </Btn>
              <Btn
                disabled={paymentSubmitting || Boolean(paymentBlockedReason)}
                variant="primary"
                onClick={handleConfirmPayment}
              >
                {paymentSubmitting
                  ? paymentPhase === 'authorizing'
                    ? 'Authorizing...'
                    : paymentPhase === 'capturing'
                      ? 'Capturing...'
                      : 'Finalizing...'
                  : 'Confirm Payment'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {scanOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[420px] rounded-sm border bg-[var(--bg2)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                Scan Barcode
              </span>
              <Btn size="sm" onClick={() => setScanOpen(false)}>
                Cancel
              </Btn>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-sm border bg-[var(--bg3)] px-3 py-3 text-[12px] text-[var(--text2)]">
                Plug-in USB scanners will type here automatically. You can also enter a SKU manually.
              </div>
              <Input
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                placeholder="Scan or type SKU"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    processScan();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={() => setScanOpen(false)}>Close</Btn>
              <Btn variant="primary" onClick={processScan}>
                Add To Cart
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {holdOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[420px] rounded-sm border bg-[var(--bg2)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                Hold Current Cart
              </span>
              <Btn size="sm" onClick={() => setHoldOpen(false)} disabled={holdSubmitting}>
                Cancel
              </Btn>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="mb-1 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                  Queue Label
                </div>
                <Input value={holdLabel} onChange={(event) => setHoldLabel(event.target.value)} />
              </div>
              <div>
                <div className="mb-1 font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                  Register Note
                </div>
                <textarea
                  value={holdNote}
                  onChange={(event) => setHoldNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-sm border border-[var(--border2)] bg-[var(--bg3)] px-3 py-2 font-body text-[13px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text3)] focus:border-[var(--accent)]"
                  placeholder="Optional pickup or quote note"
                />
              </div>
              <div className="rounded-sm border bg-[var(--bg3)] px-3 py-3">
                <div className="font-mono-iron text-[10px] uppercase tracking-[0.12em] text-[var(--text3)]">
                  Cart Summary
                </div>
                <div className="mt-1 text-[13px] text-[var(--text2)]">
                  {cartItemCount} items / {fmt(grandTotal)} / {selectedCustomerRecord?.name ?? 'Walk-in customer'}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={() => setHoldOpen(false)} disabled={holdSubmitting}>
                Close
              </Btn>
              <Btn
                variant="primary"
                onClick={handleHoldCart}
                disabled={holdSubmitting || holdLabel.trim().length === 0}
              >
                {holdSubmitting ? 'Holding...' : 'Save Hold'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {noteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[460px] rounded-sm border bg-[var(--bg2)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                Register Note
              </span>
              <Btn size="sm" onClick={() => setNoteOpen(false)} disabled={noteSubmitting}>
                Cancel
              </Btn>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-sm border bg-[var(--bg3)] px-3 py-3 text-[12px] text-[var(--text2)]">
                Use shift notes for cash adjustments, manager overrides, or customer callbacks tied to this register.
              </div>
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                rows={5}
                className="w-full rounded-sm border border-[var(--border2)] bg-[var(--bg3)] px-3 py-2 font-body text-[13px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text3)] focus:border-[var(--accent)]"
                placeholder="Enter register note"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={() => setNoteOpen(false)} disabled={noteSubmitting}>
                Close
              </Btn>
              <Btn
                variant="primary"
                onClick={handleSaveRegisterNote}
                disabled={noteSubmitting || noteBody.trim().length === 0}
              >
                {noteSubmitting ? 'Saving...' : 'Save Note'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
