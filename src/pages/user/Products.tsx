import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingCartIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import RequestProductModal from '../../components/RequestProductModal';
import { createRequest } from '../../services/dashboardService';
import { getProducts } from '../../services/dashboardService';
import { getCurrentUser } from '../../services/authService';
import type { Product } from '../../services/dashboardService';
import styles from './Products.module.css';

interface ProductCardProps {
  product: Product;
  onRequest: (product: Product) => void;
  isSubmitting?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onRequest, isSubmitting = false }) => (
  <div className={styles.productCard}>
    <div className={styles.productImage}>
      {product.foto_producto ? (
        <img src={product.foto_producto} alt={product.nombre} />
      ) : (
        <div className={styles.imagePlaceholder}>
          <ShoppingCartIcon />
        </div>
      )}
    </div>
    <div className={styles.productInfo}>
      <h3>{product.nombre}</h3>
      <p className={styles.productCode}>Código: {product.codigo}</p>
      <p className={styles.productCategory}>
        {product.categoria?.nombre || 'Sin categoría'}
      </p>
      <p className={styles.productDescription}>
        {product.descripcion || 'Sin descripción'}
      </p>
      <div className={styles.productFooter}>
        <span className={styles.productStock}>
          Stock: {product.cantidad} {product.unidad_medida || 'unidades'}
        </span>
       
      </div>
    </div>
    <button 
      className={styles.actionButton}
      onClick={() => onRequest(product)}
      disabled={product.cantidad <= 0 || isSubmitting}
      title={product.cantidad <= 0 ? 'Producto sin stock' : isSubmitting ? 'Procesando solicitud...' : 'Solicitar producto'}
    >
      <ShoppingCartIcon className={styles.actionIcon} />
      {product.cantidad <= 0 ? 'Sin stock' : 'Solicitar'}
    </button>
  </div>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.paginationButton}
        aria-label="Página anterior"
      >
        Anterior
      </button>
      
      <div className={styles.pageNumbers}>
        {totalPages <= 5 ? (
          // Show all pages if 5 or fewer
          Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePage : ''}`}
              aria-label={`Ir a la página ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))
        ) : (
          // Show first page, current page, and last page with ellipsis
          <>
            {/* Always show first page */}
            <button
              onClick={() => onPageChange(1)}
              className={`${styles.pageNumber} ${currentPage === 1 ? styles.activePage : ''}`}
              aria-label="Ir a la primera página"
              aria-current={currentPage === 1 ? 'page' : undefined}
            >
              1
            </button>

            {/* Show ellipsis if current page is more than 3 pages away from start */}
            {currentPage > 3 && <span className={styles.ellipsis}>...</span>}

            {/* Show one page before current page if it exists */}
            {currentPage > 2 && (
              <button
                onClick={() => onPageChange(currentPage - 1)}
                className={styles.pageNumber}
                aria-label={`Ir a la página ${currentPage - 1}`}
              >
                {currentPage - 1}
              </button>
            )}

            {/* Show current page if it's not first or last */}
            {currentPage > 1 && currentPage < totalPages && (
              <button
                className={`${styles.pageNumber} ${styles.activePage}`}
                aria-label={`Página actual, página ${currentPage}`}
                aria-current="page"
              >
                {currentPage}
              </button>
            )}

            {/* Show one page after current page if it exists */}
            {currentPage < totalPages - 1 && (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                className={styles.pageNumber}
                aria-label={`Ir a la página ${currentPage + 1}`}
              >
                {currentPage + 1}
              </button>
            )}

            {/* Show ellipsis if current page is more than 3 pages away from end */}
            {currentPage < totalPages - 2 && (
              <span className={styles.ellipsis}>...</span>
            )}

            {/* Always show last page if not already shown */}
            {currentPage !== totalPages && (
              <button
                onClick={() => onPageChange(totalPages)}
                className={`${styles.pageNumber} ${currentPage === totalPages ? styles.activePage : ''}`}
                aria-label={`Ir a la última página (${totalPages})`}
                aria-current={currentPage === totalPages ? 'page' : undefined}
              >
                {totalPages}
              </button>
            )}
          </>
        )}
      </div>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.paginationButton}
        aria-label="Página siguiente"
      >
        Siguiente
      </button>
    </div>
  );
};

