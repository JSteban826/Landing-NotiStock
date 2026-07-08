"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Movement {
  id: string;
  type: "in" | "out";
  quantity: number;
  created_at: string;
  products: { name: string };
}

export default function MovementsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<"in" | "out">("out");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase
        .from("stock_movements")
        .select("*, products(name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setProducts(prods || []);
    setMovements(movs || []);
    setLoading(false);
  }

  // Filtro de búsqueda por nombre, SKU o categoría
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)),
    );
  }, [search, products]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearch("");
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i,
      ),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function openModal(t: "in" | "out") {
    setType(t);
    setCart([]);
    setSearch("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    for (const item of cart) {
      const newStock =
        type === "in"
          ? item.product.current_stock + item.quantity
          : Math.max(0, item.product.current_stock - item.quantity);

      await supabase.from("stock_movements").insert({
        product_id: item.product.id,
        type,
        quantity: item.quantity,
      });

      await supabase
        .from("products")
        .update({ current_stock: newStock })
        .eq("id", item.product.id);

      if (newStock <= item.product.min_stock && user?.email) {
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName: item.product.name,
            currentStock: newStock,
            minStock: item.product.min_stock,
            userEmail: user.email,
          }),
        });
      }
    }

    setSaving(false);
    setShowModal(false);
    setCart([]);
    loadAll();
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

  return (
    <>
      <div className="page-header">
        <div className="app-content-header">
          <h1>Movimientos</h1>
          <p>Registra ventas y entradas de stock.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button className="btn-in" onClick={() => openModal("in")}>
            📦 Nueva entrada
          </button>
          <button className="btn-out" onClick={() => openModal("out")}>
            🛒 Registrar venta
          </button>
        </div>
      </div>

      <div className="movements-list">
        <div className="movements-list-header">Últimos 50 movimientos</div>
        {movements.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Aún no hay movimientos registrados.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.products?.name}</strong>
                  </td>
                  <td>
                    <span
                      className={`stock-badge ${m.type === "in" ? "stock-ok" : "stock-low"}`}
                    >
                      {m.type === "in" ? "↑ Entrada" : "↓ Venta"}
                    </span>
                  </td>
                  <td>{m.quantity} unidades</td>
                  <td style={{ color: "var(--muted)" }}>
                    {new Date(m.created_at).toLocaleString("es-CO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            style={{ maxWidth: "540px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {type === "in"
                ? "📦 Nueva entrada de stock"
                : "🛒 Registrar venta"}
            </h3>

            <div className="movement-modal-type">
              <button
                type="button"
                className={`type-btn ${type === "in" ? "active-in" : ""}`}
                onClick={() => setType("in")}
              >
                📦 Entrada de stock
              </button>
              <button
                type="button"
                className={`type-btn ${type === "out" ? "active-out" : ""}`}
                onClick={() => setType("out")}
              >
                🛒 Venta / Salida
              </button>
            </div>

            {/* BUSCADOR */}
            <input
              className="search-bar"
              placeholder="Buscar por nombre, código o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            {/* RESULTADOS DE BÚSQUEDA */}
            {search.trim() && (
              <div className="product-search-list">
                {filtered.length === 0 ? (
                  <div
                    style={{
                      padding: "1rem",
                      color: "var(--muted)",
                      fontSize: "0.85rem",
                      textAlign: "center",
                    }}
                  >
                    No se encontraron productos
                  </div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p.id}
                      className="product-search-item"
                      onClick={() => addToCart(p)}
                    >
                      <div className="product-search-item-info">
                        <span className="product-search-item-name">
                          {p.name}
                        </span>
                        <span className="product-search-item-meta">
                          {p.sku && `SKU: ${p.sku}`}
                          {p.sku && p.category && " · "}
                          {p.category}
                        </span>
                      </div>
                      <span className="product-search-item-stock">
                        {p.current_stock} en stock
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* CARRITO */}
            <div className="cart-section">
              <div className="cart-title">
                {type === "in" ? "Productos a ingresar" : "Productos vendidos"}
              </div>

              {cart.length === 0 ? (
                <p className="cart-empty">
                  Busca y selecciona productos arriba
                </p>
              ) : (
                <>
                  <div className="cart-items-wrap">
                    {cart.map((item) => (
                      <div key={item.product.id} className="cart-item">
                        <span className="cart-item-name">
                          {item.product.name}
                        </span>
                        <div className="cart-item-qty">
                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.product.id, -1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setCart((prev) =>
                                prev.map((i) =>
                                  i.product.id === item.product.id
                                    ? { ...i, quantity: val }
                                    : i,
                                ),
                              );
                            }}
                            style={{
                              width: "50px",
                              textAlign: "center",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                              borderRadius: "6px",
                              padding: "0.2rem 0.4rem",
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              outline: "none",
                            }}
                          />
                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.product.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="cart-item-remove"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="cart-total">
                    <span>
                      {cart.length} producto{cart.length !== 1 ? "s" : ""}
                    </span>
                    <strong>{totalItems} unidades en total</strong>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "1.2rem" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || cart.length === 0}
              >
                {saving
                  ? "Guardando..."
                  : type === "in"
                    ? "Confirmar entrada"
                    : "Confirmar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
