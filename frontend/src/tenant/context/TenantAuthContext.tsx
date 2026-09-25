import React, { createContext, useContext, useState, type ReactNode } from 'react';
import apiClient from '../../shared/api/client';

interface TenantUser {
  shopId: string;
  name: string;
  role: 'owner' | 'cashier';
}

interface TenantAuthContextType {
  token: string | null;
  user: TenantUser | null;
  login: (token: string, user: TenantUser) => void;
  logout: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

export const TenantAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<TenantUser | null>(null);

  const login = (newToken: string, newUser: TenantUser) => {
    setToken(newToken);
    setUser(newUser);
    // Explicitly update the global axios instance headers
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <TenantAuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </TenantAuthContext.Provider>
  );
};

export const useTenantAuth = () => {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
};
