import { useState, useEffect } from 'react';
import axios from 'axios';
import { PencilIcon, PlusIcon, TagIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import styles from './CategoriesPage.module.css';
import ConfirmModal from '../../../components/ConfirmModal';

export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/categorias');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar las categorías. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (selectedCategory) {
        // Actualizar categoría existente
        await axios.put(`https://apicomple-1.onrender.com/categorias/${selectedCategory.id}`, formData);
      } else {
        // Crear nueva categoría
        await axios.post('https://apicomple-1.onrender.com/categorias', {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });
      }
      
      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      setError('Error al guardar la categoría. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setError(null);
    setSelectedCategory(category);
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion,
      estado: category.estado
    });
    setIsModalOpen(true);
  };

  const openNewCategoryModal = () => {
    setError(null);
    setSelectedCategory(null);
    setFormData({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    setIsModalOpen(true);
  };

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const categoryId = pendingDelete.id;
    setIsDeleting(true);
    try {
      await axios.delete(`https://apicomple-1.onrender.com/categorias/${categoryId}`);
      setCategories(categories.map(cat =>
        cat.id === categoryId ? { ...cat, estado: 'INACTIVO' } : cat
      ));
    } catch (error) {
      console.error('Error al desactivar la categoría:', error);
      setError('No se pudo desactivar la categoría');
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setError(null);
    setFormData({
      nombre: '',
      descripcion: '',
      estado: 'ACTIVO'
    });
  };

  if (loading) return <div className={styles.loading}>Cargando categorías...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Administración <span>/</span> Catálogo</p>
          <h1>Categorías</h1>
        </div>
      </header>

      <section className={styles.catalog} aria-labelledby="categories-title">
        <div className={styles.catalogHeader}>
          <div>
            <h2 id="categories-title">Categorías</h2>
            <p>Organiza el catálogo para encontrar todo más rápido.</p>
          </div>
          <button className={styles.addButton} onClick={openNewCategoryModal}>
            <PlusIcon aria-hidden="true" />
            Nueva categoría
          </button>
        </div>

        {error && !isModalOpen && <div className={styles.pageError} role="alert">{error}</div>}

        {categories.length > 0 ? (
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <article className={styles.categoryCard} key={category.id}>
                <div className={styles.categoryContent}>
                  <span className={styles.categoryIcon}><TagIcon aria-hidden="true" /></span>
                  <div className={styles.categoryText}>
                    <h3>{category.nombre}</h3>
                    <p>{category.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
                <div className={styles.categoryFooter}>
                  <span className={`${styles.statusBadge} ${category.estado === 'ACTIVO' ? styles.active : styles.inactive}`}>
                    {category.estado === 'ACTIVO' ? 'Activa' : 'Inactiva'}
                  </span>
                  <div className={styles.categoryActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEdit(category)}
                      title={`Editar ${category.nombre}`}
                    >
                      <PencilIcon aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => setPendingDelete(category)}
                      disabled={category.estado === 'INACTIVO'}
                      title={category.estado === 'ACTIVO' ? `Desactivar ${category.nombre}` : 'Categoría inactiva'}
                      aria-label={category.estado === 'ACTIVO' ? `Desactivar ${category.nombre}` : `${category.nombre} inactiva`}
                    >
                      <TrashIcon aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>Todavía no hay categorías registradas.</div>
        )}
      </section>

      <Dialog
        open={isModalOpen}
        onClose={() => !isSubmitting && handleCloseModal()}
        className={styles.dialogRoot}
      >
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        <div className={styles.dialogScroll}>
          <div className={styles.dialogCenter}>
            <Dialog.Panel className={styles.dialogPanel}>
              <header className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>{selectedCategory ? 'Administración' : 'Catálogo'}</p>
                  <Dialog.Title className={styles.modalTitle}>
                    {selectedCategory ? 'Editar categoría' : 'Agregar nueva categoría'}
                  </Dialog.Title>
                </div>
                <button
                  className={styles.modalClose}
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  aria-label="Cerrar modal"
                >
                  <XMarkIcon aria-hidden="true" />
                </button>
              </header>

              {error && isModalOpen && <div className={styles.modalError} role="alert">{error}</div>}

              <form className={styles.categoryForm} onSubmit={handleSubmit}>
                <div className={styles.formField}>
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej. Electrónica"
                    autoFocus
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    placeholder="Describe esta categoría..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                {selectedCategory && (
                  <div className={styles.formField}>
                    <label htmlFor="estado">Estado</label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="ACTIVO">Activa</option>
                      <option value="INACTIVO">Inactiva</option>
                    </select>
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                    {isSubmitting ? 'Guardando...' : selectedCategory ? 'Guardar cambios' : 'Guardar categoría'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Desactivar categoría"
        message={<>¿Seguro que deseas desactivar <strong>{pendingDelete?.nombre}</strong>?</>}
        confirmLabel="Sí, desactivar"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default CategoriesPage;
