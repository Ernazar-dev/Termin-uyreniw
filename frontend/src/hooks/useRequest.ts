import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { getErrorMessage } from '../utils/error';

interface RequestState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (updater: (current: T | undefined) => T | undefined) => void;
}

/**
 * Loads data on mount and whenever `deps` change.
 * Responses from outdated requests are ignored, so fast filter changes never show stale data.
 */
export const useRequest = <T>(fetcher: () => Promise<T>, deps: DependencyList, enabled = true): RequestState<T> => {
  const [data, setDataState] = useState<T>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (active) setDataState(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, enabled]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const setData = useCallback((updater: (current: T | undefined) => T | undefined) => setDataState(updater), []);

  return { data, loading, error, reload, setData };
};
