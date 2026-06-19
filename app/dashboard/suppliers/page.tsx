'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Supplier {
  id: string;
  name: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
}

const emptyForm = { name: '', contact_phone: '', contact_email: '', notes: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Supplier | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    setSuppliers(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contact_phone: s.contact_phone || '',
      contact_email: s.contact_email || '',
      notes: s.notes || '',
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editing) {
      await supabase.from('suppliers').update(form).eq('id', editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('suppliers').insert({ ...form, user_id: user!.id });
    }

    setSaving(false);
    setShowModal(false);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return;
    await supabase.from('suppliers').delete().eq('id', id);
    loadAll();
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Cargando...</p>;

  return (
    <>
      <div className="page-header">
        <div className="app-content-header">
          <h1>Proveedores</h1>
          <p>Todos tus contactos de proveedores.</p>
        </div>
        <button className="btn-secondary" onClick={openNew}>+ Agregar proveedor</button>
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state">
          <p>Aún no tienes proveedores registrados.</p>
          <p><button className="btn-secondary" onClick={openNew}>Agrega el primero →</button></p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.contact_phone || '—'}</td>
                  <td>{s.contact_email || '—'}</td>
                  <td style={{ color: 'var(--muted)', maxWidth: '200px' }}>{s.notes || '—'}</td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-edit" onClick={() => openEdit(s)}>Editar</button>
                    <button className="btn-danger" onClick={() => handleDelete(s.id)}>Eliminar</button>
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
            <h3>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
            <form className="modal-form" onSubmit={handleSave}>
              <div>
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label>Teléfono</label>
                <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+57 300 000 0000" />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="proveedor@correo.com" />
              </div>
              <div>
                <label>Notas</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ej: Entrega los martes, mínimo 10 unidades" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}