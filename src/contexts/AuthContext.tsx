import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<{
  auth: AuthState;
  login: (token: string, user: any) => void;
  logout: () => void;
  updateUser: (userUpdates: any) => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('vouch_token');
    const userStr = localStorage.getItem('vouch_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e) {
        localStorage.removeItem('vouch_token');
        localStorage.removeItem('vouch_user');
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuth(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (token: string, user: any) => {
    localStorage.setItem('vouch_token', token);
    localStorage.setItem('vouch_user', JSON.stringify(user));
    setAuth({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('vouch_token');
    localStorage.removeItem('vouch_user');
    setAuth({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (userUpdates: any) => {
    setAuth(prev => {
      const newUser = { ...prev.user, ...userUpdates };
      localStorage.setItem('vouch_user', JSON.stringify(newUser));
      return { ...prev, user: newUser };
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
