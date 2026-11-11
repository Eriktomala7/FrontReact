import { useEffect, useState } from 'react';
import {
  ClockIcon,
  FunnelIcon,
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
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <section
        className={styles.requestsPanel}
        aria-labelledby="requests-title"
      >
        <header className={styles.panelHeader}>
          <div>
            <h1 id="requests-title">Mis solicitudes</h1>
            <p>Consulta el estado de tus requerimientos de productos.</p>
          </div>

          <button
            type="button"
            className={styles.newRequestButton}
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon
  aria-hidden="true"
  className={styles.plusIcon}
/>
            Nueva solicitud
          </button>
        </header>

        <div className={styles.filterHeader}>
          <span>
            {filteredRequests.length}{' '}
            {filteredRequests.length === 1 ? 'solicitud' : 'solicitudes'}
          </span>

          <button
            className={`${styles.filterToggle} ${
              isFilterOpen ? styles.filterToggleActive : ''
            }`}
            type="button"
            onClick={() => setIsFilterOpen((open) => !open)}
            aria-expanded={isFilterOpen}
            aria-controls="request-filter"
          >
            <FunnelIcon aria-hidden="true" />
            Filtrar estado
          </button>
        </div>

        {isFilterOpen && (
          <div
            id="request-filter"
            className={styles.filterPanel}
          >
            <label className={styles.statusFilter}>
              <FunnelIcon aria-hidden="true" />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="APROBADA">Aprobadas</option>
                <option value="RECHAZADA">Rechazadas</option>
                <option value="EN_PROCESO">En proceso</option>
              </select>
            </label>
          </div>
        )}

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
                        <strong>
                          {request.producto?.nombre ||
                            'Producto no disponible'}
                        </strong>

                        <span>
                          {request.producto?.codigo || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className={styles.quantityCell}>
                      {request.cantidad ?? 0}{' '}
                      {request.producto?.unidad_medida || 'unidades'}
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
                        '—'}
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