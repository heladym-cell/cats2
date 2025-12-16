import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';

interface AuthContextType {
  user: User | null;
  isInitialized: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  initializeAdmin: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false); // True if admin account exists

  useEffect(() => {
    const adminExists = localStorage.getItem('pg_admin_hash');
    const storedUser = localStorage.getItem('pg_current_user');
    
    setIsInitialized(!!adminExists);
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const initializeAdmin = (password: string) => {
    // In a real app, hash this password. Storing plain/simple hash for demo.
    localStorage.setItem('pg_admin_hash', btoa(password)); 
    const adminUser: User = { username: 'admin', role: UserRole.ADMIN };
    setUser(adminUser);
    localStorage.setItem('pg_current_user', JSON.stringify(adminUser));
    setIsInitialized(true);
  };

  const login = (username: string, password: string): boolean => {
    const storedHash = localStorage.getItem('pg_admin_hash');
    
    if (username === 'admin') {
      if (storedHash && btoa(password) === storedHash) {
        const adminUser: User = { username: 'admin', role: UserRole.ADMIN };
        setUser(adminUser);
        localStorage.setItem('pg_current_user', JSON.stringify(adminUser));
        return true;
      }
    } else {
      // Allow any guest login for demo purposes if not admin
      const guestUser: User = { username: username || 'Guest', role: UserRole.GUEST };
      setUser(guestUser);
      localStorage.setItem('pg_current_user', JSON.stringify(guestUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pg_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, logout, initializeAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};