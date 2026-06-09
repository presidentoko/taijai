import { useState, useEffect } from 'react';
import { api } from '../api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [rankInfo, setRankInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        setUser(payload);
        api.get('/users/rank').then(setRankInfo).catch(() => {});
      } else {
        localStorage.removeItem('token');
      }
    } catch {
      localStorage.removeItem('token');
    }
  }, []);

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    setRankInfo(null);
  }

  return { user, rankInfo, logout };
}
