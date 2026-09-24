import { useEffect, useState } from 'react';
import api from '../services/api.js';

export function useDemoMode() {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    api
      .get('/health')
      .then(({ data }) => setDemoMode(Boolean(data.demoMode)))
      .catch(() => {});
  }, []);

  return demoMode;
}
