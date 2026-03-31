import { useState, useMemo } from 'react';
import { useSales } from '@/store/SalesContext';
import { Sale, isCashOrCopo } from '@/types/sales';
import { StatusBadge } from './StatusBadge';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import TablePagination from './TablePagination';

interface ClientInformationProps {
  onSelectSale: (sale: Sale) => void;
}

type SortDir = 'asc' | 'desc';

export default function ClientInformation({ onSelectSale }: ClientInformationProps) {
  const { sales, updateSale } = useSales();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('clientName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const statusOptions = ['pending', 'released'] as const;
  const orCrOptions = ['na', 'released'] as const;
  const arOptions = ['pending', 'paid'] as const;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s =>
      !search || [s.clientName, s.cs, s.engineNo, s.chassisNo, s.model].some(f => f.toLowerCase().includes(search.toLowerCase()))
    );
  }, [sales, search]);

  const grouped = useMemo(() => {
    const g = filteredSales.reduce<Record<string, Sale[]>>((acc, s) => {
      const key = `${s.clientName || 'Unknown'}|${s.contact || ''}|${s.address || ''}`;
      (acc[key] = acc[key] || []).push(s);
      return acc;
    }, {});
    const entries = Object.entries(g);
    entries.sort(([a], [b]) => {
      const cmp = a.localeCompare(b);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return entries;
  }, [filteredSales, sortKey, sortDir]);

  const statusClass = (status: string, type: 'default' | 'ar' | 'orCr' = 'default') => {
    if (type === 'ar') return status === 'paid' ? 'status-released' : 'status-pending';
    if (type === 'orCr') return status === 'released' ? 'status-released' : 'status-na-orcr';
    return status === 'released' ? 'status-released' : 'status-pending';
  };

  const headers = [
    { key: 'clientName', label: 'Client Name' },
    { key: 'address', label: 'Address' },
    { key: 'contact', label: 'Contact#' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'bank', label: 'Bank' },
    { key: 'bankStatus', label: 'Bank Status' },
    { key: 'ltoStatus', label: 'LTO Status' },
    { key: 'dealerStatus', label: 'Dealer Status' },
    { key: 'accountingStatus', label: 'Accounting' },
    { key: 'orCrStatus', label: 'OR/CR Status' },
    { key: 'arStatus', label: 'AR Status' },
  ];

  return (
    <section id="client-info" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Client Information</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-ring w-60"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border rounded overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              {headers.map(h => (
                <th
                  key={h.key}
                  className="px-3 py-2 font-medium whitespace-nowrap cursor-pointer select-none hover:bg-accent/50"
                  onClick={() => toggleSort(h.key)}
                >
                  <span className="flex items-center gap-1">
                    {h.label}
                    {sortKey === h.key && (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 && (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">No records</td></tr>
            )}
            {pagedGroups.map(([client, clientSales]) =>
              clientSales.map((sale, idx) => {
                const cashCopo = isCashOrCopo(sale.modeOfPayment);
                const [clientName] = client.split('|');
                return (
                  <tr
                    key={sale.id}
                    className="border-t border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => onSelectSale(sale)}
                  >
                    {idx === 0 && (
                      <>
                        <td className="px-3 py-2 font-medium align-top" rowSpan={clientSales.length}>{clientName}</td>
                        <td className="px-3 py-2 align-top" rowSpan={clientSales.length}>{sale.address}</td>
                        <td className="px-3 py-2 align-top" rowSpan={clientSales.length}>{sale.contact}</td>
                      </>
                    )}
                    <td className="px-3 py-2">{sale.color}/{sale.brand}/{sale.model}</td>
                    {/* Bank */}
                    <td className="px-3 py-2 text-xs">
                      {cashCopo ? (
                        <span className="status-na px-1.5 py-0.5 rounded">N/A</span>
                      ) : (
                        sale.bank || 'N/A'
                      )}
                    </td>
                    {/* Bank Status */}
                    <td className="px-3 py-2">
                      {cashCopo ? (
                        <span className="status-na px-1.5 py-0.5 rounded text-xs">N/A</span>
                      ) : (
                        <select
                          className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.bankStatus)}`}
                          value={sale.bankStatus}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); updateSale(sale.id, { bankStatus: e.target.value as any }); }}
                        >
                          {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.ltoStatus)}`}
                        value={sale.ltoStatus}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateSale(sale.id, { ltoStatus: e.target.value as any }); }}
                      >
                        {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.dealerStatus)}`}
                        value={sale.dealerStatus}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateSale(sale.id, { dealerStatus: e.target.value as any }); }}
                      >
                        {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.accountingStatus)}`}
                        value={sale.accountingStatus}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateSale(sale.id, { accountingStatus: e.target.value as any }); }}
                      >
                        {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.orCrStatus, 'orCr')}`}
                        value={sale.orCrStatus}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateSale(sale.id, { orCrStatus: e.target.value as any }); }}
                      >
                        {orCrOptions.map(o => <option key={o} value={o}>{o === 'na' ? 'N/A' : o === 'released' ? 'Released' : o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.arStatus, 'ar')}`}
                        value={sale.arStatus}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateSale(sale.id, { arStatus: e.target.value as any }); }}
                      >
                        {arOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
