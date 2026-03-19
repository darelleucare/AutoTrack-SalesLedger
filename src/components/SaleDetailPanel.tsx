import { useState } from 'react';
import { Sale, BANK_DOCS, ACCOUNTING_DOCS, DEALER_DOCS, LTO_DOCS, DocumentChecklist, ARStatusType, formatDateBySettings } from '@/types/sales';
import { useSales } from '@/store/SalesContext';
import { X, Save, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PAGES = [
  { title: 'Bank', docs: BANK_DOCS, key: 'bank' as const },
  { title: 'Accounting', docs: ACCOUNTING_DOCS, key: 'accounting' as const },
  { title: 'Dealer', docs: DEALER_DOCS, key: 'dealer' as const },
  { title: 'LTO', docs: LTO_DOCS, key: 'lto' as const },
];

interface SaleDetailPanelProps {
  sale: Sale;
  onClose: () => void;
}

export default function SaleDetailPanel({ sale, onClose }: SaleDetailPanelProps) {
  const { updateSale, settings } = useSales();
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [docTab, setDocTab] = useState(0);

  // Local state for batched saving
  const [localSale, setLocalSale] = useState<Sale>({ ...sale, grp: [...sale.grp], documents: { bank: { ...sale.documents.bank }, accounting: { ...sale.documents.accounting }, dealer: { ...sale.documents.dealer }, lto: { ...sale.documents.lto } } });

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

  const currentPage = PAGES[docTab];

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
            <EditableField label="Brand" field="brand" value={localSale.brand} />
            <EditableField label="Model" field="model" value={localSale.model} />
            <EditableField label="Unit Cost" field="cost" value={`₱${localSale.cost.toLocaleString()}`} />
            <EditableField label="Bank" field="bank" value={localSale.bank || 'N/A'} />
            <EditableField label="Rate (%)" field="rate" value={`${localSale.rate}%`} />
            <EditableField label="OR/CR" field="orCr" value={localSale.orCr} />
            <EditableField label="Branch" field="branch" value={localSale.branch} />
            {/* Date Release with calendar */}
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
            </div>

            <div className="border border-border rounded p-3 space-y-1">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Group Profit</h4>
              {localSale.grp.map((g, i) => (
                <EditableField key={i} label={`GRP${i + 1}`} field={`grp_${i}`} value={`₱${g.toLocaleString()}`} />
              ))}
              <div className="flex justify-between items-center py-1 border-t border-border mt-2 pt-2">
                <span className="text-xs font-semibold">Total Profit</span>
                <span className="text-sm font-bold text-primary">₱{totalProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Status - inline with tabs */}
        <div className="border border-border rounded p-3 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Document Status</h4>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {PAGES.map((p, i) => (
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

          {/* Checklist */}
          <div className="space-y-1.5">
            {currentPage.docs.map(doc => (
              <label key={doc} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={localSale.documents[currentPage.key][doc] || false}
                  onChange={() => toggleDoc(currentPage.key, doc)}
                  className="rounded border-border"
                />
                {doc}
              </label>
            ))}
          </div>

          {/* AR Status on last tab */}
          {docTab === PAGES.length - 1 && (
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
