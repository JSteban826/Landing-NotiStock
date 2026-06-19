'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError('Email o contraseña incorrectos');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Inicia sesión</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="auth-switch">
          ¿No tienes cuenta? <a href="/signup">Regístrate</a>
        </p>
      </div>
    </div>
  );
}