import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useSales } from '@/store/SalesContext';
import { formatDateBySettings, isCashOrCopo } from '@/types/sales';
import Sidebar from '@/components/Sidebar';
import * as XLSX from 'xlsx';

function docStatus(docs: Record<string, boolean>): string {
  const keys = Object.keys(docs);
  if (keys.length === 0) return 'N/A';
  const checked = keys.filter(k => docs[k]).length;
  if (checked === keys.length) return 'Complete';
  if (checked === 0) return 'Processing';
  return `${keys.length - checked} missing`;
}

export default function FullTable() {
  const navigate = useNavigate();
  const { sales, settings } = useSales();

  const sorted = useMemo(() =>
    [...sales].sort((a, b) => (b.dateRelease || '').localeCompare(a.dateRelease || '')),
    [sales]
  );
  

  const exportToExcel = () => {
    try {
      const data = sorted.map(s => {
        const cashCopo = isCashOrCopo(s.modeOfPayment);
        return {
          'CS#': s.cs,
          'Engine#': s.engineNo,
          'Chassis#': s.chassisNo,
          'Brand': s.brand,
          'Model': s.model,
          'Branch': s.branch,
          'Unit Cost': s.cost,
          'OR/CR': s.orCrStatus === 'na' ? 'N/A' : 'Released',
          'Date Release': formatDateBySettings(s.dateRelease, settings),
          'Client Name': s.clientName,
          'Contact': s.contact,
          'Address': s.address,
          'Mode': s.modeOfPayment.toUpperCase(),
          'Bank': cashCopo ? 'N/A' : (s.bank || 'N/A'),
          ...Object.fromEntries(s.grp.map((g, i) => [`Grp${i + 1}`, g])),
          'Gross': s.grp.reduce((a, b) => a + b, 0),
          'Accounting': docStatus(s.documents.accounting),
          'Dealer': docStatus(s.documents.dealer),
          'LTO': docStatus(s.documents.lto),
          'AR': s.arStatus === 'paid' ? 'Paid' : 'Pending',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales');

      // Auto-calculate column widths
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(r => String((r as any)[key] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'VehicleSales_FullTable.xlsx');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    }
  };

  const scrollTo = (id: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const statusColor = (status: string) => {
    if (status === 'Complete') return 'text-green-600';
    if (status === 'Processing') return 'text-yellow-500';
    if (status === 'N/A') return 'text-muted-foreground';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-suzuki">
      <Sidebar onNavigate={scrollTo} onSettingsClick={() => navigate('/settings')} onRouteNavigate={(r) => navigate(r)} />

      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4 ml-12">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-accent rounded">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight">Full Sales Table</h1>
          <span className="text-xs text-muted-foreground">({sorted.length} records)</span>
        </div>
        <button
          onClick={exportToExcel}
          disabled={sorted.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </header>

      <main className="p-4 max-w-full overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              {['CS#','Engine#','Chassis#','Brand','Model','Branch','Unit Cost','OR/CR','Date Release','Client Name','Contact','Address','Mode','Bank',
                ...Array.from({ length: settings.groupCount }, (_, i) => `Grp${i + 1}`),
                'Gross','Accounting','Dealer','LTO','AR'
              ].map(h => (
                <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const gross = s.grp.reduce((a, b) => a + b, 0);
              const cashCopo = isCashOrCopo(s.modeOfPayment);
              const accStatus = docStatus(s.documents.accounting);
              const dlrStatus = docStatus(s.documents.dealer);
              const ltoStat = docStatus(s.documents.lto);
              return (
                <tr key={s.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">{s.cs}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{s.engineNo}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{s.chassisNo}</td>
                  <td className="px-2 py-1.5">{s.brand}</td>
                  <td className="px-2 py-1.5">{s.model}</td>
                  <td className="px-2 py-1.5">{s.branch}</td>
                  <td className="px-2 py-1.5 text-right">₱{s.cost.toLocaleString()}</td>
                  <td className="px-2 py-1.5">
                    {s.orCrStatus === 'na' ? (
                      <span className="status-na px-1.5 py-0.5 rounded text-xs">N/A</span>
                    ) : (
                      <span className="status-released px-1.5 py-0.5 rounded text-xs">Released</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatDateBySettings(s.dateRelease, settings)}</td>
                  <td className="px-2 py-1.5">{s.clientName}</td>
                  <td className="px-2 py-1.5">{s.contact}</td>
                  <td className="px-2 py-1.5">{s.address}</td>
                  <td className="px-2 py-1.5 uppercase">{s.modeOfPayment}</td>
                  <td className={`px-2 py-1.5 ${cashCopo ? 'text-muted-foreground' : ''}`}>{cashCopo ? 'N/A' : (s.bank || 'N/A')}</td>
                  {s.grp.map((g, i) => (
                    <td key={i} className="px-2 py-1.5 text-right">₱{g.toLocaleString()}</td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-medium">₱{gross.toLocaleString()}</td>
                  <td className="px-2 py-1.5">
                    <span className={statusColor(accStatus)}>{accStatus}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={statusColor(dlrStatus)}>{dlrStatus}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={statusColor(ltoStat)}>{ltoStat}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.arStatus === 'paid' ? 'status-released' : 'status-pending'}`}>
                      {s.arStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={99} className="px-4 py-8 text-center text-muted-foreground">No sales records found.</td></tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}
