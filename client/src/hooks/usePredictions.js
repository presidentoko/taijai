import { useState, useEffect } from 'react';
import { api } from '../api';

export function usePredictions(category = '') {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPredictions() {
    try {
      const path = category ? `/predictions?category=${encodeURIComponent(category)}` : '/predictions';
      const data = await api.get(path);
      setPredictions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 5000);
    return () => clearInterval(interval);
  }, [category]);

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
    const interval = setInterval(fetchPrediction, 5000);
    return () => clearInterval(interval);
  }, [id]);

  return { prediction, loading, refetch: fetchPrediction };
}
