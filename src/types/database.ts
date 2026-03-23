import type {
  AppSettings,
  Category,
  HeldCartStatus,
  IntegrationProvider,
  IntegrationRunStatus,
  PurchaseOrderStatus,
  CustomerPurchase,
  OrderLineItem,
  OrderStatus,
  PaymentMethod,
  TimelineEvent,
} from '@/types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          owner_id: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          owner_id?: string;
          payload: Json;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_purchases: {
        Row: {
          amount: number;
          created_at: string;
          customer_id: string;
          date_label: string;
          owner_id: string;
          purchase_id: string;
          row_id: number;
          status: CustomerPurchase['status'];
        };
        Insert: {
          amount: number;
          created_at?: string;
          customer_id: string;
          date_label: string;
          owner_id?: string;
          purchase_id: string;
          row_id?: number;
          status: CustomerPurchase['status'];
        };
        Update: {
          amount?: number;
          created_at?: string;
          customer_id?: string;
          date_label?: string;
          owner_id?: string;
          purchase_id?: string;
          row_id?: number;
          status?: CustomerPurchase['status'];
        };
        Relationships: [];
      };
      held_cart_items: {
        Row: {
          cat: Category;
          held_cart_id: string;
          min_stock: number;
          name: string;
          owner_id: string;
          position: number;
          price: number;
          qty: number;
          row_id: number;
          sku: string;
          stock: number;
          supplier: string | null;
        };
        Insert: {
          cat: Category;
          held_cart_id: string;
          min_stock: number;
          name: string;
          owner_id?: string;
          position: number;
          price: number;
          qty: number;
          row_id?: number;
          sku: string;
          stock: number;
          supplier?: string | null;
        };
        Update: {
          cat?: Category;
          held_cart_id?: string;
          min_stock?: number;
          name?: string;
          owner_id?: string;
          position?: number;
          price?: number;
          qty?: number;
          row_id?: number;
          sku?: string;
          stock?: number;
          supplier?: string | null;
        };
        Relationships: [];
      };
      held_carts: {
        Row: {
          created_at: string;
          customer_id: string | null;
          customer_name: string;
          id: string;
          item_count: number;
          label: string;
          note: string | null;
          owner_id: string;
          row_id: number;
          status: HeldCartStatus;
          total: number;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          customer_name: string;
          id: string;
          item_count: number;
          label: string;
          note?: string | null;
          owner_id?: string;
          row_id?: number;
          status?: HeldCartStatus;
          total: number;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          customer_name?: string;
          id?: string;
          item_count?: number;
          label?: string;
          note?: string | null;
          owner_id?: string;
          row_id?: number;
          status?: HeldCartStatus;
          total?: number;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          balance: number;
          created_at: string;
          credit_limit: number | null;
          email: string;
          id: string;
          last_purchase: string;
          loyalty_points: number | null;
          name: string;
          owner_id: string;
          phone: string | null;
          row_id: number;
          terms: string | null;
          total_spent: number;
          type: 'trade' | 'retail';
        };
        Insert: {
          balance?: number;
          created_at?: string;
          credit_limit?: number | null;
          email: string;
          id: string;
          last_purchase?: string;
          loyalty_points?: number | null;
          name: string;
          owner_id?: string;
          phone?: string | null;
          row_id?: number;
          terms?: string | null;
          total_spent?: number;
          type: 'trade' | 'retail';
        };
        Update: {
          balance?: number;
          created_at?: string;
          credit_limit?: number | null;
          email?: string;
          id?: string;
          last_purchase?: string;
          loyalty_points?: number | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          row_id?: number;
          terms?: string | null;
          total_spent?: number;
          type?: 'trade' | 'retail';
        };
        Relationships: [];
      };
      integration_runs: {
        Row: {
          created_at: string;
          event: string;
          id: string;
          message: string;
          owner_id: string;
          provider: IntegrationProvider;
          reference: string | null;
          row_id: number;
          status: IntegrationRunStatus;
          target_id: string | null;
        };
        Insert: {
          created_at?: string;
          event: string;
          id: string;
          message: string;
          owner_id?: string;
          provider: IntegrationProvider;
          reference?: string | null;
          row_id?: number;
          status: IntegrationRunStatus;
          target_id?: string | null;
        };
        Update: {
          created_at?: string;
          event?: string;
          id?: string;
          message?: string;
          owner_id?: string;
          provider?: IntegrationProvider;
          reference?: string | null;
          row_id?: number;
          status?: IntegrationRunStatus;
          target_id?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          name: string;
          order_id: string;
          owner_id: string;
          position: number;
          qty: number;
          row_id: number;
          sku: string;
          status: OrderLineItem['status'];
          unit_price: number;
        };
        Insert: {
          name: string;
          order_id: string;
          owner_id?: string;
          position: number;
          qty: number;
          row_id?: number;
          sku: string;
          status: OrderLineItem['status'];
          unit_price: number;
        };
        Update: {
          name?: string;
          order_id?: string;
          owner_id?: string;
          position?: number;
          qty?: number;
          row_id?: number;
          sku?: string;
          status?: OrderLineItem['status'];
          unit_price?: number;
        };
        Relationships: [];
      };
      order_timeline_events: {
        Row: {
          label: string;
          order_id: string;
          owner_id: string;
          position: number;
          row_id: number;
          state: TimelineEvent['state'];
          time_text: string;
        };
        Insert: {
          label: string;
          order_id: string;
          owner_id?: string;
          position: number;
          row_id?: number;
          state: TimelineEvent['state'];
          time_text?: string;
        };
        Update: {
          label?: string;
          order_id?: string;
          owner_id?: string;
          position?: number;
          row_id?: number;
          state?: TimelineEvent['state'];
          time_text?: string;
        };
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          name: string;
          owner_id: string;
          position: number;
          purchase_order_id: string;
          qty: number;
          row_id: number;
          sku: string;
          unit_cost: number;
        };
        Insert: {
          name: string;
          owner_id?: string;
          position: number;
          purchase_order_id: string;
          qty: number;
          row_id?: number;
          sku: string;
          unit_cost: number;
        };
        Update: {
          name?: string;
          owner_id?: string;
          position?: number;
          purchase_order_id?: string;
          qty?: number;
          row_id?: number;
          sku?: string;
          unit_cost?: number;
        };
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          created_at: string;
          expected_date: string;
          id: string;
          item_count: number;
          owner_id: string;
          row_id: number;
          status: PurchaseOrderStatus;
          supplier_id: string;
          supplier_name: string;
          total: number;
        };
        Insert: {
          created_at?: string;
          expected_date: string;
          id: string;
          item_count: number;
          owner_id?: string;
          row_id?: number;
          status: PurchaseOrderStatus;
          supplier_id: string;
          supplier_name: string;
          total: number;
        };
        Update: {
          created_at?: string;
          expected_date?: string;
          id?: string;
          item_count?: number;
          owner_id?: string;
          row_id?: number;
          status?: PurchaseOrderStatus;
          supplier_id?: string;
          supplier_name?: string;
          total?: number;
        };
        Relationships: [];
      };
      register_notes: {
        Row: {
          author: string;
          body: string;
          created_at: string;
          id: string;
          owner_id: string;
          register_label: string;
          row_id: number;
        };
        Insert: {
          author: string;
          body: string;
          created_at?: string;
          id: string;
          owner_id?: string;
          register_label: string;
          row_id?: number;
        };
        Update: {
          author?: string;
          body?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          register_label?: string;
          row_id?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          customer: string;
          customer_id: string | null;
          date_label: string;
          deposit: number | null;
          due_label: string;
          id: string;
          owner_id: string;
          row_id: number;
          status: OrderStatus;
          total: number;
        };
        Insert: {
          created_at?: string;
          customer: string;
          customer_id?: string | null;
          date_label: string;
          deposit?: number | null;
          due_label: string;
          id: string;
          owner_id?: string;
          row_id?: number;
          status: OrderStatus;
          total: number;
        };
        Update: {
          created_at?: string;
          customer?: string;
          customer_id?: string | null;
          date_label?: string;
          deposit?: number | null;
          due_label?: string;
          id?: string;
          owner_id?: string;
          row_id?: number;
          status?: OrderStatus;
          total?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          cat: Category;
          created_at: string;
          min_stock: number;
          name: string;
          owner_id: string;
          price: number;
          row_id: number;
          sku: string;
          stock: number;
          supplier: string | null;
        };
        Insert: {
          cat: Category;
          created_at?: string;
          min_stock: number;
          name: string;
          owner_id?: string;
          price: number;
          row_id?: number;
          sku: string;
          stock: number;
          supplier?: string | null;
        };
        Update: {
          cat?: Category;
          created_at?: string;
          min_stock?: number;
          name?: string;
          owner_id?: string;
          price?: number;
          row_id?: number;
          sku?: string;
          stock?: number;
          supplier?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          account: string;
          category: string;
          created_at: string;
          id: string;
          lead_days: number;
          monthly_spend: number;
          name: string;
          on_time_rate: number;
          owner_id: string;
          row_id: number;
          skus: number;
        };
        Insert: {
          account: string;
          category: string;
          created_at?: string;
          id: string;
          lead_days: number;
          monthly_spend: number;
          name: string;
          on_time_rate: number;
          owner_id?: string;
          row_id?: number;
          skus: number;
        };
        Update: {
          account?: string;
          category?: string;
          created_at?: string;
          id?: string;
          lead_days?: number;
          monthly_spend?: number;
          name?: string;
          on_time_rate?: number;
          owner_id?: string;
          row_id?: number;
          skus?: number;
        };
        Relationships: [];
      };
      transaction_lines: {
        Row: {
          cat: Category;
          min_stock: number;
          name: string;
          owner_id: string;
          position: number;
          price: number;
          qty: number;
          row_id: number;
          sku: string;
          stock: number;
          supplier: string | null;
          transaction_id: string;
        };
        Insert: {
          cat: Category;
          min_stock: number;
          name: string;
          owner_id?: string;
          position: number;
          price: number;
          qty: number;
          row_id?: number;
          sku: string;
          stock: number;
          supplier?: string | null;
          transaction_id: string;
        };
        Update: {
          cat?: Category;
          min_stock?: number;
          name?: string;
          owner_id?: string;
          position?: number;
          price?: number;
          qty?: number;
          row_id?: number;
          sku?: string;
          stock?: number;
          supplier?: string | null;
          transaction_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string;
          customer: string;
          customer_id: string | null;
          id: string;
          items: number;
          method: PaymentMethod;
          owner_id: string;
          row_id: number;
          timestamp: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          customer: string;
          customer_id?: string | null;
          id: string;
          items: number;
          method: PaymentMethod;
          owner_id?: string;
          row_id?: number;
          timestamp: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          customer?: string;
          customer_id?: string | null;
          id?: string;
          items?: number;
          method?: PaymentMethod;
          owner_id?: string;
          row_id?: number;
          timestamp?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type DatabaseSettingsPayload = AppSettings;
