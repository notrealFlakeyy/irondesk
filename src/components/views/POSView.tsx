'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { CreditCard, FileText, Minus, Plus, ScanLine, Search, Trash2, Wallet } from 'lucide-react';
import { Btn, Input, Select } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { CATEGORIES } from '@/lib/data';
import { cn, fmt } from '@/lib/utils';
import { CartItem, PaymentMethod, ToastTone, View } from '@/types';

const paymentMeta = {
  card: {
    label: 'Card',
    icon: CreditCard,
    status: 'Card reader ready - tap, insert or swipe',
  },
  cash: {
    label: 'Cash',
    icon: Wallet,
    status: 'Cash drawer ready - count change and confirm',
  },
  invoice: {
    label: 'Invoice',
    icon: FileText,
    status: 'Invoice will be posted to the customer trade account',
  },
} satisfies Record<PaymentMethod, { label: string; icon: typeof CreditCard; status: string }>;

export default function POSView({
  onNav,
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { customers, products, checkoutCart, createSpecialOrder, settings } = useAppState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | (typeof CATEGORIES)[number]['id']>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const deferredSearch = useDeferredValue(search);

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = discountEnabled ? subtotal * 0.05 : 0;
  const taxable = subtotal - discount;
  const vat = taxable * (settings.vatRate / 100);
  const grandTotal = taxable + vat;
  const paymentStatus = paymentMeta[paymentMethod].status;

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
            <Btn onClick={() => onNotify('Scanner armed for the next barcode.', 'info')}>
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
            <Btn
              size="sm"
              onClick={() => onNotify('Sale placed on hold in the local queue.', 'info')}
              disabled={cart.length === 0}
            >
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

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-10 text-center">
              <div className="font-display text-[18px] font-semibold uppercase tracking-[0.08em] text-[var(--text2)]">
                Cart Empty
              </div>
              <div className="text-[13px] text-[var(--text3)]">
                Add products from the left grid or scan an item code.
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
            onClick={() => setPaymentOpen(true)}
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
            <Btn
              onClick={() => {
                setSubmitting(true);
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
                    onNotify(
                      error instanceof Error ? error.message : 'Failed to create the special order.',
                      'info'
                    );
                  } finally {
                    setSubmitting(false);
                  }
                })();
              }}
              disabled={cart.length === 0 || submitting}
            >
              {submitting ? 'Saving...' : 'Special Order'}
            </Btn>
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
              <Btn size="sm" onClick={() => setPaymentOpen(false)}>
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

                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        'rounded-sm border px-3 py-4 text-center transition-colors',
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

              <div className="mt-4 font-mono-iron text-[12px] uppercase tracking-[0.12em] text-[var(--text2)]">
                {paymentStatus}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={() => setPaymentOpen(false)}>Cancel</Btn>
              <Btn
                disabled={submitting}
                variant="primary"
                onClick={() => {
                  setSubmitting(true);
                  void (async () => {
                    try {
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
                      onNotify(
                        `Payment processed for ${customerName}. Receipt ${receiptId} is ready.`,
                        'success'
                      );
                    } catch (error) {
                      onNotify(
                        error instanceof Error ? error.message : 'Failed to process the payment.',
                        'info'
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                {submitting ? 'Processing...' : 'Confirm Payment'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
