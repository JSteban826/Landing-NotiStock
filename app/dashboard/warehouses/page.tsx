'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Warehouse {
  id: string;
  name: string;
  address: string;
}

const emptyForm = { name: '', address: '' };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Warehouse | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false });
    setWarehouses(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(w: Warehouse) {
    setEditing(w);
    setForm({ name: w.name, address: w.address || '' });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editing) {
      await supabase.from('warehouses').update(form).eq('id', editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('warehouses').insert({ ...form, user_id: user!.id });
    }

    setSaving(false);
    setShowModal(false);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este almacén?')) return;
    await supabase.from('warehouses').delete().eq('id', id);
    loadAll();
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Cargando...</p>;

  return (
    <>
      <div className="page-header">
        <div className="app-content-header">
          <h1>Almacenes</h1>
          <p>Ubicaciones donde guardas tu inventario.</p>
        </div>
        <button className="btn-secondary" onClick={openNew}>+ Agregar almacén</button>
      </div>

      {warehouses.length === 0 ? (
        <div className="empty-state">
          <p>Aún no tienes almacenes registrados.</p>
          <p><button className="btn-secondary" onClick={openNew}>Agrega el primero →</button></p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map(w => (
                <tr key={w.id}>
                  <td><strong>{w.name}</strong></td>
                  <td>{w.address || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-edit" onClick={() => openEdit(w)}>Editar</button>
                    <button className="btn-danger" onClick={() => handleDelete(w.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Editar almacén' : 'Nuevo almacén'}</h3>
            <form className="modal-form" onSubmit={handleSave}>
              <div>
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Bodega principal" required />
              </div>
              <div>
                <label>Dirección</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Ej: Calle 13 # 45-20, Bogotá" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar almacén'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}