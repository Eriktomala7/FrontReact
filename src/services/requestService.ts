import axios from 'axios';

const API_URL = "https://apicomple-1.onrender.com";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createRequest = async (data: {
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  comentario?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_PROCESO';
}) => {
  try {
    const response = await api.post('/solicitudes', data);
    return response.data;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};


