import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowsRightLeftIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import styles from './MovementsPage.module.css';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
}

interface Movimiento {
  id: number;
  id_producto: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo: string;
  fecha: string;
  id_usuario: number;
  estado: 'ACTIVO' | 'INACTIVO';
  producto: Producto;
  usuario: User;
}

export const MovementsPage = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [adjustmentMovement, setAdjustmentMovement] = useState<Movimiento | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  const fetchMovimientos = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/movimientos');
      setMovimientos(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setError('Error al cargar el historial de movimientos');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const openAdjustment = (movement: Movimiento) => {
    setAdjustmentMovement(movement);
    setAdjustmentQuantity(String(movement.cantidad));
    setAdjustmentReason(movement.motivo || '');
    setAdjustmentError(null);
  };

  const closeAdjustment = () => {
    if (isSavingAdjustment) return;
    setAdjustmentMovement(null);
    setAdjustmentError(null);
  };

  const handleAdjustmentQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (nextValue === '' || /^[-+]?\d*$/.test(nextValue)) {
      setAdjustmentQuantity(nextValue);
      setAdjustmentError(null);
    }
  };

  const adjustQuantityBy = (delta: number) => {
    const currentValue = adjustmentQuantity === '' ? 0 : Number(adjustmentQuantity);
    const nextValue = Number.isFinite(currentValue) ? currentValue + delta : delta;
    setAdjustmentQuantity(String(nextValue));
    setAdjustmentError(null);
  };

  const handleAdjustmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjustmentMovement) return;

    const cantidad = Number(adjustmentQuantity);
    const motivo = adjustmentReason.trim();
    if (!Number.isSafeInteger(cantidad)) {
      setAdjustmentError('La cantidad debe ser un número entero válido.');
      return;
    }
    if (!motivo) {
      setAdjustmentError('Escribe el motivo del ajuste.');
      return;
    }

    setIsSavingAdjustment(true);
    setAdjustmentError(null);
    try {
      await axios.put(`https://apicomple-1.onrender.com/movimientos/${adjustmentMovement.id}`, {
        cantidad,
        motivo,
      });
      setAdjustmentMovement(null);
      await fetchMovimientos();
    } catch (updateError) {
      console.error('Error al ajustar el movimiento:', updateError);
      setAdjustmentError('No se pudo guardar el ajuste. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const filteredMovimientos = movimientos.filter((mov) => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    const matchesSearch = [mov.producto.nombre, mov.producto.codigo, mov.motivo || '']
      .some(value => value.toLocaleLowerCase().includes(normalizedSearch));
    
    const matchesTipo = tipoFiltro === 'TODOS' || mov.tipo === tipoFiltro;
    
    return matchesSearch && matchesTipo;
  });

  if (loading) return <div className={styles.loading}>Cargando movimientos...</div>;
  if (error) return <div className={styles.error} role="alert">{error}</div>;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Administración <span>/</span> Movimientos</p>
          <h1>Movimientos</h1>
        </div>
      </header>

      <section className={styles.history} aria-labelledby="history-title">
        <div className={styles.historyHeader}>
          <div>
            <h2 id="history-title">Historial de movimientos</h2>
            <p>Registro completo de operaciones del inventario.</p>
          </div>
          <button
            className={`${styles.filterToggle} ${isFilterOpen ? styles.filterToggleActive : ''}`}
            type="button"
            onClick={() => setIsFilterOpen(open => !open)}
            aria-expanded={isFilterOpen}
            aria-controls="movement-filters"
          >
            <FunnelIcon aria-hidden="true" />
            {isFilterOpen ? 'Ocultar filtros' : 'Filtrar movimientos'}
          </button>
        </div>

        {isFilterOpen && (
          <div className={styles.filterPanel} id="movement-filters">
            <label className={styles.searchField}>
              <MagnifyingGlassIcon aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto, código o motivo..."
                aria-label="Buscar movimientos"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} aria-label="Limpiar búsqueda">
                  <XMarkIcon aria-hidden="true" />
                </button>
              )}
            </label>
            <label className={styles.typeFilter}>
              <FunnelIcon aria-hidden="true" />
              <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)} aria-label="Filtrar por tipo">
                <option value="TODOS">Todos los tipos</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SALIDA">Salidas</option>
                <option value="AJUSTE">Ajustes</option>
              </select>
            </label>
            {(searchTerm || tipoFiltro !== 'TODOS') && (
              <button
                className={styles.clearFilters}
                type="button"
                onClick={() => { setSearchTerm(''); setTipoFiltro('TODOS'); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.movementTable}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Detalle</th>
                <th>Responsable</th>
                <th>Fecha</th>
                <th><span className={styles.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredMovimientos.length > 0 ? filteredMovimientos.map((mov) => {
                const isEntry = mov.tipo === 'ENTRADA';
                const isExit = mov.tipo === 'SALIDA';
                const typeStyle = isEntry ? styles.entry : isExit ? styles.exit : styles.adjustment;
                const typeIcon = isEntry
                  ? <ArrowDownIcon aria-hidden="true" />
                  : isExit
                    ? <ArrowUpIcon aria-hidden="true" />
                    : <ArrowsRightLeftIcon aria-hidden="true" />;
                const amountPrefix = isEntry ? '+' : isExit ? '-' : '';

                return (
                  <tr key={mov.id}>
                    <td>
                      <span className={`${styles.typeBadge} ${typeStyle}`}>
                        {typeIcon}
                        {isEntry ? 'Entrada' : isExit ? 'Salida' : 'Ajuste'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <strong>{mov.producto.nombre}</strong>
                        <span>{mov.producto.codigo}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.detailCell}>
                        <strong>{amountPrefix}{mov.cantidad} {mov.producto.unidad_medida}</strong>
                        {mov.motivo && <span title={mov.motivo}>{mov.motivo}</span>}
                      </div>
                    </td>
                    <td className={styles.responsibleCell}>{mov.usuario.nombre}</td>
                    <td className={styles.dateCell}>
                      {new Date(mov.fecha).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <button
                        className={styles.adjustButton}
                        type="button"
                        onClick={() => openAdjustment(mov)}
                        title={`Ajustar cantidad de ${mov.producto.nombre}`}
                        aria-label={`Ajustar ${mov.producto.nombre}`}
                      >
                        <PencilSquareIcon aria-hidden="true" />
                        Ajustar
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className={styles.emptyState} colSpan={6}>
                    No se encontraron movimientos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={adjustmentMovement !== null}
        onClose={closeAdjustment}
        className={styles.dialogRoot}
      >
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        <div className={styles.dialogScroll}>
          <div className={styles.dialogCenter}>
            {adjustmentMovement && (
              <Dialog.Panel className={styles.dialogPanel}>
                <header className={styles.modalHeader}>
                  <div>
                    <p className={styles.modalEyebrow}>Corrección de inventario</p>
                    <Dialog.Title className={styles.modalTitle}>Ajustar movimiento</Dialog.Title>
                  </div>
                  <button
                    className={styles.modalClose}
                    type="button"
                    onClick={closeAdjustment}
                    disabled={isSavingAdjustment}
                    aria-label="Cerrar modal"
                  >
                    <XMarkIcon aria-hidden="true" />
                  </button>
                </header>

                <div className={styles.adjustmentProduct}>
                  <strong>{adjustmentMovement.producto.nombre}</strong>
                  <span>{adjustmentMovement.producto.codigo} · Cantidad actual: {adjustmentMovement.cantidad} {adjustmentMovement.producto.unidad_medida}</span>
                </div>

                <p className={styles.adjustmentHint}>Escribe un valor con signo para ajustar el inventario, por ejemplo +10 o -5.</p>

                {adjustmentError && <div className={styles.adjustmentError} role="alert">{adjustmentError}</div>}

                <form className={styles.adjustmentForm} onSubmit={handleAdjustmentSubmit}>
                  <label className={styles.adjustmentField}>
                    <span>Cantidad de ajuste *</span>
                    <div className={styles.adjustmentQuantityControl}>
                      <button
                        type="button"
                        className={styles.adjustmentStepButton}
                        onClick={() => adjustQuantityBy(-1)}
                        disabled={isSavingAdjustment}
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[-+]?\\d*"
                        value={adjustmentQuantity}
                        onChange={handleAdjustmentQuantityChange}
                        placeholder="Ej: +10 o -5"
                        disabled={isSavingAdjustment}
                        required
                      />
                      <button
                        type="button"
                        className={styles.adjustmentStepButton}
                        onClick={() => adjustQuantityBy(1)}
                        disabled={isSavingAdjustment}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  </label>
                  <label className={styles.adjustmentField}>
                    <span>Motivo del ajuste *</span>
                    <textarea
                      value={adjustmentReason}
                      onChange={(event) => setAdjustmentReason(event.target.value)}
                      placeholder="Describe la corrección de inventario..."
                      rows={3}
                      disabled={isSavingAdjustment}
                      required
                    />
                  </label>
                  <div className={styles.modalActions}>
                    <button className={styles.cancelButton} type="button" onClick={closeAdjustment} disabled={isSavingAdjustment}>
                      Cancelar
                    </button>
                    <button className={styles.submitButton} type="submit" disabled={isSavingAdjustment}>
                      {isSavingAdjustment ? 'Guardando...' : 'Guardar ajuste'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            )}
          </div>
        </div>
      </Dialog>
    </main>
  );
};

export default MovementsPage;
