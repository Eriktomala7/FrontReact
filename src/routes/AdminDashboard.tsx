import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../pages/admin/dashboard/DashboardAdmin';
import UsersPage from '../pages/admin/users/UsersPage';
import CategoriesPage from '../pages/admin/categories/CategoriesPage';
import ProductsPage from '../pages/admin/products/ProductsPage';
import RequestsPage from '../pages/admin/requests/RequestsPage';
import MovementsPage from '../pages/admin/movements/MovementsPage';
import ReportsPage from '../pages/admin/reports/ReportsPage';
import { useAdminNotifications } from '../components/useAdminNotifications';

const AdminDashboard = () => {
  const notifications = useAdminNotifications();
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard notifications={notifications} />} />
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