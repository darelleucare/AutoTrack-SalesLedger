import { useState } from 'react';
import { Sale } from '@/types/sales';
import { useSales } from '@/store/SalesContext';
import { X, FileText } from 'lucide-react';
import DocumentChecklistView from './DocumentChecklistView';

interface SaleDetailPanelProps {
  sale: Sale;
  onClose: () => void;
}

export default function SaleDetailPanel({ sale, onClose }: SaleDetailPanelProps) {
  const { updateSale, settings } = useSales();
  const [showDocs, setShowDocs] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalProfit = sale.grp.reduce((a, b) => a + b, 0);

  const startEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(value);
  };

  const commitEdit = (field: string) => {
    if (field.startsWith('grp_')) {
      const idx = parseInt(field.split('_')[1]);
      const newGrp = [...sale.grp];
      newGrp[idx] = Number(editValue) || 0;
      updateSale(sale.id, { grp: newGrp });
    } else {
      const numFields = ['cost', 'rate'];
      const val = numFields.includes(field) ? Number(editValue) || 0 : editValue;
      updateSale(sale.id, { [field]: val } as any);
    }
    setEditField(null);
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

  if (showDocs) {
    return (
      <div className="fixed top-0 right-0 w-full md:w-[40%] h-full bg-card border-l border-border z-30 animate-slide-in-right overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Document Status — {sale.cs}</h3>
            <button onClick={() => setShowDocs(false)} className="p-1 hover:bg-accent rounded"><X className="w-4 h-4" /></button>
          </div>
          <DocumentChecklistView
            documents={sale.documents}
            arStatus={sale.arStatus}
            onUpdate={(docs, ar) => updateSale(sale.id, { documents: docs, arStatus: ar })}
            onClose={() => setShowDocs(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 w-full md:w-[40%] h-full bg-card border-l border-border z-30 animate-slide-in-right overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Sale Details — {sale.cs}</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="w-4 h-4" /></button>
        </div>

        {/* Vehicle Info */}
        <div className="border border-border rounded p-3 space-y-1">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Vehicle Info</h4>
          <EditableField label="CS#" field="cs" value={sale.cs} />
          <EditableField label="Engine#" field="engineNo" value={sale.engineNo} />
          <EditableField label="Chassis#" field="chassisNo" value={sale.chassisNo} />
          <EditableField label="Brand" field="brand" value={sale.brand} />
          <EditableField label="Model" field="model" value={sale.model} />
          <EditableField label="Unit Cost" field="cost" value={`₱${sale.cost.toLocaleString()}`} />
          <EditableField label="Bank" field="bank" value={sale.bank || 'N/A'} />
          <EditableField label="Rate (%)" field="rate" value={`${sale.rate}%`} />
          <EditableField label="OR/CR" field="orCr" value={sale.orCr} />
          <EditableField label="Branch" field="branch" value={sale.branch} />
        </div>

        {/* Client Info */}
        <div className="border border-border rounded p-3 space-y-1">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Client Info</h4>
          <EditableField label="Name" field="clientName" value={sale.clientName} />
          <EditableField label="Contact" field="contact" value={sale.contact} />
          <EditableField label="Address" field="address" value={sale.address} />
        </div>

        {/* Group Profit */}
        <div className="border border-border rounded p-3 space-y-1">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Group Profit</h4>
          {sale.grp.map((g, i) => (
            <EditableField key={i} label={`GRP${i + 1}`} field={`grp_${i}`} value={`₱${g.toLocaleString()}`} />
          ))}
          <div className="flex justify-between items-center py-1 border-t border-border mt-2 pt-2">
            <span className="text-xs font-semibold">Total Profit</span>
            <span className="text-sm font-bold text-primary">₱{totalProfit.toLocaleString()}</span>
          </div>
        </div>

        {/* Document Status Button */}
        <button
          onClick={() => setShowDocs(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <FileText className="w-4 h-4" />
          View Document Status
        </button>
      </div>
    </div>
  );
}
