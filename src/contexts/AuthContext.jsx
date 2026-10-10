import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        setUser(response.data.user);
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        } else {
          console.error('Auth check failed:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => controller.abort();
  }, [token]);

  const saveAuth = (newToken, userData) => {
    const normalizedUser = { ...userData, _id: userData?._id || userData?.id };

    localStorage.setItem('token', newToken);
    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(normalizedUser);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return { success: false, message: 'Invalid login response' };
      }

      saveAuth(newToken, userData);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Login failed',
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      if (!newToken || !userData) {
        return {
          success: false,
          message: 'Invalid registration response',
        };
      }

      saveAuth(newToken, userData);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Registration failed. Check the server logs.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/users/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Profile update failed',
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};