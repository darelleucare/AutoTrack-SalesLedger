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

function getStatusColor(status: string): string {
  if (status === 'Complete') return '90EE90';
  if (status === 'Processing') return 'FFFF00';
  if (status === 'N/A') return 'D3D3D3';
  if (status?.includes('missing')) return 'FF6B6B';
  if (status === 'Pending') return 'FF6B6B';
  if (status === 'Paid') return '90EE90';
  return 'FFFFFF';
}

export default function FullTable() {
  const navigate = useNavigate();
  const { sales, settings } = useSales();

  const sorted = useMemo(() =>
    [...sales].sort((a, b) => (b.dateRelease || '').localeCompare(a.dateRelease || '')),
    [sales]
  );
  

  const exportToExcel = () => {
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
        'OR/CR': s.orCr,
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
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Style header row (yellow background, bold text)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cell]) {
        ws[cell].s = {
          fill: { fgColor: { rgb: 'FFFF00' } },
          font: { bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }

    // Calculate column positions for status columns
    const baseColumns = 14;
    const accCol = baseColumns + settings.groupCount;
    const dlrCol = accCol + 1;
    const ltoCol = dlrCol + 1;
    const arCol = ltoCol + 1;

    // Apply status styling to data rows
    for (let row = 1; row <= data.length; row++) {
      const statusCols = [accCol, dlrCol, ltoCol, arCol];
      for (const col of statusCols) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cell]) {
          const bgColor = getStatusColor(ws[cell].v);
          ws[cell].s = {
            fill: { fgColor: { rgb: bgColor } },
            font: { bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String((r as any)[key] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;
    XLSX.writeFile(wb, 'VehicleSales_FullTable.xlsx');
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
    <div className="min-h-screen bg-background">
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
                  <td className="px-2 py-1.5">{s.orCr}</td>
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
