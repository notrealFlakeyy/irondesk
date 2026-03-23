import type { AppSettings, CartItem, IntegrationProvider, PaymentMethod, Product } from '@/types';

export type IntegrationDispatchResult = {
  status: 'success' | 'skipped';
  message: string;
  reference?: string;
};

function getIntegration(settings: AppSettings, provider: IntegrationProvider) {
  return settings.integrations.find((integration) => integration.provider === provider);
}

export function isIntegrationConnected(settings: AppSettings, provider: IntegrationProvider) {
  return Boolean(getIntegration(settings, provider)?.connected);
}

function formBody(payload: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => body.set(key, value));
  return body;
}

function basicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function readProviderError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) {
    return fallback;
  }

  return `${fallback}: ${text.slice(0, 300)}`;
}

export async function processStripeCardPayment(params: {
  settings: AppSettings;
  amount: number;
  currency?: string;
  receiptId: string;
  customerName: string;
}) {
  if (!isIntegrationConnected(params.settings, 'stripe')) {
    return {
      status: 'skipped',
      message: 'Stripe Terminal integration is disabled for this workspace.',
    } satisfies IntegrationDispatchResult;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return {
      status: 'skipped',
      message: 'Stripe secret key is not configured. Sale recorded without external capture.',
    } satisfies IntegrationDispatchResult;
  }

  const paymentMethod =
    process.env.STRIPE_TEST_PAYMENT_METHOD ??
    (secretKey.startsWith('sk_test_') ? 'pm_card_visa' : undefined);

  if (!paymentMethod) {
    return {
      status: 'skipped',
      message: 'Stripe live terminal handoff is not configured. Sale recorded without external capture.',
    } satisfies IntegrationDispatchResult;
  }

  const amountMinor = Math.round(params.amount * 100);
  const body = formBody({
    amount: String(amountMinor),
    currency: (params.currency ?? 'eur').toLowerCase(),
    confirm: 'true',
    payment_method: paymentMethod,
    description: `IronDesk POS ${params.receiptId}`,
    'metadata[receipt_id]': params.receiptId,
    'metadata[customer_name]': params.customerName,
  });

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response, 'Stripe payment request failed'));
  }

  const payload = (await response.json()) as { id?: string; status?: string };
  return {
    status: 'success',
    message: `Stripe payment intent ${payload.status ?? 'succeeded'}.`,
    reference: payload.id,
  } satisfies IntegrationDispatchResult;
}

export async function sendTwilioSms(params: {
  settings: AppSettings;
  to?: string;
  body: string;
}) {
  if (!isIntegrationConnected(params.settings, 'twilio')) {
    return {
      status: 'skipped',
      message: 'Twilio SMS integration is disabled for this workspace.',
    } satisfies IntegrationDispatchResult;
  }

  if (!params.to) {
    return {
      status: 'skipped',
      message: 'Customer phone number is missing.',
    } satisfies IntegrationDispatchResult;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return {
      status: 'skipped',
      message: 'Twilio credentials are not configured.',
    } satisfies IntegrationDispatchResult;
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({
      To: params.to,
      From: from,
      Body: params.body,
    }),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response, 'Twilio SMS request failed'));
  }

  const payload = (await response.json()) as { sid?: string; status?: string };
  return {
    status: 'success',
    message: `Twilio SMS queued with status ${payload.status ?? 'accepted'}.`,
    reference: payload.sid,
  } satisfies IntegrationDispatchResult;
}

export async function syncSaleToXero(params: {
  settings: AppSettings;
  documentId: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  cart: CartItem[];
}) {
  if (!isIntegrationConnected(params.settings, 'xero')) {
    return {
      status: 'skipped',
      message: 'Xero sync is disabled for this workspace.',
    } satisfies IntegrationDispatchResult;
  }

  const accessToken = process.env.XERO_ACCESS_TOKEN;
  const tenantId = process.env.XERO_TENANT_ID;
  const accountCode = process.env.XERO_SALES_ACCOUNT_CODE;

  if (!accessToken || !tenantId || !accountCode) {
    return {
      status: 'skipped',
      message: 'Xero credentials are incomplete.',
    } satisfies IntegrationDispatchResult;
  }

  const response = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Type: 'ACCREC',
      Status: 'AUTHORISED',
      Reference: params.documentId,
      Contact: {
        Name: params.customerName,
      },
      LineItems: params.cart.map((item) => ({
        Description: `${item.sku} ${item.name}`,
        Quantity: item.qty,
        UnitAmount: Number(item.price.toFixed(2)),
        AccountCode: accountCode,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response, 'Xero sync failed'));
  }

  const payload = (await response.json()) as { Invoices?: Array<{ InvoiceID?: string }> };
  return {
    status: 'success',
    message: `${params.paymentMethod === 'invoice' ? 'Invoice' : 'Sale'} exported to Xero.`,
    reference: payload.Invoices?.[0]?.InvoiceID,
  } satisfies IntegrationDispatchResult;
}

