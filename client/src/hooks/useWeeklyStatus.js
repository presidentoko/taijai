import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from './useAuth';

export function useWeeklyStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/votes/weekly-status').then(setStatus).catch(() => {});
  }, [user]);

  return status;
}
