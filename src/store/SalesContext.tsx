import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Sale, AppSettings, DEFAULT_SETTINGS } from '@/types/sales';

interface SalesContextType {
  sales: Sale[];
  settings: AppSettings;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const SalesContext = createContext<SalesContextType | null>(null);

const SALES_KEY = 'vst_sales';
const SETTINGS_KEY = 'vst_settings';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage(SALES_KEY, []));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS));

  useEffect(() => { localStorage.setItem(SALES_KEY, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  const addSale = useCallback((sale: Sale) => setSales(prev => [sale, ...prev]), []);
  const updateSale = useCallback((id: string, updates: Partial<Sale>) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);
  const deleteSale = useCallback((id: string) => setSales(prev => prev.filter(s => s.id !== id)), []);
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <SalesContext.Provider value={{ sales, settings, addSale, updateSale, deleteSale, updateSettings }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used within SalesProvider');
  return ctx;
}
