import {
  AppData,
  AppSettings,
  CartItem,
  Category,
  Customer,
  CustomerPurchase,
  Integration,
  HeldCart,
  IntegrationRun,
  Order,
  OrderLineItem,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  RegisterNote,
  SettingsSection,
  StaffPerformanceRow,
  Supplier,
  TimelineEvent,
  Transaction,
  VatRow,
} from '@/types';

export const CATEGORIES: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fasteners', label: 'Fasteners' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'tools', label: 'Tools' },
  { id: 'paint', label: 'Paint' },
  { id: 'safety', label: 'Safety' },
  { id: 'lumber', label: 'Lumber' },
];

export const PRODUCTS: Product[] = [
  { sku: 'FAS-0441', name: 'M8 Hex Bolts (Box/100)', price: 21.0, stock: 4, cat: 'fasteners', min: 20, supplier: 'Würth Group' },
  { sku: 'FAS-0442', name: 'M10 Hex Bolts (Box/50)', price: 18.4, stock: 32, cat: 'fasteners', min: 15, supplier: 'Würth Group' },
  { sku: 'FAS-0510', name: 'Wood Screws 4x50mm (Box)', price: 8.0, stock: 12, cat: 'fasteners', min: 25, supplier: 'Würth Group' },
  { sku: 'FAS-0511', name: 'Self-tapping Screws 5x25', price: 6.5, stock: 45, cat: 'fasteners', min: 20, supplier: 'Würth Group' },
  { sku: 'FAS-0600', name: 'M6 Nuts (Bag/200)', price: 4.9, stock: 88, cat: 'fasteners', min: 30, supplier: 'Würth Group' },
  { sku: 'ELC-0882', name: '2.5mm² Twin+Earth Cable (50m)', price: 64.2, stock: 22, cat: 'electrical', min: 10, supplier: 'Hager Electric' },
  { sku: 'ELC-0884', name: '4mm² Cable (25m)', price: 48.0, stock: 14, cat: 'electrical', min: 8, supplier: 'Hager Electric' },
  { sku: 'ELC-1100', name: '15A Circuit Breaker', price: 14.8, stock: 0, cat: 'electrical', min: 20, supplier: 'Hager Electric' },
  { sku: 'ELC-1101', name: '20A Circuit Breaker', price: 16.4, stock: 18, cat: 'electrical', min: 15, supplier: 'Hager Electric' },
  { sku: 'ELC-0220', name: '20mm PVC Conduit (3m)', price: 3.8, stock: 6, cat: 'electrical', min: 15, supplier: 'Hager Electric' },
  { sku: 'PLM-0214', name: '22mm Copper Elbow (x10)', price: 12.3, stock: 41, cat: 'plumbing', min: 20, supplier: 'Geberit BV' },
  { sku: 'PLM-0310', name: '15mm Straight Coupler', price: 4.6, stock: 76, cat: 'plumbing', min: 25, supplier: 'Geberit BV' },
  { sku: 'PLM-0411', name: 'Teflon Tape (10m)', price: 1.2, stock: 120, cat: 'plumbing', min: 50, supplier: 'Geberit BV' },
  { sku: 'TOL-0810', name: '4in Angle Grinder Disc', price: 3.4, stock: 8, cat: 'tools', min: 20, supplier: 'Bosch Tools NL' },
  { sku: 'TOL-0880', name: 'Combination Spanner Set', price: 34.9, stock: 11, cat: 'tools', min: 5, supplier: 'Bosch Tools NL' },
  { sku: 'PAI-1100', name: 'White Primer 5L', price: 22.5, stock: 24, cat: 'paint', min: 10, supplier: 'Sikkens Paint' },
  { sku: 'PAI-1200', name: 'Masking Tape 50mm', price: 4.2, stock: 67, cat: 'paint', min: 30, supplier: 'Sikkens Paint' },
  { sku: 'SAF-0118', name: 'FFP2 Dust Masks (Box/20)', price: 22.5, stock: 30, cat: 'safety', min: 15, supplier: 'Würth Group' },
  { sku: 'SAF-0210', name: 'Safety Glasses (CE EN166)', price: 8.9, stock: 42, cat: 'safety', min: 10, supplier: 'Würth Group' },
  { sku: 'LUM-0010', name: 'CLS Timber 47x100 (3m)', price: 6.8, stock: 52, cat: 'lumber', min: 20, supplier: 'Timber NL' },
];

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Bakker Contracting', email: 'p.bakker@bakkercontract.nl', phone: '+31610234001', type: 'trade', totalSpent: 28440, lastPurchase: '23 Mar 2026', balance: -892, creditLimit: 5000, loyaltyPoints: 2844, terms: 'Net 30' },
  { id: 'c2', name: 'De Vries Bouw', email: 'info@devries-bouw.nl', phone: '+31610234002', type: 'trade', totalSpent: 14820, lastPurchase: '21 Mar 2026', balance: 0, creditLimit: 3000, loyaltyPoints: 1482, terms: 'Net 30' },
  { id: 'c3', name: 'Visser Electric', email: 'r.visser@visserelec.nl', phone: '+31610234003', type: 'trade', totalSpent: 9310, lastPurchase: '17 Mar 2026', balance: -440, creditLimit: 2000, loyaltyPoints: 931, terms: 'Net 14' },
  { id: 'c4', name: 'J. Smit', email: 'j.smit@gmail.com', phone: '+31610234004', type: 'retail', totalSpent: 1240, lastPurchase: '21 Mar 2026', balance: 0, loyaltyPoints: 124 },
  { id: 'c5', name: 'H. Müller', email: 'h.muller@web.de', phone: '+31610234005', type: 'retail', totalSpent: 680, lastPurchase: '18 Mar 2026', balance: 0, loyaltyPoints: 68 },
];

