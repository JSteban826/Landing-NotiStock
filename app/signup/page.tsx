'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/login?registered=true');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Crea tu cuenta</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Nombre de tu negocio"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            required
          />
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
            minLength={6}
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}