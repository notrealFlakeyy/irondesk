'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialAppData } from '@/lib/data';
import type {
  AppData,
  AppSettings,
  CheckoutCartParams,
  CreateSpecialOrderParams,
  Customer,
  Order,
  Product,
  Supplier,
} from '@/types';

type AppStateContextValue = AppData & {
  hydrated: boolean;
  syncing: boolean;
  backendError: string | null;
  dataSource: 'empty' | 'supabase';
  refreshData: () => Promise<void>;
  checkoutCart: (params: CheckoutCartParams) => Promise<{ receiptId: string; total: number }>;
  createSpecialOrder: (params: CreateSpecialOrderParams) => Promise<{ orderId: string; total: number }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  seedDemoData: () => Promise<void>;
  resetData: () => Promise<void>;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function cloneInitialState() {
  const initial = createInitialAppData();
  return {
    ...initial,
    products: [],
    customers: [],
    orders: [],
    suppliers: [],
    transactions: [],
    transactionLines: {},
    customerPurchases: {},
    orderItems: {},
    orderTimelines: {},
  };
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }

  if (!payload.data) {
    throw new Error('The server response did not include app data.');
  }

  return {
    data: payload.data,
    meta: payload.meta,
  };
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData>(cloneInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'empty' | 'supabase'>('empty');

  const refreshData = useCallback(async () => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/bootstrap');
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : 'Failed to sync with Supabase.');
      setDataSource('empty');
    } finally {
      setHydrated(true);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const checkoutCart = useCallback(async (params: CheckoutCartParams) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');

      return {
        receiptId: String(payload.meta?.receiptId ?? ''),
        total: Number(payload.meta?.total ?? 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete checkout.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const createSpecialOrder = useCallback(async (params: CreateSpecialOrderParams) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');

      return {
        orderId: String(payload.meta?.orderId ?? ''),
        total: Number(payload.meta?.total ?? 0),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create the special order.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>(`/api/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update the order.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add the product.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>(`/api/products/${product.sku}`, {
        method: 'PATCH',
        body: JSON.stringify(product),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update the product.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const addCustomer = useCallback(async (customer: Customer) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add the customer.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const addSupplier = useCallback(async (supplier: Supplier) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplier),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add the supplier.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const updateSettings = useCallback(async (settings: AppSettings) => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const seedDemoData = useCallback(async () => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/demo/seed', {
        method: 'POST',
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load the demo workspace.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const resetData = useCallback(async () => {
    setSyncing(true);

    try {
      const payload = await requestJson<AppData>('/api/reset', {
        method: 'POST',
      });
      setData(payload.data);
      setBackendError(null);
      setDataSource('supabase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset the demo data.';
      setBackendError(message);
      throw new Error(message);
    } finally {
      setSyncing(false);
    }
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...data,
      hydrated,
      syncing,
      backendError,
      dataSource,
      refreshData,
      checkoutCart,
      createSpecialOrder,
      updateOrderStatus,
      addProduct,
      updateProduct,
      addCustomer,
      addSupplier,
      updateSettings,
      seedDemoData,
      resetData,
    }),
    [
      addCustomer,
      addProduct,
      addSupplier,
      backendError,
      checkoutCart,
      createSpecialOrder,
      data,
      dataSource,
      hydrated,
      refreshData,
      resetData,
      seedDemoData,
      syncing,
      updateOrderStatus,
      updateProduct,
      updateSettings,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}
