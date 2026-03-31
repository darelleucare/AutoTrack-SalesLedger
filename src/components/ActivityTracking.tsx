import { useState, useMemo } from 'react';
import { useSales } from '@/store/SalesContext';
import { Sale, StatusType, ARStatusType, isCashOrCopo } from '@/types/sales';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePagination } from '@/hooks/usePagination';
import TablePagination from './TablePagination';

interface ActivityTrackingProps {
  onSelectSale: (sale: Sale) => void;
}

type SortDir = 'asc' | 'desc';

function getMissing(docs: Record<string, boolean>): string[] {
  return Object.entries(docs).filter(([, v]) => !v).map(([k]) => k);
}

function MissingLabel({ missing, status, isNA }: { missing: string[]; status: string; isNA?: boolean }) {
  if (isNA) {
    return <span className="status-na px-1.5 py-0.5 rounded text-xs">N/A</span>;
  }
  if (status === 'released') {
    return <span className="status-released px-1.5 py-0.5 rounded">Complete</span>;
  }
  if (missing.length === 0) {
    return <span className="px-1.5 py-0.5 rounded font-medium" style={{ color: 'hsl(45, 90%, 50%)' }}>Processing</span>;
  }
  return <span className="status-pending px-1.5 py-0.5 rounded">{missing.length} missing</span>;
}