export const ORDERS: Order[] = [
  { id: 'ORD-2041', customer: 'Bakker Contracting', customerId: 'c1', date: '22 Mar 2026', due: '25 Mar 2026', status: 'ready', total: 1248.6, deposit: 250 },
  { id: 'ORD-2040', customer: 'J. Smit', customerId: 'c4', date: '21 Mar 2026', due: '21 Mar 2026', status: 'paid', total: 340.0 },
  { id: 'ORD-2039', customer: 'De Vries Bouw', customerId: 'c2', date: '20 Mar 2026', due: '24 Mar 2026', status: 'pending', total: 2140.0, deposit: 500 },
  { id: 'ORD-2038', customer: 'Walk-in', date: '19 Mar 2026', due: '19 Mar 2026', status: 'paid', total: 89.4 },
  { id: 'ORD-2037', customer: 'H. Müller', customerId: 'c5', date: '18 Mar 2026', due: '18 Mar 2026', status: 'paid', total: 124.5 },
  { id: 'ORD-2036', customer: 'Bakker Contracting', customerId: 'c1', date: '17 Mar 2026', due: '17 Mar 2026', status: 'paid', total: 2140.0 },
  { id: 'ORD-2035', customer: 'Visser Electric', customerId: 'c3', date: '17 Mar 2026', due: '20 Mar 2026', status: 'pending', total: 880.0, deposit: 200 },
];

