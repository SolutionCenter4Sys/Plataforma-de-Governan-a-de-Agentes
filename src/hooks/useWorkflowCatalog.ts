import { useCallback, useEffect, useState } from 'react';
import { workflowApi } from '../services/api';
import { WorkflowCatalogEntry } from '../types';

export function useWorkflowCatalog() {
  const [data, setData] = useState<WorkflowCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await workflowApi.getCatalog());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar workflows.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
