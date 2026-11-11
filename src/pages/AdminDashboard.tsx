import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Dashboard from './DashboardAdmin.tsx';
import UsersPage from './users/UsersPage.tsx';
import CategoriesPage from './admin/categories/CategoriesPage';
import ProductsPage from './admin/products/ProductsPage';
import RequestsPage from './admin/requests/RequestsPage.tsx';
import MovementsPage from './admin/movements/MovementsPage';
import ReportsPage from './admin/reports/ReportsPage';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="solicitudes" element={<RequestsPage />} />
        <Route path="movements" element={<MovementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;

export const adminRoutes = [
  {
    path: 'admin',
    element: <AdminDashboard />
  }
];