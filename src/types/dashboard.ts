// Tipos para las estadísticas del dashboard
export interface EstadisticasDashboard {
  totalProducts: number;
  lowStockCount: number;
  todayMovements: number;
  pendingRequests: number;
}

// Tipo para productos con bajo stock
export interface ProductoBajoStock {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  code?: string;
  category?: string;
}

// Tipo para movimientos recientes
export interface MovimientoReciente {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  fecha: string;
  motivo: string;
  producto: {
    id: number;
    nombre: string;
    codigo: string;
  };
  usuario: {
    id: number;
    nombre: string;
    email: string;
  };
}

// Tipo para solicitudes pendientes
export interface SolicitudPendiente {
  id: string;
  tipo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  fechaSolicitud: string;
  solicitante: {
    id: string;
    nombre: string;
    email: string;
  };
  producto?: {
    id: string;
    nombre: string;
    codigo: string;
  };
  cantidad?: number;
  notas?: string;
}
