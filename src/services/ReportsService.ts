import axios from 'axios';

const API_URL = 'https://apicomple-1.onrender.com';

// Types for report parameters
export interface InventoryReportParams {
  fechaInicio?: string;
  fechaFin?: string;
  idCategoria?: number;
  estado?: string;
}

export interface MovementReportParams {
  fechaInicio?: string;
  fechaFin?: string;
  tipoMovimiento?: string;
  idProducto?: number;
}

export interface LowStockReportParams {
  nivelAlerta?: number;
  idCategoria?: number;
}

export interface ProductoReporte {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  cantidad_minima: number;
  unidad_medida: string;
  categoria: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}
export interface ProductoMovimiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_categoria: number;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
  unidad_medida: string;
  estado: string;
  foto_producto: string | null;
}
export interface UsuarioMovimiento {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  foto_perfil: string | null;
  reset_token?: string | null;
  reset_token_expiration?: string | null;
}

export interface ProductoMasMovimientosReporte {
  producto: {
    id?: number;
    codigo?: string;
    nombre?: string;
    categoria?: string | { nombre: string };
  };
  totalMovimientos: number;
}

export interface MovimientoReporte {
  id: number;
  id_producto: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo: string;
  fecha: string;
  id_usuario: number;
  estado: string;
  producto: ProductoMovimiento;
  usuario: UsuarioMovimiento;
}

// Helper to extract readable error from blob responses
async function extractBlobError(err: unknown): Promise<never> {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const contentType = err.response?.headers?.['content-type'];
    try {
      // When responseType is 'blob', errors come as Blob too
      const blob = err.response?.data as Blob | undefined;
      if (blob && typeof blob.text === 'function') {
        const text = await blob.text();
        // Try parse as JSON to get message
        try {
          const json = JSON.parse(text);
          const msg = json.message || json.error || text;
          throw new Error(`Error ${status ?? ''}: ${msg}`.trim());
        } catch {
          // Not JSON, return raw text
          throw new Error(`Error ${status ?? ''}: ${text}`.trim());
        }
      }
      // Fallback to axios data/message
      if (typeof err.message === 'string') {
        throw new Error(`Error ${status ?? ''}: ${err.message}`.trim());
      }
    } catch (parseErr) {
      throw parseErr as Error;
    }
  }
  throw err as Error;
}