export const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Würth Group', category: 'Fasteners & Safety', leadDays: 2, account: 'WUR-4421', skus: 24, monthlySpend: 4820, onTimeRate: 98 },
  { id: 's2', name: 'Hager Electric', category: 'Electrical', leadDays: 3, account: 'HAG-0092', skus: 38, monthlySpend: 7140, onTimeRate: 88 },
  { id: 's3', name: 'Geberit BV', category: 'Plumbing', leadDays: 4, account: 'GEB-7712', skus: 19, monthlySpend: 2960, onTimeRate: 96 },
  { id: 's4', name: 'Bosch Tools NL', category: 'Power Tools', leadDays: 5, account: 'BSH-3301', skus: 12, monthlySpend: 3440, onTimeRate: 100 },
  { id: 's5', name: 'Sikkens Paint', category: 'Paint & Finishes', leadDays: 2, account: 'SIK-8801', skus: 31, monthlySpend: 1880, onTimeRate: 94 },
  { id: 's6', name: 'Timber NL', category: 'Lumber', leadDays: 3, account: 'TIM-0041', skus: 8, monthlySpend: 1420, onTimeRate: 91 },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 'R-0847', customer: 'Walk-in', items: 3, amount: 124.5, method: 'card', timestamp: '2026-03-23T14:32:00.000Z' },
  { id: 'R-0846', customer: 'Bakker Contracting', customerId: 'c1', items: 12, amount: 892.0, method: 'invoice', timestamp: '2026-03-23T14:18:00.000Z' },
  { id: 'R-0845', customer: 'Walk-in', items: 1, amount: 28.9, method: 'cash', timestamp: '2026-03-23T13:55:00.000Z' },
  { id: 'R-0844', customer: 'De Vries Bouw', customerId: 'c2', items: 8, amount: 441.2, method: 'invoice', timestamp: '2026-03-23T13:40:00.000Z' },
  { id: 'R-0843', customer: 'Walk-in', items: 5, amount: 67.4, method: 'card', timestamp: '2026-03-23T13:22:00.000Z' },
  { id: 'R-0842', customer: 'Visser Electric', customerId: 'c3', items: 6, amount: 286.0, method: 'invoice', timestamp: '2026-03-22T15:45:00.000Z' },
  { id: 'R-0841', customer: 'Walk-in', items: 2, amount: 92.6, method: 'card', timestamp: '2026-03-22T11:10:00.000Z' },
  { id: 'R-0840', customer: 'H. Müller', customerId: 'c5', items: 4, amount: 124.5, method: 'cash', timestamp: '2026-03-21T10:18:00.000Z' },
  { id: 'R-0839', customer: 'Walk-in', items: 2, amount: 74.3, method: 'card', timestamp: '2026-03-20T16:04:00.000Z' },
  { id: 'R-0838', customer: 'Bakker Contracting', customerId: 'c1', items: 10, amount: 640.0, method: 'invoice', timestamp: '2026-03-19T12:36:00.000Z' },
  { id: 'R-0837', customer: 'De Vries Bouw', customerId: 'c2', items: 9, amount: 518.8, method: 'invoice', timestamp: '2026-03-18T09:42:00.000Z' },
  { id: 'R-0836', customer: 'Walk-in', items: 3, amount: 129.9, method: 'cash', timestamp: '2026-03-17T15:12:00.000Z' },
  { id: 'R-0835', customer: 'Walk-in', items: 5, amount: 210.0, method: 'card', timestamp: '2026-03-17T10:02:00.000Z' },
];

export const TRANSACTION_LINES: Record<string, CartItem[]> = {
  'R-0847': [
    { ...PRODUCTS[15], qty: 2 },
    { ...PRODUCTS[18], qty: 1 },
  ],
  'R-0846': [
    { ...PRODUCTS[5], qty: 8 },
    { ...PRODUCTS[10], qty: 10 },
    { ...PRODUCTS[17], qty: 4 },
  ],
  'R-0845': [{ ...PRODUCTS[14], qty: 1 }],
  'R-0844': [
    { ...PRODUCTS[9], qty: 6 },
    { ...PRODUCTS[11], qty: 12 },
  ],
  'R-0843': [
    { ...PRODUCTS[16], qty: 3 },
    { ...PRODUCTS[19], qty: 2 },
  ],
  'R-0842': [
    { ...PRODUCTS[6], qty: 2 },
    { ...PRODUCTS[8], qty: 4 },
  ],
  'R-0841': [
    { ...PRODUCTS[1], qty: 2 },
    { ...PRODUCTS[13], qty: 1 },
  ],
  'R-0840': [
    { ...PRODUCTS[14], qty: 1 },
    { ...PRODUCTS[18], qty: 1 },
    { ...PRODUCTS[16], qty: 2 },
  ],
  'R-0839': [
    { ...PRODUCTS[5], qty: 1 },
    { ...PRODUCTS[10], qty: 1 },
  ],
  'R-0838': [
    { ...PRODUCTS[0], qty: 5 },
    { ...PRODUCTS[5], qty: 4 },
    { ...PRODUCTS[9], qty: 6 },
  ],
  'R-0837': [
    { ...PRODUCTS[11], qty: 8 },
    { ...PRODUCTS[5], qty: 3 },
    { ...PRODUCTS[17], qty: 2 },
  ],
  'R-0836': [
    { ...PRODUCTS[15], qty: 3 },
    { ...PRODUCTS[18], qty: 1 },
  ],
  'R-0835': [
    { ...PRODUCTS[12], qty: 5 },
    { ...PRODUCTS[13], qty: 4 },
  ],
};

