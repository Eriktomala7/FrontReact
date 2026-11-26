import { useState, useEffect } from 'react';
import { Button, Form, Table, Select, message, Tag } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReportsService from '../../../../services/ReportsService';
import type { ProductoReporte } from '../../../../services/ReportsService';
import { exportExcelReport, exportPdfReport } from '../exportUtils';
import styles from './ReportPanel.module.css';

type StockStatus = 'ACTIVO' | 'INACTIVO';
type InventoryFilters = { categoria?: string; estado?: StockStatus | 'TODOS' };

interface StockRow {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad_medida: string;
  estado: StockStatus;
}

const statusLabels: Record<StockStatus, string> = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
};

const statusColors: Record<StockStatus, string> = {
  ACTIVO: 'green',
  INACTIVO: 'default',
};

type InventoryItem = Omit<ProductoReporte, 'categoria'> & {
  categoria?: string | { nombre?: string } | null;
};

const normalize = (item: InventoryItem): StockRow => {
  const cantidad = Number(item.cantidad ?? 0);
  if (item.estado !== 'ACTIVO' && item.estado !== 'INACTIVO') {
    throw new Error(`Estado de producto inválido: ${item.estado}`);
  }

  return {
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    categoria: typeof item.categoria === 'string' ? item.categoria : item.categoria?.nombre || 'Sin categoría',
    cantidad,
    unidad_medida: item.unidad_medida || 'unidad',
    estado: item.estado,
  };
};

const applyFilters = (rows: StockRow[], values: InventoryFilters) =>
  rows.filter(
    (item) =>
      (!values.categoria || item.categoria === values.categoria) &&
      (!values.estado || values.estado === 'TODOS' || item.estado === values.estado),
  );

const fetchInventory = async (): Promise<StockRow[]> => {
  const response: unknown = await ReportsService.getInventoryReport({});
  const productos = Array.isArray(response)
    ? response
    : response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)
      ? response.data
      : null;
  if (!productos) throw new Error('La respuesta del inventario tiene un formato inválido');
  return productos.map(normalize);
};

const StockReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<StockRow[]>([]);
  const [data, setData] = useState<StockRow[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const categories = Array.from(new Set(allData.map((item) => item.categoria))).sort();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rows = await fetchInventory();
        setAllData(rows);
        setData(rows);
      } catch (error) {
        console.error('Error al cargar el inventario:', error);
        message.error('Error al cargar el inventario');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onFinish = (values: InventoryFilters) => {
    const filtered = applyFilters(allData, values);
    setFilters(values);
    setData(filtered);
    message.success(`Se encontraron ${filtered.length} registros`);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const rows = await fetchInventory();
      setAllData(rows);
      setData(applyFilters(rows, filters));
    } catch (error) {
      console.error('Error al cargar el inventario:', error);
      message.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      if (data.length === 0) {
        message.warning('No hay datos para exportar');
        return;
      }

      const filterTexts = [
        filters.categoria ? `Categoría: ${filters.categoria}` : undefined,
        filters.estado && filters.estado !== 'TODOS'
          ? `Estado: ${statusLabels[filters.estado]}`
          : undefined,
      ].filter(Boolean) as string[];

      const countBy = (estado: StockStatus) => data.filter((item) => item.estado === estado).length;
      const summary = [
        { label: 'Total productos', value: data.length },
        { label: 'Activos', value: countBy('ACTIVO') },
        { label: 'Inactivos', value: countBy('INACTIVO') },
      ];
      const day = dayjs().format('YYYY-MM-DD');

      if (format === 'pdf') {
        const filename = `reporte-inventario-${day}.pdf`;
        exportPdfReport({
          title: 'Reporte de inventario',
          filters: filterTexts,
          summary,
          head: ['Código', 'Producto', 'Categoría', 'Stock', 'Unidad', 'Estado'],
          body: data.map((item) => [
            item.codigo,
            item.nombre,
            item.categoria,
            item.cantidad,
            item.unidad_medida,
            statusLabels[item.estado],
          ]),
          filename,
        });
        message.success(`Reporte exportado exitosamente como ${filename}`);
        return;
      }

      exportExcelReport(`reporte-inventario-${day}.xlsx`, [
        {
          name: 'Resumen',
          rows: [
            ...summary.map((s) => ({ Concepto: s.label, Valor: s.value })),
            ...filterTexts.map((f) => ({ Concepto: 'Filtro', Valor: f })),
          ],
        },
        {
          name: 'Inventario',
          autoFilter: true,
          rows: data.map((item) => ({
            Código: item.codigo,
            Producto: item.nombre,
            Categoría: item.categoria,
            Stock: item.cantidad,
            Unidad: item.unidad_medida,
            Estado: statusLabels[item.estado],
          })),
        },
      ]);
      message.success('Excel generado correctamente');
    } catch (error) {
      console.error(`Error al exportar a ${format}:`, error);
      message.error(`Error al exportar el reporte a ${format.toUpperCase()}`);
    }
  };

  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo' },
    { title: 'Producto', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Categoría', dataIndex: 'categoria', key: 'categoria' },
    {
      title: 'Stock actual',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (value: number, record: StockRow) => (
        <span>{value} {record.unidad_medida}</span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: StockStatus) => <Tag color={statusColors[estado]}>{statusLabels[estado]}</Tag>,
    },
  ];

  return (
    <div className={styles.report}>
        <div className={styles.header}>
          <h2>Inventario general</h2>
          <div className={styles.actions}>
            <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="inventory-filters">
              {showFilters ? 'Ocultar filtros' : 'Filtros'}
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')} disabled={loading || data.length === 0}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')} disabled={loading || data.length === 0}>
              Excel
            </Button>
            <Button onClick={handleRefresh} loading={loading}>Actualizar</Button>
          </div>
        </div>

        <div id="inventory-filters" hidden={!showFilters}>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ estado: 'TODOS' }} className={styles.filters}>
            <Form.Item name="categoria" label="Categoría">
              <Select placeholder="Todas las categorías" allowClear>
                {categories.map((name) => (
                  <Select.Option key={name} value={name}>{name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="estado" label="Estado">
              <Select>
                <Select.Option value="TODOS">Todos los estados</Select.Option>
                <Select.Option value="ACTIVO">Activo</Select.Option>
                <Select.Option value="INACTIVO">Inactivo</Select.Option>
              </Select>
            </Form.Item>
            <Button type="primary" htmlType="submit" disabled={loading}>Aplicar filtros</Button>
          </Form>
        </div>

        <div className={styles.table}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} registros`,
          }}
          scroll={{ x: true }}
          locale={{ emptyText: 'No hay datos para mostrar con los filtros aplicados' }}
        />
        </div>
    </div>
  );
};

export default StockReport;