export async function syncSaleToQuickBooks(params: {
  settings: AppSettings;
  documentId: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  cart: CartItem[];
}) {
  if (!isIntegrationConnected(params.settings, 'quickbooks')) {
    return {
      status: 'skipped',
      message: 'QuickBooks sync is disabled for this workspace.',
    } satisfies IntegrationDispatchResult;
  }

  const accessToken = process.env.QBO_ACCESS_TOKEN;
  const realmId = process.env.QBO_REALM_ID;
  const customerRef = process.env.QBO_DEFAULT_CUSTOMER_REF;
  const itemRef = process.env.QBO_DEFAULT_ITEM_REF;

  if (!accessToken || !realmId || !customerRef || !itemRef) {
    return {
      status: 'skipped',
      message: 'QuickBooks credentials or default references are incomplete.',
    } satisfies IntegrationDispatchResult;
  }

  const endpoint =
    params.paymentMethod === 'invoice'
      ? `https://quickbooks.api.intuit.com/v3/company/${realmId}/invoice`
      : `https://quickbooks.api.intuit.com/v3/company/${realmId}/salesreceipt`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      CustomerRef: {
        value: customerRef,
        name: params.customerName,
      },
      PrivateNote: `IronDesk ${params.documentId}`,
      Line: params.cart.map((item) => ({
        DetailType: 'SalesItemLineDetail',
        Amount: Number((item.price * item.qty).toFixed(2)),
        Description: `${item.sku} ${item.name}`,
        SalesItemLineDetail: {
          ItemRef: {
            value: itemRef,
          },
          Qty: item.qty,
          UnitPrice: Number(item.price.toFixed(2)),
        },
      })),
      TotalAmt: Number(params.amount.toFixed(2)),
    }),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response, 'QuickBooks sync failed'));
  }

  const payload = (await response.json()) as { Invoice?: { Id?: string }; SalesReceipt?: { Id?: string } };
  return {
    status: 'success',
    message: `${params.paymentMethod === 'invoice' ? 'Invoice' : 'Sale'} exported to QuickBooks.`,
    reference: payload.Invoice?.Id ?? payload.SalesReceipt?.Id,
  } satisfies IntegrationDispatchResult;
}

export async function syncWooCommerceStock(params: {
  settings: AppSettings;
  product: Product;
}) {
  if (!isIntegrationConnected(params.settings, 'woocommerce')) {
    return {
      status: 'skipped',
      message: 'WooCommerce sync is disabled for this workspace.',
    } satisfies IntegrationDispatchResult;
  }

  const baseUrl = process.env.WOOCOMMERCE_BASE_URL?.replace(/\/$/, '');
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!baseUrl || !consumerKey || !consumerSecret) {
    return {
      status: 'skipped',
      message: 'WooCommerce credentials are incomplete.',
    } satisfies IntegrationDispatchResult;
  }

  const searchResponse = await fetch(
    `${baseUrl}/wp-json/wc/v3/products?sku=${encodeURIComponent(params.product.sku)}`,
    {
      headers: {
        Authorization: basicAuthHeader(consumerKey, consumerSecret),
        Accept: 'application/json',
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error(await readProviderError(searchResponse, 'WooCommerce product lookup failed'));
  }

  const products = (await searchResponse.json()) as Array<{ id: number }>;
  const remoteProduct = products[0];
  if (!remoteProduct) {
    return {
      status: 'skipped',
      message: `WooCommerce SKU ${params.product.sku} was not found.`,
    } satisfies IntegrationDispatchResult;
  }

  const updateResponse = await fetch(`${baseUrl}/wp-json/wc/v3/products/${remoteProduct.id}`, {
    method: 'PUT',
    headers: {
      Authorization: basicAuthHeader(consumerKey, consumerSecret),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stock_quantity: params.product.stock,
      manage_stock: true,
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(await readProviderError(updateResponse, 'WooCommerce stock sync failed'));
  }

  return {
    status: 'success',
    message: `WooCommerce stock updated for ${params.product.sku}.`,
    reference: String(remoteProduct.id),
  } satisfies IntegrationDispatchResult;
}
