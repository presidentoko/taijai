import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function usePredictions(category = '') {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    try {
      const path = category ? `/predictions?category=${encodeURIComponent(category)}` : '/predictions';
      const data = await api.get(path);
      setPredictions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setLoading(true);
    fetchPredictions();

    const interval = setInterval(() => {
      if (!document.hidden) fetchPredictions();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchPredictions]);

  return { predictions, loading, refetch: fetchPredictions };
}

export function usePrediction(id) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPrediction = useCallback(async () => {
    try {
      const data = await api.get(`/predictions/${id}`);
      setPrediction(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrediction();

    const interval = setInterval(() => {
      if (!document.hidden) fetchPrediction();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchPrediction]);

  return { prediction, loading, refetch: fetchPrediction };
}
