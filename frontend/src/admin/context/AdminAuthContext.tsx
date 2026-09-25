import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { setAuthTokenGetter } from '../../shared/api/client';

interface AdminAuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  // Sync the token getter with the shared API client whenever it changes.
  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AdminAuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
