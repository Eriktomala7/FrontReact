// src/pages/reports/ReportsPage.tsx
import { useState } from 'react';
import { ArrowsRightLeftIcon, CubeIcon, ExclamationTriangleIcon, UsersIcon } from '@heroicons/react/24/outline';
import styles from './ReportsPage.module.css';
import TopProductReport from './components/TopProductReport';
import StockReport from './components/StockReport';
import MovementReport from './components/MovementReport';
import LowStockReport from './components/LowStockReport';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('stock');

  const reports = [
    {
      key: 'stock',
      title: 'Inventario general',
      description: 'Consulta existencias, categorías y estado de los productos.',
      icon: <CubeIcon aria-hidden="true" />,
      iconStyle: styles.blue,
    },
    {
      key: 'movements',
      title: 'Movimientos',
      description: 'Analiza entradas, salidas y ajustes por periodo.',
      icon: <ArrowsRightLeftIcon aria-hidden="true" />,
      iconStyle: styles.green,
    },
    {
      key: 'low-stock',
      title: 'Stock mínimo',
      description: 'Identifica productos que requieren reposición.',
      icon: <ExclamationTriangleIcon aria-hidden="true" />,
      iconStyle: styles.amber,
    },
    {
      key: 'top-product',
      title: 'Producto con más movimientos',
      description: 'Descubre qué producto registra más operaciones.',
      icon: <UsersIcon aria-hidden="true" />,
      iconStyle: styles.blue,
    },
  ];

  const activeReport = activeTab === 'stock'
    ? <StockReport />
    : activeTab === 'movements'
      ? <MovementReport />
      : activeTab === 'top-product'
        ? <TopProductReport />
        : <LowStockReport />;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Administración <span>/</span> Análisis</p>
          <h1>Reportes</h1>
        </div>
      </header>

      <section className={styles.reportDirectory} aria-labelledby="reports-title">
        <header className={styles.directoryHeader}>
          <div>
            <h2 id="reports-title">Reportes de inventario</h2>
            <p>Genera información lista para analizar o compartir.</p>
          </div>
        </header>

        <div className={styles.reportGrid} role="tablist" aria-label="Tipos de reporte">
          {reports.map((report) => (
            <button
              className={`${styles.reportCard} ${activeTab === report.key ? styles.reportCardActive : ''}`}
              type="button"
              key={report.key}
              onClick={() => setActiveTab(report.key)}
              role="tab"
              aria-selected={activeTab === report.key}
              aria-controls="active-report"
            >
              <span className={`${styles.reportIcon} ${report.iconStyle}`}>{report.icon}</span>
              <strong>{report.title}</strong>
              <span className={styles.reportDescription}>{report.description}</span>
              <span className={styles.openReport}>{activeTab === report.key ? 'Reporte seleccionado' : 'Abrir reporte'} <span aria-hidden="true">›</span></span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.activeReport} id="active-report" role="tabpanel" aria-label={reports.find((report) => report.key === activeTab)?.title}>
        {activeReport}
      </section>
    </main>
  );
};

export default ReportsPage;