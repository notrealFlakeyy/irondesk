import type { SupabaseClient } from '@supabase/supabase-js';
import { createInitialAppData } from '@/lib/data';
import {
  isIntegrationConnected,
  processStripeCardPayment,
  sendTwilioSms,
  syncSaleToQuickBooks,
  syncSaleToXero,
  syncWooCommerceStock,
} from '@/lib/integrations';
import type {
  AppData,
  AppSettings,
  CartItem,
  CheckoutCartParams,
  CreateRegisterNoteParams,
  CreateSpecialOrderParams,
  CreatePurchaseOrderParams,
  Customer,
  CustomerPurchase,
  HeldCart,
  HoldCartParams,
  IntegrationProvider,
  IntegrationRun,
  IntegrationRunStatus,
  Order,
  OrderLineItem,
  PaymentMethod,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  RegisterNote,
  Supplier,
  TimelineEvent,
} from '@/types';
import type { Database } from '@/types/database';

type AppSupabaseClient = SupabaseClient<Database>;
type Tables = Database['public']['Tables'];

type ProductRow = Tables['products']['Row'];
type ProductInsert = Tables['products']['Insert'];
type CustomerRow = Tables['customers']['Row'];
type CustomerInsert = Tables['customers']['Insert'];
type IntegrationRunRow = Tables['integration_runs']['Row'];
type IntegrationRunInsert = Tables['integration_runs']['Insert'];
type HeldCartRow = Tables['held_carts']['Row'];
type HeldCartInsert = Tables['held_carts']['Insert'];
type HeldCartItemRow = Tables['held_cart_items']['Row'];
type HeldCartItemInsert = Tables['held_cart_items']['Insert'];
type SupplierRow = Tables['suppliers']['Row'];
type SupplierInsert = Tables['suppliers']['Insert'];
type OrderRow = Tables['orders']['Row'];
type OrderInsert = Tables['orders']['Insert'];
type OrderItemRow = Tables['order_items']['Row'];
type OrderItemInsert = Tables['order_items']['Insert'];
type PurchaseOrderRow = Tables['purchase_orders']['Row'];
type PurchaseOrderInsert = Tables['purchase_orders']['Insert'];
type PurchaseOrderItemRow = Tables['purchase_order_items']['Row'];
type PurchaseOrderItemInsert = Tables['purchase_order_items']['Insert'];
type TimelineRow = Tables['order_timeline_events']['Row'];
type TimelineInsert = Tables['order_timeline_events']['Insert'];
type TransactionRow = Tables['transactions']['Row'];
type TransactionInsert = Tables['transactions']['Insert'];
type TransactionLineRow = Tables['transaction_lines']['Row'];
type TransactionLineInsert = Tables['transaction_lines']['Insert'];
type CustomerPurchaseRow = Tables['customer_purchases']['Row'];
type CustomerPurchaseInsert = Tables['customer_purchases']['Insert'];
type RegisterNoteRow = Tables['register_notes']['Row'];
type RegisterNoteInsert = Tables['register_notes']['Insert'];
type SettingsRow = Tables['app_settings']['Row'];
type SettingsInsert = Tables['app_settings']['Insert'];

const DATE_MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
} as const;

