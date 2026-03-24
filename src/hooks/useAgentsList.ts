import { useCallback, useEffect, useState } from 'react';
import { agentsApi } from '../services/api';
import { Agent } from '../types';

export function useAgentsList() {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await agentsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar agentes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
