import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSales } from '@/store/SalesContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Sidebar from '@/components/Sidebar';

export default function Reports() {
  const navigate = useNavigate();
  const { sales } = useSales();

  const profitByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      if (!s.dateRelease) return;
      const d = new Date(s.dateRelease);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + s.grp.reduce((a, b) => a + b, 0);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, profit]) => ({ month, profit }));
  }, [sales]);

  const unitsByModel = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => { map[s.model] = (map[s.model] || 0) + 1; });
    return Object.entries(map).map(([model, count]) => ({ model, count }));
  }, [sales]);

  const profitByModel = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => { map[s.model] = (map[s.model] || 0) + s.grp.reduce((a, b) => a + b, 0); });
    return Object.entries(map).map(([model, profit]) => ({ model, profit }));
  }, [sales]);

  const pendingAR = useMemo(() => {
    return sales.filter(s => s.arStatus === 'pending').reduce((sum, s) => sum + s.grp.reduce((a, b) => a + b, 0), 0);
  }, [sales]);

  const scrollTo = (id: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="min-h-screen bg-web-bg">
      <Sidebar onNavigate={scrollTo} onSettingsClick={() => navigate('/settings')} onRouteNavigate={(r) => navigate(r)} />

      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-2.5 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="ml-12 p-1.5 hover:bg-accent rounded">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold tracking-tight">Reports</h1>
      </header>

      <main className="p-4 space-y-8 max-w-[1200px] mx-auto">
        {/* Pending AR Card */}
        <div className="pastel-card-amber rounded-lg p-4">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Pending AR Total</p>
          <p className="text-2xl font-bold">₱{pendingAR.toLocaleString()}</p>
        </div>

        {/* Profit by Month */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-4">Total Profit by Month</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Units by Model */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-4">Total Units Sold by Model</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitsByModel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="model" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit by Model */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-4">Total Profit by Model</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitByModel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="model" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
                  <Bar dataKey="profit" fill="hsl(142 64% 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
