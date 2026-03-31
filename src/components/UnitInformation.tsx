import { useState, useMemo } from 'react';
import { useSales } from '@/store/SalesContext';
import { Sale, formatDateBySettings } from '@/types/sales';
import { Search, ArrowUp, ArrowDown, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePagination } from '@/hooks/usePagination';
import TablePagination from './TablePagination';

interface UnitInformationProps {
  onSelectSale: (sale: Sale) => void;
}

type SortDir = 'asc' | 'desc';

const fields: { key: keyof Sale; label: string }[] = [
  { key: 'cs', label: 'CS#' },
  { key: 'clientName', label: 'Client Name' },
  { key: 'engineNo', label: 'Engine#' },
  { key: 'chassisNo', label: 'Chassis#' },
  { key: 'color', label: 'Color' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'rate', label: 'Rate (%)' },
  { key: 'cost', label: 'Cost' },
  { key: 'dateRelease', label: 'Date Release' },
];

export default function UnitInformation({ onSelectSale }: UnitInformationProps) {
  const { sales, updateSale, settings } = useSales();
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortKey, setSortKey] = useState<keyof Sale>('dateRelease');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null);

  const toggleSort = (key: keyof Sale) => {
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
      const aVal = String(a[sortKey] ?? '').toLowerCase();
      const bVal = String(b[sortKey] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [sales, search, sortKey, sortDir]);

  const startEdit = (id: string, field: string, value: string) => {
    if (field === 'dateRelease') {
      setDatePickerOpen(id);
      return;
    }
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (editingCell) {
      const val = ['rate', 'cost'].includes(editingCell.field) ? Number(editValue) || 0 : editValue;
      updateSale(editingCell.id, { [editingCell.field]: val } as Partial<Sale>);
      setEditingCell(null);
    }
  };

  return (
    <section id="unit-info" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Unit Information</h2>
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
              {fields.map(f => (
                <th
                  key={f.key}
                  className="px-3 py-2 font-medium whitespace-nowrap cursor-pointer select-none hover:bg-accent/50"
                  onClick={() => toggleSort(f.key)}
                >
                  <span className="flex items-center gap-1">
                    {f.label}
                    {sortKey === f.key && (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={fields.length} className="px-3 py-8 text-center text-muted-foreground">No records</td></tr>
            )}
            {filtered.map(sale => (
              <tr key={sale.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                {fields.map(f => {
                  const isEditing = editingCell?.id === sale.id && editingCell?.field === f.key;
                  const rawValue = sale[f.key];
                  const value = String(rawValue ?? '');

                  if (f.key === 'dateRelease') {
                    const displayDate = formatDateBySettings(value, settings);
                    return (
                      <td key={f.key} className="px-3 py-1.5 whitespace-nowrap">
                        <Popover open={datePickerOpen === sale.id} onOpenChange={(open) => setDatePickerOpen(open ? sale.id : null)}>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 text-sm hover:text-primary" onClick={(e) => e.stopPropagation()}>
                              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              {displayDate || '—'}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={value ? new Date(value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateSale(sale.id, { dateRelease: format(date, 'yyyy-MM-dd') });
                                }
                                setDatePickerOpen(null);
                              }}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={f.key}
                      className="px-3 py-1.5 cursor-pointer whitespace-nowrap"
                      onClick={() => f.key === 'cs' ? onSelectSale(sale) : startEdit(sale.id, f.key, value)}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          className="table-cell-edit w-full bg-background border border-ring rounded"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === 'Enter' && commitEdit()}
                        />
                      ) : (
                        <span className={f.key === 'cs' ? 'text-primary font-medium cursor-pointer hover:underline' : ''}>
                          {f.key === 'rate' ? `${Number(value)}%` : f.key === 'cost' ? `₱${Number(value).toLocaleString()}` : value}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
