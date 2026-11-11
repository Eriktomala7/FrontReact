import { useState, useEffect } from 'react';
import { Button, Form, Row, Col, Table, Select, message, Modal, Card, Space, Typography, Tag } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReportsService from '../../../../services/ReportsService';
import { exportExcelReport, exportPdfReport } from '../exportUtils';
import './StockReports.css';

const { Title } = Typography;

type StockStatus = 'DISPONIBLE' | 'BAJO_STOCK' | 'AGOTADO' | 'INACTIVO';

interface StockRow {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  cantidad_minima: number;
  unidad_medida: string;
  estado: StockStatus;
}

const statusLabels: Record<StockStatus, string> = {
  DISPONIBLE: 'Disponible',
  BAJO_STOCK: 'Bajo stock',
  AGOTADO: 'Agotado',
  INACTIVO: 'Inactivo',
};

const statusColors: Record<StockStatus, string> = {
  DISPONIBLE: 'green',
  BAJO_STOCK: 'gold',
  AGOTADO: 'red',
  INACTIVO: 'default',
};

const normalize = (item: any): StockRow => {
  const cantidad = Number(item.cantidad ?? 0);
  const minimo = Number(item.cantidad_minima ?? item.stock_minimo ?? 0);
  let estado: StockStatus = 'DISPONIBLE';
  if (item.estado && item.estado !== 'ACTIVO' && item.estado !== 'DISPONIBLE') estado = 'INACTIVO';
  else if (cantidad === 0) estado = 'AGOTADO';
  else if (cantidad <= minimo) estado = 'BAJO_STOCK';

  return {
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    categoria: typeof item.categoria === 'string' ? item.categoria : item.categoria?.nombre || 'Sin categoría',
    cantidad,
    cantidad_minima: minimo,
    unidad_medida: item.unidad_medida || 'unidad',
    estado,
  };
};

const StockReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<StockRow[]>([]);
  const [data, setData] = useState<StockRow[]>([]);
  const [filters, setFilters] = useState<{ categoria?: string; estado?: string }>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const categories = Array.from(new Set(allData.map((item) => item.categoria))).sort();

  const applyFilters = (rows: StockRow[], values: { categoria?: string; estado?: string }) =>
    rows.filter(
      (item) =>
        (!values.categoria || item.categoria === values.categoria) &&
        (!values.estado || values.estado === 'TODOS' || item.estado === values.estado),
    );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = (await ReportsService.getInventoryReport({})) as any;
        const productos = Array.isArray(response) ? response : response.data || [];
        const rows = productos.map(normalize);
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

  const onFinish = (values: { categoria?: string; estado?: string }) => {
    const filtered = applyFilters(allData, values);
    setFilters(values);
    setData(filtered);
    setIsFilterModalVisible(false);
    message.success(`Se encontraron ${filtered.length} registros`);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setData(allData);
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
          ? `Estado: ${statusLabels[filters.estado as StockStatus]}`
          : undefined,
      ].filter(Boolean) as string[];

      const countBy = (estado: StockStatus) => data.filter((item) => item.estado === estado).length;
      const summary = [
        { label: 'Total productos', value: data.length },
        { label: 'Disponibles', value: countBy('DISPONIBLE') },
        { label: 'Bajo stock', value: countBy('BAJO_STOCK') },
        { label: 'Agotados', value: countBy('AGOTADO') },
      ];
      const day = dayjs().format('YYYY-MM-DD');

      if (format === 'pdf') {
        const filename = `reporte-inventario-${day}.pdf`;
        exportPdfReport({
          title: 'Reporte de inventario',
          filters: filterTexts,
          summary,
          head: ['Código', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Unidad', 'Estado'],
          body: data.map((item) => [
            item.codigo,
            item.nombre,
            item.categoria,
            item.cantidad,
            item.cantidad_minima,
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
            Mínimo: item.cantidad_minima,
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
      title: 'Stock Actual',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (value: number, record: StockRow) => (
        <span className={value <= record.cantidad_minima ? 'text-red-500 font-medium' : ''}>
          {value} {record.unidad_medida}
        </span>
      ),
    },
    {
      title: 'Mínimo Requerido',
      dataIndex: 'cantidad_minima',
      key: 'cantidad_minima',
      render: (value: number, record: StockRow) => <span>{value} {record.unidad_medida}</span>,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: StockStatus) => <Tag color={statusColors[estado]}>{statusLabels[estado]}</Tag>,
    },
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="mb-0">Reporte de Inventario</Title>
          <Space>
            <Button icon={<FilterOutlined />} onClick={() => setIsFilterModalVisible(true)}>
              Filtros
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={loading}>
              Limpiar
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')} disabled={loading || data.length === 0}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')} disabled={loading || data.length === 0}>
              Excel
            </Button>
          </Space>
        </div>

        <Modal
          title="Filtrar Reporte"
          open={isFilterModalVisible}
          onCancel={() => setIsFilterModalVisible(false)}
          width={600}
          footer={[
            <Button key="cancel" onClick={() => setIsFilterModalVisible(false)}>Cancelar</Button>,
            <Button key="apply" type="primary" onClick={() => form.submit()}>Aplicar Filtros</Button>,
          ]}
        >
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ estado: 'TODOS' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="categoria" label="Categoría">
                  <Select placeholder="Todas las categorías" allowClear>
                    {categories.map((name) => (
                      <Select.Option key={name} value={name}>{name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="estado" label="Estado">
                  <Select>
                    <Select.Option value="TODOS">Todos</Select.Option>
                    <Select.Option value="DISPONIBLE">Disponible</Select.Option>
                    <Select.Option value="BAJO_STOCK">Bajo stock</Select.Option>
                    <Select.Option value="AGOTADO">Agotado</Select.Option>
                    <Select.Option value="INACTIVO">Inactivo</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

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
      </Card>
    </div>
  );
};

export default StockReport;