export const ORDER_ITEMS: Record<string, OrderLineItem[]> = {
  'ORD-2041': [
    { sku: 'FAS-0442', name: 'M10 Hex Bolts (Box/50)', qty: 5, unitPrice: 18.4, status: 'reserved' },
    { sku: 'ELC-0882', name: '2.5mm² Twin+Earth Cable (50m)', qty: 8, unitPrice: 64.2, status: 'ready' },
    { sku: 'PLM-0214', name: '22mm Copper Elbow (x10)', qty: 10, unitPrice: 12.3, status: 'ready' },
    { sku: 'SAF-0118', name: 'FFP2 Dust Masks (Box/20)', qty: 4, unitPrice: 22.5, status: 'ready' },
  ],
  'ORD-2039': [
    { sku: 'ELC-1100', name: '15A Circuit Breaker', qty: 40, unitPrice: 14.8, status: 'backorder' },
    { sku: 'ELC-1101', name: '20A Circuit Breaker', qty: 25, unitPrice: 16.4, status: 'reserved' },
    { sku: 'ELC-0220', name: '20mm PVC Conduit (3m)', qty: 60, unitPrice: 3.8, status: 'backorder' },
  ],
  'ORD-2035': [
    { sku: 'ELC-0884', name: '4mm² Cable (25m)', qty: 6, unitPrice: 48, status: 'reserved' },
    { sku: 'ELC-1101', name: '20A Circuit Breaker', qty: 10, unitPrice: 16.4, status: 'reserved' },
    { sku: 'SAF-0210', name: 'Safety Glasses (CE EN166)', qty: 20, unitPrice: 8.9, status: 'ready' },
  ],
};

export const ORDER_TIMELINES: Record<string, TimelineEvent[]> = {
  'ORD-2041': [
    { label: 'Order placed', time: '22 Mar 09:14 by M. Jansen', state: 'done' },
    { label: 'Deposit received', time: '22 Mar 09:22 via card', state: 'done' },
    { label: 'Stock reserved', time: '22 Mar 09:22 automatic reservation', state: 'done' },
    { label: 'Ready', time: '23 Mar 08:40 SMS sent to customer', state: 'active' },
    { label: 'Awaiting collection', time: '', state: 'pending' },
  ],
  'ORD-2039': [
    { label: 'Order placed', time: '20 Mar 11:08 by S. Kramer', state: 'done' },
    { label: 'Deposit received', time: '20 Mar 11:10 via card', state: 'done' },
    { label: 'Supplier PO created', time: '20 Mar 11:14 Hager Electric', state: 'active' },
    { label: 'Stock incoming', time: '', state: 'pending' },
    { label: 'Ready for pickup', time: '', state: 'pending' },
  ],
  'ORD-2035': [
    { label: 'Order placed', time: '17 Mar 15:42 by M. Jansen', state: 'done' },
    { label: 'Deposit received', time: '17 Mar 15:44 via cash', state: 'done' },
    { label: 'Awaiting stock allocation', time: '18 Mar 08:10 warehouse queue', state: 'active' },
    { label: 'Ready for dispatch', time: '', state: 'pending' },
    { label: 'Awaiting collection', time: '', state: 'pending' },
  ],
};

