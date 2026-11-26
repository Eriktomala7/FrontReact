import { useEffect, useState } from 'react';
import { Alert, Button, Empty, Spin, Table, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReportsService from '../../../../services/ReportsService';
import type { ProductoMasMovimientosReporte } from '../../../../services/ReportsService';
import { exportExcelReport, exportPdfReport } from '../exportUtils';
import styles from './ReportPanel.module.css';

const EXPLANATION =
  'Cada entrada, salida o ajuste cuenta como una operación. El total no representa unidades, sino cuántas operaciones se registraron para ese producto.';

const TopProductReport = () => {
  const [report, setReport] = useState<ProductoMasMovimientosReporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setReport(await ReportsService.getProductWithMostMovementsReport());
    } catch (err: unknown) {
      console.error('Error al cargar el reporte de productos con más movimientos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte de productos con más movimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ReportsService.getProductWithMostMovementsReport()
      .then(setReport)
      .catch((err: unknown) => {
        console.error('Error al cargar el reporte de productos con más movimientos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el reporte de productos con más movimientos');
      })
      .finally(() => setLoading(false));
  }, []);

  const categoria = report
    ? typeof report.producto.categoria === 'object'
      ? report.producto.categoria?.nombre || '—'
      : report.producto.categoria || '—'
    : '—';

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!report) return;
    const codigo = report.producto.codigo || '—';
    const nombre = report.producto.nombre || 'Producto';
    const day = dayjs().format('YYYY-MM-DD');
    const summary = [
      { label: 'Operaciones registradas', value: report.totalMovimientos },
      { label: 'Producto', value: nombre },
    ];

    if (format === 'pdf') {
      exportPdfReport({
        title: 'Producto con más movimientos',
        filters: [EXPLANATION],
        summary,
        head: ['Código', 'Producto', 'Categoría', 'Operaciones registradas'],
        body: [[codigo, nombre, categoria, report.totalMovimientos]],
        filename: `reporte-producto-mas-movimientos-${day}.pdf`,
      });
    } else {
      exportExcelReport(`reporte-producto-mas-movimientos-${day}.xlsx`, [
        {
          name: 'Cómo leer el reporte',
          rows: [
            { Concepto: 'Reporte', Valor: 'Producto con más movimientos' },
            { Concepto: 'Explicación', Valor: EXPLANATION },
            { Concepto: 'Generado el', Valor: dayjs().format('DD/MM/YYYY') },
          ],
        },
        {
          name: 'Producto más movimientos',
          rows: [
            {
              Código: codigo,
              Producto: nombre,
              Categoría: categoria,
              'Operaciones registradas': report.totalMovimientos,
            },
          ],
        },
      ]);
    }
    message.success(format === 'pdf' ? 'Reporte exportado correctamente' : 'Excel generado correctamente');
  };

  return (
    <div className={styles.report}>
        <div className={styles.header}>
          <h2>Producto con más movimientos</h2>
          <div className={styles.actions}>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')} disabled={loading || !report}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')} disabled={loading || !report}>
              Excel
            </Button>
            <Button onClick={load} loading={loading}>
              Actualizar
            </Button>
          </div>
        </div>

        <p className={styles.explanation}>{EXPLANATION}</p>

        {error && <Alert type="error" showIcon message={error} className="mb-4" />}

        <Spin spinning={loading}>
          {!error && !loading && !report && (
            <Empty description="Aún no hay movimientos registrados" />
          )}
          {report && (
            <div className={styles.table}>
              <Table
                columns={[
                  { title: 'Código', dataIndex: 'codigo', key: 'codigo' },
                  { title: 'Producto', dataIndex: 'nombre', key: 'nombre' },
                  { title: 'Categoría', dataIndex: 'categoria', key: 'categoria' },
                  { title: 'Operaciones registradas', dataIndex: 'totalMovimientos', key: 'totalMovimientos' },
                ]}
                dataSource={[{
                  key: 'top-product',
                  codigo: report.producto.codigo || '—',
                  nombre: report.producto.nombre || 'Producto',
                  categoria,
                  totalMovimientos: report.totalMovimientos,
                }]}
                pagination={false}
                scroll={{ x: true }}
              />
            </div>
          )}
        </Spin>
    </div>
  );
};

export default TopProductReport;
