import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Sale, AppSettings, DEFAULT_SETTINGS, DEFAULT_ACCOUNTING_BANK_REQUIRED, DEFAULT_DEALER_BANK_REQUIRED } from '@/types/sales';
import { getDb, writeDb } from '@/lib/db';

interface SalesContextType {
  sales: Sale[];
  settings: AppSettings;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const SalesContext = createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const db = getDb();
      const loadedSales = db.data.sales || [];
      // Migrate old data: set orCrStatus to 'released' if it doesn't exist
      return loadedSales.map(s => ({
        ...s,
        orCr: (s.orCr as any) || 'released' as any,
        orCrStatus: (s.orCrStatus as any) || 'released' as any,
      }));
    } catch {
      return [];
    }
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const db = getDb();
      const savedSettings = db.data.settings || {};
      const merged = { ...DEFAULT_SETTINGS, ...savedSettings };
      // Ensure new fields exist for backward compat
      if (!merged.accountingBankRequired) merged.accountingBankRequired = [...DEFAULT_ACCOUNTING_BANK_REQUIRED];
      if (!merged.dealerBankRequired) merged.dealerBankRequired = [...DEFAULT_DEALER_BANK_REQUIRED];
      return merged;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => { 
    try {
      const db = getDb();
      db.data.sales = sales;
      writeDb();
    } catch (error) {
      console.error('Failed to save sales:', error);
    }
  }, [sales]);
  
  useEffect(() => { 
    try {
      const db = getDb();
      db.data.settings = settings;
      writeDb();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

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
