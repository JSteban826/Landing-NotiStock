'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Warehouse { id: string; name: string; }
interface Supplier  { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
  warehouse_id: string | null;
  supplier_id: string | null;
  warehouses?: { name: string };
  suppliers?: { name: string };
}

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  current_stock: 0,
  min_stock: 0,
  unit_price: 0,
  warehouse_id: '',
  supplier_id: '',
};

export default function ProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: prods }, { data: wares }, { data: sups }] = await Promise.all([
      supabase.from('products').select('*, warehouses(name), suppliers(name)').order('created_at', { ascending: false }),
      supabase.from('warehouses').select('id, name'),
      supabase.from('suppliers').select('id, name'),
    ]);
    setProducts(prods || []);
    setWarehouses(wares || []);
    setSuppliers(sups || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku || '',
      category: p.category || '',
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      unit_price: p.unit_price,
      warehouse_id: p.warehouse_id || '',
      supplier_id: p.supplier_id || '',
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);

  const payload = {
    ...form,
    warehouse_id: form.warehouse_id || null,
    supplier_id: form.supplier_id || null,
    current_stock: Number(form.current_stock),
    min_stock: Number(form.min_stock),
    unit_price: Number(form.unit_price),
  };

  if (editing) {
    await supabase.from('products').update(payload).eq('id', editing.id);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('products').insert({ ...payload, user_id: user!.id });
  }

  // Verificar si el stock es crítico y enviar alerta
  if (Number(form.current_stock) <= Number(form.min_stock)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name,
          currentStock: form.current_stock,
          minStock: form.min_stock,
          userEmail: user.email,
        }),
      });
    }
  }

  setSaving(false);
  setShowModal(false);
  loadAll();
}

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadAll();
  }

  function stockStatus(current: number, min: number) {
    if (current <= min) return { label: 'Crítico', cls: 'stock-critical' };
    if (current <= min * 1.5) return { label: 'Bajo', cls: 'stock-low' };
    return { label: 'OK', cls: 'stock-ok' };
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Cargando...</p>;

  return (
    <>
      <div className="page-header">
        <div className="app-content-header">
          <h1>Inventario</h1>
          <p>Todos tus productos en un solo lugar.</p>
        </div>
        <button className="btn-secondary" onClick={openNew}>+ Agregar producto</button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Aún no tienes productos.</p>
          <p><button className="btn-secondary" onClick={openNew}>Agrega el primero →</button></p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Stock actual</th>
                <th>Stock mín.</th>
                <th>Precio</th>
                <th>Almacén</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const status = stockStatus(p.current_stock, p.min_stock);
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td style={{ color: 'var(--muted)' }}>{p.sku || '—'}</td>
                    <td>{p.category || '—'}</td>
                    <td>{p.current_stock}</td>
                    <td>{p.min_stock}</td>
                    <td>${p.unit_price.toLocaleString('es-CO')}</td>
                    <td>{p.warehouses?.name || '—'}</td>
                    <td>{p.suppliers?.name || '—'}</td>
                    <td><span className={`stock-badge ${status.cls}`}>{status.label}</span></td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-edit" onClick={() => openEdit(p)}>Editar</button>
                      <button className="btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form className="modal-form" onSubmit={handleSave}>
              <div>
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label>SKU (código)</label>
                <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Opcional" />
              </div>
              <div>
                <label>Categoría</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej: Lubricantes" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label>Stock actual *</label>
                  <input type="number" min={0} value={form.current_stock} onChange={e => setForm({ ...form, current_stock: +e.target.value })} required />
                </div>
                <div>
                  <label>Stock mínimo *</label>
                  <input type="number" min={0} value={form.min_stock} onChange={e => setForm({ ...form, min_stock: +e.target.value })} required />
                </div>
                <div>
                  <label>Precio unitario</label>
                  <input type="number" min={0} value={form.unit_price} onChange={e => setForm({ ...form, unit_price: +e.target.value })} />
                </div>
              </div>
              <div>
                <label>Almacén</label>
                <select value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                  <option value="">Sin almacén</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label>Proveedor</label>
                <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}