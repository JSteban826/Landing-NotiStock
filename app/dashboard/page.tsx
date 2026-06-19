'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name, current_stock, min_stock, unit_price');
      setProducts(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.current_stock * p.unit_price, 0);
  const criticalProducts = products.filter(p => p.current_stock <= p.min_stock);

  if (loading) return <p style={{ color: 'var(--muted)' }}>Cargando...</p>;

  return (
    <>
      <div className="app-content-header">
        <h1>Resumen del día</h1>
        <p>Esto es lo que está pasando en tu inventario.</p>
      </div>

      {totalProducts === 0 ? (
        <div className="empty-state">
          <p>Aún no tienes productos registrados.</p>
          <p><a href="/dashboard/products">Agrega tu primer producto →</a></p>
        </div>
      ) : (
        <>
          <div className="kpi-grid-large">
            <div className="kpi-card-large">
              <div className="kpi-label">Productos</div>
              <div className="kpi-value">{totalProducts}</div>
            </div>
            <div className="kpi-card-large">
              <div className="kpi-label">Stock crítico</div>
              <div className="kpi-value red">{criticalProducts.length}</div>
            </div>
            <div className="kpi-card-large">
              <div className="kpi-label">Valor total</div>
              <div className="kpi-value green">${totalValue.toLocaleString('es-CO')}</div>
            </div>
          </div>

          <div className="alerts-box">
            <div className="alerts-title">⚠️ Alertas de inventario</div>
            {criticalProducts.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Todo tu stock está en niveles saludables.
              </p>
            ) : (
              criticalProducts.map(p => (
                <div key={p.id} className="alert-row">
                  <span className="alert-name">{p.name}</span>
                  <span className="alert-tag tag-danger">Solo {p.current_stock} unidades</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}