import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Space, Spin, Statistic, Typography, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReportsService from '../../../../services/ReportsService';
import type { ProductoMasMovimientosReporte } from '../../../../services/ReportsService';
import { exportExcelReport, exportPdfReport } from '../exportUtils';

const { Title, Paragraph } = Typography;

const EXPLANATION =
  'Cada entrada, salida o ajuste cuenta como una operación. El total no representa unidades, sino cuántas operaciones se registraron para ese producto.';

const TopProductReport = () => {
  const [report, setReport] = useState<ProductoMasMovimientosReporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setReport(await ReportsService.getProductWithMostMovementsReport());
    } catch (err: any) {
      setError(err?.message || 'Error al cargar el reporte de productos con más movimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
    <div className="p-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="mb-0">Producto con más movimientos</Title>
          <Space>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')} disabled={loading || !report}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')} disabled={loading || !report}>
              Excel
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Actualizar
            </Button>
          </Space>
        </div>

        <Paragraph type="secondary">{EXPLANATION}</Paragraph>

        {error && <Alert type="error" showIcon message={error} className="mb-4" />}

        <Spin spinning={loading}>
          {!error && !loading && !report && (
            <Empty description="Aún no hay movimientos registrados" />
          )}
          {report && (
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', padding: '12px 0' }}>
              <Statistic title="Operaciones registradas" value={report.totalMovimientos} />
              <Statistic title="Producto" value={report.producto.nombre || 'Producto'} />
              <Statistic title="Código" value={report.producto.codigo || '—'} />
              <Statistic title="Categoría" value={categoria} />
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default TopProductReport;
