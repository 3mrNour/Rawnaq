import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantAuthProvider } from './context/TenantAuthContext';
import { TenantLayout } from './components/TenantLayout';
import { Login } from './pages/Login';
import { StaffManagement } from './pages/StaffManagement';
import { PriceCatalogue } from './pages/PriceCatalogue';
import { ShopSettings } from './pages/ShopSettings';
import { OrderEntry } from './pages/pos/OrderEntry';
import { OrderBoard } from './pages/pos/OrderBoard';
import { ScanScreen } from './pages/floor/ScanScreen';
import { StaffEarnings } from './pages/StaffEarnings';
import './styles/print.css';

export function TenantApp() {
  return (
    <TenantAuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/floor" element={<ScanScreen />} />
        <Route element={<TenantLayout />}>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<OrderEntry />} />
          <Route path="/orders" element={<OrderBoard />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/staff/earnings" element={<StaffEarnings />} />
          <Route path="/price-catalogue" element={<PriceCatalogue />} />
          <Route path="/settings" element={<ShopSettings />} />
        </Route>
      </Routes>
    </TenantAuthProvider>
  );
}
