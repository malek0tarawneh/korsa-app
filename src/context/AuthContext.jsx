import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem('korsa_token') || localStorage.getItem('learnly_token'));
  const [loading, setLoading] = useState(true);

  // Load current user on initial mount or token change
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setProfile(null);
        setActiveSubscriptions([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setProfile(data.profile);
          setActiveSubscriptions(data.activeSubscriptions || []);
        } else {
          // Token invalid or expired
          localStorage.removeItem('korsa_token');
          localStorage.removeItem('learnly_token');
          setToken(null);
          setUser(null);
          setProfile(null);
          setActiveSubscriptions([]);
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }

    localStorage.setItem('korsa_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register');
    }

    localStorage.setItem('korsa_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('korsa_token');
    localStorage.removeItem('learnly_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setActiveSubscriptions([]);
  };

  // 1-Click Quick Demo Login for instant testing of all roles
  const quickLogin = async (role) => {
    let email = 'student@learnly.com';
    if (role === 'teacher') email = 'jordan.math@learnly.com';
    if (role === 'admin') email = 'admin@learnly.com';

    return await login(email, 'learnly123');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setActiveSubscriptions(data.activeSubscriptions || []);
      }
    } catch (err) {
      console.error('Error refreshing user state:', err);
    }
  };

  const isSubscribedTo = (teacherId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.id === parseInt(teacherId)) return true;
    return activeSubscriptions.includes(parseInt(teacherId));
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      activeSubscriptions,
      token,
      loading,
      login,
      register,
      logout,
      quickLogin,
      refreshUser,
      isSubscribedTo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
