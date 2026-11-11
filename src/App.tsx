// App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import UserRoutes from './pages/user/UserRoutes';
import AdminDashboard from './pages/AdminDashboard';
import { getCurrentUser } from './services/authService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'USUARIO' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setUserRole(user.rol as 'ADMIN' | 'USUARIO');
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setIsAuthenticated(false);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // Protected route component
  const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'ADMIN' | 'USUARIO' }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/not-authorized" replace />;
    }
    
    return <>{children}</>;
  };

  // Main app content
  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'ADMIN' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Login
                onLogin={(userData) => {
                  setIsAuthenticated(true);
                  setUserRole(userData.rol);
                }}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'ADMIN' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Register
                onRegister={(userData) => {
                  setIsAuthenticated(true);
                  setUserRole(userData.rol);
                }}
              />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* User routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute requiredRole="USUARIO">
              <UserRoutes />
            </ProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Not authorized page */}
        <Route path="/not-authorized" element={<div>No tienes permiso para acceder a esta página</div>} />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'ADMIN' ? '/admin' : '/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* 404 - Not Found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