export default function ActivityTracking({ onSelectSale }: ActivityTrackingProps) {
  const { sales, updateSale } = useSales();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('cs');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const statusOptions = ['pending', 'released'] as const;
  const arOptions = ['pending', 'paid'] as const;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = sales.filter(s =>
      !search || [s.cs, s.clientName, s.engineNo, s.chassisNo, s.model].some(f => f.toLowerCase().includes(search.toLowerCase()))
    );
    result = [...result].sort((a, b) => {
      const aVal = String((a as any)[sortKey] ?? '').toLowerCase();
      const bVal = String((b as any)[sortKey] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [sales, search, sortKey, sortDir]);

  const { paged, page, setPage, totalPages, totalItems, pageSize } = usePagination(filtered);

  const statusClass = (status: string, type: 'default' | 'ar' | 'orCr' = 'default') => {
    if (type === 'ar') return status === 'paid' ? 'status-released' : 'status-pending';
    if (type === 'orCr') return status === 'released' ? 'status-released' : 'status-na-orcr';
    return status === 'released' ? 'status-released' : 'status-pending';
  };

  const sortableHeaders = [
    { key: 'cs', label: 'CS#' },
    { key: 'clientName', label: 'Client' },
    { key: 'model', label: 'Model' },
  ];

  return (
    <section id="activity" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Activity Tracking</h2>
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
              {sortableHeaders.map(h => (
                <th
                  key={h.key}
                  className="px-3 py-2 font-medium cursor-pointer select-none hover:bg-accent/50"
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
              <th className="px-3 py-2 font-medium" colSpan={2}>Bank</th>
              <th className="px-3 py-2 font-medium" colSpan={2}>Accounting</th>
              <th className="px-3 py-2 font-medium" colSpan={2}>Dealer</th>
              <th className="px-3 py-2 font-medium" colSpan={2}>LTO</th>
              <th className="px-3 py-2 font-medium">OR/CR</th>
              <th className="px-3 py-2 font-medium">AR</th>
            </tr>
            <tr className="bg-muted/50 text-left text-xs">
              <th className="px-3 py-1"></th>
              <th className="px-3 py-1"></th>
              <th className="px-3 py-1"></th>
              <th className="px-3 py-1">Status</th>
              <th className="px-3 py-1">Missing/Complete</th>
              <th className="px-3 py-1">Status</th>
              <th className="px-3 py-1">Missing/Complete</th>
              <th className="px-3 py-1">Status</th>
              <th className="px-3 py-1">Missing/Complete</th>
              <th className="px-3 py-1">Status</th>
              <th className="px-3 py-1">Missing/Complete</th>
              <th className="px-3 py-1">Status</th>
              <th className="px-3 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={13} className="px-3 py-8 text-center text-muted-foreground">No records</td></tr>
            )}
            {paged.map(sale => {
              const cashCopo = isCashOrCopo(sale.modeOfPayment);
              const bankMissing = getMissing(sale.documents.bank);
              const accMissing = getMissing(sale.documents.accounting);
              const dealerMissing = getMissing(sale.documents.dealer);
              const ltoMissing = getMissing(sale.documents.lto);

              return (
                <tr
                  key={sale.id}
                  className="border-t border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onSelectSale(sale)}
                >
                  <td className="px-3 py-2 font-medium text-primary">{sale.cs}</td>
                  <td className="px-3 py-2">{sale.clientName}</td>
                  <td className="px-3 py-2">{sale.model}</td>
                  {/* Bank Status */}
                  <td className="px-3 py-2">
                    {cashCopo ? (
                      <span className="status-na px-1.5 py-0.5 rounded text-xs">N/A</span>
                    ) : (
                      <select
                        className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.bankStatus)}`}
                        value={sale.bankStatus}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateSale(sale.id, { bankStatus: e.target.value as StatusType }); }}
                      >
                        {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help inline-block">
                          <MissingLabel missing={bankMissing} status={sale.bankStatus} isNA={cashCopo} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          {cashCopo ? (
                            <p className="text-xs">Not applicable for cash/COPO sales</p>
                          ) : bankMissing.length > 0 ? (
                            <>
                              <p className="font-semibold text-xs">Missing Bank Documents:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {bankMissing.map(doc => <li key={doc} className="text-xs">{doc}</li>)}
                              </ul>
                            </>
                          ) : (
                            <p className="text-xs">All documents complete</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {/* Accounting */}
                  <td className="px-3 py-2">
                    <select
                      className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.accountingStatus)}`}
                      value={sale.accountingStatus}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateSale(sale.id, { accountingStatus: e.target.value as StatusType }); }}
                    >
                      {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help inline-block">
                          <MissingLabel missing={accMissing} status={sale.accountingStatus} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          {accMissing.length > 0 ? (
                            <>
                              <p className="font-semibold text-xs">Missing Accounting Documents:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {accMissing.map(doc => <li key={doc} className="text-xs">{doc}</li>)}
                              </ul>
                            </>
                          ) : (
                            <p className="text-xs">All documents complete</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {/* Dealer */}
                  <td className="px-3 py-2">
                    <select
                      className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.dealerStatus)}`}
                      value={sale.dealerStatus}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateSale(sale.id, { dealerStatus: e.target.value as StatusType }); }}
                    >
                      {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help inline-block">
                          <MissingLabel missing={dealerMissing} status={sale.dealerStatus} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          {dealerMissing.length > 0 ? (
                            <>
                              <p className="font-semibold text-xs">Missing Dealer Documents:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {dealerMissing.map(doc => <li key={doc} className="text-xs">{doc}</li>)}
                              </ul>
                            </>
                          ) : (
                            <p className="text-xs">All documents complete</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {/* LTO */}
                  <td className="px-3 py-2">
                    <select
                      className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.ltoStatus)}`}
                      value={sale.ltoStatus}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateSale(sale.id, { ltoStatus: e.target.value as StatusType }); }}
                    >
                      {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help inline-block">
                          <MissingLabel missing={ltoMissing} status={sale.ltoStatus} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          {ltoMissing.length > 0 ? (
                            <>
                              <p className="font-semibold text-xs">Missing LTO Documents:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {ltoMissing.map(doc => <li key={doc} className="text-xs">{doc}</li>)}
                              </ul>
                            </>
                          ) : (
                            <p className="text-xs">All documents complete</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {/* AR */}
                  <td className="px-3 py-2">
                    <select
                      className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.orCrStatus, 'orCr')}`}
                      value={sale.orCrStatus}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateSale(sale.id, { orCrStatus: e.target.value as any }); }}
                    >
                      <option value="na">N/A</option>
                      <option value="released">Released</option>
                    </select>
                  </td>
                  {/* AR Status */}
                  <td className="px-3 py-2">
                    <select
                      className={`text-xs border border-border rounded px-1 py-0.5 ${statusClass(sale.arStatus, 'ar')}`}
                      value={sale.arStatus}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateSale(sale.id, { arStatus: e.target.value as ARStatusType }); }}
                    >
                      {arOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
    </section>
  );
}
