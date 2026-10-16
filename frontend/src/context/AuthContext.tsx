import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface User {
  id: string;
  name: string;
  phone_number: string;
  preferred_language: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    name: string;
    phone_number: string;
    password: string;
    preferred_language?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  syncLanguage: (languageCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('agri_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { i18n } = useTranslation();

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('agri_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            // Sync i18n with user's preferred language from MongoDB if present
            if (data.user.preferred_language && data.user.preferred_language !== i18n.language) {
              i18n.changeLanguage(data.user.preferred_language);
            }
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('agri_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [i18n]);

  const login = async (phone_number: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed' };
      }

      localStorage.setItem('agri_token', data.token);
      setToken(data.token);
      setUser(data.user);

      // If user had a preferred language stored, switch to it
      if (data.user.preferred_language) {
        i18n.changeLanguage(data.user.preferred_language);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login' };
    }
  };

  const register = async (formData: {
    name: string;
    phone_number: string;
    password: string;
    preferred_language?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    try {
      const preferred_language = formData.preferred_language || i18n.language || 'en';
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, preferred_language }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, message: data.message || 'Registration failed' };
      }

      localStorage.setItem('agri_token', data.token);
      setToken(data.token);
      setUser(data.user);

      if (data.user.preferred_language) {
        i18n.changeLanguage(data.user.preferred_language);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during registration' };
    }
  };

  const logout = () => {
    localStorage.removeItem('agri_token');
    setToken(null);
    setUser(null);
  };

  const syncLanguage = async (languageCode: string) => {
    // Immediately apply to browser
    await i18n.changeLanguage(languageCode);
    localStorage.setItem('i18nextLng', languageCode);

    // If authenticated, also sync with MongoDB
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/language`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferred_language: languageCode }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.user) {
            setUser(resData.user);
          }
        }
      } catch (err) {
        console.error('Failed to sync language to backend:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        syncLanguage,
      }}
    >
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
