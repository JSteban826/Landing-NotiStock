'use client';

import { useState, useEffect, useRef } from 'react';

function EmailForm({ id, buttonText }: { id: string; buttonText: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? 'success' : 'error');
    if (res.ok) setEmail('');
  }

  return (
    <form onSubmit={handleSubmit} className="form-wrap" id={id}>
      {status !== 'success' && (
        <>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />
          <button className="btn-primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Enviando...' : buttonText}
          </button>
        </>
      )}
      <p className="form-note">Sin spam. Te avisamos cuando esté listo.</p>
      {status === 'success' && (
        <div className="success-msg">✅ ¡Listo! Te avisamos en cuanto abramos el acceso.</div>
      )}
      {status === 'error' && (
        <div className="error-msg">❌ Algo salió mal, intenta de nuevo.</div>
      )}
    </form>
  );
}

export default function Home() {
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function scrollToForm() {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      {/* NAV */}
     <nav className="landing-nav">
        <div className="logo">Noti<span>Stock</span></div>
        <button className="nav-cta" onClick={scrollToForm}>Quiero acceso</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="badge">
          <span className="badge-dot" />
          Acceso anticipado · Lista de espera abierta
        </div>

        <h1>Deja de perder dinero por <em>no saber</em> lo que tienes</h1>

        <p className="hero-sub">
          Inventario inteligente para negocios pequeños. Alertas antes de quedarte sin stock,
          rotación automática y todo en un solo lugar.
        </p>

        <EmailForm id="waitlist" buttonText="Quiero acceso anticipado →" />

        <p className="waitlist-count">Sé parte de los primeros en acceder</p>

        {/* MOCK DASHBOARD */}
        <div className="dashboard-preview">
          <div className="dashboard-frame">
            <div className="dash-topbar">
              <div className="dot r" /><div className="dot y" /><div className="dot g" />
              <div className="dash-url">app.notistock.com/dashboard</div>
            </div>
            <div className="dash-body">
              <div className="dash-sidebar">
                <div className="dash-logo">NotiStock</div>
                <div className="dash-nav-item active"><span>📊</span> Dashboard</div>
                <div className="dash-nav-item"><span>📦</span> Inventario</div>
                <div className="dash-nav-item"><span>🏭</span> Proveedores</div>
                <div className="dash-nav-item"><span>🔔</span> Alertas</div>
                <div className="dash-nav-item"><span>♻️</span> Rotación</div>
              </div>
              <div className="dash-main">
                <div className="dash-title">Resumen del día</div>
                <div className="kpi-row">
                  <div className="kpi">
                    <div className="kpi-label">Productos</div>
                    <div className="kpi-value">148</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Stock crítico</div>
                    <div className="kpi-value red">3</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-label">Valor total</div>
                    <div className="kpi-value green">$24,800</div>
                  </div>
                </div>
                <div className="alerts-box">
                  <div className="alerts-title">⚠️ Alertas de inventario</div>
                  <div className="alert-row">
                    <span className="alert-name">Aceite motor 1L</span>
                    <span className="alert-tag tag-danger">Solo 2 unidades</span>
                  </div>
                  <div className="alert-row">
                    <span className="alert-name">Filtro de aire</span>
                    <span className="alert-tag tag-warn">Bajo stock</span>
                  </div>
                  <div className="alert-row">
                    <span className="alert-name">Tornillos M6 × 1.0</span>
                    <span className="alert-tag tag-ok">Stock OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="section-problem reveal">
        <p className="section-label">El problema</p>
        <h2>¿Te suena familiar alguno de estos?</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto' }}>
          La mayoría de negocios pequeños siguen gestionando su inventario como hace 20 años.
        </p>
        <div className="problem-grid">
          {[
            { icon: '😤', title: '"Se me acabó sin darme cuenta"', desc: 'Pierdes ventas porque un producto llegó a cero y nadie te avisó a tiempo.' },
            { icon: '📦', title: 'Mercancía vieja estancada', desc: 'Tienes dinero muerto en stock que lleva meses sin moverse y sin saberlo.' },
            { icon: '🗒️', title: 'Excel o libreta como sistema', desc: 'Actualizas a mano, te equivocas, y nunca tienes certeza de qué hay realmente.' },
            { icon: '📱', title: 'Proveedores en mil lugares', desc: 'Contactos en WhatsApp, notas en papel, precios en tu cabeza. Un caos.' },
          ].map((p, i) => (
            <div key={i} className="problem-card reveal">
              <div className="problem-icon">{p.icon}</div>
              <div className="problem-title">{p.title}</div>
              <div className="problem-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-features reveal">
        <div className="features-header">
          <p className="section-label">Qué hace NotiStock</p>
          <h2>Todo lo que necesitas, nada que no usas</h2>
        </div>
        <div className="features-grid">
          {[
            { icon: '🔔', title: 'Alertas automáticas de stock', desc: 'Defines el mínimo de cada producto. Te llegará un aviso por email antes de que se acabe, no después.', soon: false },
            { icon: '📍', title: 'Ubicación exacta por almacén', desc: '¿En qué estante, pasillo o bodega está? Encuentra cualquier producto en segundos.', soon: false },
            { icon: '🏭', title: 'Gestión de proveedores', desc: 'Contacto, productos que ofrece, historial de compras y precios. Todo junto, siempre a mano.', soon: false },
            { icon: '📊', title: 'Dashboard útil de verdad', desc: 'Valor total del inventario, productos críticos, movimientos recientes. Info que importa, de un vistazo.', soon: false },
            { icon: '♻️', title: 'Rotación FIFO inteligente', desc: 'Te dice qué productos llevan más tiempo en stock para venderlos primero y no estancarte.', soon: true },
            { icon: '📋', title: 'Sugerencias de compra', desc: 'Con base en tu historial, te recomienda qué pedir, cuánto y a qué proveedor.', soon: true },
          ].map((f, i) => (
            <div key={i} className="feature-card reveal">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
              {f.soon && <span className="feature-soon">Próximamente</span>}
            </div>
          ))}
        </div>
      </section>

      {/* PARA QUIEN */}
      <section className="section-who reveal">
        <p className="section-label">¿Para quién es?</p>
        <h2>Hecho para negocios reales, no corporaciones</h2>
        <p style={{ color: 'var(--muted)' }}>Si tienes stock físico y lo gestionas tú mismo, esto es para ti.</p>
        <div className="who-tags">
          {['🔧 Ferretería','🍕 Restaurante','🛒 Tienda de abarrotes','👗 Boutique de ropa','💊 Farmacia pequeña','🖨️ Papelería','🌿 Vivero','🎨 Taller artesanal','📦 Distribuidor local'].map((tag, i) => (
            <span key={i} className="who-tag">{tag}</span>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="section-pricing reveal">
        <p className="section-label">Precio</p>
        <h2>Simple y justo</h2>
        <div className="pricing-card">
          <span className="pricing-badge">ACCESO ANTICIPADO</span>
          <div className="pricing-price"><sup>$</sup>9<sub>/mes USD</sub></div>
          <p className="pricing-note">Precio especial para los primeros usuarios. Sin permanencia, cancelas cuando quieras.</p>
          <ul className="pricing-features">
            {['Productos y categorías ilimitados','Alertas de stock por email','Gestión de proveedores','Ubicación por almacén','Dashboard con métricas clave','Acceso a todas las funciones futuras'].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <button className="btn-primary" onClick={scrollToForm}>Quiero este precio →</button>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section-cta reveal">
        <div className="cta-inner">
          <p className="section-label">¿Listo?</p>
          <h2>Únete antes de que abramos</h2>
          <p>Deja tu email y serás el primero en acceder. Sin tarjeta, sin compromiso.</p>
          <EmailForm id="waitlist-bottom" buttonText="Reservar lugar →" />
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <strong>NotiStock</strong> · Inventario inteligente para negocios reales · 2025
        <br />
        <span style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.3rem', display: 'block' }}>
          Hecho con cariño para el comercio latinoamericano 🌎
        </span>
      </footer>
    </>
  );
}
