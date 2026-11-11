import { useState, useEffect } from 'react';
import { Button, Form, Row, Col, Table, InputNumber, Select, message, Card, Statistic} from 'antd';
import { AlertOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { LowStockReportParams, ProductoReporte } from '../../../../services/ReportsService';
import ReportsService from '../../../../services/ReportsService';
import { useForm } from 'antd/es/form/Form';
import axios from 'axios';
import dayjs from 'dayjs';
import { exportExcelReport, exportPdfReport } from '../exportUtils';

const LowStockReport = () => {
  const [form] = useForm(); 
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductoReporte[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; nombre: string }>>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  // Fetch categories on component mount
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

    fetchCategories();
    // Load initial data
    onFinish({ nivelAlerta: 10 });
  }, []);

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
      title: 'Stock Actual',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (value: number, record: ProductoReporte) => (
        <span className={value === 0 ? 'text-red-600 font-bold' : 'text-orange-600 font-medium'}>
          {value} {record.unidad_medida}
        </span>
      ),
    },
    {
      title: 'Mínimo Requerido',
      dataIndex: 'cantidad_minima',
      key: 'cantidad_minima',
      render: (value: number, record: ProductoReporte) => (
        <span>{value} {record.unidad_medida}</span>
      ),
    },
    {
      title: 'Diferencia',
      key: 'diferencia',
      render: (_: any, record: ProductoReporte) => {
        const diferencia = record.cantidad - record.cantidad_minima;
        return (
          <span className={diferencia < 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
            {diferencia < 0 ? 'Faltan ' : 'Sobran '}
            {Math.abs(diferencia)} {record.unidad_medida}
          </span>
        );
      },
    },
  ];

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const params: LowStockReportParams = {
        nivelAlerta: values.nivelAlerta || 10, // Default to 10 if not provided
        idCategoria: values.idCategoria,
      };

      const result = await ReportsService.getLowStockReport(params);
      setData(result);
      
      // Calculate statistics
      const lowStockCount = result.length;
      const outOfStockCount = result.filter(item => item.cantidad === 0).length;
      
      setStats({
        totalProducts: result.length,
        lowStockCount,
        outOfStockCount,
      });
      
      message.success(`Se encontraron ${result.length} productos con stock bajo`);
    } catch (error) {
      console.error('Error fetching low stock report:', error);
      message.error('Error al generar el reporte de stock bajo');
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
      const categoryName = categories.find((c) => c.id === values.idCategoria)?.nombre;
      const filters = [
        `Nivel de alerta: ${values.nivelAlerta || 10}`,
        categoryName ? `Categoría: ${categoryName}` : undefined,
      ].filter(Boolean) as string[];
      const summary = [
        { label: 'Productos con stock bajo', value: stats.totalProducts },
        { label: 'Agotados', value: stats.outOfStockCount },
        { label: 'Por agotarse', value: stats.lowStockCount - stats.outOfStockCount },
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
            (item as any).categoria || '',
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
              Categoría: (item as any).categoria || '',
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
    <div className="p-4">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="Productos con Stock Bajo"
            value={stats.totalProducts}
            valueStyle={{ color: stats.totalProducts > 0 ? '#f59e0b' : '#10b981' }}
            prefix={<AlertOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Productos Agotados"
            value={stats.outOfStockCount}
            valueStyle={{ color: stats.outOfStockCount > 0 ? '#ef4444' : '#10b981' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Productos por Agotarse"
            value={stats.lowStockCount - stats.outOfStockCount}
            valueStyle={{ color: '#f59e0b' }}
          />
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            nivelAlerta: 10,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8} lg={4}>
              <Form.Item
                name="nivelAlerta"
                label="Nivel de Alerta"
                tooltip="Número de unidades por debajo del cual se considera stock bajo"
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="Ej: 10"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8} lg={4}>
              <Form.Item name="idCategoria" label="Categoría">
                <Select
                  placeholder="Todas las categorías"
                  allowClear
                  options={categories.map(cat => ({
                    value: cat.id,
                    label: cat.nombre,
                  }))}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8} lg={16} className="flex items-end space-x-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<AlertOutlined />}
              >
                Ver Stock Bajo
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
              showTotal: (total) => `Total: ${total} productos con stock bajo`
            }}
            scroll={{ x: true }}
            locale={{
              emptyText: 'No hay productos con stock bajo para los filtros seleccionados'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LowStockReport;
