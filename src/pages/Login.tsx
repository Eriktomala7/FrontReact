import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CubeIcon } from '@heroicons/react/24/outline';
import { login } from '../services/authService';
import './Login.css';

interface UserData {
  rol: 'ADMIN' | 'USUARIO';
}

interface LoginProps {
  onLogin: (userData: UserData) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || '/';
  const isUnauthorized = location.state?.unauthorized;

  useEffect(() => {
    if (isUnauthorized) {
      setError('No tienes permiso para acceder a esa página. Por favor inicia sesión.');
      window.history.replaceState({}, document.title);
    }
  }, [isUnauthorized]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);
      const userRole = response.user?.rol || response.rol;
      if (!userRole) {
        throw new Error('No se pudo determinar el rol del usuario');
      }

      onLogin({ rol: userRole });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <p className="login-eyebrow">Inventario simple, decisiones claras</p>
            <h1>Todo lo que necesitas para mantener tu inventario en movimiento.</h1>
            <p className="login-description">
              Administra productos, atiende solicitudes y consulta el estado de tu operación desde un solo lugar.
            </p>
          </div>

          <div className="login-highlights" aria-label="Funciones de Stockwise">
            <div>
              <strong>Productos</strong>
              <span>Tu catálogo, siempre organizado</span>
            </div>
            <div>
              <strong>Movimientos</strong>
              <span>El estado de tu operación al día</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Acceso a tu cuenta">
        <div className="login-form-wrap">
          <div className="login-brand login-brand-dark">
            <span className="login-brand-mark"><CubeIcon aria-hidden="true" /></span>
            <span className="login-brand-copy">
              <strong>Stockwise</strong>
              <small>CONTROL DE INVENTARIO</small>
            </span>
          </div>

          <header className="login-heading">
            <p>Bienvenido de nuevo</p>
            <h2>Inicia sesión</h2>
            <span>Accede a tu espacio de trabajo para continuar.</span>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error" role="alert">{error}</div>}

            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Link className="login-forgot-password" to="/forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>

            <button className="login-submit" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Iniciando sesión...' : 'Entrar al sistema'}</span>
              {!isLoading && <ArrowRightIcon aria-hidden="true" />}
            </button>
          </form>

          <p className="login-register">
            ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;