export const CUSTOMER_PURCHASES: Record<string, CustomerPurchase[]> = {
  c1: [
    { id: 'R-0846', date: '23 Mar 2026', amount: 892, status: 'invoice' },
    { id: 'ORD-2036', date: '17 Mar 2026', amount: 2140, status: 'paid' },
    { id: 'R-0811', date: '10 Mar 2026', amount: 540.8, status: 'paid' },
  ],
  c2: [
    { id: 'ORD-2039', date: '20 Mar 2026', amount: 2140, status: 'processing' },
    { id: 'R-0798', date: '12 Mar 2026', amount: 311.6, status: 'paid' },
  ],
  c3: [
    { id: 'ORD-2035', date: '17 Mar 2026', amount: 880, status: 'processing' },
    { id: 'R-0754', date: '04 Mar 2026', amount: 420, status: 'invoice' },
  ],
  c4: [
    { id: 'ORD-2040', date: '21 Mar 2026', amount: 340, status: 'paid' },
    { id: 'R-0777', date: '11 Mar 2026', amount: 88.2, status: 'paid' },
  ],
  c5: [{ id: 'ORD-2037', date: '18 Mar 2026', amount: 124.5, status: 'paid' }],
};

export const SETTINGS_INTEGRATIONS: Integration[] = [
  { provider: 'xero', name: 'Xero Accounting', hint: 'Sync sales and invoices automatically', connected: true },
  { provider: 'stripe', name: 'Stripe Terminal', hint: 'Card reader integration for countertop checkout', connected: true },
  { provider: 'twilio', name: 'Twilio SMS', hint: 'Send order-ready notifications by SMS', connected: false },
  { provider: 'woocommerce', name: 'WooCommerce', hint: 'Sync online and in-store inventory', connected: false },
  { provider: 'quickbooks', name: 'QuickBooks', hint: 'Alternative accounting sync', connected: false },
];

export const INTEGRATION_RUNS: IntegrationRun[] = [
  {
    id: 'SYNC-0001',
    provider: 'stripe',
    event: 'payment',
    targetId: 'R-0847',
    status: 'success',
    message: 'Card payment settled in terminal sandbox.',
    reference: 'pi_demo_0847',
    createdAt: '2026-03-23T14:32:04.000Z',
  },
  {
    id: 'SYNC-0002',
    provider: 'xero',
    event: 'sales_sync',
    targetId: 'R-0846',
    status: 'success',
    message: 'Trade invoice exported to Xero.',
    reference: 'xero-inv-2046',
    createdAt: '2026-03-23T14:18:11.000Z',
  },
  {
    id: 'SYNC-0003',
    provider: 'twilio',
    event: 'order_ready_sms',
    targetId: 'ORD-2041',
    status: 'skipped',
    message: 'SMS disabled for this workspace.',
    createdAt: '2026-03-23T08:40:00.000Z',
  },
];

export const HELD_CARTS: HeldCart[] = [
  {
    id: 'HOLD-0001',
    label: 'Counter Quote / Bakker',
    customerId: 'c1',
    customerName: 'Bakker Contracting',
    note: 'Waiting for site manager approval on cable run.',
    createdAt: '2026-03-23T09:14:00.000Z',
    itemCount: 5,
    total: 214.6,
    status: 'held',
  },
  {
    id: 'HOLD-0002',
    label: 'Walk-in Paint Mix',
    customerName: 'Walk-in',
    note: 'Customer stepped out to confirm quantity.',
    createdAt: '2026-03-23T10:48:00.000Z',
    itemCount: 3,
    total: 58.44,
    status: 'held',
  },
];

