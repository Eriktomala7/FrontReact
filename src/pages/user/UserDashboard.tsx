import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowsRightLeftIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BellAlertIcon,
  CubeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import RequestProductModal from '../../components/RequestProductModal';
import { getCurrentUser } from '../../services/authService';
import {
  createRequest,
  getMyRequests,
  getProducts,
  getRecentMovements,
  type Product,
  type RequestType,
} from '../../services/dashboardService';
import type { MovimientoReciente } from '../../types/dashboard';
import styles from './UserDashboard.module.css';

const UserDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [recentMovements, setRecentMovements] = useState<MovimientoReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestProduct, setRequestProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const [productResult, requestResult, movementResult] = await Promise.allSettled([
        getProducts(),
        getMyRequests(),
        getRecentMovements(5),
      ]);

      const failedSections: string[] = [];
      if (productResult.status === 'fulfilled') {
        setProducts(productResult.value);
      } else {
        failedSections.push('productos');
        console.error('Error al cargar productos del dashboard:', productResult.reason);
      }

      if (requestResult.status === 'fulfilled') {
        setRequests(requestResult.value);
      } else {
        failedSections.push('solicitudes');
        console.error('Error al cargar solicitudes del dashboard:', requestResult.reason);
      }

      if (movementResult.status === 'fulfilled') {
        setRecentMovements(movementResult.value);
      } else {
        failedSections.push('movimientos');
        console.error('Error al cargar movimientos del dashboard:', movementResult.reason);
      }

      if (failedSections.length > 0) {
        setError(`No se pudieron cargar: ${failedSections.join(', ')}.`);
      }
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const activeProducts = products.filter((product) => product.estado === 'ACTIVO');
  const availableProducts = activeProducts.filter((product) => product.cantidad > 0);
  const unavailableProducts = activeProducts.filter((product) => product.cantidad <= 0);
  const availableUnits = availableProducts.reduce((total, product) => total + product.cantidad, 0);
  const pendingRequests = requests.filter((request) => request.estado === 'PENDIENTE').length;

  const handleRequest = async (requestData: { cantidad: number; comentario: string }) => {
    if (!requestProduct) return;
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('No se pudo obtener la información del usuario actual.');
    }

    await createRequest({
      id_usuario: Number(currentUser.id),
      id_producto: requestProduct.id,
      cantidad: requestData.cantidad,
      comentario: requestData.comentario,
      estado: 'PENDIENTE',
    });

    try {
      setRequests(await getMyRequests());
    } catch (refreshError) {
      console.error('La solicitud se creó, pero no se pudo actualizar su lista:', refreshError);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <p>Cargando tu espacio...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {error && <p className={styles.errorMessage} role="alert">{error}</p>}

      <section className={styles.statsGrid} aria-label="Resumen de usuario">
        <article className={styles.statCard}>
          <div className={styles.statIcon + ' ' + styles.blue}><CubeIcon aria-hidden="true" /></div>
          <p className={styles.statLabel}>Productos disponibles</p>
          <div className={styles.statValueRow}>
            <strong className={styles.statValue}>{availableProducts.length.toLocaleString('es')}</strong>
            <Link className={styles.statLink} to="/dashboard/products">Ver catálogo <span aria-hidden="true">›</span></Link>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statIcon + ' ' + styles.green}><ArrowsRightLeftIcon aria-hidden="true" /></div>
          <p className={styles.statLabel}>Unidades disponibles</p>
          <div className={styles.statValueRow}>
            <strong className={styles.statValue}>{availableUnits.toLocaleString('es')}</strong>
            <span className={styles.statNote}>En inventario</span>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statIcon + ' ' + styles.violet}><DocumentTextIcon aria-hidden="true" /></div>
          <p className={styles.statLabel}>Mis solicitudes</p>
          <div className={styles.statValueRow}>
            <strong className={styles.statValue}>{requests.length.toLocaleString('es')}</strong>
            <Link className={styles.statLink} to="/dashboard/requests">{pendingRequests} pendientes <span aria-hidden="true">›</span></Link>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statIcon + ' ' + styles.amber}><BellAlertIcon aria-hidden="true" /></div>
          <p className={styles.statLabel}>Productos agotados</p>
          <div className={styles.statValueRow}>
            <strong className={styles.statValue}>{unavailableProducts.length.toLocaleString('es')}</strong>
            <Link className={styles.statLink} to="/dashboard/products">Ver productos <span aria-hidden="true">›</span></Link>
          </div>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby="activity-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="activity-title">Actividad de inventario</h2>
              <p>Movimientos recientes registrados</p>
            </div>
            <Link to="/dashboard/activity" className={styles.panelLink}>Ver actividad</Link>
          </div>

          {recentMovements.length > 0 ? (
            <ul className={styles.activityList}>
              {recentMovements.slice(0, 5).map((movement) => {
                const isEntry = movement.tipo === 'ENTRADA';
                const isExit = movement.tipo === 'SALIDA';
                const iconStyle = isEntry ? styles.entry : isExit ? styles.exit : styles.adjustment;
                const icon = isEntry
                  ? <ArrowDownIcon aria-hidden="true" />
                  : isExit
                    ? <ArrowUpIcon aria-hidden="true" />
                    : <ArrowsRightLeftIcon aria-hidden="true" />;

                return (
                  <li className={styles.activityItem} key={movement.id}>
                    <span className={`${styles.activityIcon} ${iconStyle}`}>{icon}</span>
                    <div className={styles.activityText}>
                      <strong>{movement.producto.nombre}</strong>
                      <span>{movement.tipo} · {movement.producto.codigo}</span>
                    </div>
                    <div className={styles.activityAmount}>
                      <strong>{isEntry ? '+' : isExit ? '-' : ''}{movement.cantidad} </strong>
                      <time dateTime={movement.fecha}>{new Date(movement.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</time>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyState}>No hay movimientos recientes.</div>
          )}
        </section>

        <aside className={styles.panel} aria-labelledby="products-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="products-title">Productos disponibles</h2>
              <p>Solicita los artículos que necesitas.</p>
            </div>
            <Link to="/dashboard/products" className={styles.panelLink}>Ver todos</Link>
          </div>

          {availableProducts.length > 0 ? (
            <ul className={styles.productList}>
              {availableProducts.slice(0, 4).map((product) => (
                <li className={styles.productItem} key={product.id}>
                  <span className={styles.productIcon}><CubeIcon aria-hidden="true" /></span>
                  <div className={styles.productText}>
                    <strong>{product.nombre}</strong>
                    <span>{product.cantidad} {product.unidad_medida} disponibles</span>
                  </div>
                  <button className={styles.requestButton} type="button" onClick={() => setRequestProduct(product)}>
                    Solicitar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>No hay productos disponibles para solicitar.</div>
          )}
        </aside>
      </div>

      <RequestProductModal
        isOpen={requestProduct !== null}
        product={requestProduct}
        onClose={() => setRequestProduct(null)}
        onRequest={handleRequest}
      />
    </div>
  );
};

export default UserDashboard;