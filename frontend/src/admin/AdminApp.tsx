import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { RequireAdminAuth } from './routes/RequireAdminAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateShop } from './pages/CreateShop';

export function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<RequireAdminAuth />}>
          <Route path="/shops" element={<Dashboard />} />
          <Route path="/shops/create" element={<CreateShop />} />
          <Route path="/" element={<Navigate to="/admin/shops" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