const ReportsService = {
  // Get inventory report
  async getInventoryReport(params: InventoryReportParams = {}): Promise<ProductoReporte[]> {
    try {
      const response = await axios.get(`${API_URL}/reportes/inventario`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw error;
    }
  },

  // Get movement report
  async getMovementReport(params: MovementReportParams = {}): Promise<MovimientoReporte[]> {
    try {
      // Preparar los parámetros de consulta
      const queryParams: Record<string, any> = {};
      
      // Mapear los parámetros a los nombres que espera la API
      if (params.fechaInicio) queryParams.fechaInicio = params.fechaInicio;
      if (params.fechaFin) queryParams.fechaFin = params.fechaFin;
      if (params.tipoMovimiento && params.tipoMovimiento !== 'TODOS') {
        queryParams.tipo = params.tipoMovimiento;
      }
      if (params.idProducto) queryParams.id_producto = params.idProducto;
  
      // Realizar la petición
      const response = await axios.get(`${API_URL}/reportes/movimientos`, { 
        params: queryParams 
      });
  
      // Manejar diferentes formatos de respuesta
      let movimientos: any[] = [];
      
      // Caso 1: La respuesta tiene un array en la propiedad 'data'
      if (response.data && Array.isArray(response.data.data)) {
        movimientos = response.data.data;
      } 
      // Caso 2: La respuesta es directamente el array
      else if (Array.isArray(response.data)) {
        movimientos = response.data;
      }
      // Caso 3: La respuesta es un objeto con un array en alguna propiedad
      else if (response.data && typeof response.data === 'object') {
        const dataKey = Object.keys(response.data).find(key => 
          Array.isArray(response.data[key])
        );
        if (dataKey) {
          movimientos = response.data[dataKey];
        }
      }
  
      // Mapear los datos al formato esperado por la interfaz
      return movimientos.map((mov: any) => ({
        id: mov.id,
        id_producto: mov.id_producto,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        motivo: mov.motivo || '',
        fecha: mov.fecha,
        id_usuario: mov.id_usuario,
        estado: mov.estado || 'ACTIVO',
        producto: {
          id: mov.producto?.id || 0,
          codigo: mov.producto?.codigo || '',
          nombre: mov.producto?.nombre || 'Producto no encontrado',
          descripcion: mov.producto?.descripcion || '',
          id_categoria: mov.producto?.id_categoria || 0,
          cantidad: mov.producto?.cantidad || 0,
          precio_compra: mov.producto?.precio_compra || 0,
          precio_venta: mov.producto?.precio_venta || 0,
          unidad_medida: mov.producto?.unidad_medida || 'unidad',
          estado: mov.producto?.estado || 'INACTIVO',
          foto_producto: mov.producto?.foto_producto || null
        },
        usuario: {
          id: mov.usuario?.id || 0,
          nombre: mov.usuario?.nombre || 'Usuario desconocido',
          email: mov.usuario?.email || '',
          rol: mov.usuario?.rol || 'USUARIO',
          estado: mov.usuario?.estado || 'INACTIVO',
          foto_perfil: mov.usuario?.foto_perfil || null,
          reset_token: mov.usuario?.reset_token || null,
          reset_token_expiration: mov.usuario?.reset_token_expiration || null
        }
      }));
  
    } catch (error) {
      console.error('Error al obtener el reporte de movimientos:', error);
      // Puedes personalizar el mensaje de error según sea necesario
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // El servidor respondió con un código de estado fuera del rango 2xx
          console.error('Error en la respuesta:', error.response.data);
          console.error('Código de estado:', error.response.status);
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          console.error('No se recibió respuesta del servidor');
        } else {
          // Algo más causó el error
          console.error('Error al configurar la petición:', error.message);
        }
      }
      // Relanzar el error para que pueda ser manejado por el componente
      throw error;
    }
  },

  // Get low stock report
  async getLowStockReport(params: LowStockReportParams = {}): Promise<ProductoReporte[]> {
    try {
      const response = await axios.get(`${API_URL}/reportes/bajo-stock`, { params });

      // Normalizar respuesta: puede venir como { success, data: [...] } o directamente como array
      let items: any[] = [];
      if (response.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const key = Object.keys(response.data).find(k => 
          Array.isArray(response.data[k])
        );
        if (key) items = response.data[key];
      }

      // Mapear al tipo ProductoReporte esperado por el front
      const mapped: ProductoReporte[] = items.map((item: any) => ({
        id: item.id,
        codigo: item.codigo,
        nombre: item.nombre,
        descripcion: item.descripcion ?? '',
        cantidad: item.cantidad ?? 0,
        cantidad_minima: item.cantidad_minima ?? item.stock_minimo ?? 0,
        unidad_medida: item.unidad_medida ?? 'unidad',
        categoria: item.categoria?.nombre ?? item.categoria ?? 'Sin categoría',
        estado: item.estado ?? 'ACTIVO',
        fecha_creacion: item.fecha_creacion ?? '',
        fecha_actualizacion: item.fecha_actualizacion ?? '',
      }));

      return mapped;
    } catch (error) {
      console.error('Error fetching low stock report:', error);
      throw error;
    }
  },

  // Export report to PDF
  async exportToPDF(reportType: 'inventario' | 'movimientos' | 'bajo-stock', params: any = {}): Promise<Blob> {
    try {
      const response = await axios.get(`${API_URL}/reportes/export/${reportType}/pdf`, {
        params,
        responseType: 'blob',
      });
      // If server returned JSON error with 200 but wrong content-type, try to guard
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('application/pdf')) {
        // Attempt to read as text and throw
        const text = await (response.data as Blob).text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || json.error || 'Respuesta no es PDF');
        } catch {
          throw new Error(text || 'Respuesta no es PDF');
        }
      }
      return response.data;
    } catch (error) {
      console.error(`Error exporting ${reportType} to PDF:`, error);
      // Try to extract message from blob error
      return extractBlobError(error);
    }
  },

  // Export report to Excel
  async exportToExcel(reportType: 'inventario' | 'movimientos' | 'bajo-stock', params: any = {}): Promise<Blob> {
    try {
      const response = await axios.get(`${API_URL}/reportes/export/${reportType}/excel`, {
        params,
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        const text = await (response.data as Blob).text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || json.error || 'Respuesta no es Excel');
        } catch {
          throw new Error(text || 'Respuesta no es Excel');
        }
      }
      return response.data;
    } catch (error) {
      console.error(`Error exporting ${reportType} to Excel:`, error);
      return extractBlobError(error);
    }
  },

  async getProductWithMostMovementsReport(): Promise<ProductoMasMovimientosReporte | null> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Se requiere una sesión de administrador para consultar este reporte');

    const response = await axios.get(`${API_URL}/reportes/producto-mas-movimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')
      ? response.data.data
      : response.data;

    if (payload === null) return null;
    if (
      !payload ||
      typeof payload.producto !== 'object' ||
      payload.producto === null ||
      !Number.isInteger(payload.totalMovimientos) ||
      payload.totalMovimientos < 0
    ) {
      throw new Error('La respuesta del reporte de productos con más movimientos tiene un formato inválido');
    }

    return { producto: payload.producto, totalMovimientos: payload.totalMovimientos };
  },

  // Helper function to download a blob
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export default ReportsService;
