import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckIcon, FunnelIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import styles from './RequestsPage.module.css';
import ConfirmModal from '../../../components/ConfirmModal';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO';
  estado: 'ACTIVO' | 'INACTIVO';
}

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
}

export interface Solicitud {
  id: number;
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  fecha: string;
  estado_solicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  comentario: string;
  estado: 'ACTIVO' | 'INACTIVO';
  usuario: User;
  producto: Producto;
}

const RequestsPage = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id_producto: 0,
    cantidad: 1,
    comentario: '',
  });

  const fetchSolicitudes = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/solicitudes');
      setSolicitudes(response.data);
      setError(null);
    } catch (fetchError) {
      console.error('Error al cargar solicitudes:', fetchError);
      setError('Error al cargar las solicitudes. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/productos');
      setProductos(response.data);
    } catch (fetchError) {
      console.error('Error al cargar productos:', fetchError);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
    fetchProductos();
  }, []);

  const filteredSolicitudes = solicitudes.filter((solicitud) =>
    statusFilter === 'TODOS' || solicitud.estado_solicitud === statusFilter
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === 'cantidad' || name === 'id_producto' ? Number(value) : value,
    }));
  };

  const handleCreateRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await axios.post('https://apicomple-1.onrender.com/solicitudes', {
        ...formData,
        id_usuario: JSON.parse(localStorage.getItem('user') || '{}')?.id ?? 1,
        estado_solicitud: 'PENDIENTE',
      });
      await fetchSolicitudes();
      handleCloseCreateModal();
    } catch (submitError) {
      console.error('Error al crear la solicitud:', submitError);
      setError('Error al crear la solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [decision, setDecision] = useState<{ solicitud: Solicitud; status: 'APROBADA' | 'RECHAZADA' } | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const updateRequestStatus = async () => {
    if (!decision) return;
    const { solicitud, status: newStatus } = decision;
    setUpdatingId(solicitud.id);
    setDecisionError(null);
    try {
      await axios.patch(`https://apicomple-1.onrender.com/solicitudes/${solicitud.id}/estado`, {
        estado_solicitud: newStatus,
      });
      await fetchSolicitudes();
      setSelectedSolicitud(null);
      setDecision(null);
    } catch (updateError: unknown) {
      console.error('Error al actualizar el estado:', updateError);
      setDecisionError(
        axios.isAxiosError(updateError) && updateError.response?.data?.message
          ? String(updateError.response.data.message)
          : 'Error al procesar la solicitud. Por favor, intente nuevamente.',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreateModal = () => {
    setError(null);
    setFormData({ id_producto: 0, cantidad: 1, comentario: '' });
    setIsCreateOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateOpen(false);
    setFormData({ id_producto: 0, cantidad: 1, comentario: '' });
    setError(null);
  };

  if (loading) return <div className={styles.loading}>Cargando solicitudes...</div>;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Administración <span>/</span> Solicitudes</p>
          <h1>Solicitudes</h1>
        </div>
        <button className={styles.createButton} type="button" onClick={openCreateModal}>
          <PlusIcon aria-hidden="true" />
          Nueva solicitud
        </button>
      </header>

      <section className={styles.history} aria-labelledby="requests-title">
        <div className={styles.historyHeader}>
          <div>
            <h2 id="requests-title">Solicitudes</h2>
            <p>Revisa y gestiona los requerimientos del equipo.</p>
          </div>
          <button
            className={`${styles.filterToggle} ${isFilterOpen ? styles.filterToggleActive : ''}`}
            type="button"
            onClick={() => setIsFilterOpen((open) => !open)}
            aria-expanded={isFilterOpen}
            aria-controls="request-filters"
          >
            <FunnelIcon aria-hidden="true" />
            {isFilterOpen ? 'Ocultar filtro' : 'Filtrar estado'}
          </button>
        </div>

        {isFilterOpen && (
          <div className={styles.filterPanel} id="request-filters">
            <label className={styles.statusFilter}>
              <FunnelIcon aria-hidden="true" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por estado">
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="APROBADA">Aprobadas</option>
                <option value="RECHAZADA">Denegadas</option>
              </select>
            </label>
          </div>
        )}

        {error && <div className={styles.pageError} role="alert">{error}</div>}

        <div className={styles.tableWrap}>
          <table className={styles.requestTable}>
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th><span className={styles.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredSolicitudes.length > 0 ? filteredSolicitudes.map((solicitud) => {
                const isPending = solicitud.estado_solicitud === 'PENDIENTE';
                const statusStyle = solicitud.estado_solicitud === 'PENDIENTE'
                  ? styles.pending
                  : solicitud.estado_solicitud === 'APROBADA'
                    ? styles.approved
                    : styles.rejected;

                return (
                  <tr key={solicitud.id}>
                    <td>
                      <div className={styles.requesterCell}>
                        <strong>{solicitud.usuario.nombre}</strong>
                        <span>{solicitud.usuario.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <strong>{solicitud.producto.nombre}</strong>
                        <span>{solicitud.producto.codigo}</span>
                      </div>
                    </td>
                    <td className={styles.quantityCell}>
                      {solicitud.cantidad} {solicitud.producto.unidad_medida}
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(solicitud.fecha).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusStyle}`}>
                        {solicitud.estado_solicitud === 'RECHAZADA' ? 'Denegada' : solicitud.estado_solicitud === 'APROBADA' ? 'Aprobada' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {isPending ? (
                          <>
                            <button
                              className={styles.approveButton}
                              type="button"
                              onClick={() => { setDecisionError(null); setDecision({ solicitud, status: 'APROBADA' }); }}
                              disabled={updatingId === solicitud.id}
                              title="Aprobar solicitud"
                              aria-label={`Aprobar solicitud de ${solicitud.usuario.nombre}`}
                            >
                              <CheckIcon aria-hidden="true" />
                            </button>
                            <button
                              className={styles.rejectButton}
                              type="button"
                              onClick={() => { setDecisionError(null); setDecision({ solicitud, status: 'RECHAZADA' }); }}
                              disabled={updatingId === solicitud.id}
                              title="Denegar solicitud"
                              aria-label={`Denegar solicitud de ${solicitud.usuario.nombre}`}
                            >
                              <XMarkIcon aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.detailButton}
                            type="button"
                            onClick={() => setSelectedSolicitud(solicitud)}
                          >
                            Ver detalle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className={styles.emptyState} colSpan={6}>
                    No hay solicitudes para el estado seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={isCreateOpen} onClose={handleCloseCreateModal} className={styles.dialogRoot}>
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        <div className={styles.dialogScroll}>
          <div className={styles.dialogCenter}>
            <Dialog.Panel className={styles.dialogPanel}>
              <header className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Inventario</p>
                  <Dialog.Title className={styles.modalTitle}>Nueva solicitud</Dialog.Title>
                </div>
                <button className={styles.modalClose} type="button" onClick={handleCloseCreateModal} aria-label="Cerrar modal">
                  <XMarkIcon aria-hidden="true" />
                </button>
              </header>
              {error && <div className={styles.modalError} role="alert">{error}</div>}
              <form className={styles.requestForm} onSubmit={handleCreateRequest}>
                <div className={styles.formField}>
                  <label htmlFor="id_producto">Producto *</label>
                  <select id="id_producto" name="id_producto" value={formData.id_producto} onChange={handleInputChange} required>
                    <option value="">Seleccione un producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} (Disponibles: {producto.cantidad} {producto.unidad_medida})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="cantidad">Cantidad *</label>
                  <input type="number" id="cantidad" name="cantidad" min="1" value={formData.cantidad} onChange={handleInputChange} required />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="comentario">Comentario (opcional)</label>
                  <textarea id="comentario" name="comentario" value={formData.comentario} onChange={handleInputChange} rows={3} placeholder="Ej. Para proyecto X..." />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={handleCloseCreateModal} disabled={isSubmitting}>Cancelar</button>
                  <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      <Dialog open={selectedSolicitud !== null} onClose={() => setSelectedSolicitud(null)} className={styles.dialogRoot}>
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        <div className={styles.dialogScroll}>
          <div className={styles.dialogCenter}>
            {selectedSolicitud && (
              <Dialog.Panel className={styles.dialogPanel}>
                <header className={styles.modalHeader}>
                  <div>
                    <p className={styles.modalEyebrow}>Detalle</p>
                    <Dialog.Title className={styles.modalTitle}>Solicitud #{selectedSolicitud.id}</Dialog.Title>
                  </div>
                  <button className={styles.modalClose} type="button" onClick={() => setSelectedSolicitud(null)} aria-label="Cerrar detalle">
                    <XMarkIcon aria-hidden="true" />
                  </button>
                </header>
                <dl className={styles.detailList}>
                  <div><dt>Solicitante</dt><dd>{selectedSolicitud.usuario.nombre}</dd></div>
                  <div><dt>Producto</dt><dd>{selectedSolicitud.producto.nombre} ({selectedSolicitud.producto.codigo})</dd></div>
                  <div><dt>Cantidad</dt><dd>{selectedSolicitud.cantidad} {selectedSolicitud.producto.unidad_medida}</dd></div>
                  <div><dt>Estado</dt><dd>{selectedSolicitud.estado_solicitud}</dd></div>
                  <div><dt>Fecha</dt><dd>{new Date(selectedSolicitud.fecha).toLocaleString('es-ES')}</dd></div>
                  {selectedSolicitud.comentario && <div><dt>Comentario</dt><dd>{selectedSolicitud.comentario}</dd></div>}
                </dl>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={() => setSelectedSolicitud(null)}>Cerrar</button>
                </div>
              </Dialog.Panel>
            )}
          </div>
        </div>
      </Dialog>

      <ConfirmModal
        open={decision !== null}
        variant={decision?.status === 'APROBADA' ? 'primary' : 'danger'}
        title={decision?.status === 'APROBADA' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        message={decision && (
          <>
            ¿Confirmas que deseas {decision.status === 'APROBADA' ? 'aprobar' : 'rechazar'} la solicitud de{' '}
            <strong>{decision.solicitud.usuario?.nombre || `#${decision.solicitud.id}`}</strong> para{' '}
            <strong>
              {decision.solicitud.cantidad} {decision.solicitud.producto?.unidad_medida || 'ud'} de{' '}
              {decision.solicitud.producto?.nombre || 'producto'}
            </strong>?
          </>
        )}
        confirmLabel={decision?.status === 'APROBADA' ? 'Sí, aprobar' : 'Sí, rechazar'}
        busy={updatingId !== null}
        error={decisionError}
        onConfirm={updateRequestStatus}
        onCancel={() => setDecision(null)}
      />
    </main>
  );
};

export default RequestsPage;