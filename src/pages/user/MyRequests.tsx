import { useEffect, useState } from 'react';
import {
  ClockIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { getMyRequests } from '../../services/dashboardService';
import NewRequestModal from '../../components/NewRequestModal';
import type { RequestType } from '../../services/dashboardService';

import styles from './MyRequests.module.css';

const getStatusClass = (status: string) => {
  switch (status) {
    case 'PENDIENTE':
      return styles.statusPending;

    case 'APROBADA':
      return styles.statusApproved;

    case 'RECHAZADA':
      return styles.statusRejected;

    case 'EN_PROCESO':
      return styles.statusProcessing;

    default:
      return styles.statusProcessing;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDIENTE':
      return 'Pendiente';

    case 'APROBADA':
      return 'Aprobada';

    case 'RECHAZADA':
      return 'Rechazada';

    case 'EN_PROCESO':
      return 'En Proceso';

    default:
      return status || 'En Proceso';
  }
};

const MyRequests = () => {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestType['estado'] | 'TODOS'>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setError(
        'Error al cargar las solicitudes. Por favor, inténtalo de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return '—';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter === 'TODOS') {
      return true;
    }

    return request.estado === statusFilter;
  });

  const statusCards: { status: RequestType['estado'] | 'TODOS'; label: string; color: string }[] = [
    { status: 'TODOS', label: 'Total de solicitudes', color: styles.dotTotal },
    { status: 'PENDIENTE', label: 'Pendientes', color: styles.dotPending },
    { status: 'EN_PROCESO', label: 'En proceso', color: styles.dotProcessing },
    { status: 'APROBADA', label: 'Aprobadas', color: styles.dotApproved },
    { status: 'RECHAZADA', label: 'Rechazadas', color: styles.dotRejected },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <svg
          className={styles.errorIcon}
          fill="currentColor"
          viewBox="0 0 20 20"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l-1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>

        <p className={styles.errorText}>{error}</p>
        <button type="button" className={styles.refreshButton} onClick={fetchRequests}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Espacio de usuario</span>
            <h1 id="requests-title">Mis solicitudes</h1>
            <p>Consulta el estado de tus requerimientos de productos.</p>
          </div>

          <button
            type="button"
            className={styles.newRequestButton}
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon aria-hidden="true" className={styles.plusIcon} />
            Nueva solicitud
          </button>
      </header>

      <div className={styles.stats} aria-label="Filtrar solicitudes por estado">
        {statusCards.map(({ status, label, color }) => (
          <button
            key={status}
            type="button"
            className={`${styles.statCard} ${statusFilter === status ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
          >
            <span className={`${styles.statDot} ${color}`} aria-hidden="true" />
            <span className={styles.statLabel}>{label}</span>
            <strong>{status === 'TODOS' ? requests.length : requests.filter((request) => request.estado === status).length}</strong>
          </button>
        ))}
      </div>

      <section className={styles.requestsPanel} aria-labelledby="history-title">
        <div className={styles.historyHeader}>
          <div>
            <h2 id="history-title">Historial de solicitudes</h2>
            <p>
              {filteredRequests.length}{' '}
              {filteredRequests.length === 1 ? 'solicitud registrada' : 'solicitudes registradas'}
              {statusFilter === 'TODOS' ? ' en total' : ''}
            </p>
          </div>
          <button type="button" className={styles.refreshButton} onClick={fetchRequests}>
            <ArrowPathIcon aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {filteredRequests.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.requestTable}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Fecha de solicitud</th>
                  <th>Estado</th>
                  <th>Comentario</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className={styles.productCell}>
                        <span className={styles.productInitial} aria-hidden="true">
                          {(request.producto?.nombre?.trim().charAt(0) || '?').toUpperCase()}
                        </span>
                        <div>
                          <strong>{request.producto?.nombre || 'Producto no disponible'}</strong>
                          <span>{request.producto?.codigo || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td className={styles.quantityCell}>
                      <span>{request.cantidad ?? 0}{' '}
                      {request.producto?.unidad_medida || 'unidades'}</span>
                    </td>

                    <td className={styles.dateCell}>
                      <time
                        dateTime={request.fecha_creacion || ''}
                      >
                        {formatDate(request.fecha_creacion)}
                      </time>
                    </td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          request.estado,
                        )}`}
                      >
                        {getStatusLabel(request.estado)}
                      </span>
                    </td>

                    <td className={styles.commentCell}>
                      {request.comentario_admin ||
                        request.comentario ||
                        'Sin comentario'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <ClockIcon aria-hidden="true" />

            <h2>No hay solicitudes</h2>

            <p>
              {requests.length === 0
                ? 'Todavía no has realizado ninguna solicitud.'
                : 'No hay solicitudes con ese estado.'}
            </p>
          </div>
        )}
      </section>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setStatusFilter('TODOS');
          return fetchRequests();
        }}
      />
    </main>
  );
};

export default MyRequests;