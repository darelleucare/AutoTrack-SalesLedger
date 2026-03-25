import { useState, useMemo } from 'react';
import { Sale, DocumentChecklist, ARStatusType, formatDateBySettings, isCashOrCopo } from '@/types/sales';
import { useSales } from '@/store/SalesContext';
import { X, Save, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SaleDetailPanelProps {
  sale: Sale;
  onClose: () => void;
}

export default function SaleDetailPanel({ sale, onClose }: SaleDetailPanelProps) {
  const { updateSale, settings } = useSales();
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [docTab, setDocTab] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(sale.groupNumber);

  // Ensure groupNames exists (for backward compatibility with old data)
  const groupNames = settings.groupNames || Array.from({ length: settings.groupCount }, (_, i) => `Group ${i + 1}`);

  // Ensure grp array has correct length based on settings
  const normalizedGrp = [...sale.grp];
  while (normalizedGrp.length < settings.groupCount) {
    normalizedGrp.push(0);
  }

  const [localSale, setLocalSale] = useState<Sale>({
    ...sale,
    grp: normalizedGrp,
    documents: {
      bank: { ...sale.documents.bank },
      accounting: { ...sale.documents.accounting },
      dealer: { ...sale.documents.dealer },
      lto: { ...sale.documents.lto },
    },
  });

  const cashCopo = isCashOrCopo(localSale.modeOfPayment);

  // Build doc pages dynamically — skip bank for cash/copo
  const docPages = useMemo(() => {
    const pages: { title: string; key: keyof DocumentChecklist }[] = [];
    if (!cashCopo) {
      pages.push({ title: 'Bank', key: 'bank' });
    }
    pages.push({ title: 'Accounting', key: 'accounting' });
    pages.push({ title: 'Dealer', key: 'dealer' });
    pages.push({ title: 'LTO', key: 'lto' });
    return pages;
  }, [cashCopo]);

  const totalProfit = localSale.grp.reduce((a, b) => a + b, 0);

  const startEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(value);
  };

  const commitEdit = (field: string) => {
    if (field.startsWith('grp_')) {
      const idx = parseInt(field.split('_')[1]);
      const newGrp = [...localSale.grp];
      newGrp[idx] = Number(editValue) || 0;
      setLocalSale(prev => ({ ...prev, grp: newGrp }));
    } else if (field === 'groupNumber') {
      const newGroupNumber = Number(editValue) || 1;
      setLocalSale(prev => ({ ...prev, groupNumber: newGroupNumber }));
      setSelectedGroup(newGroupNumber);
    } else {
      const numFields = ['cost', 'rate'];
      const val = numFields.includes(field) ? Number(editValue) || 0 : editValue;
      setLocalSale(prev => ({ ...prev, [field]: val }));
    }
    setEditField(null);
  };

  const handleSave = () => {
    updateSale(sale.id, localSale);
    onClose();
  };

  const toggleDoc = (key: keyof DocumentChecklist, doc: string) => {
    setLocalSale(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [key]: { ...prev.documents[key], [doc]: !prev.documents[key][doc] },
      },
    }));
  };

  const currentPage = docPages[docTab];
  const currentDocs = currentPage ? Object.keys(localSale.documents[currentPage.key]) : [];

  const EditableField = ({ label, field, value }: { label: string; field: string; value: string }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {editField === field ? (
        <input
          autoFocus
          className="text-sm border border-ring rounded px-2 py-0.5 bg-background w-40 text-right"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => commitEdit(field)}
          onKeyDown={e => e.key === 'Enter' && commitEdit(field)}
        />
      ) : (
        <span
          className="text-sm cursor-pointer hover:text-primary"
          onClick={() => startEdit(field, value)}
        >
          {value || '—'}
        </span>
      )}
    </div>
  );

  return (
    <div className="fixed top-0 right-0 w-full md:w-[45%] h-full bg-card border-l border-border z-30 animate-slide-in-right overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header with Save */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Sale Details — {localSale.cs}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Vehicle Info */}
          <div className="border border-border rounded p-3 space-y-1">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Vehicle Info</h4>
            <EditableField label="CS#" field="cs" value={localSale.cs} />
            <EditableField label="Engine#" field="engineNo" value={localSale.engineNo} />
            <EditableField label="Chassis#" field="chassisNo" value={localSale.chassisNo} />
            <EditableField label="Color" field="color" value={localSale.color} />
            <EditableField label="Brand" field="brand" value={localSale.brand} />
            <EditableField label="Model" field="model" value={localSale.model} />
            <EditableField label="Unit Cost" field="cost" value={`₱${localSale.cost.toLocaleString()}`} />
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-muted-foreground">Bank</span>
              <span className={`text-sm ${cashCopo ? 'status-na px-1.5 py-0.5 rounded' : ''}`}>
                {cashCopo ? 'N/A' : (localSale.bank || 'N/A')}
              </span>
            </div>
            <EditableField label="Rate (%)" field="rate" value={`${localSale.rate}%`} />
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-muted-foreground">OR/CR</span>
              <select
                value={localSale.orCrStatus}
                onChange={(e) => {
                  const value = e.target.value as any;
                  setLocalSale(prev => ({ ...prev, orCr: value, orCrStatus: value }));
                }}
                className="text-sm border border-border rounded px-2 py-0.5 bg-background w-40"
              >
                <option value="na">N/A</option>
                <option value="released">Released</option>
              </select>
            </div>
            <EditableField label="Branch" field="branch" value={localSale.branch} />
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-muted-foreground">Date Release</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm hover:text-primary">
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatDateBySettings(localSale.dateRelease, settings)}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={localSale.dateRelease ? new Date(localSale.dateRelease) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setLocalSale(prev => ({ ...prev, dateRelease: format(date, 'yyyy-MM-dd') }));
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Client Info + Group Profit */}
          <div className="space-y-4">
            <div className="border border-border rounded p-3 space-y-1">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Client Info</h4>
              <EditableField label="Name" field="clientName" value={localSale.clientName} />
              <EditableField label="Contact" field="contact" value={localSale.contact} />
              <EditableField label="Address" field="address" value={localSale.address} />
              <EditableField label="Group Number" field="groupNumber" value={`${localSale.groupNumber}`} />
            </div>

            <div className="border border-border rounded p-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Group Profit</h4>
              <div className="flex justify-between items-center py-1">
                <label className="text-xs text-muted-foreground">Group Number</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    const newGroupNumber = Number(e.target.value);
                    setSelectedGroup(newGroupNumber);
                    setLocalSale(prev => ({ ...prev, groupNumber: newGroupNumber }));
                  }}
                  className="text-sm border border-border rounded px-2 py-0.5 bg-background w-40"
                >
                  {Array.from({ length: settings.groupCount }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{groupNames[i] || `Group ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <EditableField 
                label={`GP Amount (${groupNames[selectedGroup - 1] || `Group ${selectedGroup}`})`} 
                field={`grp_${selectedGroup - 1}`} 
                value={`₱${(localSale.grp[selectedGroup - 1] || 0).toLocaleString()}`} 
              />
              <div className="flex justify-between items-center py-1 border-t border-border mt-2 pt-2">
                <span className="text-xs font-semibold">Total Profit</span>
                <span className="text-sm font-bold text-primary">₱{totalProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Status */}
        <div className="border border-border rounded p-3 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Document Status</h4>

          <div className="flex items-center gap-1">
            {docPages.map((p, i) => (
              <button
                key={p.key}
                onClick={() => setDocTab(i)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  i === docTab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Check All */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!currentPage) return;
                const key = currentPage.key;
                const allChecked = currentDocs.every(d => localSale.documents[key][d]);
                setLocalSale(prev => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    [key]: Object.fromEntries(currentDocs.map(d => [d, !allChecked])),
                  },
                }));
              }}
              className="px-2 py-0.5 text-xs border border-border rounded hover:bg-accent transition-colors"
            >
              {currentDocs.every(d => localSale.documents[currentPage?.key || 'bank'][d]) ? 'Uncheck All' : 'Check All'}
            </button>
          </div>

          {/* Checklist table */}
          {currentPage && (
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left font-semibold" colSpan={2}>
                      {currentPage.title.toUpperCase()}
                    </th>
                  </tr>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Document</th>
                    <th className="px-3 py-1.5 text-center text-xs font-medium text-muted-foreground w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDocs.map((doc, idx) => {
                    const isChecked = localSale.documents[currentPage.key][doc] || false;
                    return (
                      <tr
                        key={doc}
                        className={`border-t border-border cursor-pointer transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-accent/50'} ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                        onClick={() => toggleDoc(currentPage.key, doc)}
                      >
                        <td className="px-3 py-2">{doc}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDoc(currentPage.key, doc)}
                            onClick={e => e.stopPropagation()}
                            className="rounded border-border w-4 h-4 accent-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {currentDocs.length === 0 && (
                    <tr><td colSpan={2} className="px-3 py-4 text-center text-muted-foreground text-xs">No documents</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* AR Status on last tab */}
          {docTab === docPages.length - 1 && (
            <div className="pt-2 border-t border-border">
              <label className="text-sm font-medium">AR Status</label>
              <select
                className="ml-2 text-sm border border-border rounded px-2 py-1 bg-card"
                value={localSale.arStatus}
                onChange={e => setLocalSale(prev => ({ ...prev, arStatus: e.target.value as ARStatusType }))}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
