import type { SupabaseClient } from '@supabase/supabase-js';
import { createInitialAppData } from '@/lib/data';
import type {
  AppData,
  AppSettings,
  CartItem,
  CheckoutCartParams,
  CreateSpecialOrderParams,
  Customer,
  CustomerPurchase,
  Order,
  OrderLineItem,
  Product,
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
type SupplierRow = Tables['suppliers']['Row'];
type SupplierInsert = Tables['suppliers']['Insert'];
type OrderRow = Tables['orders']['Row'];
type OrderInsert = Tables['orders']['Insert'];
type OrderItemRow = Tables['order_items']['Row'];
type OrderItemInsert = Tables['order_items']['Insert'];
type TimelineRow = Tables['order_timeline_events']['Row'];
type TimelineInsert = Tables['order_timeline_events']['Insert'];
type TransactionRow = Tables['transactions']['Row'];
type TransactionInsert = Tables['transactions']['Insert'];
type TransactionLineRow = Tables['transaction_lines']['Row'];
type TransactionLineInsert = Tables['transaction_lines']['Insert'];
type CustomerPurchaseRow = Tables['customer_purchases']['Row'];
type CustomerPurchaseInsert = Tables['customer_purchases']['Insert'];
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
    type: row.type,
    totalSpent: Number(row.total_spent),
    lastPurchase: row.last_purchase,
    balance: Number(row.balance),
    creditLimit: row.credit_limit ?? undefined,
    loyaltyPoints: row.loyalty_points ?? undefined,
    terms: row.terms ?? undefined,
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

  return ((data as SettingsRow | null)?.payload as AppSettings | undefined) ?? createInitialAppData().settings;
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

async function clearWorkspaceData(supabase: AppSupabaseClient, userId: string) {
  const deleteSteps = [
    async () => supabase.from('customer_purchases').delete().eq('owner_id', userId),
    async () => supabase.from('order_timeline_events').delete().eq('owner_id', userId),
    async () => supabase.from('order_items').delete().eq('owner_id', userId),
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

  const inserts = [
    supabase.from('products').insert(products),
    supabase.from('customers').insert(customers),
    supabase.from('suppliers').insert(suppliers),
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
    suppliersResult,
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
    supabase.from('suppliers').select('*').order('name'),
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
    { result: suppliersResult, context: 'Failed to load suppliers' },
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
  const supplierRows = (suppliersResult.data ?? []) as SupplierRow[];
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
    orders: orderRows.map(serializeOrder),
    suppliers: supplierRows.map(serializeSupplier),
    transactions: transactionRows.map(serializeTransaction),
    transactionLines: groupRows(transactionLineRows, (row) => row.transaction_id, serializeTransactionLine),
    customerPurchases: groupRows(customerPurchaseRows, (row) => row.customer_id, serializeCustomerPurchase),
    orderItems: groupRows(orderItemRows, (row) => row.order_id, serializeOrderItem),
    orderTimelines: groupRows(timelineRows, (row) => row.order_id, serializeTimelineEvent),
    settings: (settingsRow?.payload as AppSettings | undefined) ?? createInitialAppData().settings,
  };
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
  await updateProductsStock(supabase, params.cart, 'decrement_always');

  const transactionInsert: TransactionInsert = {
    id: receiptId,
    customer: customer?.name ?? 'Walk-in',
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

  return { data: await loadAppData(supabase) };
}

export async function updateProduct(supabase: AppSupabaseClient, product: Product) {
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

  return { data: await loadAppData(supabase) };
}

export async function addCustomer(supabase: AppSupabaseClient, customer: Customer) {
  const insert: CustomerInsert = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
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
