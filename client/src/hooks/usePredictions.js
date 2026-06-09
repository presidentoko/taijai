import { useState, useEffect } from 'react';
import { api } from '../api';

export function usePredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPredictions() {
    try {
      const data = await api.get('/predictions');
      setPredictions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 3000);
    return () => clearInterval(interval);
  }, []);

  return { predictions, loading, refetch: fetchPredictions };
}

export function usePrediction(id) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchPrediction() {
    try {
      const data = await api.get(`/predictions/${id}`);
      setPrediction(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 3000);
    return () => clearInterval(interval);
  }, [id]);

  return { prediction, loading, refetch: fetchPrediction };
}
