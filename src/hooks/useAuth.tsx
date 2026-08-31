import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  username?: string;
  operatorName?: string;
  scope: 'GLOBAL' | 'WILAYAH' | 'CABANG' | 'WALI' | 'AUDITOR';
  divisi: 'ALL' | 'FORMAL' | 'PESANTREN';
  wilayahId?: string;
  cabangId?: string;
  wilayahName?: string;
  cabangName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncCookie = (tok: string | null) => {
    if (typeof document === 'undefined') return;
    if (tok) {
      const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `token=${tok}; path=/; max-age=86400; SameSite=Lax${secureFlag}`;
    } else {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  useEffect(() => {
    // Check for stored token and user info on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      syncCookie(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    syncCookie(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('dismissed_popup_ids');
    syncCookie(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
