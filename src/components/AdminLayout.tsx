// src/components/AdminLayout.tsx
import { useLocation, Link } from 'react-router-dom';
import { logout } from '../services/authService';
import type { ReactNode } from 'react';
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import './AdminLayout.css';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Resumen', icon: <HomeIcon style={{ width: 20, height: 20 }} /> },
    { path: '/admin/products', label: 'Productos', icon: <CubeIcon style={{ width: 20, height: 20 }} /> },
    { path: '/admin/categorias', label: 'Categorías', icon: <TagIcon style={{ width: 20, height: 20 }} /> },
    { path: '/admin/movements', label: 'Movimientos', icon: <ClockIcon style={{ width: 20, height: 20 }} /> },
    { path: '/admin/solicitudes', label: 'Solicitudes', icon: <DocumentTextIcon style={{ width: 20, height: 20 }} /> },
    { path: '/admin/users', label: 'Usuarios', icon: <UserGroupIcon style={{ width: 20, height: 20 }} /> },
    { path: '/admin/reports', label: 'Reportes', icon: <DocumentTextIcon style={{ width: 20, height: 20 }} /> },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname.replace(/\/+$/, '') === '/admin';

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand-mark">
            <CubeIcon aria-hidden="true" />
          </div>
          <div className="sidebar-brand-copy">
            <h1>Stockwise</h1>
            <span>CONTROL DE INVENTARIO</span>
          </div>
        </div>
        <nav className="menu">
          <p className="menu-label">MENÚ PRINCIPAL</p>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <ArrowLeftOnRectangleIcon style={{ width: 20, height: 20, marginRight: 5 }} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className={`main-content${isDashboard ? ' dashboard-content' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
