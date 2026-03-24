import { useCallback, useEffect, useRef, useState } from 'react';
import { executionApi } from '../services/api';
import { ExecutionDetail } from '../types';

interface UseExecutionDetailOptions {
  poll?: boolean;
  intervalMs?: number;
}

export function useExecutionDetail(id?: string, options: UseExecutionDetailOptions = {}) {
  const { poll = false, intervalMs = 1500 } = options;
  const [data, setData] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const execution = await executionApi.get(id);
      setData(execution);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar execução.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!poll || !id) return undefined;
    intervalRef.current = setInterval(async () => {
      try {
        const execution = await executionApi.get(id);
        setData(execution);
        if (execution.status === 'succeeded' || execution.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Mantém o último estado renderizado; o erro já é tratado no carregamento principal.
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id, intervalMs, poll]);

  return { data, loading, error, reload };
}
