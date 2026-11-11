import { useEffect, useMemo, useState } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { getMyRequests } from '../../services/dashboardService';
import type { RequestType } from '../../services/dashboardService';
import styles from './UserActivity.module.css';

interface UserActivityProps {
  mode: 'activity' | 'notifications';
}

interface FeedItem {
  id: string;
  title: string;
  description: string;
  date: string;
  estado: RequestType['estado'];
  notifyId: string;
}

const READ_KEY = 'read_notifications';

const loadRead = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
  } catch {
    return [];
  }
};

const statusClass = (estado: string) => {
  switch (estado) {
    case 'APROBADA': return styles.approved;
    case 'RECHAZADA': return styles.rejected;
    case 'PENDIENTE': return styles.pending;
    default: return styles.processing;
  }
};

const StatusIcon = ({ estado }: { estado: string }) => {
  if (estado === 'APROBADA') return <CheckCircleIcon aria-hidden="true" />;
  if (estado === 'RECHAZADA') return <XCircleIcon aria-hidden="true" />;
  return <ClockIcon aria-hidden="true" />;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const UserActivity = ({ mode }: UserActivityProps) => {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<string[]>(loadRead);

  useEffect(() => {
    getMyRequests()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setError('No se pudo cargar la información. Inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo<FeedItem[]>(() => {
    const feed: FeedItem[] = [];
    requests.forEach((r) => {
      const name = r.producto?.nombre || 'Producto';
      const qty = `${r.cantidad ?? 0} ${r.producto?.unidad_medida || 'unidades'}`;
      feed.push({
        id: `created-${r.id}`,
        title: `Solicitaste ${name}`,
        description: `Cantidad: ${qty}${r.comentario ? ` · ${r.comentario}` : ''}`,
        date: r.fecha_creacion,
        estado: 'PENDIENTE',
        notifyId: '',
      });
      if (r.estado !== 'PENDIENTE') {
        const label =
          r.estado === 'APROBADA' ? 'aprobada' : r.estado === 'RECHAZADA' ? 'rechazada' : 'en proceso';
        feed.push({
          id: `status-${r.id}-${r.estado}`,
          title: `Tu solicitud de ${name} fue ${label}`,
          description: r.comentario_admin ? `Comentario: ${r.comentario_admin}` : `Cantidad: ${qty}`,
          date: r.fecha_actualizacion || r.fecha_creacion,
          estado: r.estado,
          notifyId: `status-${r.id}-${r.estado}`,
        });
      }
    });
    const sorted = feed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return mode === 'notifications' ? sorted.filter((i) => i.notifyId) : sorted;
  }, [requests, mode]);

  const unreadCount = items.filter((i) => i.notifyId && !readIds.includes(i.notifyId)).length;

  const markAllRead = () => {
    const ids = Array.from(new Set([...readIds, ...items.map((i) => i.notifyId).filter(Boolean)]));
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
    setReadIds(ids);
  };

  const isNotifications = mode === 'notifications';

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h1>{isNotifications ? 'Notificaciones' : 'Actividad reciente'}</h1>
            <p>
              {isNotifications
                ? `${unreadCount} sin leer`
                : 'Historial de tus solicitudes y sus cambios de estado.'}
            </p>
          </div>
          {isNotifications && unreadCount > 0 && (
            <button type="button" className={styles.action} onClick={markAllRead}>
              Marcar todas como leídas
            </button>
          )}
        </header>

        {loading && <div className={styles.loading}>Cargando...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className={styles.empty}>
            <BellIcon width={40} height={40} aria-hidden="true" />
            <p>{isNotifications ? 'No tienes notificaciones.' : 'Aún no hay actividad.'}</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className={styles.list}>
            {items.map((item) => {
              const unread = item.notifyId && !readIds.includes(item.notifyId);
              return (
                <li key={item.id} className={`${styles.item} ${unread ? styles.unread : ''}`}>
                  <span className={`${styles.icon} ${statusClass(item.estado)}`}>
                    <StatusIcon estado={item.estado} />
                  </span>
                  <div className={styles.body}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <time className={styles.time} dateTime={item.date}>
                    {formatDateTime(item.date)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
};

export default UserActivity;
