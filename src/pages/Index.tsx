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
import { getDb, writeDb } from '@/lib/db';

export default function Index() {
  const navigate = useNavigate();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showAddSale, setShowAddSale] = useState(false);
  

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    const db = getDb();
    db.data.auth.authenticated = false;
    writeDb();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-suzuki">
      <Sidebar onNavigate={scrollTo} onSettingsClick={() => navigate('/settings')} onRouteNavigate={(r) => navigate(r)} onLogout={handleLogout} />

      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-2.5 flex items-center justify-between ml-0">
        <div className="flex items-center gap-4 ml-12">
          <h1 className="text-base font-semibold tracking-tight">Vehicle Sales Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/full-table')}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-border text-sm font-medium rounded hover:bg-accent transition-colors"
          >
            <Table2 className="w-4 h-4" />
            View Full Table
          </button>
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
        <ActivityTracking onSelectSale={setSelectedSale} />
        <UnitInformation onSelectSale={setSelectedSale} />
        <ClientInformation onSelectSale={setSelectedSale} />
        <TotalGP />
      </main>

      {/* Sale Detail Panel */}
      {selectedSale && (
        <>
          <div className="fixed inset-0 z-20 bg-foreground/50" onClick={() => setSelectedSale(null)} />
          <SaleDetailPanel sale={selectedSale} onClose={() => setSelectedSale(null)} />
        </>
      )}

      {/* Add Sale Modal */}
      {showAddSale && <AddSaleModal onClose={() => setShowAddSale(false)} />}
    </div>
  );
}
