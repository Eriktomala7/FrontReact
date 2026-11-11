import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CubeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import styles from './ProductsPage.module.css';
import ConfirmModal from '../../../components/ConfirmModal';

export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_categoria: number;
  cantidad: number;
  estado: 'ACTIVO' | 'INACTIVO';
  foto_producto: string | null;
  categoria: Category;
}

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    codigo: string;
    nombre: string;
    descripcion: string;
    foto_producto: string;
    id_categoria: number;
    cantidad: string;
    estado: 'ACTIVO' | 'INACTIVO';
  }>({
    codigo: '',
    nombre: '',
    descripcion: '',
    foto_producto: '',
    id_categoria: 1,
    cantidad: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/productos');
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar los productos. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://apicomple-1.onrender.com/categorias');
      setCategories(response.data);
      // Set default category if none selected
      if (response.data.length > 0 && !formData.id_categoria) {
        setFormData(prev => ({
          ...prev,
          id_categoria: response.data[0].id
        }));
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(selectedProduct?.foto_producto || null);
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile, selectedProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'id_categoria'
        ? Number(value)
        : value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoFile(e.target.files?.[0] || null);
  };

  const parseErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any;
      if (responseData) {
        const message = responseData.message ?? responseData.error ?? responseData;
        if (Array.isArray(message)) {
          return message.join(', ');
        }
        if (typeof message === 'string') {
          return message;
        }
        if (message && typeof message === 'object' && typeof message.message === 'string') {
          return message.message;
        }
      }
      if (error.message) {
        return error.message;
      }
    }
    return 'Error al guardar el producto. Por favor, inténtalo de nuevo.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    console.log('[ProductsPage] handleSubmit start', { selectedProduct, formData });

    try {
      const quantityText = formData.cantidad.trim();
      const quantity = Number(quantityText);
      if (!/^\d+$/.test(quantityText) || !Number.isSafeInteger(quantity) || quantity < 0) {
        throw new Error('La cantidad debe ser un número entero igual o mayor que cero.');
      }
      const productData = { ...formData, cantidad: quantity };
      let payload: typeof productData | FormData = productData;
      if (photoFile) {
        const multipartData = new FormData();
        Object.entries(productData).forEach(([key, value]) => multipartData.append(key, String(value)));
        multipartData.set('foto_producto', photoFile);
        payload = multipartData;
      }

      if (selectedProduct) {
        // Actualizar producto existente
        console.log('[ProductsPage] updating product', selectedProduct.id);
        await axios.put(`https://apicomple-1.onrender.com/productos/${selectedProduct.id}`, payload);
      } else {
        // Crear nuevo producto
        console.log('[ProductsPage] creating product', productData);
        await axios.post('https://apicomple-1.onrender.com/productos', payload);
      }

      await fetchProducts();
      setSuccessMessage(selectedProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      console.log('[ProductsPage] create/update success');
      setIsSubmitting(false);
      // close modal shortly after success so user sees the message
      setTimeout(() => {
        handleCloseModal();
        setSuccessMessage(null);
      }, 1000);
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      const parsed = parseErrorMessage(error);
      setError(parsed);
      console.log('[ProductsPage] create/update error', parsed);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setError(null);
    setSelectedProduct(product);
    setFormData({
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion,
      foto_producto: product.foto_producto || '',
      id_categoria: product.id_categoria,
      cantidad: String(product.cantidad),
      estado: product.estado
    });
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const productId = pendingDelete.id;
    setIsDeleting(true);
    try {
      await axios.delete(`https://apicomple-1.onrender.com/productos/${productId}`);
      setProducts(products.map(prod =>
        prod.id === productId ? { ...prod, estado: 'INACTIVO' } : prod
      ));
    } catch (error) {
      console.error('Error al desactivar el producto:', error);
      setError('No se pudo desactivar el producto');
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  const getNextProductCode = () => {
    const existingCodes = products.map(product => product.codigo);
    const numericCodes = existingCodes
      .map(code => {
        const match = code.match(/\d+/g);
        return match ? Number(match.join('')) : NaN;
      })
      .filter(code => !Number.isNaN(code));

    let nextNumber = 1;
    if (numericCodes.length > 0) {
      nextNumber = Math.max(...numericCodes) + 1;
    }

    let nextCode = String(nextNumber).padStart(4, '0');
    while (existingCodes.includes(nextCode)) {
      nextNumber += 1;
      nextCode = String(nextNumber).padStart(4, '0');
    }

    return nextCode;
  };

  const openNewProductModal = () => {
    console.log('[ProductsPage] openNewProductModal');
    setError(null);
    setSelectedProduct(null);
    setPhotoFile(null);
    setFormData({
      codigo: getNextProductCode(),
      nombre: '',
      descripcion: '',
      foto_producto: '',
      id_categoria: categories[0]?.id || 1,
      cantidad: '',
      estado: 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setPhotoFile(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      foto_producto: '',
      id_categoria: categories[0]?.id || 1,
      cantidad: '',
      estado: 'ACTIVO'
    });
  };

  const getProductStatus = (product: Product) => {
    if (product.estado === 'INACTIVO') return 'INACTIVO';
    if (product.cantidad <= 0) return 'AGOTADO';
    return 'DISPONIBLE';
  };

  const filteredProducts = products.filter((product) => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    const matchesSearch = `${product.nombre} ${product.codigo}`.toLocaleLowerCase().includes(normalizedSearch);
    const matchesCategory = categoryFilter === 'all' || String(product.id_categoria) === categoryFilter;
    const matchesStatus = statusFilter === 'all' || getProductStatus(product) === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) return <div className={styles.loading}>Cargando productos...</div>;

  return (
    <div className={styles.page}>
      <section className={styles.catalog} aria-labelledby="catalog-title">
        <header className={styles.catalogHeader}>
          <div>
            <h1 id="catalog-title">Catálogo de productos</h1>
            <p>Administra los artículos registrados en tu inventario.</p>
          </div>
          <button className={styles.addButton} onClick={openNewProductModal}>
            <PlusIcon aria-hidden="true" />
            Nuevo producto
          </button>
        </header>

        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <MagnifyingGlassIcon aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o código..."
              aria-label="Buscar productos por nombre o código"
            />
          </label>

          <label className={styles.filterField}>
            <FunnelIcon aria-hidden="true" />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.nombre}</option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <FunnelIcon aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="AGOTADO">Agotado</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </label>
        </div>

        {error && !isModalOpen && <div className={styles.pageError} role="alert">{error}</div>}

        <div className={styles.tableWrap}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Categoría</th>
                <th>Existencias</th>
                <th>Estado</th>
                <th><span className={styles.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const productStatus = getProductStatus(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productNameCell}>
                        <span className={styles.productIcon}><CubeIcon aria-hidden="true" /></span>
                        <strong>{product.nombre}</strong>
                      </div>
                    </td>
                    <td className={styles.codeCell}>{product.codigo}</td>
                    <td>{product.categoria?.nombre || 'Sin categoría'}</td>
                    <td className={styles.stockCell}>{product.cantidad} <span>unidades</span></td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[productStatus.toLowerCase()]}`}>
                        {productStatus === 'DISPONIBLE' ? 'Disponible' : productStatus === 'AGOTADO' ? 'Agotado' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEdit(product)}
                          title={`Editar ${product.nombre}`}
                        >
                          <PencilIcon aria-hidden="true" />
                          Editar
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => setPendingDelete(product)}
                          disabled={product.estado === 'INACTIVO'}
                          title={product.estado === 'ACTIVO' ? `Desactivar ${product.nombre}` : 'Producto inactivo'}
                          aria-label={product.estado === 'ACTIVO' ? `Desactivar ${product.nombre}` : `${product.nombre} inactivo`}
                        >
                          <TrashIcon aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td className={styles.emptyState} colSpan={6}>
                    {products.length === 0 ? 'No hay productos registrados.' : 'No se encontraron productos con esos filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de producto */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        className={styles.dialogRoot}
      >
        <div className={styles.dialogBackdrop} aria-hidden="true" />
        <div className={styles.dialogScroll}>
          <div className={styles.dialogCenter}>
            <Dialog.Panel className={styles.dialogPanel}>
              <header className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Inventario</p>
                  <Dialog.Title className={styles.modalTitle}>
                    {selectedProduct ? 'Editar producto' : 'Agregar nuevo producto'}
                  </Dialog.Title>
                </div>
                <button className={styles.modalClose} type="button" onClick={handleCloseModal} disabled={isSubmitting} aria-label="Cerrar modal">
                  <XMarkIcon aria-hidden="true" />
                </button>
              </header>
              {isSubmitting ? (
                <div className={`${styles.modalStatus} ${styles.modalProgress}`} role="status">
                  {selectedProduct ? 'Guardando cambios...' : 'Guardando producto...'}
                </div>
              ) : successMessage ? (
                <div className={`${styles.modalStatus} ${styles.modalSuccess}`} role="status">{successMessage}</div>
              ) : error ? (
                <div className={`${styles.modalStatus} ${styles.modalError}`} role="alert">{error}</div>
              ) : null}

              <form onSubmit={handleSubmit} className={styles.productForm}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formField} ${styles.formFieldWide}`}>
                    <label htmlFor="nombre">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej. Monitor 24 pulgadas"
                      disabled={isSubmitting}
                      autoFocus={!selectedProduct}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="codigo">Código *</label>
                    <input
                      type="text"
                      id="codigo"
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleInputChange}
                      readOnly={!selectedProduct}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="id_categoria">Categoría *</label>
                    <select
                      id="id_categoria"
                      name="id_categoria"
                      value={formData.id_categoria}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldWide}`}>
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Describe el producto y su uso..."
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="cantidad">Cantidad *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="cantidad"
                      name="cantidad"
                      defaultValue={formData.cantidad}
                      onChange={handleInputChange}
                      onFocus={(event) => event.currentTarget.select()}
                      onClick={(event) => event.currentTarget.select()}
                      autoFocus={Boolean(selectedProduct)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className={`${styles.formField} ${selectedProduct ? styles.formFieldWide : ''}`}>
                    <label htmlFor="foto_producto">Fotografía</label>
                    <div className={styles.photoControl}>
                      <input
                        className={styles.fileInput}
                        type="file"
                        id="foto_producto"
                        name="foto_producto"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        disabled={isSubmitting}
                      />
                      <label className={styles.fileSelect} htmlFor="foto_producto">
                        <PhotoIcon aria-hidden="true" />
                        Seleccionar imagen
                      </label>
                      <span className={styles.fileName}>
                        {photoFile?.name || (photoPreview ? 'Fotografía actual' : 'Ningún archivo seleccionado')}
                      </span>
                    </div>
                    {photoPreview && (
                      <img
                        key={photoPreview}
                        className={styles.photoPreview}
                        src={photoPreview}
                        alt={`Vista previa de ${formData.nombre || 'producto'}`}
                        onError={(event) => { event.currentTarget.hidden = true; }}
                      />
                    )}
                  </div>

                  {selectedProduct && (
                    <div className={styles.formField}>
                      <label htmlFor="estado">Estado</label>
                      <select
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
              
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className={styles.modalCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.modalSubmit}
                  >
                    {isSubmitting ? 'Guardando...' : (selectedProduct ? 'Guardar cambios' : 'Guardar producto')}
                  </button>
                </div>
              </form>
          </Dialog.Panel>
        </div>
      </div>
      </Dialog>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Desactivar producto"
        message={<>¿Seguro que deseas desactivar <strong>{pendingDelete?.nombre}</strong>? Podrás reactivarlo editándolo.</>}
        confirmLabel="Sí, desactivar"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default ProductsPage;
