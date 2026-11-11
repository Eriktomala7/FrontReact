import { useEffect, useState, type FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createRequest, getProducts } from '../services/dashboardService';
import type { Product } from '../services/dashboardService';
import styles from '../styles/RequestModal.module.css';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

const NewRequestModal = ({ isOpen, onClose, onCreated }: NewRequestModalProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productId, setProductId] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setProductId(0);
    setQuantity(1);
    setComentario('');
    setError(null);
    setLoadingProducts(true);
    getProducts()
      .then((data) => setProducts((Array.isArray(data) ? data : []).filter((p) => p.cantidad > 0)))
      .catch(() => setError('Error al cargar los productos'))
      .finally(() => setLoadingProducts(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const selected = products.find((p) => p.id === productId) ?? null;
  const invalidQuantity =
    !selected || !Number.isInteger(quantity) || quantity < 1 || quantity > selected.cantidad;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || invalidQuantity) {
      setError('La cantidad debe estar entre 1 y las unidades disponibles');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.id) {
      setError('No se encontró el usuario autenticado');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createRequest({
        id_usuario: user.id,
        id_producto: selected.id,
        cantidad: quantity,
        comentario: comentario.trim() || 'Solicitud de material',
        estado: 'PENDIENTE',
      });
      await onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo crear la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    font: 'inherit',
  };

  return (
    <div className={styles.modalOverlay} onClick={() => !isSubmitting && onClose()}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-request-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="new-request-title">Nueva solicitud</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={isSubmitting} aria-label="Cerrar modal">
            <XMarkIcon className={styles.closeIcon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.requestForm}>
          <div className={styles.formGroup}>
            <label htmlFor="new-request-product" className={styles.label}>Producto *</label>
            <select
              id="new-request-product"
              style={fieldStyle}
              value={productId}
              onChange={(e) => {
                setProductId(Number(e.target.value));
                setQuantity(1);
              }}
              disabled={loadingProducts || isSubmitting}
              required
            >
              <option value={0} disabled>
                {loadingProducts ? 'Cargando productos...' : 'Selecciona un producto'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.cantidad} {p.unidad_medida} disponibles)
                </option>
              ))}
            </select>
            {!loadingProducts && products.length === 0 && (
              <small>No hay productos disponibles para solicitar.</small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="new-request-qty" className={styles.label}>Cantidad *</label>
            <input
              id="new-request-qty"
              type="number"
              min={1}
              step={1}
              max={selected?.cantidad}
              style={fieldStyle}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!selected || isSubmitting}
              required
            />
            {selected && (
              <small>Disponibles: {selected.cantidad} {selected.unidad_medida}</small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="new-request-comment" className={styles.label}>Comentario (opcional)</label>
            <textarea
              id="new-request-comment"
              className={styles.textarea}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos para qué necesitas el producto."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {selected && quantity > selected.cantidad && (
            <p className={styles.errorMessage}>
              No puedes solicitar más de {selected.cantidad} unidades.
            </p>
          )}
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={isSubmitting || loadingProducts || invalidQuantity}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequestModal;
