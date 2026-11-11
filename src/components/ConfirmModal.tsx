import { useEffect, type ReactNode } from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const danger = variant === 'danger';

  return (
    <div className={styles.overlay} onClick={() => !busy && onCancel()}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className={`${styles.icon} ${danger ? styles.iconDanger : styles.iconPrimary}`} aria-hidden="true">
          {danger ? <ExclamationTriangleIcon /> : <CheckIcon />}
        </span>
        <h2 id="confirm-modal-title" className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button
            type="button"
            className={danger ? styles.confirmDanger : styles.confirmPrimary}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Guardando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmModal;
