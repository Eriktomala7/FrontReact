import React, { useState, useEffect } from 'react';
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import styles from '../styles/RequestModal.module.css';

interface Product {
  id: number;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidad_medida: string;
}

interface RequestProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onRequest: (data: { cantidad: number; comentario: string }) => void | Promise<void>;
}

const RequestProductModal: React.FC<RequestProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onRequest,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [comentario, setComentario] = useState('Solicitud de material');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError(null);
      setComentario('Solicitud de material');
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const handleQuantityChange = (value: number) => {
    if (!product) return;
    const newQuantity = Math.max(1, Math.min(product.cantidad, value));
    setQuantity(newQuantity);
    if (newQuantity > product.cantidad) {
      setError(`No puedes solicitar más de ${product.cantidad} ${product.unidad_medida || 'unidades'}`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) {
      setError('La cantidad debe ser al menos 1');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onRequest({
        cantidad: quantity,
        comentario: comentario.trim() || 'Solicitud de material'
      });
      setIsSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={() => !isSubmitting && onClose()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Solicitar Producto</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={isSubmitting} aria-label="Cerrar modal">
            <XMarkIcon className={styles.closeIcon} />
          </button>
        </div>
        
        <div className={styles.productInfo}>
          <h3>{product?.nombre}</h3>
          <p>Código: {product?.codigo}</p>
          <p>Disponible: {product?.cantidad} {product?.unidad_medida || 'unidades'}</p>
        </div>

        {isSubmitted ? (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <h3>¡Solicitud Enviada!</h3>
            <p>Tu solicitud ha sido registrada correctamente.
              Espera a que un administrador la apruebe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.requestForm}>
            <div className={styles.quantitySelector}>
              <button
                type="button"
                className={styles.quantityButton}
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1 || isSubmitting}
                aria-label="Disminuir cantidad"
              >
                <MinusIcon className={styles.quantityIcon} />
              </button>
              
              <input
                type="number"
                min="1"
                max={product?.cantidad}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 1;
                  setQuantity(Math.min(Math.max(1, value), product?.cantidad || 0));
                }}
                disabled={isSubmitting}
                className={styles.quantityInput}
                aria-label="Cantidad solicitada"
              />
              
              <button
                type="button"
                className={styles.quantityButton}
                onClick={() => setQuantity(prev => Math.min(product?.cantidad || 0, prev + 1))}
                disabled={quantity >= (product?.cantidad || 0) || isSubmitting}
                aria-label="Aumentar cantidad"
              >
                <PlusIcon className={styles.quantityIcon} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="comentario" className={styles.label}>
                Comentario (opcional)
              </label>
              <textarea
                id="comentario"
                className={styles.textarea}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ej: Solicitud de material para proyecto"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

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
                disabled={!product || quantity > product.cantidad || quantity < 1 || isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestProductModal;