export const HELD_CART_ITEMS: Record<string, CartItem[]> = {
  'HOLD-0001': [
    { ...PRODUCTS[5], qty: 2 },
    { ...PRODUCTS[10], qty: 5 },
    { ...PRODUCTS[17], qty: 1 },
  ],
  'HOLD-0002': [
    { ...PRODUCTS[15], qty: 2 },
    { ...PRODUCTS[16], qty: 3 },
  ],
};

export const REGISTER_NOTES: RegisterNote[] = [
  {
    id: 'NOTE-0001',
    body: 'Cash drawer reconciled after morning float. No variance.',
    createdAt: '2026-03-23T08:12:00.000Z',
    author: 'Marcus J.',
    registerLabel: 'Register 1',
  },
  {
    id: 'NOTE-0002',
    body: 'Trade account signatures enabled for invoice sales after 14:00.',
    createdAt: '2026-03-23T13:05:00.000Z',
    author: 'Sarah K.',
    registerLabel: 'Register 1',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  storeInfo: {
    storeName: "Hartmann's Hardware",
    address: 'Marktstraat 14, 2600 Antwerp',
    vatNumber: 'BE0123456789',
    phone: '+32 3 456 78 90',
    currency: 'EUR',
  },
  toggles: {
    autoReceipt: true,
    askCustomer: false,
    offlineMode: true,
    managerPin: true,
    cashRounding: false,
    captureSignature: true,
    printLogo: true,
    showVatBreakdown: true,
    emailReceipts: true,
    smsReadyAlerts: true,
    nightlyBackup: true,
    includeAuditLog: true,
  },
  defaultTerms: 'Net 30',
  vatRate: 21,
  filingCycle: 'Quarterly',
  receiptFooter: 'Thank you for shopping local.',
  receiptWidth: '80mm',
  notificationsEmail: 'ops@hartmann-hardware.be',
  retentionDays: 365,
  subscriptionPlan: 'Pro',
  integrations: SETTINGS_INTEGRATIONS,
};

export const SETTINGS_NAV: SettingsSection[] = [
  'Store Info',
  'POS Settings',
  'Payments',
  'Tax & VAT',
  'Receipts',
  'Staff & Roles',
  'Integrations',
  'Notifications',
  'Backup & Data',
  'Subscription',
];

export const VAT_ROWS: VatRow[] = [
  { period: 'Mar 2026', net: 69594, vat: 14616, total: 84210 },
  { period: 'Feb 2026', net: 62810, vat: 13190, total: 76000 },
  { period: 'Jan 2026', net: 58264, vat: 12235, total: 70499 },
];

export const STAFF_PERFORMANCE: StaffPerformanceRow[] = [
  { name: 'Marcus J.', transactions: 284, revenue: 31420, averageBasket: 110.6 },
  { name: 'Sarah K.', transactions: 248, revenue: 22180, averageBasket: 89.4 },
  { name: 'Tom B.', transactions: 216, revenue: 18440, averageBasket: 85.4 },
  { name: 'Lisa V.', transactions: 194, revenue: 12170, averageBasket: 62.7 },
];

export function createInitialAppData(): AppData {
  return JSON.parse(
    JSON.stringify({
      products: PRODUCTS,
      customers: CUSTOMERS,
      orders: ORDERS,
      suppliers: SUPPLIERS,
      purchaseOrders: [] as PurchaseOrder[],
      heldCarts: HELD_CARTS,
      registerNotes: REGISTER_NOTES,
      integrationRuns: INTEGRATION_RUNS,
      transactions: TRANSACTIONS,
      transactionLines: TRANSACTION_LINES,
      customerPurchases: CUSTOMER_PURCHASES,
      orderItems: ORDER_ITEMS,
      orderTimelines: ORDER_TIMELINES,
      purchaseOrderItems: {} as Record<string, PurchaseOrderItem[]>,
      heldCartItems: HELD_CART_ITEMS,
      settings: INITIAL_SETTINGS,
    })
  ) as AppData;
}