function parseSequence(id: string) {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function nextId(prefix: string, existingIds: string[], width = 4) {
  const nextSequence = existingIds.reduce((max, id) => Math.max(max, parseSequence(id)), 0) + 1;
  return `${prefix}${String(nextSequence).padStart(width, '0')}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTimelineStamp(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '');
}

function dueDateFrom(baseDate: Date, days: number) {
  const due = new Date(baseDate);
  due.setDate(due.getDate() + days);
  return formatDateLabel(due);
}

function parseDateLabel(value: string) {
  const match = value.match(/^(\d{2})\s([A-Z][a-z]{2})\s(\d{4})$/);
  if (!match) {
    return new Date();
  }

  const [, day, monthLabel, year] = match;
  const month = DATE_MONTHS[monthLabel as keyof typeof DATE_MONTHS];
  return new Date(Date.UTC(Number(year), month, Number(day), 12, 0, 0));
}

function toSettingsPayload(settings: AppSettings): SettingsInsert['payload'] {
  return settings as unknown as SettingsInsert['payload'];
}

function normalizeSettings(settings: AppSettings): AppSettings {
  const seededSettings = createInitialAppData().settings;
  const providerByName = new Map(seededSettings.integrations.map((integration) => [integration.name, integration.provider]));

  return {
    ...settings,
    integrations: settings.integrations.map((integration) => ({
      ...integration,
      provider: integration.provider ?? providerByName.get(integration.name) ?? 'stripe',
    })),
  };
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function throwSupabaseError(
  error: { message: string; details?: string | null; hint?: string | null },
  context: string
): never {
  const details = [error.message, error.details, error.hint].filter(Boolean).join(' ');
  throw new Error(`${context}: ${details}`);
}

function serializeProduct(row: ProductRow): Product {
  return {
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    cat: row.cat,
    min: row.min_stock,
    supplier: row.supplier ?? undefined,
  };
}

function serializeCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    type: row.type,
    totalSpent: Number(row.total_spent),
    lastPurchase: row.last_purchase,
    balance: Number(row.balance),
    creditLimit: row.credit_limit ?? undefined,
    loyaltyPoints: row.loyalty_points ?? undefined,
    terms: row.terms ?? undefined,
  };
}

function serializeIntegrationRun(row: IntegrationRunRow): IntegrationRun {
  return {
    id: row.id,
    provider: row.provider,
    event: row.event,
    targetId: row.target_id ?? undefined,
    status: row.status,
    message: row.message,
    reference: row.reference ?? undefined,
    createdAt: row.created_at,
  };
}

function serializeHeldCart(row: HeldCartRow): HeldCart {
  return {
    id: row.id,
    label: row.label,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    itemCount: row.item_count,
    total: Number(row.total),
    status: row.status,
  };
}

function serializeSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    leadDays: row.lead_days,
    account: row.account,
    skus: row.skus,
    monthlySpend: Number(row.monthly_spend),
    onTimeRate: Number(row.on_time_rate),
  };
}

function serializeOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customer: row.customer,
    customerId: row.customer_id ?? undefined,
    date: row.date_label,
    due: row.due_label,
    status: row.status,
    total: Number(row.total),
    deposit: row.deposit ?? undefined,
  };
}

function serializeOrderItem(row: OrderItemRow): OrderLineItem {
  return {
    sku: row.sku,
    name: row.name,
    qty: row.qty,
    unitPrice: Number(row.unit_price),
    status: row.status,
  };
}

function serializePurchaseOrder(row: PurchaseOrderRow): PurchaseOrder {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    createdAt: row.created_at,
    expectedDate: row.expected_date,
    status: row.status,
    total: Number(row.total),
    itemCount: row.item_count,
  };
}

function serializePurchaseOrderItem(row: PurchaseOrderItemRow): PurchaseOrderItem {
  return {
    sku: row.sku,
    name: row.name,
    qty: row.qty,
    unitCost: Number(row.unit_cost),
  };
}

function serializeRegisterNote(row: RegisterNoteRow): RegisterNote {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    author: row.author,
    registerLabel: row.register_label,
  };
}

function serializeTimelineEvent(row: TimelineRow): TimelineEvent {
  return {
    label: row.label,
    time: row.time_text,
    state: row.state,
  };
}

function serializeTransaction(row: TransactionRow): AppData['transactions'][number] {
  return {
    id: row.id,
    customer: row.customer,
    customerId: row.customer_id ?? undefined,
    items: row.items,
    amount: Number(row.amount),
    method: row.method,
    timestamp: row.timestamp,
  };
}

function serializeTransactionLine(row: TransactionLineRow): CartItem {
  return {
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    cat: row.cat,
    min: row.min_stock,
    supplier: row.supplier ?? undefined,
    qty: row.qty,
  };
}

function serializeHeldCartItem(row: HeldCartItemRow): CartItem {
  return {
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    cat: row.cat,
    min: row.min_stock,
    supplier: row.supplier ?? undefined,
    qty: row.qty,
  };
}

function serializeCustomerPurchase(row: CustomerPurchaseRow): CustomerPurchase {
  return {
    id: row.purchase_id,
    date: row.date_label,
    amount: Number(row.amount),
    status: row.status,
  };
}

function groupRows<T, TValue>(rows: T[], key: (row: T) => string, mapper: (row: T) => TValue) {
  return rows.reduce<Record<string, TValue[]>>((accumulator, row) => {
    const groupKey = key(row);
    const existing = accumulator[groupKey] ?? [];
    existing.push(mapper(row));
    accumulator[groupKey] = existing;
    return accumulator;
  }, {});
}

async function loadCustomer(supabase: AppSupabaseClient, customerId: string) {
  const { data, error } = await supabase.from('customers').select('*').eq('id', customerId).maybeSingle();
  if (error) {
    throwSupabaseError(error, 'Failed to load customer');
  }

  return (data as CustomerRow | null) ?? null;
}

async function loadSettings(supabase: AppSupabaseClient) {
  const { data, error } = await supabase.from('app_settings').select('*').maybeSingle();
  if (error) {
    throwSupabaseError(error, 'Failed to load app settings');
  }

  const loaded =
    ((data as SettingsRow | null)?.payload as AppSettings | undefined) ?? createInitialAppData().settings;
  return normalizeSettings(loaded);
}

async function updateProductsStock(
  supabase: AppSupabaseClient,
  cart: CartItem[],
  mode: 'decrement_when_available' | 'decrement_always'
) {
  const skus = cart.map((item) => item.sku);
  const { data, error } = await supabase.from('products').select('*').in('sku', skus);
  if (error) {
    throwSupabaseError(error, 'Failed to load products for stock update');
  }

  const productRows = (data ?? []) as ProductRow[];
  const currentProducts = new Map(productRows.map((product) => [product.sku, product]));

  for (const item of cart) {
    const product = currentProducts.get(item.sku);
    if (!product) continue;

    const nextStock =
      mode === 'decrement_when_available'
        ? product.stock < item.qty
          ? product.stock
          : product.stock - item.qty
        : Math.max(0, product.stock - item.qty);

    const { error: updateError } = await supabase.from('products').update({ stock: nextStock }).eq('sku', item.sku);
    if (updateError) {
      throwSupabaseError(updateError, `Failed to update stock for ${item.sku}`);
    }
  }

  return currentProducts;
}

async function nextIntegrationRunId(supabase: AppSupabaseClient) {
  const { data, error } = await supabase.from('integration_runs').select('id');
  if (error) {
    throwSupabaseError(error, 'Failed to generate integration run number');
  }

  return nextId(
    'SYNC-',
    ((data ?? []) as Array<Pick<IntegrationRunRow, 'id'>>).map((row) => row.id)
  );
}

async function recordIntegrationRun(
  supabase: AppSupabaseClient,
  params: {
    provider: IntegrationProvider;
    event: string;
    status: IntegrationRunStatus;
    message: string;
    targetId?: string;
    reference?: string;
  }
) {
  const id = await nextIntegrationRunId(supabase);
  const insert: IntegrationRunInsert = {
    id,
    provider: params.provider,
    event: params.event,
    target_id: params.targetId ?? null,
    status: params.status,
    message: params.message,
    reference: params.reference ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('integration_runs').insert(insert);
  if (error) {
    throwSupabaseError(error, 'Failed to record integration run');
  }
}

async function syncProductToChannels(
  supabase: AppSupabaseClient,
  settings: AppSettings,
  product: Product
) {
  if (!isIntegrationConnected(settings, 'woocommerce')) {
    return;
  }

  try {
    const result = await syncWooCommerceStock({ settings, product });
    await recordIntegrationRun(supabase, {
      provider: 'woocommerce',
      event: 'stock_sync',
      status: result.status,
      message: result.message,
      targetId: product.sku,
      reference: result.reference,
    });
  } catch (error) {
    await recordIntegrationRun(supabase, {
      provider: 'woocommerce',
      event: 'stock_sync',
      status: 'failed',
      message: toErrorMessage(error, `WooCommerce sync failed for ${product.sku}`),
      targetId: product.sku,
    });
  }
}

async function syncSaleToAccounting(
  supabase: AppSupabaseClient,
  settings: AppSettings,
  params: {
    documentId: string;
    customerName: string;
    paymentMethod: PaymentMethod;
    amount: number;
    cart: CartItem[];
  }
) {
  if (isIntegrationConnected(settings, 'xero')) {
    try {
      const xeroResult = await syncSaleToXero({
        settings,
        documentId: params.documentId,
        customerName: params.customerName,
        paymentMethod: params.paymentMethod,
        cart: params.cart,
      });
      await recordIntegrationRun(supabase, {
        provider: 'xero',
        event: 'sales_sync',
        status: xeroResult.status,
        message: xeroResult.message,
        targetId: params.documentId,
        reference: xeroResult.reference,
      });
    } catch (error) {
      await recordIntegrationRun(supabase, {
        provider: 'xero',
        event: 'sales_sync',
        status: 'failed',
        message: toErrorMessage(error, `Xero sync failed for ${params.documentId}`),
        targetId: params.documentId,
      });
    }
  }

  if (isIntegrationConnected(settings, 'quickbooks')) {
    try {
      const quickBooksResult = await syncSaleToQuickBooks({
        settings,
        documentId: params.documentId,
        customerName: params.customerName,
        paymentMethod: params.paymentMethod,
        amount: params.amount,
        cart: params.cart,
      });
      await recordIntegrationRun(supabase, {
        provider: 'quickbooks',
        event: 'sales_sync',
        status: quickBooksResult.status,
        message: quickBooksResult.message,
        targetId: params.documentId,
        reference: quickBooksResult.reference,
      });
    } catch (error) {
      await recordIntegrationRun(supabase, {
        provider: 'quickbooks',
        event: 'sales_sync',
        status: 'failed',
        message: toErrorMessage(error, `QuickBooks sync failed for ${params.documentId}`),
        targetId: params.documentId,
      });
    }
  }
}

async function clearWorkspaceData(supabase: AppSupabaseClient, userId: string) {
  const deleteSteps = [
    async () => supabase.from('customer_purchases').delete().eq('owner_id', userId),
    async () => supabase.from('order_timeline_events').delete().eq('owner_id', userId),
    async () => supabase.from('order_items').delete().eq('owner_id', userId),
    async () => supabase.from('purchase_order_items').delete().eq('owner_id', userId),
    async () => supabase.from('purchase_orders').delete().eq('owner_id', userId),
    async () => supabase.from('held_cart_items').delete().eq('owner_id', userId),
    async () => supabase.from('held_carts').delete().eq('owner_id', userId),
    async () => supabase.from('register_notes').delete().eq('owner_id', userId),
    async () => supabase.from('integration_runs').delete().eq('owner_id', userId),
    async () => supabase.from('transaction_lines').delete().eq('owner_id', userId),
    async () => supabase.from('transactions').delete().eq('owner_id', userId),
    async () => supabase.from('orders').delete().eq('owner_id', userId),
    async () => supabase.from('products').delete().eq('owner_id', userId),
    async () => supabase.from('suppliers').delete().eq('owner_id', userId),
    async () => supabase.from('customers').delete().eq('owner_id', userId),
    async () => supabase.from('app_settings').delete().eq('owner_id', userId),
  ];

  for (const remove of deleteSteps) {
    const { error } = await remove();
    if (error) {
      throwSupabaseError(error, 'Failed to clear the current workspace');
    }
  }
}

export async function seedDemoWorkspace(supabase: AppSupabaseClient, userId: string) {
  await clearWorkspaceData(supabase, userId);
  const seed = createInitialAppData();

  const products: ProductInsert[] = seed.products.map((product) => ({
    owner_id: userId,
    sku: product.sku,
    name: product.name,
    price: product.price,
    stock: product.stock,
    cat: product.cat,
    min_stock: product.min,
    supplier: product.supplier ?? null,
  }));

  const customers: CustomerInsert[] = seed.customers.map((customer) => ({
    owner_id: userId,
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? null,
    type: customer.type,
    total_spent: customer.totalSpent,
    last_purchase: customer.lastPurchase,
    balance: customer.balance,
    credit_limit: customer.creditLimit ?? null,
    loyalty_points: customer.loyaltyPoints ?? null,
    terms: customer.terms ?? null,
  }));

  const suppliers: SupplierInsert[] = seed.suppliers.map((supplier) => ({
    owner_id: userId,
    id: supplier.id,
    name: supplier.name,
    category: supplier.category,
    lead_days: supplier.leadDays,
    account: supplier.account,
    skus: supplier.skus,
    monthly_spend: supplier.monthlySpend,
    on_time_rate: supplier.onTimeRate,
  }));

  const heldCarts: HeldCartInsert[] = seed.heldCarts.map((heldCart) => ({
    owner_id: userId,
    id: heldCart.id,
    label: heldCart.label,
    customer_id: heldCart.customerId ?? null,
    customer_name: heldCart.customerName,
    note: heldCart.note ?? null,
    created_at: heldCart.createdAt,
    item_count: heldCart.itemCount,
    total: heldCart.total,
    status: heldCart.status,
  }));

  const heldCartItems: HeldCartItemInsert[] = Object.entries(seed.heldCartItems).flatMap(([heldCartId, items]) =>
    items.map((item, position) => ({
      owner_id: userId,
      held_cart_id: heldCartId,
      position,
      sku: item.sku,
      name: item.name,
      price: item.price,
      stock: item.stock,
      cat: item.cat,
      min_stock: item.min,
      supplier: item.supplier ?? null,
      qty: item.qty,
    }))
  );

  const orders: OrderInsert[] = seed.orders.map((order) => ({
    owner_id: userId,
    id: order.id,
    customer: order.customer,
    customer_id: order.customerId ?? null,
    date_label: order.date,
    due_label: order.due,
    status: order.status,
    total: order.total,
    deposit: order.deposit ?? null,
    created_at: parseDateLabel(order.date).toISOString(),
  }));

  const orderItems: OrderItemInsert[] = Object.entries(seed.orderItems).flatMap(([orderId, items]) =>
    items.map((item, position) => ({
      owner_id: userId,
      order_id: orderId,
      position,
      sku: item.sku,
      name: item.name,
      qty: item.qty,
      unit_price: item.unitPrice,
      status: item.status,
    }))
  );

  const timelineEvents: TimelineInsert[] = Object.entries(seed.orderTimelines).flatMap(([orderId, events]) =>
    events.map((event, position) => ({
      owner_id: userId,
      order_id: orderId,
      position,
      label: event.label,
      time_text: event.time,
      state: event.state,
    }))
  );

  const transactions: TransactionInsert[] = seed.transactions.map((transaction) => ({
    owner_id: userId,
    id: transaction.id,
    customer: transaction.customer,
    customer_id: transaction.customerId ?? null,
    items: transaction.items,
    amount: transaction.amount,
    method: transaction.method,
    timestamp: transaction.timestamp,
    created_at: transaction.timestamp,
  }));

  const transactionLines: TransactionLineInsert[] = Object.entries(seed.transactionLines).flatMap(
    ([transactionId, lines]) =>
      lines.map((line, position) => ({
        owner_id: userId,
        transaction_id: transactionId,
        position,
        sku: line.sku,
        name: line.name,
        price: line.price,
        stock: line.stock,
        cat: line.cat,
        min_stock: line.min,
        supplier: line.supplier ?? null,
        qty: line.qty,
      }))
  );

  const customerPurchases: CustomerPurchaseInsert[] = Object.entries(seed.customerPurchases).flatMap(
    ([customerId, purchases]) =>
      purchases.map((purchase, index) => ({
        owner_id: userId,
        customer_id: customerId,
        purchase_id: purchase.id,
        date_label: purchase.date,
        amount: purchase.amount,
        status: purchase.status,
        created_at: new Date(parseDateLabel(purchase.date).getTime() - index * 60_000).toISOString(),
      }))
  );

  const settings: SettingsInsert = {
    owner_id: userId,
    payload: toSettingsPayload(seed.settings),
    updated_at: new Date().toISOString(),
  };

  const integrationRuns: IntegrationRunInsert[] = seed.integrationRuns.map((run) => ({
    owner_id: userId,
    id: run.id,
    provider: run.provider,
    event: run.event,
    target_id: run.targetId ?? null,
    status: run.status,
    message: run.message,
    reference: run.reference ?? null,
    created_at: run.createdAt,
  }));

  const registerNotes: RegisterNoteInsert[] = seed.registerNotes.map((note) => ({
    owner_id: userId,
    id: note.id,
    body: note.body,
    author: note.author,
    register_label: note.registerLabel,
    created_at: note.createdAt,
  }));

  const inserts = [
    supabase.from('products').insert(products),
    supabase.from('customers').insert(customers),
    supabase.from('suppliers').insert(suppliers),
    supabase.from('held_carts').insert(heldCarts),
    supabase.from('held_cart_items').insert(heldCartItems),
    supabase.from('register_notes').insert(registerNotes),
    supabase.from('integration_runs').insert(integrationRuns),
    supabase.from('orders').insert(orders),
    supabase.from('order_items').insert(orderItems),
    supabase.from('order_timeline_events').insert(timelineEvents),
    supabase.from('transactions').insert(transactions),
    supabase.from('transaction_lines').insert(transactionLines),
    supabase.from('customer_purchases').insert(customerPurchases),
    supabase.from('app_settings').insert(settings),
  ];

  const results = await Promise.all(inserts);
  for (const result of results) {
    if (result.error) {
      throwSupabaseError(result.error, 'Failed to load demo data into this workspace');
    }
  }

  return { data: await loadAppData(supabase) };
}

export async function loadAppData(supabase: AppSupabaseClient): Promise<AppData> {
  const [
    productsResult,
    customersResult,
    heldCartsResult,
    heldCartItemsResult,
    registerNotesResult,
    integrationRunsResult,
    suppliersResult,
    purchaseOrdersResult,
    purchaseOrderItemsResult,
    ordersResult,
    orderItemsResult,
    timelinesResult,
    transactionsResult,
    transactionLinesResult,
    customerPurchasesResult,
    settingsResult,
  ] = await Promise.all([
    supabase.from('products').select('*').order('sku'),
    supabase.from('customers').select('*').order('name'),
    supabase.from('held_carts').select('*').order('created_at', { ascending: false }),
    supabase.from('held_cart_items').select('*').order('held_cart_id').order('position'),
    supabase.from('register_notes').select('*').order('created_at', { ascending: false }),
    supabase.from('integration_runs').select('*').order('created_at', { ascending: false }),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
    supabase.from('purchase_order_items').select('*').order('purchase_order_id').order('position'),
    supabase.from('orders').select('*').order('id', { ascending: false }),
    supabase.from('order_items').select('*').order('order_id').order('position'),
    supabase.from('order_timeline_events').select('*').order('order_id').order('position'),
    supabase.from('transactions').select('*').order('timestamp', { ascending: false }),
    supabase.from('transaction_lines').select('*').order('transaction_id').order('position'),
    supabase.from('customer_purchases').select('*').order('created_at', { ascending: false }),
    supabase.from('app_settings').select('*').maybeSingle(),
  ]);

  const resultSet = [
    { result: productsResult, context: 'Failed to load products' },
    { result: customersResult, context: 'Failed to load customers' },
    { result: heldCartsResult, context: 'Failed to load held carts' },
    { result: heldCartItemsResult, context: 'Failed to load held cart items' },
    { result: registerNotesResult, context: 'Failed to load register notes' },
    { result: integrationRunsResult, context: 'Failed to load integration runs' },
    { result: suppliersResult, context: 'Failed to load suppliers' },
    { result: purchaseOrdersResult, context: 'Failed to load purchase orders' },
    { result: purchaseOrderItemsResult, context: 'Failed to load purchase order items' },
    { result: ordersResult, context: 'Failed to load orders' },
    { result: orderItemsResult, context: 'Failed to load order items' },
    { result: timelinesResult, context: 'Failed to load order timeline' },
    { result: transactionsResult, context: 'Failed to load transactions' },
    { result: transactionLinesResult, context: 'Failed to load transaction lines' },
    { result: customerPurchasesResult, context: 'Failed to load customer purchases' },
  ];

  for (const { result, context } of resultSet) {
    if (result.error) {
      throwSupabaseError(result.error, context);
    }
  }

  if (settingsResult.error) {
    throwSupabaseError(settingsResult.error, 'Failed to load settings');
  }

  const productRows = (productsResult.data ?? []) as ProductRow[];
  const customerRows = (customersResult.data ?? []) as CustomerRow[];
  const heldCartRows = (heldCartsResult.data ?? []) as HeldCartRow[];
  const heldCartItemRows = (heldCartItemsResult.data ?? []) as HeldCartItemRow[];
  const registerNoteRows = (registerNotesResult.data ?? []) as RegisterNoteRow[];
  const integrationRunRows = (integrationRunsResult.data ?? []) as IntegrationRunRow[];
  const supplierRows = (suppliersResult.data ?? []) as SupplierRow[];
  const purchaseOrderRows = (purchaseOrdersResult.data ?? []) as PurchaseOrderRow[];
  const purchaseOrderItemRows = (purchaseOrderItemsResult.data ?? []) as PurchaseOrderItemRow[];
  const orderRows = (ordersResult.data ?? []) as OrderRow[];
  const orderItemRows = (orderItemsResult.data ?? []) as OrderItemRow[];
  const timelineRows = (timelinesResult.data ?? []) as TimelineRow[];
  const transactionRows = (transactionsResult.data ?? []) as TransactionRow[];
  const transactionLineRows = (transactionLinesResult.data ?? []) as TransactionLineRow[];
  const customerPurchaseRows = (customerPurchasesResult.data ?? []) as CustomerPurchaseRow[];
  const settingsRow = (settingsResult.data ?? null) as SettingsRow | null;

  return {
    products: productRows.map(serializeProduct),
    customers: customerRows.map(serializeCustomer),
    heldCarts: heldCartRows.map(serializeHeldCart),
    registerNotes: registerNoteRows.map(serializeRegisterNote),
    integrationRuns: integrationRunRows.map(serializeIntegrationRun),
    orders: orderRows.map(serializeOrder),
    suppliers: supplierRows.map(serializeSupplier),
    purchaseOrders: purchaseOrderRows.map(serializePurchaseOrder),
    transactions: transactionRows.map(serializeTransaction),
    transactionLines: groupRows(transactionLineRows, (row) => row.transaction_id, serializeTransactionLine),
    customerPurchases: groupRows(customerPurchaseRows, (row) => row.customer_id, serializeCustomerPurchase),
    orderItems: groupRows(orderItemRows, (row) => row.order_id, serializeOrderItem),
    orderTimelines: groupRows(timelineRows, (row) => row.order_id, serializeTimelineEvent),
    heldCartItems: groupRows(heldCartItemRows, (row) => row.held_cart_id, serializeHeldCartItem),
    purchaseOrderItems: groupRows(
      purchaseOrderItemRows,
      (row) => row.purchase_order_id,
      serializePurchaseOrderItem
    ),
    settings: normalizeSettings((settingsRow?.payload as AppSettings | undefined) ?? createInitialAppData().settings),
  };
}

export async function holdCart(supabase: AppSupabaseClient, params: HoldCartParams) {
  const now = new Date();
  const { data: existingRows, error: idError } = await supabase.from('held_carts').select('id');
  if (idError) {
    throwSupabaseError(idError, 'Failed to generate held cart number');
  }

  const customer = params.customerId ? await loadCustomer(supabase, params.customerId) : null;
  const heldCartId = nextId(
    'HOLD-',
    ((existingRows ?? []) as Array<Pick<HeldCartRow, 'id'>>).map((row) => row.id)
  );

  const heldCartInsert: HeldCartInsert = {
    id: heldCartId,
    label: params.label.trim() || `Held cart ${heldCartId}`,
    customer_id: customer?.id ?? null,
    customer_name: customer?.name ?? 'Walk-in',
    note: params.note?.trim() ? params.note.trim() : null,
    created_at: now.toISOString(),
    item_count: params.cart.reduce((sum, item) => sum + item.qty, 0),
    total: Number(params.total.toFixed(2)),
    status: 'held',
  };

  const { error: insertError } = await supabase.from('held_carts').insert(heldCartInsert);
  if (insertError) {
    throwSupabaseError(insertError, 'Failed to hold the cart');
  }

  const heldCartItems: HeldCartItemInsert[] = params.cart.map((item, position) => ({
    held_cart_id: heldCartId,
    position,
    sku: item.sku,
    name: item.name,
    price: item.price,
    stock: item.stock,
    cat: item.cat,
    min_stock: item.min,
    supplier: item.supplier ?? null,
    qty: item.qty,
  }));

  const { error: itemError } = await supabase.from('held_cart_items').insert(heldCartItems);
  if (itemError) {
    throwSupabaseError(itemError, 'Failed to save held cart items');
  }

  return {
    data: await loadAppData(supabase),
    meta: {
      heldCartId,
    },
  };
}

export async function resolveHeldCartAction(
  supabase: AppSupabaseClient,
  heldCartId: string,
  action: 'resume' | 'delete'
) {
  const { data: heldCartData, error: heldCartError } = await supabase
    .from('held_carts')
    .select('*')
    .eq('id', heldCartId)
    .maybeSingle();
  if (heldCartError) {
    throwSupabaseError(heldCartError, 'Failed to load held cart');
  }
  if (!heldCartData) {
    throw new Error(`Held cart ${heldCartId} was not found.`);
  }

  const { data: itemData, error: itemLoadError } = await supabase
    .from('held_cart_items')
    .select('*')
    .eq('held_cart_id', heldCartId)
    .order('position');
  if (itemLoadError) {
    throwSupabaseError(itemLoadError, 'Failed to load held cart items');
  }

  const restoredCart = ((itemData ?? []) as HeldCartItemRow[]).map(serializeHeldCartItem);

  const { error: deleteItemsError } = await supabase.from('held_cart_items').delete().eq('held_cart_id', heldCartId);
  if (deleteItemsError) {
    throwSupabaseError(deleteItemsError, 'Failed to clear held cart items');
  }

  const { error: deleteCartError } = await supabase.from('held_carts').delete().eq('id', heldCartId);
  if (deleteCartError) {
    throwSupabaseError(deleteCartError, 'Failed to clear held cart');
  }

  const heldCart = heldCartData as HeldCartRow;

  return {
    data: await loadAppData(supabase),
    meta:
      action === 'resume'
        ? {
            cart: restoredCart,
            customerId: heldCart.customer_id ?? undefined,
            label: heldCart.label,
          }
        : undefined,
  };
}

export async function addRegisterNote(supabase: AppSupabaseClient, params: CreateRegisterNoteParams) {
  const noteBody = params.body.trim();
  if (!noteBody) {
    throw new Error('Register note cannot be empty.');
  }

  const { data: existingRows, error: idError } = await supabase.from('register_notes').select('id');
  if (idError) {
    throwSupabaseError(idError, 'Failed to generate register note number');
  }

  const noteId = nextId(
    'NOTE-',
    ((existingRows ?? []) as Array<Pick<RegisterNoteRow, 'id'>>).map((row) => row.id)
  );
  const noteInsert: RegisterNoteInsert = {
    id: noteId,
    body: noteBody,
    author: params.author?.trim() || 'Register staff',
    register_label: params.registerLabel?.trim() || 'Register 1',
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('register_notes').insert(noteInsert);
  if (error) {
    throwSupabaseError(error, 'Failed to save register note');
  }

  return {
    data: await loadAppData(supabase),
    meta: {
      note: serializeRegisterNote(noteInsert as RegisterNoteRow),
    },
  };
}

export async function createPurchaseOrder(supabase: AppSupabaseClient, params: CreatePurchaseOrderParams) {
  const now = new Date();
  const { data: existingRows, error: idError } = await supabase.from('purchase_orders').select('id');
  if (idError) {
    throwSupabaseError(idError, 'Failed to generate purchase order number');
  }

  const { data: supplierRow, error: supplierError } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', params.supplierId)
    .maybeSingle();
  if (supplierError) {
    throwSupabaseError(supplierError, 'Failed to load supplier');
  }
  if (!supplierRow) {
    throw new Error('Selected supplier was not found.');
  }

  const supplier = supplierRow as SupplierRow;
  const purchaseOrderId = nextId(
    'PO-',
    ((existingRows ?? []) as Array<Pick<PurchaseOrderRow, 'id'>>).map((row) => row.id)
  );
  const expectedDate = dueDateFrom(now, supplier.lead_days);
  const total = Number(
    params.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0).toFixed(2)
  );

  const purchaseOrderInsert: PurchaseOrderInsert = {
    id: purchaseOrderId,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    created_at: now.toISOString(),
    expected_date: expectedDate,
    status: params.status ?? 'sent',
    total,
    item_count: params.items.reduce((sum, item) => sum + item.qty, 0),
  };

  const { error: insertPoError } = await supabase.from('purchase_orders').insert(purchaseOrderInsert);
  if (insertPoError) {
    throwSupabaseError(insertPoError, 'Failed to create purchase order');
  }

  const poItems: PurchaseOrderItemInsert[] = params.items.map((item, position) => ({
    purchase_order_id: purchaseOrderId,
    position,
    sku: item.sku,
    name: item.name,
    qty: item.qty,
    unit_cost: item.unitCost,
  }));

  const { error: insertItemsError } = await supabase.from('purchase_order_items').insert(poItems);
  if (insertItemsError) {
    throwSupabaseError(insertItemsError, 'Failed to create purchase order items');
  }

  return {
    data: await loadAppData(supabase),
    meta: {
      purchaseOrderId,
      total,
    },
  };
}

export async function updatePurchaseOrderStatus(
  supabase: AppSupabaseClient,
  purchaseOrderId: string,
  status: PurchaseOrder['status']
) {
  const settings = await loadSettings(supabase);
  const { data: orderData, error: orderError } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', purchaseOrderId)
    .maybeSingle();
  if (orderError) {
    throwSupabaseError(orderError, 'Failed to load purchase order');
  }
  if (!orderData) {
    throw new Error(`Purchase order ${purchaseOrderId} was not found.`);
  }

  const orderRow = orderData as PurchaseOrderRow;
  const { error: statusError } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', purchaseOrderId);
  if (statusError) {
    throwSupabaseError(statusError, 'Failed to update purchase order status');
  }

  if (status === 'received' && orderRow.status !== 'received') {
    const { data: poItemData, error: poItemsError } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('position');
    if (poItemsError) {
      throwSupabaseError(poItemsError, 'Failed to load purchase order items');
    }

    for (const line of (poItemData ?? []) as PurchaseOrderItemRow[]) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', line.sku)
        .maybeSingle();
      if (productError) {
        throwSupabaseError(productError, `Failed to load product ${line.sku}`);
      }
      if (!productData) {
        continue;
      }

      const productRow = productData as ProductRow;
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: productRow.stock + line.qty })
        .eq('sku', line.sku);
      if (stockError) {
        throwSupabaseError(stockError, `Failed to update stock from purchase order ${purchaseOrderId}`);
      }

      await syncProductToChannels(supabase, settings, {
        ...serializeProduct(productRow),
        stock: productRow.stock + line.qty,
      });
    }
  }

  return { data: await loadAppData(supabase) };
}

export async function checkoutCart(supabase: AppSupabaseClient, params: CheckoutCartParams) {
  const now = new Date();
  const settings = await loadSettings(supabase);
  const subtotal = params.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = subtotal * (params.discountRate ?? 0);
  const taxable = subtotal - discount;
  const total = Number((taxable + taxable * (settings.vatRate / 100)).toFixed(2));
  const { data: existingTransactions, error: transactionIdError } = await supabase.from('transactions').select('id');

  if (transactionIdError) {
    throwSupabaseError(transactionIdError, 'Failed to generate receipt number');
  }

  const receiptId = nextId(
    'R-',
    ((existingTransactions ?? []) as Array<Pick<TransactionRow, 'id'>>).map((transaction) => transaction.id)
  );
  const customer = params.customerId ? await loadCustomer(supabase, params.customerId) : null;
  const customerName = customer?.name ?? 'Walk-in';

  if (params.paymentMethod === 'card') {
    try {
      const stripeResult = await processStripeCardPayment({
        settings,
        amount: total,
        receiptId,
        customerName,
      });
      await recordIntegrationRun(supabase, {
        provider: 'stripe',
        event: 'payment',
        status: stripeResult.status,
        message: stripeResult.message,
        targetId: receiptId,
        reference: stripeResult.reference,
      });
    } catch (error) {
      await recordIntegrationRun(supabase, {
        provider: 'stripe',
        event: 'payment',
        status: 'failed',
        message: toErrorMessage(error, `Stripe payment failed for ${receiptId}`),
        targetId: receiptId,
      });
      throw error;
    }
  }

  await updateProductsStock(supabase, params.cart, 'decrement_always');

  const transactionInsert: TransactionInsert = {
    id: receiptId,
    customer: customerName,
    customer_id: customer?.id ?? null,
    items: params.cart.reduce((sum, item) => sum + item.qty, 0),
    amount: total,
    method: params.paymentMethod,
    timestamp: now.toISOString(),
    created_at: now.toISOString(),
  };

  const { error: transactionError } = await supabase.from('transactions').insert(transactionInsert);
  if (transactionError) {
    throwSupabaseError(transactionError, 'Failed to create transaction');
  }

  const transactionLines: TransactionLineInsert[] = params.cart.map((item, position) => ({
    transaction_id: receiptId,
    position,
    sku: item.sku,
    name: item.name,
    price: item.price,
    stock: item.stock,
    cat: item.cat,
    min_stock: item.min,
    supplier: item.supplier ?? null,
    qty: item.qty,
  }));

  const { error: lineError } = await supabase.from('transaction_lines').insert(transactionLines);
  if (lineError) {
    throwSupabaseError(lineError, 'Failed to save transaction lines');
  }

  if (customer) {
    const nextBalance =
      params.paymentMethod === 'invoice'
        ? Number((customer.balance - total).toFixed(2))
        : Number(customer.balance.toFixed(2));
    const nextSpent = Number((customer.total_spent + total).toFixed(2));
    const nextPoints = (customer.loyalty_points ?? 0) + Math.round(total);

    const { error: customerError } = await supabase
      .from('customers')
      .update({
        total_spent: nextSpent,
        last_purchase: formatDateLabel(now),
        balance: nextBalance,
        loyalty_points: nextPoints,
      })
      .eq('id', customer.id);

    if (customerError) {
      throwSupabaseError(customerError, 'Failed to update customer totals');
    }

    const { error: purchaseError } = await supabase.from('customer_purchases').upsert(
      {
        customer_id: customer.id,
        purchase_id: receiptId,
        date_label: formatDateLabel(now),
        amount: total,
        status: params.paymentMethod === 'invoice' ? 'invoice' : 'paid',
        created_at: now.toISOString(),
      },
      { onConflict: 'owner_id,customer_id,purchase_id' }
    );

    if (purchaseError) {
      throwSupabaseError(purchaseError, 'Failed to save customer purchase history');
    }
  }

  await syncSaleToAccounting(supabase, settings, {
    documentId: receiptId,
    customerName,
    paymentMethod: params.paymentMethod,
    amount: total,
    cart: params.cart,
  });

  const affectedSkus = [...new Set(params.cart.map((item) => item.sku))];
  const { data: syncedProducts, error: syncedProductsError } = await supabase
    .from('products')
    .select('*')
    .in('sku', affectedSkus);
  if (syncedProductsError) {
    throwSupabaseError(syncedProductsError, 'Failed to load products for channel sync');
  }

  for (const productRow of (syncedProducts ?? []) as ProductRow[]) {
    await syncProductToChannels(supabase, settings, serializeProduct(productRow));
  }

  return {
    data: await loadAppData(supabase),
    meta: {
      receiptId,
      total,
    },
  };
}

export async function createSpecialOrder(supabase: AppSupabaseClient, params: CreateSpecialOrderParams) {
  const now = new Date();
  const settings = await loadSettings(supabase);
  const subtotal = params.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Number((subtotal + subtotal * (settings.vatRate / 100)).toFixed(2));
  const { data: existingOrders, error: orderIdError } = await supabase.from('orders').select('id');

  if (orderIdError) {
    throwSupabaseError(orderIdError, 'Failed to generate order number');
  }

  const orderId = nextId(
    'ORD-',
    ((existingOrders ?? []) as Array<Pick<OrderRow, 'id'>>).map((order) => order.id)
  );
  const customer = params.customerId ? await loadCustomer(supabase, params.customerId) : null;
  const products = await updateProductsStock(supabase, params.cart, 'decrement_when_available');
  const lineItems: OrderItemInsert[] = params.cart.map((item, position) => {
    const sourceProduct = products.get(item.sku);
    const status = (sourceProduct?.stock ?? 0) >= item.qty ? 'reserved' : 'backorder';

    return {
      order_id: orderId,
      position,
      sku: item.sku,
      name: item.name,
      qty: item.qty,
      unit_price: item.price,
      status,
    };
  });

  const allReserved = lineItems.every((item) => item.status !== 'backorder');
  const orderInsert: OrderInsert = {
    id: orderId,
    customer: customer?.name ?? 'Walk-in',
    customer_id: customer?.id ?? null,
    date_label: formatDateLabel(now),
    due_label: dueDateFrom(now, 3),
    status: allReserved ? 'ready' : 'pending',
    total,
    deposit: Number((params.deposit ?? 0).toFixed(2)),
    created_at: now.toISOString(),
  };

  const { error: orderError } = await supabase.from('orders').insert(orderInsert);
  if (orderError) {
    throwSupabaseError(orderError, 'Failed to create special order');
  }

  const { error: orderItemsError } = await supabase.from('order_items').insert(lineItems);
  if (orderItemsError) {
    throwSupabaseError(orderItemsError, 'Failed to save special order items');
  }

  const timelineStamp = formatTimelineStamp(now);
  const timelineEvents: TimelineInsert[] = [
    { order_id: orderId, position: 0, label: 'Order placed', time_text: `${timelineStamp} by POS`, state: 'done' },
    params.deposit && params.deposit > 0
      ? {
          order_id: orderId,
          position: 1,
          label: 'Deposit received',
          time_text: `${timelineStamp} via register`,
          state: 'done',
        }
      : {
          order_id: orderId,
          position: 1,
          label: 'Deposit pending',
          time_text: '',
          state: 'pending',
        },
    {
      order_id: orderId,
      position: 2,
      label: allReserved ? 'Stock reserved' : 'Supplier allocation required',
      time_text: allReserved ? `${timelineStamp} auto-reserved` : `${timelineStamp} awaiting purchase order`,
      state: 'active',
    },
    {
      order_id: orderId,
      position: 3,
      label: allReserved ? 'Ready for collection' : 'Awaiting supplier delivery',
      time_text: '',
      state: 'pending',
    },
  ];

  const { error: timelineError } = await supabase.from('order_timeline_events').insert(timelineEvents);
  if (timelineError) {
    throwSupabaseError(timelineError, 'Failed to create order timeline');
  }

  if (customer) {
    const { error: purchaseError } = await supabase.from('customer_purchases').upsert(
      {
        customer_id: customer.id,
        purchase_id: orderId,
        date_label: formatDateLabel(now),
        amount: total,
        status: 'processing',
        created_at: now.toISOString(),
      },
      { onConflict: 'owner_id,customer_id,purchase_id' }
    );

    if (purchaseError) {
      throwSupabaseError(purchaseError, 'Failed to save special order history');
    }
  }

  return {
    data: await loadAppData(supabase),
    meta: {
      orderId,
      total,
    },
  };
}

export async function updateOrderStatus(supabase: AppSupabaseClient, orderId: string, status: Order['status']) {
  const now = new Date();
  const settings = await loadSettings(supabase);

  const { data, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (orderError) {
    throwSupabaseError(orderError, 'Failed to load order');
  }

  const orderRow = (data as OrderRow | null) ?? null;
  if (!orderRow) {
    throw new Error(`Order ${orderId} was not found.`);
  }

  const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (updateError) {
    throwSupabaseError(updateError, 'Failed to update order status');
  }

  if (status === 'paid' && orderRow.customer_id && orderRow.status !== 'paid') {
    const customer = await loadCustomer(supabase, orderRow.customer_id);
    if (customer) {
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          total_spent: Number((customer.total_spent + orderRow.total).toFixed(2)),
          last_purchase: formatDateLabel(now),
          loyalty_points: (customer.loyalty_points ?? 0) + Math.round(orderRow.total),
        })
        .eq('id', customer.id);

      if (customerError) {
        throwSupabaseError(customerError, 'Failed to update customer after order collection');
      }

      const { error: purchaseError } = await supabase.from('customer_purchases').upsert(
        {
          customer_id: customer.id,
          purchase_id: orderId,
          date_label: formatDateLabel(now),
          amount: orderRow.total,
          status: 'paid',
          created_at: now.toISOString(),
        },
        { onConflict: 'owner_id,customer_id,purchase_id' }
      );

      if (purchaseError) {
        throwSupabaseError(purchaseError, 'Failed to update customer purchase history');
      }
    }
  }

  if (status === 'ready' && orderRow.customer_id && settings.toggles.smsReadyAlerts) {
    const customer = await loadCustomer(supabase, orderRow.customer_id);
    try {
      const smsResult = await sendTwilioSms({
        settings,
        to: customer?.phone ?? undefined,
        body: `${orderRow.customer}, your IronDesk order ${orderId} is ready for collection at ${settings.storeInfo.storeName}.`,
      });
      await recordIntegrationRun(supabase, {
        provider: 'twilio',
        event: 'order_ready_sms',
        status: smsResult.status,
        message: smsResult.message,
        targetId: orderId,
        reference: smsResult.reference,
      });
    } catch (error) {
      await recordIntegrationRun(supabase, {
        provider: 'twilio',
        event: 'order_ready_sms',
        status: 'failed',
        message: toErrorMessage(error, `SMS send failed for ${orderId}`),
        targetId: orderId,
      });
    }
  }

  if (status === 'paid') {
    const { data: orderLineData, error: orderLineError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('position');
    if (orderLineError) {
      throwSupabaseError(orderLineError, 'Failed to load order items for accounting sync');
    }

    const accountingCart = ((orderLineData ?? []) as OrderItemRow[]).map((row) => ({
      sku: row.sku,
      name: row.name,
      price: Number(row.unit_price),
      stock: 0,
      cat: 'tools' as const,
      min: 0,
      qty: row.qty,
    }));

    await syncSaleToAccounting(supabase, settings, {
      documentId: orderId,
      customerName: orderRow.customer,
      paymentMethod: 'invoice',
      amount: Number(orderRow.total),
      cart: accountingCart,
    });
  }

  const { data: timelineData, error: timelineError } = await supabase
    .from('order_timeline_events')
    .select('*')
    .eq('order_id', orderId)
    .order('position');

  if (timelineError) {
    throwSupabaseError(timelineError, 'Failed to load order timeline');
  }

  const timelineRows = (timelineData ?? []) as TimelineRow[];
  const updates = timelineRows
    .filter((entry) => entry.state === 'active')
    .map((entry) =>
      supabase.from('order_timeline_events').update({ state: 'done' }).eq('order_id', orderId).eq('position', entry.position)
    );

  const updateResults = await Promise.all(updates);
  for (const result of updateResults) {
    if (result.error) {
      throwSupabaseError(result.error, 'Failed to update existing timeline state');
    }
  }

  const nextPosition = timelineRows.reduce((max, entry) => Math.max(max, entry.position), -1) + 1;
  const label =
    status === 'paid'
      ? 'Collected and closed'
      : status === 'ready'
        ? 'Ready for collection'
        : status === 'processing'
          ? 'Processing started'
          : 'Awaiting stock';

  const { error: insertTimelineError } = await supabase.from('order_timeline_events').insert({
    order_id: orderId,
    position: nextPosition,
    label,
    time_text: formatTimelineStamp(now),
    state: status === 'paid' ? 'done' : 'active',
  });

  if (insertTimelineError) {
    throwSupabaseError(insertTimelineError, 'Failed to append order timeline');
  }

  return { data: await loadAppData(supabase) };
}

export async function addProduct(supabase: AppSupabaseClient, product: Product) {
  const settings = await loadSettings(supabase);
  const insert: ProductInsert = {
    sku: product.sku,
    name: product.name,
    price: product.price,
    stock: product.stock,
    cat: product.cat,
    min_stock: product.min,
    supplier: product.supplier ?? null,
  };

  const { error } = await supabase.from('products').insert(insert);
  if (error) {
    throwSupabaseError(error, 'Failed to add product');
  }

  await syncProductToChannels(supabase, settings, product);

  return { data: await loadAppData(supabase) };
}

export async function updateProduct(supabase: AppSupabaseClient, product: Product) {
  const settings = await loadSettings(supabase);
  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      price: product.price,
      stock: product.stock,
      cat: product.cat,
      min_stock: product.min,
      supplier: product.supplier ?? null,
    })
    .eq('sku', product.sku);

  if (error) {
    throwSupabaseError(error, 'Failed to update product');
  }

  await syncProductToChannels(supabase, settings, product);

  return { data: await loadAppData(supabase) };
}

export async function addCustomer(supabase: AppSupabaseClient, customer: Customer) {
  const insert: CustomerInsert = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? null,
    type: customer.type,
    total_spent: customer.totalSpent,
    last_purchase: customer.lastPurchase,
    balance: customer.balance,
    credit_limit: customer.creditLimit ?? null,
    loyalty_points: customer.loyaltyPoints ?? null,
    terms: customer.terms ?? null,
  };

  const { error } = await supabase.from('customers').insert(insert);
  if (error) {
    throwSupabaseError(error, 'Failed to add customer');
  }

  return { data: await loadAppData(supabase) };
}

export async function addSupplier(supabase: AppSupabaseClient, supplier: Supplier) {
  const insert: SupplierInsert = {
    id: supplier.id,
    name: supplier.name,
    category: supplier.category,
    lead_days: supplier.leadDays,
    account: supplier.account,
    skus: supplier.skus,
    monthly_spend: supplier.monthlySpend,
    on_time_rate: supplier.onTimeRate,
  };

  const { error } = await supabase.from('suppliers').insert(insert);
  if (error) {
    throwSupabaseError(error, 'Failed to add supplier');
  }

  return { data: await loadAppData(supabase) };
}

export async function updateSettings(supabase: AppSupabaseClient, settings: AppSettings) {
  const { error } = await supabase.from('app_settings').upsert(
    {
      payload: toSettingsPayload(settings),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id' }
  );

  if (error) {
    throwSupabaseError(error, 'Failed to update settings');
  }

  return { data: await loadAppData(supabase) };
}

export async function clearWorkspace(supabase: AppSupabaseClient, userId: string) {
  await clearWorkspaceData(supabase, userId);
  return { data: await loadAppData(supabase) };
}

export function toApiError(error: unknown, fallback: string) {
  return {
    error: toErrorMessage(error, fallback),
  };
}
