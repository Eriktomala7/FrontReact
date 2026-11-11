import { useState, useEffect } from 'react';
import { Button, DatePicker, Form, Row, Col, Table, Select, message } from 'antd';
import { SearchOutlined, FilePdfOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import moment from 'moment';
import type { MovementReportParams, MovimientoReporte } from '../../../../services/ReportsService';
import ReportsService from '../../../../services/ReportsService';
import { useForm } from 'antd/es/form/Form';
import { exportExcelReport, exportPdfReport } from '../exportUtils';
import { getProducts } from '../../../../services/dashboardService';

const { RangePicker } = DatePicker;

const movementTypes = [
  { value: 'TODOS', label: 'Todos los movimientos' },
  { value: 'ENTRADA', label: 'Entradas' },
  { value: 'SALIDA', label: 'Salidas' },
  { value: 'AJUSTE', label: 'Ajustes' },
];

const MovementReport = () => {
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MovimientoReporte[]>([]);
  const [products, setProducts] = useState<Array<{ id: number; nombre: string }>>([]);

  // Fetch products on component mount
  useEffect(() => {
    loadMovements();
    const fetchProducts = async () => {
      try {
        const result = await getProducts();
        setProducts(result.map(({ id, nombre }) => ({ id, nombre })));
      } catch (error) {
        console.error('Error fetching products:', error);
        message.error('Error al cargar los productos');
      }
    };

    fetchProducts();
  }, []);

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha: string) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' :
          tipo === 'SALIDA' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {tipo}
        </span>
      ),
    },
    {
      title: 'Producto',
      key: 'producto',
      render: (_: any, record: MovimientoReporte) => (
        <div>
          <div className="font-medium">{record.producto.nombre}</div>
          <div className="text-gray-500 text-xs">Código: {record.producto.codigo}</div>
        </div>
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (cantidad: number, record: MovimientoReporte) => (
        <span className={record.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}>
          {record.tipo === 'ENTRADA' ? '+' : '-'}{cantidad}
        </span>
      ),
    },
    {
      title: 'Usuario',
      key: 'usuario',
      render: (_: any, record: MovimientoReporte) => (
        <div>
          <div>{record.usuario.nombre}</div>
          <div className="text-gray-500 text-xs">{record.usuario.email}</div>
        </div>
      ),
    },
    {
      title: 'Comentario',
      dataIndex: 'comentario',
      key: 'comentario',
      render: (comentario: string) => comentario || 'N/A',
    },
  ];

  const getMovementParams = (values: any): MovementReportParams => ({
    fechaInicio: values.dateRange?.[0]?.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    fechaFin: values.dateRange?.[1]?.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    tipoMovimiento: values.tipo === 'TODOS' ? undefined : values.tipo,
    idProducto: values.idProducto ? Number(values.idProducto) : undefined,
  });

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const result = await ReportsService.getMovementReport(getMovementParams(values));
      const [startDate, endDate] = values.dateRange || [];
      const filteredResult = result.filter((movement) => {
        if (values.tipo && values.tipo !== 'TODOS' && movement.tipo !== values.tipo) return false;
        if (values.idProducto && String(movement.id_producto) !== String(values.idProducto)) return false;

        const movementDate = dayjs(movement.fecha);
        if (startDate && movementDate.isBefore(startDate.startOf('day'))) return false;
        if (endDate && movementDate.isAfter(endDate.endOf('day'))) return false;
        return true;
      });

      setData(filteredResult);
      
      message.success(`Se encontraron ${filteredResult.length} registros`);
    } catch (error) {
      console.error('Error fetching movement report:', error);
      message.error('Error al generar el reporte de movimientos');
    } finally {
      setLoading(false);
    }
  };
  

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      if (data.length === 0) {
        message.warning('No hay datos para exportar');
        return;
      }

      const values = form.getFieldsValue();
      const [start, end] = values.dateRange || [];
      const productName = products.find((p) => String(p.id) === String(values.idProducto))?.nombre;
      const filters = [
        start && end ? `Periodo: ${start.format('DD/MM/YYYY')} a ${end.format('DD/MM/YYYY')}` : undefined,
        values.tipo && values.tipo !== 'TODOS' ? `Tipo: ${values.tipo}` : undefined,
        productName ? `Producto: ${productName}` : undefined,
      ].filter(Boolean) as string[];

      const count = (tipo: string) => data.filter((m) => m.tipo === tipo).length;
      const units = (tipo: string) =>
        data.filter((m) => m.tipo === tipo).reduce((sum, m) => sum + Number(m.cantidad || 0), 0);
      const summary = [
        { label: 'Total movimientos', value: data.length },
        { label: 'Entradas (unidades)', value: `${count('ENTRADA')} (${units('ENTRADA')})` },
        { label: 'Salidas (unidades)', value: `${count('SALIDA')} (${units('SALIDA')})` },
        { label: 'Ajustes', value: count('AJUSTE') },
      ];
      const day = dayjs().format('YYYY-MM-DD');

      if (format === 'pdf') {
        const filename = `reporte-movimientos-${day}.pdf`;
        exportPdfReport({
          title: 'Reporte de movimientos',
          filters,
          summary,
          head: ['Fecha', 'Tipo', 'Producto', 'Código', 'Cantidad', 'Usuario', 'Motivo'],
          body: data.map((m) => [
            dayjs(m.fecha).format('DD/MM/YYYY HH:mm'),
            m.tipo,
            m.producto?.nombre ?? '',
            m.producto?.codigo ?? '',
            m.cantidad,
            m.usuario?.nombre ?? '',
            m.motivo ?? '',
          ]),
          filename,
        });
        message.success(`Reporte exportado exitosamente como ${filename}`);
        return;
      }

      if (format === 'excel') {
        exportExcelReport(`reporte-movimientos-${day}.xlsx`, [
          {
            name: 'Resumen',
            rows: [
              ...summary.map((s) => ({ Concepto: s.label, Valor: s.value })),
              ...filters.map((f) => ({ Concepto: 'Filtro', Valor: f })),
            ],
          },
          {
            name: 'Movimientos',
            autoFilter: true,
            rows: data.map((m) => ({
              Fecha: dayjs(m.fecha).format('DD/MM/YYYY HH:mm'),
              Tipo: m.tipo,
              Producto: m.producto?.nombre ?? '',
              Código: m.producto?.codigo ?? '',
              Cantidad: m.cantidad,
              Usuario: m.usuario?.nombre ?? '',
              Email: m.usuario?.email ?? '',
              Motivo: m.motivo ?? '',
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
  const loadMovements = async (params: MovementReportParams = {}) => {
    try {
      setLoading(true);
      const movimientos = await ReportsService.getMovementReport(params);
      setData(movimientos);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      message.error('Error al cargar los movimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    loadMovements();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        tipo: 'TODOS',
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12} lg={6}>
          <Form.Item
            name="dateRange"
            label="Rango de fechas"
          >
            <RangePicker
              className="w-full"
              format="DD/MM/YYYY"
              ranges={{
                'Hoy': [moment(), moment()],
                'Últimos 7 días': [moment().subtract(6, 'day'), moment()],
                'Este mes': [moment().startOf('month'), moment()],
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={4}>
          <Form.Item name="tipo" label="Tipo de movimiento">
            <Select
              options={movementTypes}
              onChange={(value) => {
                form.setFieldsValue({ tipo: value });
                form.submit();
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Form.Item name="idProducto" label="Producto">
            <Select
              showSearch
              placeholder="Todos los productos"
              optionFilterProp="children"
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                form.setFieldsValue({ idProducto: value });
                form.submit();
              }}
              options={products.map((p) => ({
                value: p.id,
                label: p.nombre,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12} lg={8} className="flex items-end space-x-2">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            htmlType="submit"
            loading={loading}
          >
            Buscar
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={loading}
          >
            Limpiar
          </Button>

          <Button 
    icon={<FilePdfOutlined />} 
    onClick={() => handleExport('pdf')}
    disabled={loading || data.length === 0}
  >
    Exportar PDF
  </Button>
  <Button 
    icon={<FileExcelOutlined />} 
    onClick={() => handleExport('excel')}
    disabled={loading || data.length === 0}
  >
    Exportar Excel
  </Button>
        </Col>
      </Row>
    </Form>

    <div className="mt-6">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} movimientos`,
        }}
        scroll={{ x: true }}
        locale={{
          emptyText: 'No hay movimientos para mostrar. Aplique los filtros y haga clic en "Buscar"',
        }}
      />
    </div>
  </div>
);
};


export default MovementReport;
