import axios from 'axios';
import type { MovimientoReciente } from '../types/dashboard';

const API_URL = 'https://apicomple-1.onrender.com';

// Types for the dashboard statistics
export interface DashboardStats {
  totalProductos: number;
  totalCategorias: number;
  totalMovimientos: number;
  productosBajoStock: number;
}

// Product related types
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface Product {
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
  categoria: Categoria;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Fetches dashboard statistics from the API
 * @returns Promise with dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/productos/dashboard/estadisticas');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    throw error;
  }
};

/**
 * Fetches recent inventory movements
 * @param limit Number of recent movements to fetch (default: 10)
 * @returns Promise with array of recent movements
 */
export const getRecentMovements = async (limit: number = 10): Promise<MovimientoReciente[]> => {
  try {
    const response = await api.get('/productos/dashboard/movimientos-recientes', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent movements:', error);
    throw error;
  }
};

/**
 * Fetches all products from the API
 * @returns Promise with array of products
 */
/**
 * Fetches all products from the API
 * @returns Promise with array of products
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/productos');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Creates a new product request
 * @param requestData The request data including product_id and quantity
 * @returns Promise with the created request
 */
export interface CreateRequestData {
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  comentario: string;
  estado?: string;
}

export const createRequest = async (requestData: CreateRequestData) => {
  try {
    const response = await api.post('/solicitudes', requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};

export interface RequestType {
  id: number;
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_PROCESO';
  comentario?: string;
  comentario_admin?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  producto: {
    id: number;
    nombre: string;
    codigo: string;
    cantidad: number;
    unidad_medida: string;
  };
}

export const getMyRequests = async (): Promise<RequestType[]> => {
  try {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
      throw new Error('No se pudo obtener la información del usuario');
    }
    
    const response = await api.get(`/solicitudes/usuario/${user.id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

// Export the API instance in case it's needed elsewhere
export default api;