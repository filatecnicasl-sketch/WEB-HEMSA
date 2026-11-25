import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultContent } from '../content/site';
import { apiRequest } from '../lib/api';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [content, setContent] = useState(defaultContent);

  const refreshContent = useCallback(async (signal) => {
    try {
      const data = await apiRequest('/api/public/content', { signal });
      if (data?.content) setContent(data.content);
      return data?.content;
    } catch (error) {
      if (error.name === 'AbortError') return null;
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshContent(controller.signal);
    return () => controller.abort();
  }, [refreshContent]);

  const value = useMemo(() => ({ content, refreshContent }), [content, refreshContent]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used inside SiteProvider');
  return context;
}
