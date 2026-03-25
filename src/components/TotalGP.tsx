import { useState, useMemo } from 'react';
import { useSales } from '@/store/SalesContext';
import SummaryCard from './SummaryCard';
import { Sale } from '@/types/sales';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

type SortDir = 'asc' | 'desc';

export default function TotalGP() {
  const { sales, settings } = useSales();
  const [bdSearch, setBdSearch] = useState('');
  const [bdSortKey, setBdSortKey] = useState<string>('cs');
  const [bdSortDir, setBdSortDir] = useState<SortDir>('asc');

  const totalGP = sales.reduce((sum, s) => sum + s.grp.reduce((a, b) => a + b, 0), 0);
  const avgGP = sales.length ? Math.round(totalGP / sales.length) : 0;

  const modeGP = (mode: string) => sales.filter(s => s.modeOfPayment === mode).reduce((sum, s) => sum + s.grp.reduce((a, b) => a + b, 0), 0);
  const modeCount = (mode: string) => sales.filter(s => s.modeOfPayment === mode).length;

  // Group by groupNumber
  const groups: Record<number, Sale[]> = {};
  sales.forEach(s => {
    (groups[s.groupNumber] = groups[s.groupNumber] || []).push(s);
  });

  // GP Breakdowns table
  const toggleBdSort = (key: string) => {
    if (bdSortKey === key) setBdSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setBdSortKey(key); setBdSortDir('asc'); }
  };

  const breakdowns = useMemo(() => {
    let rows = sales.map(s => ({
      cs: s.cs,
      groupNumber: s.groupNumber,
      gp: s.grp.reduce((a, b) => a + b, 0),
      mode: s.modeOfPayment,
    }));
    if (bdSearch) {
      const q = bdSearch.toLowerCase();
      rows = rows.filter(r => r.cs.toLowerCase().includes(q) || String(r.groupNumber).includes(q));
    }
    rows.sort((a, b) => {
      const aVal = String((a as any)[bdSortKey] ?? '').toLowerCase();
      const bVal = String((b as any)[bdSortKey] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return bdSortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [sales, bdSearch, bdSortKey, bdSortDir]);

  const modeLabel: Record<string, string> = { cash: 'Cash', fin: 'FIN', copo: 'COPO', bank_po: 'BANK PO' };
  const bdHeaders = [
    { key: 'cs', label: 'CS#' },
    { key: 'groupNumber', label: 'Group#' },
    { key: 'gp', label: 'GP' },
    { key: 'mode', label: 'Mode' },
  ];

  return (
    <section id="total-gp" className="space-y-4">
      <h2 className="text-xl font-bold">Total Gross Profit</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard title="Total GP" value={`₱${totalGP.toLocaleString()}`} subtitle={`Avg: ₱${avgGP.toLocaleString()}`} colorClass="pastel-card-blue" />
        <SummaryCard title="Cash" value={`₱${modeGP('cash').toLocaleString()}`} subtitle={`${modeCount('cash')} units`} colorClass="pastel-card-green" />
        <SummaryCard title="FIN" value={`₱${modeGP('fin').toLocaleString()}`} subtitle={`${modeCount('fin')} units`} colorClass="pastel-card-amber" />
        <SummaryCard title="COPO" value={`₱${modeGP('copo').toLocaleString()}`} subtitle={`${modeCount('copo')} units`} colorClass="pastel-card-purple" />
        <SummaryCard title="BANK PO" value={`₱${modeGP('bank_po').toLocaleString()}`} subtitle={`${modeCount('bank_po')} units`} colorClass="pastel-card-teal" />
      </div>

      {/* Group Summary Table */}
      <div className="border border-border rounded overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-3 py-2 font-medium">Group#</th>
              <th className="px-3 py-2 font-medium">Total Released</th>
              <th className="px-3 py-2 font-medium">Total GP</th>
              <th className="px-3 py-2 font-medium">Average</th>
              <th className="px-3 py-2 font-medium">Cash</th>
              <th className="px-3 py-2 font-medium">FIN</th>
              <th className="px-3 py-2 font-medium">COPO</th>
              <th className="px-3 py-2 font-medium">BANK PO</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groups).length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No records</td></tr>
            )}
            {Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b)).map(([grpNum, grpSales]) => {
              const gp = grpSales.reduce((sum, s) => sum + s.grp.reduce((a, b) => a + b, 0), 0);
              const released = grpSales.filter(s => s.bankStatus === 'released' && s.accountingStatus === 'released').length;
              return (
                <tr key={grpNum} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">Group {grpNum}</td>
                  <td className="px-3 py-2">{released}</td>
                  <td className="px-3 py-2">₱{gp.toLocaleString()}</td>
                  <td className="px-3 py-2">₱{grpSales.length ? Math.round(gp / grpSales.length).toLocaleString() : 0}</td>
                  <td className="px-3 py-2">{grpSales.filter(s => s.modeOfPayment === 'cash').length}</td>
                  <td className="px-3 py-2">{grpSales.filter(s => s.modeOfPayment === 'fin').length}</td>
                  <td className="px-3 py-2">{grpSales.filter(s => s.modeOfPayment === 'copo').length}</td>
                  <td className="px-3 py-2">{grpSales.filter(s => s.modeOfPayment === 'bank_po').length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GP Breakdowns Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gross Profit (GP) Breakdowns</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-ring w-60"
              placeholder="Filter by CS# or Group..."
              value={bdSearch}
              onChange={e => setBdSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="border border-border rounded overflow-x-auto bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                {bdHeaders.map(h => (
                  <th
                    key={h.key}
                    className="px-3 py-2 font-medium cursor-pointer select-none hover:bg-accent/50"
                    onClick={() => toggleBdSort(h.key)}
                  >
                    <span className="flex items-center gap-1">
                      {h.label}
                      {bdSortKey === h.key && (
                        bdSortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdowns.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No records</td></tr>
              )}
              {breakdowns.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{r.cs}</td>
                  <td className="px-3 py-2">Group {r.groupNumber}</td>
                  <td className="px-3 py-2">₱{r.gp.toLocaleString()}</td>
                  <td className="px-3 py-2">{modeLabel[r.mode] || r.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
