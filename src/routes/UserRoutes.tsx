import { Routes, Route, Navigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import UserDashboard from '../pages/user/dashboard/UserDashboard';
import Products from '../pages/user/products/Products';
import MyRequests from '../pages/user/requests/MyRequests';
import UserActivity from '../pages/user/activity/UserActivity';
import Profile from '../pages/user/profile/Profile';

const UserRoutes = () => {
  return (
    <UserLayout>
      <Routes>
        <Route index element={<UserDashboard />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="activity" element={<UserActivity mode="activity" />} />
        <Route path="notifications" element={<UserActivity mode="notifications" />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UserLayout>
  );
};

export default UserRoutes;

export const userRoutes = [
  {
    path: '/*',
    element: <UserRoutes />
  }
];
