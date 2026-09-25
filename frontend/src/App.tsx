import { Routes, Route } from 'react-router-dom';
import { AdminApp } from './admin/AdminApp';
import { TenantApp } from './tenant/TenantApp';
import { ThemeProvider } from './shared/context/ThemeContext';

export default function App() {


  return (
    <ThemeProvider>      
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<TenantApp />} />
      </Routes>
    </ThemeProvider>
  );
}
