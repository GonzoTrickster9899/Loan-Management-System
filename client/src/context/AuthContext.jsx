import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [initialCheck, setInitialCheck] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        setInitialCheck(false);
        return;
      }
      const { data } = await api.get('/auth/me');
      const userData = data.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
      setInitialCheck(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.requires2FA) {
      return { requires2FA: true, tempToken: data.tempToken, userId: data.userId };
    }
    const { user: userData, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return { requires2FA: false, user: userData };
  };

  const verify2FA = async (userId, token, tempToken) => {
    const { data } = await api.post('/auth/verify-2fa', { userId, token, tempToken });
    const { user: userData, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Proceed with local logout even if API fails
    }
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const updateProfile = async (updates) => {
    const { data } = await api.patch('/auth/update-profile', updates);
    const userData = data.data.user;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  };

  const value = {
    user,
    loading,
    initialCheck,
    login,
    verify2FA,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
