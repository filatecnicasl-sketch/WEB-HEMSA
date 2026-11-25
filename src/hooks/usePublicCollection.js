import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export default function usePublicCollection(kind, fallback) {
  const [items, setItems] = useState(fallback);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/api/public/${kind}`, { signal: controller.signal })
      .then((data) => {
        if (Array.isArray(data?.items)) setItems(data.items);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setItems(fallback);
      });
    return () => controller.abort();
  }, [kind, fallback]);

  return items;
}
