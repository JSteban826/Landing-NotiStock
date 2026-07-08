'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login');
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="auth-page">
        <p style={{ color: 'var(--muted)' }}>Cargando...</p>
      </div>
    );
  }

  if (!session) return null;

  const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/products', label: 'Inventario', icon: '📦' },
  { href: '/dashboard/movements', label: 'Movimientos', icon: '🔄' },
  { href: '/dashboard/suppliers', label: 'Proveedores', icon: '🏭' },
  { href: '/dashboard/warehouses', label: 'Almacenes', icon: '📍' },
];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">
          Noti<span style={{ color: 'var(--text)' }}>Stock</span>
        </div>
        <nav style={{ flex: 1 }}>
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`app-nav-item ${pathname === link.href ? 'active' : ''}`}
            >
              <span>{link.icon}</span> {link.label}
            </a>
          ))}
        </nav>
        <div className="app-sidebar-footer">
          <button className="app-logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="app-content">{children}</main>
    </div>
  );
}