import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Table2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import UnitInformation from '@/components/UnitInformation';
import ClientInformation from '@/components/ClientInformation';
import ActivityTracking from '@/components/ActivityTracking';
import TotalGP from '@/components/TotalGP';
import SaleDetailPanel from '@/components/SaleDetailPanel';
import AddSaleModal from '@/components/AddSaleModal';
import { Sale } from '@/types/sales';

export default function Index() {
  const navigate = useNavigate();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showAddSale, setShowAddSale] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onNavigate={scrollTo} onSettingsClick={() => navigate('/settings')} />

      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-2.5 flex items-center justify-between ml-0">
        <div className="flex items-center gap-4 ml-12">
          <h1 className="text-base font-semibold tracking-tight">Vehicle Sales Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring w-64"
              placeholder="Global search..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddSale(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add New Sale
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 space-y-8 max-w-[1600px] mx-auto">
        <Dashboard onSelectSale={setSelectedSale} />
        <UnitInformation onSelectSale={setSelectedSale} />
        <ClientInformation onSelectSale={setSelectedSale} />
        <ActivityTracking onSelectSale={setSelectedSale} />
        <TotalGP />
      </main>

      {/* Sale Detail Panel */}
      {selectedSale && (
        <>
          <div className="fixed inset-0 z-20 bg-foreground/10" onClick={() => setSelectedSale(null)} />
          <SaleDetailPanel sale={selectedSale} onClose={() => setSelectedSale(null)} />
        </>
      )}

      {/* Add Sale Modal */}
      {showAddSale && <AddSaleModal onClose={() => setShowAddSale(false)} />}
    </div>
  );
}
