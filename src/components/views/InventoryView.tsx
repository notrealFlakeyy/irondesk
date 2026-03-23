'use client';

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Badge, Btn, Input, Mono, Select, Table, TD, TR } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { CATEGORIES } from '@/lib/data';
import { categoryLabel, fmt, stockStatus } from '@/lib/utils';
import { Category, Product, ToastTone, View } from '@/types';

type StockFilter = 'all' | 'ok' | 'low' | 'out';

const stockTone = {
  ok: 'green',
  low: 'amber',
  out: 'red',
} as const;

const emptyProduct = (): Product => ({
  sku: '',
  name: '',
  price: 0,
  stock: 0,
  cat: 'fasteners',
  min: 0,
  supplier: '',
});

export default function InventoryView({
  onNotify,
}: {
  onNav: (view: View) => void;
  onNotify: (message: string, tone?: ToastTone) => void;
}) {
  const { products, addProduct, updateProduct } = useAppState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | (typeof CATEGORIES)[number]['id']>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draftProduct, setDraftProduct] = useState<Product>(emptyProduct);
  const [savingProduct, setSavingProduct] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const state = stockStatus(product.stock, product.min);
      const matchesCategory = category === 'all' || product.cat === category;
      const matchesStock = stockFilter === 'all' || stockFilter === state;
      const query = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.supplier ?? '').toLowerCase().includes(query);

      return matchesCategory && matchesStock && matchesSearch;
    });
  }, [category, deferredSearch, products, stockFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setDraftProduct(emptyProduct());
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setDraftProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setDraftProduct(emptyProduct());
    setIsModalOpen(false);
  };

  const saveProduct = () => {
    if (!draftProduct.sku.trim() || !draftProduct.name.trim()) {
      onNotify('SKU and product name are required.', 'info');
      return;
    }

    const normalized: Product = {
      ...draftProduct,
      sku: draftProduct.sku.trim().toUpperCase(),
      name: draftProduct.name.trim(),
      supplier: draftProduct.supplier?.trim() || undefined,
      price: Number(draftProduct.price),
      stock: Number(draftProduct.stock),
      min: Number(draftProduct.min),
    };

    setSavingProduct(true);
    void (async () => {
      try {
        if (editingProduct) {
          await updateProduct(normalized);
          onNotify(`Updated ${normalized.sku}.`, 'success');
        } else {
          await addProduct(normalized);
          onNotify(`Added ${normalized.sku} to inventory.`, 'success');
        }

        closeModal();
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Failed to save the product.', 'info');
      } finally {
        setSavingProduct(false);
      }
    })();
  };

  const parseCsvRows = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('CSV file must include a header row and at least one product row.');
    }

    const splitLine = (line: string) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
    const headers = splitLine(lines[0]).map((header) => header.toLowerCase());
    const requiredHeaders = ['sku', 'name', 'price', 'stock', 'cat', 'min'];

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        throw new Error(`CSV is missing required column "${header}".`);
      }
    }

    return lines.slice(1).map((line, index) => {
      const cells = splitLine(line);
      const getValue = (header: string) => cells[headers.indexOf(header)] ?? '';
      const rawCategory = getValue('cat').toLowerCase();
      const categoryMatch = CATEGORIES.find(
        (item) => item.id !== 'all' && (item.id === rawCategory || item.label.toLowerCase() === rawCategory)
      );

      if (!categoryMatch || categoryMatch.id === 'all') {
        throw new Error(`Row ${index + 2} has an unknown category "${getValue('cat')}".`);
      }

      return {
        sku: getValue('sku').toUpperCase(),
        name: getValue('name'),
        price: Number(getValue('price')),
        stock: Number(getValue('stock')),
        cat: categoryMatch.id,
        min: Number(getValue('min')),
        supplier: getValue('supplier') || undefined,
      } satisfies Product;
    });
  };

  const importCsv = (file: File) => {
    setImportingCsv(true);

    void file
      .text()
      .then(async (content) => {
        const rows = parseCsvRows(content);
        let added = 0;
        let updated = 0;

        for (const row of rows) {
          if (products.some((product) => product.sku === row.sku)) {
            await updateProduct(row);
            updated += 1;
          } else {
            await addProduct(row);
            added += 1;
          }
        }

        onNotify(`Imported ${rows.length} products. Added ${added}, updated ${updated}.`, 'success');
      })
      .catch((error: unknown) => {
        onNotify(error instanceof Error ? error.message : 'Failed to import the CSV file.', 'info');
      })
      .finally(() => {
        setImportingCsv(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };

  const onContextAction = useEffectEvent((view?: View) => {
    if (view === 'inventory') {
      openAddModal();
    }
  });

  useEffect(() => {
    const handleContextAction = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: View }>).detail;
      onContextAction(detail?.view);
    };

    window.addEventListener('irondesk:context-action', handleContextAction);
    return () => window.removeEventListener('irondesk:context-action', handleContextAction);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            importCsv(file);
          }
        }}
      />
      <div className="flex flex-col gap-2.5 border-b bg-[var(--bg2)] px-5 py-3.5 xl:flex-row xl:items-center">
        <Input
          placeholder="Search inventory by SKU, product or supplier"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full xl:max-w-[320px]"
        />
        <Select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
          <option value="all">All Stock</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </Select>
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn variant="primary" onClick={openAddModal}>
            Add Product
          </Btn>
          <Btn onClick={() => fileInputRef.current?.click()} disabled={importingCsv}>
            {importingCsv ? 'Importing...' : 'Import CSV'}
          </Btn>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[var(--bg2)]">
        <Table
          headers={['SKU', 'Product Name', 'Category', 'In Stock', 'Min / Max', 'Stock Level', 'Unit Cost', 'Sell Price', 'Supplier', '']}
        >
          {filteredProducts.map((product) => {
            const status = stockStatus(product.stock, product.min);
            const maxTarget = product.min * 3;
            const width = Math.min(100, (product.stock / maxTarget) * 100);
            const barColor =
              status === 'out' ? 'var(--red)' : status === 'low' ? 'var(--accent)' : 'var(--green)';

            return (
              <TR key={product.sku}>
                <TD>
                  <Mono className="text-[11px] text-[var(--text3)]">{product.sku}</Mono>
                </TD>
                <TD className="text-[var(--text)]">{product.name}</TD>
                <TD>
                  <Badge variant="gray">{categoryLabel(product.cat)}</Badge>
                </TD>
                <TD>
                  <Mono>{product.stock}</Mono>
                </TD>
                <TD>
                  <Mono className="text-[11px] text-[var(--text3)]">
                    {product.min} / {maxTarget}
                  </Mono>
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-20 overflow-hidden rounded-sm bg-[var(--bg4)]">
                      <div className="h-full rounded-sm" style={{ width: `${width}%`, background: barColor }} />
                    </div>
                    <Badge variant={stockTone[status]}>{status}</Badge>
                  </div>
                </TD>
                <TD>
                  <Mono className="text-[var(--text3)]">{fmt(product.price * 0.6)}</Mono>
                </TD>
                <TD>
                  <Mono className="text-[var(--accent)]">{fmt(product.price)}</Mono>
                </TD>
                <TD className="text-[12px]">{product.supplier}</TD>
                <TD>
                  <Btn size="sm" onClick={() => openEditModal(product)}>
                    Edit
                  </Btn>
                </TD>
              </TR>
            );
          })}
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-[640px] rounded-sm border bg-[var(--bg2)]">
            <div className="border-b px-5 py-4">
              <div className="font-display text-[18px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">
                {editingProduct ? `Edit ${editingProduct.sku}` : 'Add Product'}
              </div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Input
                placeholder="SKU"
                value={draftProduct.sku}
                onChange={(event) => setDraftProduct((current) => ({ ...current, sku: event.target.value }))}
              />
              <Select
                value={draftProduct.cat}
                onChange={(event) =>
                  setDraftProduct((current) => ({ ...current, cat: event.target.value as Category }))
                }
              >
                {CATEGORIES.filter((item) => item.id !== 'all').map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Product name"
                value={draftProduct.name}
                onChange={(event) => setDraftProduct((current) => ({ ...current, name: event.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Sell price"
                type="number"
                min="0"
                step="0.01"
                value={String(draftProduct.price)}
                onChange={(event) =>
                  setDraftProduct((current) => ({ ...current, price: Number(event.target.value) }))
                }
              />
              <Input
                placeholder="Supplier"
                value={draftProduct.supplier ?? ''}
                onChange={(event) =>
                  setDraftProduct((current) => ({ ...current, supplier: event.target.value }))
                }
              />
              <Input
                placeholder="Stock"
                type="number"
                min="0"
                value={String(draftProduct.stock)}
                onChange={(event) =>
                  setDraftProduct((current) => ({ ...current, stock: Number(event.target.value) }))
                }
              />
              <Input
                placeholder="Minimum"
                type="number"
                min="0"
                value={String(draftProduct.min)}
                onChange={(event) =>
                  setDraftProduct((current) => ({ ...current, min: Number(event.target.value) }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3.5">
              <Btn onClick={closeModal} disabled={savingProduct}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={saveProduct} disabled={savingProduct}>
                {savingProduct ? 'Saving...' : 'Save Product'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
