import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import type { AdminNotification } from './useAdminNotifications';
import { useAdminNotifications } from './useAdminNotifications';
import styles from './AdminNotifications.module.css';

type Props = {
  notifications: ReturnType<typeof useAdminNotifications>;
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const AdminNotifications = ({ notifications }: Props) => {
  const { requests, inventory, loading, error, marking, refresh, markRead } = notifications;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const unread = [...requests, ...inventory].filter((item) => !item.leida);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) void refresh();
    setOpen(!open);
  };

  const selectNotification = async (item: AdminNotification, isRequest: boolean) => {
    if (!item.leida && !await markRead([item.id])) return;
    if (isRequest) {
      setOpen(false);
      navigate('/admin/solicitudes');
    }
  };

  const renderList = (items: AdminNotification[], isRequest: boolean) => (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className={`${styles.item} ${!item.leida ? styles.unread : ''}`} onClick={() => void selectNotification(item, isRequest)} disabled={marking}>
            <span className={styles.dot} aria-hidden="true" />
            <span>
              <span className={styles.message}>{item.mensaje}</span>
              {isRequest && item.fecha && <time className={styles.meta} dateTime={item.fecha}>{formatDate(item.fecha)}</time>}
              {!isRequest && item.producto && (item.producto.nombre || item.producto.cantidad != null) && (
                <span className={styles.meta}>
                  {item.producto.nombre}
                  {item.producto.nombre && item.producto.cantidad != null ? ' · ' : ''}
                  {item.producto.cantidad != null ? `${item.producto.cantidad} unidades disponibles` : ''}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.container} ref={containerRef}>
      <button type="button" className={styles.bell} onClick={toggle} aria-label={`Notificaciones${unread.length ? `, ${unread.length} sin leer` : ''}`} aria-expanded={open} aria-controls="admin-notifications">
        <BellIcon aria-hidden="true" />
        {unread.length > 0 && <span className={styles.badge}>{unread.length > 9 ? '9+' : unread.length}</span>}
      </button>
      {open && (
        <section className={styles.panel} id="admin-notifications" aria-label="Notificaciones">
          <header className={styles.header}>
            <strong>Notificaciones</strong>
            <div className={styles.links}>
              <button type="button" onClick={() => void markRead(unread.map((item) => item.id))} disabled={marking || unread.length === 0}>Marcar todas como leídas</button>
              <button type="button" onClick={() => { setOpen(false); navigate('/admin/solicitudes'); }}>Ver solicitudes</button>
            </div>
          </header>
          {loading && <p className={styles.feedback}>Cargando notificaciones...</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {!loading && (!error || requests.length > 0 || inventory.length > 0) && (
            <div className={styles.content}>
              <h3>Solicitudes pendientes</h3>
              {requests.length ? renderList(requests, true) : <p className={styles.feedback}>No hay solicitudes pendientes.</p>}
              <h3>Alertas de inventario</h3>
              {inventory.length ? renderList(inventory, false) : <p className={styles.feedback}>No hay alertas de inventario.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminNotifications;
