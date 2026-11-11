import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowsRightLeftIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '../services/authService';
import { getDashboardStats, getRecentMovements, type DashboardStats } from '../services/dashboardService';
import type { MovimientoReciente } from '../types/dashboard';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [recentMovements, setRecentMovements] = useState<MovimientoReciente[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCurrentUser();
  const firstName = user?.nombre?.trim().split(/\s+/)[0] || 'Administrador';
  const fullName = user?.nombre?.trim() || 'Administrador';
  const roleName = user?.rol === 'ADMIN' ? 'Administrador' : 'Usuario';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, movementsData] = await Promise.all([
          getDashboardStats(),
          getRecentMovements(5),
        ]);
        setStats(statsData);
        setRecentMovements(movementsData);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
        setError('No se pudieron cargar los datos del panel de control.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <p className={styles.loadingText}>Cargando resumen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon} aria-hidden="true">!</div>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total de productos',
      value: stats?.totalProductos,
      note: 'Productos registrados',
      icon: <CubeIcon aria-hidden="true" />,
      color: styles.blue,
    },
    {
      label: 'Bajo stock',
      value: stats?.productosBajoStock,
      note: 'Requieren revisión',
      icon: <ExclamationTriangleIcon aria-hidden="true" />,
      color: styles.amber,
    },
    {
      label: 'Movimientos',
      value: stats?.totalMovimientos,
      note: 'Movimientos registrados',
      icon: <ArrowsRightLeftIcon aria-hidden="true" />,
      color: styles.green,
    },
    {
      label: 'Categorías',
      value: stats?.totalCategorias,
      note: 'Categorías activas',
      icon: <TagIcon aria-hidden="true" />,
      color: styles.coral,
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.breadcrumb}>Administración <span>/</span> Resumen</p>
            <h1 className={styles.welcomeTitle}>Buenos días, {firstName}</h1>
          </div>
          <div className={styles.accountSummary}>
            <span className={styles.accountAvatar} aria-hidden="true">
              {fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </span>
            <span className={styles.accountText}>
              <strong>{fullName}</strong>
              <small>{roleName}</small>
            </span>
          </div>
        </div>
      </header>

      <main className={styles.dashboardBody}>
        <section className={styles.statsGrid} aria-label="Resumen de inventario">
          {statCards.map((card) => (
            <article className={styles.statCard} key={card.label}>
              <div className={`${styles.statIcon} ${card.color}`}>{card.icon}</div>
              <p className={styles.statLabel}>{card.label}</p>
              <div className={styles.statValueRow}>
                <strong className={styles.statValue}>{(card.value ?? 0).toLocaleString('es')}</strong>
                <span className={styles.statNote}>{card.note}</span>
              </div>
            </article>
          ))}
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.panel} aria-labelledby="activity-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle} id="activity-title">Actividad de inventario</h2>
                <p className={styles.panelSubtitle}>Movimientos recientes registrados</p>
              </div>
              <span className={styles.panelCount}>{recentMovements.length} recientes</span>
            </div>

            {recentMovements.length > 0 ? (
              <ul className={styles.movementList}>
                {recentMovements.map((movement) => {
                  const isEntry = movement.tipo === 'ENTRADA';
                  const isExit = movement.tipo === 'SALIDA';
                  const movementIcon = isEntry
                    ? <ArrowDownIcon aria-hidden="true" />
                    : isExit
                      ? <ArrowUpIcon aria-hidden="true" />
                      : <ArrowsRightLeftIcon aria-hidden="true" />;
                  const movementColor = isEntry
                    ? styles.entry
                    : isExit
                      ? styles.exit
                      : styles.adjustment;
                  const movementDate = new Date(movement.fecha);

                  return (
                    <li className={styles.movementItem} key={movement.id}>
                      <span className={`${styles.movementIcon} ${movementColor}`}>{movementIcon}</span>
                      <div className={styles.movementInfo}>
                        <div className={styles.movementTopline}>
                          <strong className={styles.movementProduct}>{movement.producto.nombre}</strong>
                          <span className={`${styles.movementType} ${movementColor}`}>{movement.tipo}</span>
                        </div>
                        <p className={styles.movementMeta}>
                          {movement.producto.codigo} <span>·</span> {movement.usuario.nombre}
                        </p>
                        {movement.motivo && <p className={styles.movementReason}>{movement.motivo}</p>}
                      </div>
                      <div className={styles.movementAside}>
                        <strong>{movement.cantidad} unidades</strong>
                        <time dateTime={movement.fecha}>
                          {Number.isNaN(movementDate.getTime())
                            ? movement.fecha
                            : movementDate.toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className={styles.emptyState}>Todavía no hay movimientos recientes.</div>
            )}
          </section>

          <aside className={`${styles.panel} ${styles.stockPanel}`} aria-labelledby="stock-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.stockEyebrow}>Atención requerida</p>
                <h2 className={styles.panelTitle} id="stock-title">Alertas de inventario</h2>
              </div>
              <span className={styles.stockAlertIcon}><ExclamationTriangleIcon aria-hidden="true" /></span>
            </div>
            <div className={styles.stockSummary}>
              <strong>{(stats?.productosBajoStock ?? 0).toLocaleString('es')}</strong>
              <span>productos con bajo stock</span>
            </div>
            <p className={styles.stockDescription}>
              Revisa las existencias que requieren atención en tu inventario.
            </p>
            <Link className={styles.stockLink} to="/admin/products">
              Ir a productos <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;