interface RequestModalState {
  isOpen: boolean;
  product: Product | null;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestModal, setRequestModal] = useState<RequestModalState>({ 
    isOpen: false, 
    product: null 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const itemsPerPage = 10;

  // Fetch products from API
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Error al cargar los productos. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, []);

  // Get unique categories for filter (only from active products)
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.estado === 'ACTIVO' && product.categoria?.nombre) {
        categorySet.add(product.categoria.nombre);
      }
    });
    return ['all', ...Array.from(categorySet)];
  }, [products]);

  // Filter products based on search term, category, and active status
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Skip inactive products
      if (product.estado !== 'ACTIVO') return false;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.nombre.toLowerCase().includes(searchLower) ||
        product.codigo.toLowerCase().includes(searchLower) ||
        (product.descripcion?.toLowerCase() || '').includes(searchLower);
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        product.categoria?.nombre === selectedCategory ||
        product.categoria?.id.toString() === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleOpenRequestModal = (product: Product) => {
    setRequestModal({ isOpen: true, product });
  };

  const handleCloseRequestModal = () => {
    setRequestModal({ isOpen: false, product: null });
    setRequestSuccess(false);
  };

  const handleRequestSubmit = async (requestData: { cantidad: number; comentario: string }) => {
    if (!requestModal.product) return;
    
    try {
      setIsSubmitting(true);
      
      // Get the current user from auth service
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No se pudo obtener la información del usuario actual');
      }
      
      await createRequest({
        id_usuario: parseInt(currentUser.id, 10), // Convert string ID to number
        id_producto: requestModal.product.id,
        cantidad: requestData.cantidad,
        comentario: requestData.comentario,
        estado: 'PENDIENTE'
      });
      
      setError(null);
      setRequestSuccess(true);
      // Refresh the products list to update stock
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error creating request:', error);
      setRequestSuccess(false);
      setError('Error al procesar la solicitud. Por favor, intente de nuevo.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination
  const { paginatedProducts, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    return { paginatedProducts: paginated, totalPages: total };
  }, [filteredProducts, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <div className={styles.productsHeader}>
        <h1>Productos</h1>
        <Link to="/products/request" className={styles.requestButton}>
          <ShoppingCartIcon className={styles.buttonIcon} />
          Solicitar Productos
        </Link>
      </div>

      <div className={styles.productsToolbar}>
        <div className={styles.searchContainer}>
          <MagnifyingGlassIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterContainer}>
          <FunnelIcon className={styles.filterIcon} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.categorySelect}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Todas las categorías' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className={styles.alertMessage} role="alert">
          <ExclamationCircleIcon className={styles.alertIcon} />
          <span>{error}</span>
        </div>
      )}

      {requestSuccess && !error && (
        <div className={styles.successMessage} role="status">
          <span className={styles.successIcon}>✓</span>
          <span>Solicitud enviada correctamente.</span>
        </div>
      )}

      <div className={styles.productsGrid}>
        {paginatedProducts.length > 0 ? (
          <div className={styles.productCards}>
            {paginatedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onRequest={handleOpenRequestModal}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <p>No se encontraron productos que coincidan con tu búsqueda.</p>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {requestModal.isOpen && requestModal.product && (
        <RequestProductModal
          isOpen={requestModal.isOpen}
          onClose={handleCloseRequestModal}
          product={{
            id: requestModal.product.id,
            nombre: requestModal.product.nombre,
            codigo: requestModal.product.codigo,
            cantidad: requestModal.product.cantidad,
            unidad_medida: requestModal.product.unidad_medida || 'unidades'
          }}
          onRequest={handleRequestSubmit}
        />
      )}
    </div>
  );
};

export default Products;
