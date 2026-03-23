# IronDesk POS

A full-featured Point of Sale & Hardware Store Management System built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (icons)
- Fonts: Barlow Condensed, Barlow, Share Tech Mono (Google Fonts)

## Modules

| Module | Path | Description |
|---|---|---|
| Dashboard | `/` (default) | KPIs, revenue chart, alerts, recent transactions |
| Point of Sale | Sidebar → POS | Full cashier screen, cart, payment modal |
| Inventory | Sidebar → Inventory | Stock table, low-stock indicators, filters |
| Orders | Sidebar → Orders | Customer order list + detail with timeline |
| Customers | Sidebar → Customers | Customer list, trade accounts, purchase history |
| Reports | Sidebar → Reports | Revenue, VAT, top products, staff performance |
| Suppliers | Sidebar → Suppliers | Supplier cards with PO actions |
| Settings | Sidebar → Settings | Store config, POS behaviour, integrations |

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Industrial dark theme + Tailwind base
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main app shell (view switcher)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   └── Topbar.tsx     # Top bar with live clock
│   ├── ui/
│   │   └── index.tsx      # UI primitives: Badge, Btn, Input, Select, Toggle, Panel, Table
│   └── views/
│       ├── DashboardView.tsx
│       ├── POSView.tsx
│       ├── InventoryView.tsx
│       ├── OrdersView.tsx
│       ├── CustomersView.tsx
│       ├── ReportsView.tsx
│       ├── SuppliersView.tsx
│       └── SettingsView.tsx
├── lib/
│   ├── data.ts            # Seed data (products, customers, orders, suppliers)
│   └── utils.ts           # Helpers (cn, fmt, stockStatus)
└── types/
    └── index.ts           # TypeScript types
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend Integration

Each view is ready to swap mock data for real API calls. Replace imports from `@/lib/data` with `fetch()` calls to your backend:

```ts
// Before (mock)
import { PRODUCTS } from '@/lib/data';

// After (real API)
const products = await fetch('/api/products').then(r => r.json());
```

### Suggested API endpoints

| Method | Endpoint | Used by |
|---|---|---|
| GET | `/api/products` | POS, Inventory |
| POST | `/api/transactions` | POS checkout |
| GET/POST | `/api/orders` | Orders view |
| GET/POST | `/api/customers` | Customers view |
| GET | `/api/reports/summary` | Dashboard, Reports |
| GET/POST | `/api/suppliers` | Suppliers view |
| POST | `/api/payments/charge` | Payment modal |

## Pricing Tiers (for your SaaS)

| Plan | Price | Features |
|---|---|---|
| Starter | €199/mo | POS + Inventory + Basic Reports |
| Pro | €349/mo | + Orders + Trade Accounts + Suppliers + Integrations |
| Enterprise | €549+/mo | + Multi-location + Custom reports + Priority support |
