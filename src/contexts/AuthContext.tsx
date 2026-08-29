import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken, setToken, clearToken, onUnauthorized } from '../api/client';
import { unwrap } from '../api/client';

interface User {
  id: string;
  phone: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getToken();
        if (storedToken) {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(unwrap<{ user: User }>(response.data).user);
          } else {
            clearToken();
            setTokenState(null);
          }
        }
      } catch {
        clearToken();
        setTokenState(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Force logout globally when any API call gets a 401
    return onUnauthorized(() => {
      setUser(null);
      setTokenState(null);
    });
  }, []);

  const applySession = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    setTokenState(newToken);
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { phone, password });

      if (response.data.success) {
        const data = unwrap<{ user: User; token: string }>(response.data);
        applySession(data.user, data.token);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: { msg?: string }[] } } };
      throw new Error(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'حدث خطأ أثناء تسجيل الدخول'
      );
    }
  };

  const register = async (phone: string, password: string, name?: string) => {
    try {
      const response = await api.post('/auth/register', { phone, password, ...(name ? { name } : {}) });

      if (response.data.success) {
        const data = unwrap<{ user: User; token: string }>(response.data);
        applySession(data.user, data.token);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: { msg?: string }[] } } };
      throw new Error(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'حدث خطأ أثناء إنشاء الحساب'
      );
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {
      /* token is discarded locally regardless */
    });
    setUser(null);
    setTokenState(null);
    clearToken();
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
