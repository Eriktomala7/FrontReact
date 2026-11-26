import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/dashboardService';

export interface AdminNotification {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha?: string | null;
  producto?: { nombre?: string | null; cantidad?: number | null } | null;
}

interface NotificationLists {
  requests: AdminNotification[];
  inventory: AdminNotification[];
}

function isNotification(value: unknown): value is AdminNotification {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'number' || typeof item.mensaje !== 'string' || typeof item.leida !== 'boolean') return false;
  if (item.fecha != null && typeof item.fecha !== 'string') return false;
  if (item.producto != null) {
    if (typeof item.producto !== 'object') return false;
    const product = item.producto as Record<string, unknown>;
    if (product.nombre != null && typeof product.nombre !== 'string') return false;
    if (product.cantidad != null && typeof product.cantidad !== 'number') return false;
  }
  return true;
}

function parseNotifications(value: unknown): AdminNotification[] {
  if (!Array.isArray(value) || !value.every(isNotification)) {
    throw new Error('El servidor devolvió notificaciones con un formato inválido.');
  }
  return value;
}

export function useAdminNotifications() {
  const [lists, setLists] = useState<NotificationLists>({ requests: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const sequence = useRef(0);

  const refresh = useCallback(() => {
    const current = ++sequence.current;
    return Promise.all([
      api.get<unknown>('/solicitudes/admin/notificaciones'),
      api.get<unknown>('/notificaciones'),
    ]).then(([requests, inventory]) => {
      const result = inventory.data;
      if (!result || typeof result !== 'object' || !('notificaciones' in result)) {
        throw new Error('El servidor devolvió alertas con un formato inválido.');
      }
      const next = {
        requests: parseNotifications(requests.data),
        inventory: parseNotifications(result.notificaciones),
      };
      if (sequence.current === current) {
        setLists(next);
        setError(null);
      }
    }).catch((err: unknown) => {
      console.error('Error al cargar las notificaciones:', err);
      if (sequence.current === current) setError('No se pudieron cargar las notificaciones. Inténtalo de nuevo.');
    }).finally(() => {
      if (sequence.current === current) setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
      window.clearInterval(timer);
      sequence.current += 1;
    };
  }, [refresh]);

  const markRead = async (ids: number[]): Promise<boolean> => {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return true;
    setMarking(true);
    try {
      const results = await Promise.allSettled(
        uniqueIds.map((id) => api.patch(`/notificaciones/${id}/leida`)),
      );
      const successful = new Set(uniqueIds.filter((_, index) => results[index].status === 'fulfilled'));
      sequence.current += 1;
      setLoading(false);
      setLists((previous) => ({
        requests: previous.requests.map((item) => successful.has(item.id) ? { ...item, leida: true } : item),
        inventory: previous.inventory.map((item) => successful.has(item.id) ? { ...item, leida: true } : item),
      }));
      if (successful.size !== uniqueIds.length) {
        console.error('No se pudieron marcar todas las notificaciones como leídas:', results.filter((result) => result.status === 'rejected'));
        setError('No se pudieron marcar algunas notificaciones como leídas. Inténtalo de nuevo.');
        return false;
      }
      setError(null);
      return true;
    } finally {
      setMarking(false);
    }
  };

  return { ...lists, loading, error, marking, refresh, markRead };
}
