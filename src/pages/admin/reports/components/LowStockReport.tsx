import { useState, useEffect } from 'react';
import { Button, Form, Table, InputNumber, Select, message } from 'antd';
import { FilterOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { LowStockReportParams, ProductoReporte } from '../../../../services/ReportsService';
import ReportsService from '../../../../services/ReportsService';
import { useForm } from 'antd/es/form/Form';
import axios from 'axios';
import dayjs from 'dayjs';
import { exportExcelReport, exportPdfReport } from '../exportUtils';
import styles from './ReportPanel.module.css';

interface FilterValues {
  nivelAlerta?: number | null;
  idCategoria?: number;
}

const LowStockReport = () => {
  const [form] = useForm<FilterValues>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductoReporte[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; nombre: string }>>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<LowStockReportParams>({ nivelAlerta: 0 });

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
    },
    {
      title: 'Producto',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
    },
    {
      title: 'Stock actual',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (value: number, record: ProductoReporte) => (
        <span>{value} {record.unidad_medida}</span>
      ),
    },
    {
      title: 'Mínimo requerido',
      dataIndex: 'cantidad_minima',
      key: 'cantidad_minima',
      render: (value: number, record: ProductoReporte) => (
        <span>{value} {record.unidad_medida}</span>
      ),
    },
    {
      title: 'Diferencia',
      key: 'diferencia',
      render: (_: unknown, record: ProductoReporte) => {
        const diferencia = record.cantidad - record.cantidad_minima;
        return (
          <span className={diferencia < 0 ? styles.negative : styles.positive}>
            {diferencia}
          </span>
        );
      },
    },
  ];

  const onFinish = async (values: FilterValues) => {
    try {
      setLoading(true);
      
      const params: LowStockReportParams = {
        nivelAlerta: values.nivelAlerta ?? 0,
        idCategoria: values.idCategoria,
      };

      const result = await ReportsService.getLowStockReport(params);
      setData(result);
      setAppliedFilters(params);
      
      message.success(`Se encontraron ${result.length} productos con stock bajo`);
    } catch (error) {
      console.error('Error fetching low stock report:', error);
      message.error('Error al generar el reporte de stock bajo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://apicomple-1.onrender.com/categorias');
        const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setCategories(list.map(({ id, nombre }: { id: number; nombre: string }) => ({ id, nombre })));
      } catch (error) {
        console.error('Error fetching categories:', error);
        message.error('Error al cargar las categorías');
      }
    };

    const fetchInitialReport = async () => {
      try {
        setData(await ReportsService.getLowStockReport({ nivelAlerta: 0 }));
      } catch (error) {
        console.error('Error fetching low stock report:', error);
        message.error('Error al generar el reporte de stock bajo');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchInitialReport();
  }, []);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      if (data.length === 0) {
        message.warning('No hay datos para exportar');
        return;
      }

      const categoryName = categories.find((c) => c.id === appliedFilters.idCategoria)?.nombre;
      const filters = [
        `Nivel de alerta: ${appliedFilters.nivelAlerta ?? 0}`,
        categoryName ? `Categoría: ${categoryName}` : undefined,
      ].filter(Boolean) as string[];
      const summary = [
        { label: 'Productos con stock bajo', value: data.length },
        { label: 'Agotados', value: data.filter(item => item.cantidad === 0).length },
        { label: 'Por agotarse', value: data.filter(item => item.cantidad !== 0).length },
      ];
      const day = dayjs().format('YYYY-MM-DD');

      if (format === 'pdf') {
        const filename = `reporte-bajo-stock-${day}.pdf`;
        exportPdfReport({
          title: 'Reporte de stock bajo',
          filters,
          summary,
          head: ['Código', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Unidad', 'Diferencia'],
          body: data.map((item) => [
            item.codigo,
            item.nombre,
            item.categoria || '',
            item.cantidad,
            item.cantidad_minima,
            item.unidad_medida,
            item.cantidad - item.cantidad_minima,
          ]),
          filename,
        });
        message.success(`Reporte exportado exitosamente como ${filename}`);
        return;
      }

      if (format === 'excel') {
        exportExcelReport(`reporte-bajo-stock-${day}.xlsx`, [
          {
            name: 'Resumen',
            rows: [
              ...summary.map((s) => ({ Concepto: s.label, Valor: s.value })),
              ...filters.map((f) => ({ Concepto: 'Filtro', Valor: f })),
            ],
          },
          {
            name: 'Stock bajo',
            autoFilter: true,
            rows: data.map((item) => ({
              Código: item.codigo,
              Producto: item.nombre,
              Categoría: item.categoria || '',
              Stock: item.cantidad,
              Mínimo: item.cantidad_minima,
              Unidad: item.unidad_medida,
              Diferencia: item.cantidad - item.cantidad_minima,
            })),
          },
        ]);
        message.success('Excel generado correctamente');
        return;
      }

      message.error('Formato no soportado');
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      message.error(`Error al exportar el reporte a ${format.toUpperCase()}`);
    }
  };

  return (
    <div className={styles.report}>
      <div className={styles.header}>
        <h2>Stock mínimo</h2>
        <div className={styles.actions}>
          <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="low-stock-filters">
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')} disabled={loading || data.length === 0}>
            PDF
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')} disabled={loading || data.length === 0}>
            Excel
          </Button>
          <Button onClick={() => onFinish(appliedFilters)} loading={loading}>
            Actualizar
          </Button>
        </div>
      </div>

      <div id="low-stock-filters" hidden={!showFilters}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ nivelAlerta: 0 }}
          className={styles.filters}
        >
          <Form.Item name="idCategoria" label="Categoría">
            <Select
              placeholder="Todas las categorías"
              allowClear
              options={categories.map(cat => ({ value: cat.id, label: cat.nombre }))}
            />
          </Form.Item>
          <Form.Item name="nivelAlerta" label="Nivel de alerta">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Aplicar filtros</Button>
        </Form>
      </div>

        <div className={styles.table}>
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={data.length > 10 ? {
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} productos con stock bajo`
            } : false}
            scroll={{ x: true }}
            locale={{
              emptyText: 'No hay productos con stock bajo para los filtros seleccionados'
            }}
          />
        </div>
    </div>
  );
};

export default LowStockReport;
