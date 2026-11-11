import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CubeIcon } from '@heroicons/react/24/outline';
import { requestPasswordReset } from '../services/authService';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess('Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo procesar la solicitud. Inténtalo de nuevo.');
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
            <p className="login-eyebrow">Recupera el acceso</p>
            <h1>Vuelve a tu espacio de trabajo.</h1>
            <p className="login-description">
              Te ayudaremos a restablecer tu contraseña para que puedas continuar con tu operación.
            </p>
          </div>

          <div className="login-highlights" aria-label="Funciones de Stockwise">
            <div>
              <strong>Acceso seguro</strong>
              <span>Protegemos tu espacio de trabajo</span>
            </div>
            <div>
              <strong>Un paso sencillo</strong>
              <span>Solicita instrucciones con tu correo</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Recuperación de contraseña">
        <div className="login-form-wrap">
          <div className="login-brand login-brand-dark">
            <span className="login-brand-mark"><CubeIcon aria-hidden="true" /></span>
            <span className="login-brand-copy">
              <strong>Stockwise</strong>
              <small>CONTROL DE INVENTARIO</small>
            </span>
          </div>

          <header className="login-heading">
            <p>Recuperación de cuenta</p>
            <h2>¿Olvidaste tu contraseña?</h2>
            <span>Escribe el correo asociado a tu cuenta y te enviaremos las instrucciones.</span>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error" role="alert">{error}</div>}
            {success && <div className="login-success" role="status">{success}</div>}

            <div className="login-field">
              <label htmlFor="recovery-email">Correo electrónico</label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <button className="login-submit" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Enviando solicitud...' : 'Enviar instrucciones'}</span>
              {!isLoading && <ArrowRightIcon aria-hidden="true" />}
            </button>
          </form>

          <Link className="login-return-link" to="/login">Volver a iniciar sesión</Link>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;