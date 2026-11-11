// src/components/UserLayout.tsx
import { Outlet, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import {
  HomeIcon,
  CubeIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import './UserLayout.css';

interface UserLayoutProps {
  children?: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const location = useLocation();
  const user = getCurrentUser();
  const userName = user?.nombre?.trim() || 'Usuario';
  const userRole = user?.rol === 'ADMIN' ? 'Administrador' : 'Colaborador';
  const initials = userName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  const menuItems = [
    { path: '/dashboard', label: 'Inicio', icon: <HomeIcon style={{ width: 20, height: 20 }} /> },
    { path: '/dashboard/products', label: 'Productos', icon: <CubeIcon style={{ width: 20, height: 20 }} /> },
    { path: '/dashboard/requests', label: 'Mis Solicitudes', icon: <DocumentTextIcon style={{ width: 20, height: 20 }} /> },
    { path: '/dashboard/activity', label: 'Actividad', icon: <ClockIcon style={{ width: 20, height: 20 }} /> },
    { path: '/dashboard/notifications', label: 'Notificaciones', icon: <BellIcon style={{ width: 20, height: 20 }} /> },
    { path: '/dashboard/profile', label: 'Mi Perfil', icon: <UserCircleIcon style={{ width: 20, height: 20 }} /> },
  ];

  const isActive = (path: string) => {
    // Remove trailing slashes for consistent comparison
    const currentPath = location.pathname.replace(/\/+$/, '');
    const normalizedPath = path.replace(/\/+$/, '');
    
    // Special case for dashboard
    if (normalizedPath.endsWith('dashboard')) {
      return currentPath === normalizedPath || 
             currentPath.endsWith('/user') ||
             currentPath.endsWith('/user/');
    }
    
    // For other paths, check if current path starts with the menu item path
    // This handles nested routes like /user/products/123
    return currentPath === normalizedPath || 
           currentPath.startsWith(`${normalizedPath}/`);
  };

  const currentPage = menuItems.find(item => isActive(item.path));

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="user-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="user-brand-mark"><CubeIcon aria-hidden="true" /></span>
          <span className="user-brand-copy">
            <strong>Stockwise</strong>
            <small>CONTROL DE INVENTARIO</small>
          </span>
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
            <ArrowLeftOnRectangleIcon aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="user-main">
        <header className="user-topbar">
          <div>
            <p className="user-breadcrumb">Espacio de usuario <ChevronRightIcon aria-hidden="true" /> {currentPage?.label || 'Inicio'}</p>
            <h1>{currentPage?.label === 'Inicio' ? `Buenos días, ${userName.split(/\s+/)[0]}` : currentPage?.label}</h1>
          </div>
          <div className="user-account">
            <Link to="/dashboard/notifications" className="notification-link" aria-label="Notificaciones">
              <BellIcon aria-hidden="true" />
            </Link>
            <span className="account-avatar" aria-hidden="true">{initials}</span>
            <span className="account-copy">
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </span>
          </div>
        </header>
        <div className="main-content">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
