import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CubeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { register } from '../services/authService';
import './Login.css';

interface RegisterProps {
  onRegister: (userData: { rol: 'ADMIN' | 'USUARIO' }) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getStrength = (password: string) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const strengthLabels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];
const strengthColors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#16a34a'];

const Register = ({ onRegister }: RegisterProps) => {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.nombre.trim().length < 2) {
      setError('Ingresa tu nombre completo');
      return;
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: 'USUARIO',
      });
      if (response?.token && response.user) {
        onRegister({ rol: response.user.rol as 'ADMIN' | 'USUARIO' });
      }
      navigate('/login', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join('. ') : message || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getStrength(form.password);

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="Stockwise">
        <div className="login-intro-content">
          <div className="login-brand login-brand-light">
            <span className="login-brand-mark"><CubeIcon aria-hidden="true" /></span>
            <span className="login-brand-copy">
              <strong>Stockwise</strong>
              <small>CONTROL DE INVENTARIO</small>
            </span>
          </div>

          <div className="login-message">
            <p className="login-eyebrow">Únete al equipo</p>
            <h1>Crea tu cuenta y empieza a solicitar productos.</h1>
            <p className="login-description">
              Consulta el catálogo, realiza solicitudes y sigue su estado desde un solo lugar.
            </p>
          </div>

          <div className="login-highlights" aria-label="Funciones de Stockwise">
            <div>
              <strong>Catálogo en línea</strong>
              <span>Disponibilidad de productos en tiempo real</span>
            </div>
            <div>
              <strong>Seguimiento</strong>
              <span>Notificaciones de tus solicitudes</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Registro">
        <div className="login-form-wrap">
          <div className="login-brand login-brand-dark">
            <span className="login-brand-mark"><CubeIcon aria-hidden="true" /></span>
            <span className="login-brand-copy">
              <strong>Stockwise</strong>
              <small>CONTROL DE INVENTARIO</small>
            </span>
          </div>

          <header className="login-heading">
            <p>Registro</p>
            <h2>Crear cuenta</h2>
            <span>Completa tus datos para acceder a la plataforma.</span>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="login-error" role="alert">{error}</div>}

            <div className="login-field">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} autoComplete="name" autoFocus required />
            </div>

            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.75rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: '#6b7280', display: 'flex' }}
                >
                  {showPassword ? <EyeSlashIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
                </button>
              </div>
              {form.password && (
                <div aria-live="polite" style={{ marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb' }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${(strength / 4) * 100}%`, background: strengthColors[strength], transition: 'width .2s' }} />
                  </div>
                  <small style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</small>
                </div>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <button className="login-submit" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Creando cuenta...' : 'Crear cuenta'}</span>
              {!isLoading && <ArrowRightIcon aria-hidden="true" />}
            </button>
          </form>

          <p className="login-register">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Register;
