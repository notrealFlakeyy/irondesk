export type Category =
  | 'fasteners'
  | 'electrical'
  | 'plumbing'
  | 'tools'
  | 'paint'
  | 'safety'
  | 'lumber';

export type View =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'suppliers'
  | 'settings';

export type PaymentMethod = 'card' | 'cash' | 'invoice';
export type ToastTone = 'success' | 'info';
export type OrderStatus = 'ready' | 'paid' | 'pending' | 'processing';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'received';
export type HeldCartStatus = 'held';
export type IntegrationProvider = 'stripe' | 'twilio' | 'xero' | 'woocommerce' | 'quickbooks';
export type IntegrationRunStatus = 'success' | 'failed' | 'skipped';
export type StockState = 'ok' | 'low' | 'out';
export type FilingCycle = 'Monthly' | 'Quarterly' | 'Annually';
export type ReceiptWidth = '80mm' | '58mm';
export type SubscriptionPlan = 'Starter' | 'Pro' | 'Enterprise';
export type SettingsSection =
  | 'Store Info'
  | 'POS Settings'
  | 'Payments'
  | 'Tax & VAT'
  | 'Receipts'
  | 'Staff & Roles'
  | 'Integrations'
  | 'Notifications'
  | 'Backup & Data'
  | 'Subscription';

export interface Product {
  sku: string;
  name: string;
  price: number;
  stock: number;
  cat: Category;
  min: number;
  supplier?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface CheckoutCartParams {
  cart: CartItem[];
  customerId?: string;
  paymentMethod: PaymentMethod;
  discountRate?: number;
}

export interface HoldCartParams {
  cart: CartItem[];
  customerId?: string;
  label: string;
  note?: string;
  total: number;
}

export interface CreateSpecialOrderParams {
  cart: CartItem[];
  customerId?: string;
  deposit?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'trade' | 'retail';
  totalSpent: number;
  lastPurchase: string;
  balance: number;
  creditLimit?: number;
  loyaltyPoints?: number;
  terms?: string;
}

export interface Order {
  id: string;
  customer: string;
  customerId?: string;
  date: string;
  due: string;
  status: OrderStatus;
  total: number;
  deposit?: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  leadDays: number;
  account: string;
  skus: number;
  monthlySpend: number;
  onTimeRate: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  total: number;
  itemCount: number;
}

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
}

export interface HeldCart {
  id: string;
  label: string;
  customerId?: string;
  customerName: string;
  note?: string;
  createdAt: string;
  itemCount: number;
  total: number;
  status: HeldCartStatus;
}

export interface RegisterNote {
  id: string;
  body: string;
  createdAt: string;
  author: string;
  registerLabel: string;
}

export interface CreatePurchaseOrderParams {
  supplierId: string;
  status?: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
}

export interface CreateRegisterNoteParams {
  body: string;
  author?: string;
  registerLabel?: string;
}

export interface Transaction {
  id: string;
  customer: string;
  customerId?: string;
  items: number;
  amount: number;
  method: PaymentMethod;
  timestamp: string;
}

export interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
  tone: 'amber' | 'green' | 'red' | 'blue';
  deltaTone: 'green' | 'red' | 'muted' | 'blue';
}

export interface RevenueBar {
  day: string;
  height: number;
  active?: boolean;
}

export interface StockAlert {
  sku: string;
  name: string;
  stock: number;
  min: number;
  status: 'low' | 'out';
}

export interface PendingOrderSummary {
  id: string;
  customer: string;
  meta: string;
  status: OrderStatus;
}

export interface OrderLineItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  status: 'reserved' | 'ready' | 'backorder';
}

export interface TimelineEvent {
  label: string;
  time: string;
  state: 'done' | 'active' | 'pending';
}

export interface CustomerPurchase {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'invoice' | 'processing';
}

export interface ReportStat {
  label: string;
  value: string;
  tone: 'amber' | 'green' | 'blue' | 'text';
}

export interface VatRow {
  period: string;
  net: number;
  vat: number;
  total: number;
}

export interface TopProductRow {
  name: string;
  units: number;
  revenue: number;
  margin: number;
}

export interface StaffPerformanceRow {
  name: string;
  transactions: number;
  revenue: number;
  averageBasket: number;
}

export interface Integration {
  provider: IntegrationProvider;
  name: string;
  hint: string;
  connected: boolean;
}

export interface IntegrationRun {
  id: string;
  provider: IntegrationProvider;
  event: string;
  targetId?: string;
  status: IntegrationRunStatus;
  message: string;
  reference?: string;
  createdAt: string;
}

export interface StoreInfoSettings {
  storeName: string;
  address: string;
  vatNumber: string;
  phone: string;
  currency: string;
}

export interface SettingsToggleState {
  autoReceipt: boolean;
  askCustomer: boolean;
  offlineMode: boolean;
  managerPin: boolean;
  cashRounding: boolean;
  captureSignature: boolean;
  printLogo: boolean;
  showVatBreakdown: boolean;
  emailReceipts: boolean;
  smsReadyAlerts: boolean;
  nightlyBackup: boolean;
  includeAuditLog: boolean;
}

export interface AppSettings {
  storeInfo: StoreInfoSettings;
  toggles: SettingsToggleState;
  defaultTerms: string;
  vatRate: number;
  filingCycle: FilingCycle;
  receiptFooter: string;
  receiptWidth: ReceiptWidth;
  notificationsEmail: string;
  retentionDays: number;
  subscriptionPlan: SubscriptionPlan;
  integrations: Integration[];
}

export interface AppData {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  heldCarts: HeldCart[];
  registerNotes: RegisterNote[];
  integrationRuns: IntegrationRun[];
  transactions: Transaction[];
  transactionLines: Record<string, CartItem[]>;
  customerPurchases: Record<string, CustomerPurchase[]>;
  orderItems: Record<string, OrderLineItem[]>;
  orderTimelines: Record<string, TimelineEvent[]>;
  purchaseOrderItems: Record<string, PurchaseOrderItem[]>;
  heldCartItems: Record<string, CartItem[]>;
  settings: AppSettings;
}
