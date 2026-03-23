import type {
  AppSettings,
  Category,
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
          id: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payload: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_purchases: {
        Row: {
          id: number;
          amount: number;
          created_at: string;
          customer_id: string;
          date_label: string;
          purchase_id: string;
          status: CustomerPurchase['status'];
        };
        Insert: {
          id?: number;
          amount: number;
          created_at?: string;
          customer_id: string;
          date_label: string;
          purchase_id: string;
          status: CustomerPurchase['status'];
        };
        Update: {
          id?: number;
          amount?: number;
          created_at?: string;
          customer_id?: string;
          date_label?: string;
          purchase_id?: string;
          status?: CustomerPurchase['status'];
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
          terms?: string | null;
          total_spent?: number;
          type?: 'trade' | 'retail';
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: number;
          name: string;
          order_id: string;
          position: number;
          qty: number;
          sku: string;
          status: OrderLineItem['status'];
          unit_price: number;
        };
        Insert: {
          id?: number;
          name: string;
          order_id: string;
          position: number;
          qty: number;
          sku: string;
          status: OrderLineItem['status'];
          unit_price: number;
        };
        Update: {
          id?: number;
          name?: string;
          order_id?: string;
          position?: number;
          qty?: number;
          sku?: string;
          status?: OrderLineItem['status'];
          unit_price?: number;
        };
        Relationships: [];
      };
      order_timeline_events: {
        Row: {
          id: number;
          label: string;
          order_id: string;
          position: number;
          state: TimelineEvent['state'];
          time_text: string;
        };
        Insert: {
          id?: number;
          label: string;
          order_id: string;
          position: number;
          state: TimelineEvent['state'];
          time_text?: string;
        };
        Update: {
          id?: number;
          label?: string;
          order_id?: string;
          position?: number;
          state?: TimelineEvent['state'];
          time_text?: string;
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
          price: number;
          sku: string;
          stock: number;
          supplier: string | null;
        };
        Insert: {
          cat: Category;
          created_at?: string;
          min_stock: number;
          name: string;
          price: number;
          sku: string;
          stock: number;
          supplier?: string | null;
        };
        Update: {
          cat?: Category;
          created_at?: string;
          min_stock?: number;
          name?: string;
          price?: number;
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
          skus?: number;
        };
        Relationships: [];
      };
      transaction_lines: {
        Row: {
          cat: Category;
          id: number;
          min_stock: number;
          name: string;
          position: number;
          price: number;
          qty: number;
          sku: string;
          stock: number;
          supplier: string | null;
          transaction_id: string;
        };
        Insert: {
          cat: Category;
          id?: number;
          min_stock: number;
          name: string;
          position: number;
          price: number;
          qty: number;
          sku: string;
          stock: number;
          supplier?: string | null;
          transaction_id: string;
        };
        Update: {
          cat?: Category;
          id?: number;
          min_stock?: number;
          name?: string;
          position?: number;
          price?: number;
          qty?: number;
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
