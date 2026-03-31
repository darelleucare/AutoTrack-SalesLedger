import { useState, useMemo } from 'react';
import { useSales } from '@/store/SalesContext';
import {
  Sale, createEmptyDocuments, defaultGrp, PaymentMode, ARStatusType,
  DocumentChecklist, isCashOrCopo,
  DEFAULT_BANK_CHECKLIST, formatDateBySettings,
} from '@/types/sales';
import { X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddSaleModalProps {
  onClose: () => void;
}

export default function AddSaleModal({ onClose }: AddSaleModalProps) {
  const { addSale, settings } = useSales();
  const [step, setStep] = useState<'info' | 'docs'>('info');
  const [docPage, setDocPage] = useState(0);
  const [dateRelease, setDateRelease] = useState<Date>(new Date());

  // Ensure groupNames exists (for backward compatibility with old data)
  const groupNames = settings.groupNames || Array.from({ length: settings.groupCount }, (_, i) => `Group ${i + 1}`);

  const [form, setForm] = useState({
    cs: '', engineNo: '', chassisNo: '', color: '', brand: 'SUZUKI', model: '',
    cost: '', branch: 'Carmona', bank: '', clientName: '', contact: '', address: '',
    rate: '', orCr: 'na', modeOfPayment: 'cash' as PaymentMode, groupNumber: '1',
  });
  const [grp, setGrp] = useState<number[]>(defaultGrp(settings.groupCount));
  const [docs, setDocs] = useState<DocumentChecklist>(createEmptyDocuments([], settings.accountingDocs, settings.dealerDocs, settings.ltoDocs));
  const [arStatus, setArStatus] = useState<ARStatusType>('pending');

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const cashCopo = isCashOrCopo(form.modeOfPayment);

  const handleModeChange = (value: string) => {
    const mode = value as PaymentMode;
    setForm(prev => ({
      ...prev,
      modeOfPayment: mode,
      bank: isCashOrCopo(mode) ? 'N/A' : (prev.bank === 'N/A' ? '' : prev.bank),
    }));
  };

  const totalGrp = grp.reduce((a, b) => a + b, 0);

  const isValid = form.cs && form.engineNo && form.chassisNo && form.color && form.brand && form.model && form.cost && form.clientName && form.contact && form.address;

  // Build document pages dynamically
  const docPages = useMemo(() => {
    const pages: { title: string; key: keyof DocumentChecklist; docs: string[] }[] = [];
    if (!cashCopo) {
      const bankDocs = settings.bankChecklists[form.bank] || DEFAULT_BANK_CHECKLIST;
      pages.push({ title: 'Bank', key: 'bank', docs: bankDocs });
    }
    const accountingDocs = cashCopo
      ? settings.accountingDocs.filter(d => !settings.accountingBankRequired.includes(d))
      : settings.accountingDocs;
    pages.push({ title: 'Accounting', key: 'accounting', docs: accountingDocs });
    const dealerDocs = cashCopo
      ? settings.dealerDocs.filter(d => !settings.dealerBankRequired.includes(d))
      : settings.dealerDocs;
    pages.push({ title: 'Dealer', key: 'dealer', docs: dealerDocs });
    pages.push({ title: 'LTO', key: 'lto', docs: settings.ltoDocs });
    return pages;
  }, [cashCopo, form.bank, settings]);

  const goToDocs = () => {
    if (!isValid) return;
    const bankDocs = cashCopo ? [] : (settings.bankChecklists[form.bank] || DEFAULT_BANK_CHECKLIST);
    const accountingDocs = cashCopo
      ? settings.accountingDocs.filter(d => !settings.accountingBankRequired.includes(d))
      : settings.accountingDocs;
    const dealerDocs = cashCopo
      ? settings.dealerDocs.filter(d => !settings.dealerBankRequired.includes(d))
      : settings.dealerDocs;
    setDocs(createEmptyDocuments(bankDocs, accountingDocs, dealerDocs, settings.ltoDocs));
    setDocPage(0);
    setStep('docs');
  };

  const handleSave = () => {
    const sale: Sale = {
      id: crypto.randomUUID(),
      cs: form.cs,
      engineNo: form.engineNo,
      chassisNo: form.chassisNo,
      color: form.color,
      brand: form.brand,
      model: form.model,
      rate: Number(form.rate) || 0,
      cost: Number(form.cost) || 0,
      orCr: form.orCr as any,
      dateRelease: format(dateRelease, 'yyyy-MM-dd'),
      branch: form.branch,
      bank: cashCopo ? 'N/A' : (form.bank || 'N/A'),
      clientName: form.clientName,
      contact: form.contact,
      address: form.address,
      grp,
      bankStatus: 'pending',
      accountingStatus: 'pending',
      dealerStatus: 'pending',
      ltoStatus: 'pending',
      orCrStatus: form.orCr as any,
      arStatus,
      modeOfPayment: form.modeOfPayment,
      groupNumber: Number(form.groupNumber) || 1,
      documents: docs,
    };
    addSale(sale);
    onClose();
  };

  const toggleDoc = (key: keyof DocumentChecklist, doc: string) => {
    setDocs(prev => ({
      ...prev,
      [key]: { ...prev[key], [doc]: !prev[key][doc] },
    }));
  };

  const currentPage = docPages[docPage];
  const checkedCount = currentPage ? Object.values(docs[currentPage.key]).filter(Boolean).length : 0;
  const totalCount = currentPage ? currentPage.docs.length : 0;

  const bankNames = Object.keys(settings.bankChecklists);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-foreground/20 backdrop-blur-sm">
      <div className="bg-card border border-border rounded w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Add New Sale {step === 'docs' ? '— Documents' : ''}</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="w-4 h-4" /></button>
        </div>

        {step === 'info' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Vehicle Info</h4>
                {[
                  { key: 'cs', label: 'CS#' },
                  { key: 'engineNo', label: 'Engine#' },
                  { key: 'chassisNo', label: 'Chassis#' },
                  { key: 'color', label: 'Unit Color *' },
                  { key: 'brand', label: 'Brand *' },
                ].map(f => (
                  <div key={f.key} className="mb-2">
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input
                      className="w-full border border-dark rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={(form as any)[f.key]}
                      onChange={e => updateField(f.key, e.target.value)}
                    />
                  </div>
                ))}
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">Model</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background"
                    value={form.model}
                    onChange={e => updateField('model', e.target.value)}
                  >
                    <option value="">Select model</option>
                    {settings.vehicleModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Unit Cost</label>
                    <input
                      type="number"
                      className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={form.cost}
                      onChange={e => updateField('cost', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Bank</label>
                    {cashCopo ? (
                      <input
                        className="w-full border border-border rounded px-2 py-1.5 text-sm bg-muted text-muted-foreground cursor-not-allowed"
                        value="N/A"
                        disabled
                      />
                    ) : (
                      <Select value={form.bank} onValueChange={v => updateField('bank', v)}>
                        <SelectTrigger className="w-full h-[34px] text-sm">
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankNames.map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Rate (%)</label>
                    <input
                      type="number"
                      className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={form.rate}
                      onChange={e => updateField('rate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">OR/CR</label>
                    <select
                      className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background"
                      value={form.orCr}
                      onChange={e => updateField('orCr', e.target.value)}
                    >
                      <option value="na">N/A</option>
                      <option value="released">Released</option>
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">Date Release</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center gap-2 border border-border rounded px-2 py-1.5 text-sm bg-background text-left hover:bg-accent/50">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        {formatDateBySettings(format(dateRelease, 'yyyy-MM-dd'), settings)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRelease}
                        onSelect={(d) => d && setDateRelease(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">Branch</label>
                  <input
                    className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background"
                    value={form.branch}
                    onChange={e => updateField('branch', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Client Info</h4>
                {[
                  { key: 'clientName', label: 'Name' },
                  { key: 'contact', label: 'Contact' },
                  { key: 'address', label: 'Address' },
                ].map(f => (
                  <div key={f.key} className="mb-2">
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input
                      className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={(form as any)[f.key]}
                      onChange={e => updateField(f.key, e.target.value)}
                    />
                  </div>
                ))}

                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">Mode of Payment</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background"
                    value={form.modeOfPayment}
                    onChange={e => handleModeChange(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="fin">FIN</option>
                    <option value="copo">COPO</option>
                    <option value="bank_po">BANK PO</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">Group Number</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background"
                    value={form.groupNumber}
                    onChange={e => updateField('groupNumber', e.target.value)}
                  >
                    {Array.from({ length: settings.groupCount }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{groupNames[i] || `Group ${i + 1}`}</option>
                    ))}
                  </select>
                </div>

                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 mt-4">Group Profit</h4>
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground">GP Amount ({groupNames[Number(form.groupNumber) - 1] || `Group ${form.groupNumber}`})</label>
                  <input
                    type="number"
                    className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background"
                    value={grp[Number(form.groupNumber) - 1] || ''}
                    onChange={e => {
                      const newGrp = [...grp];
                      newGrp[Number(form.groupNumber) - 1] = Number(e.target.value) || 0;
                      setGrp(newGrp);
                    }}
                  />
                </div>
                <div className="text-sm font-medium">Total: ₱{totalGrp.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={onClose} className="px-4 py-1.5 text-sm border border-border rounded hover:bg-accent">Cancel</button>
              <button
                onClick={goToDocs}
                disabled={!isValid}
                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'docs' && (
          <div className="p-4 space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {docPages.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => setDocPage(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-colors border ${
                    i === docPage
                      ? 'bg-primary text-primary-foreground border-primary'
                      : i < docPage
                      ? 'bg-accent text-accent-foreground border-border'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-background/20">
                    {i + 1}
                  </span>
                  {p.title}
                </button>
              ))}
            </div>

            {/* Progress + Check All */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span>{checkedCount}/{totalCount}</span>
              <button
                type="button"
                onClick={() => {
                  if (!currentPage) return;
                  const key = currentPage.key;
                  const allChecked = checkedCount === totalCount;
                  setDocs(prev => ({
                    ...prev,
                    [key]: Object.fromEntries(currentPage.docs.map(d => [d, !allChecked])),
                  }));
                }}
                className="px-2 py-0.5 text-xs border border-border rounded hover:bg-accent transition-colors"
              >
                {checkedCount === totalCount ? 'Uncheck All' : 'Check All'}
              </button>
            </div>

            {/* Table-style checklist */}
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
                    {currentPage.docs.map((doc, idx) => {
                      const isChecked = docs[currentPage.key][doc] || false;
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
                  </tbody>
                </table>
              </div>
            )}

            {docPage === docPages.length - 1 && (
              <div className="pt-2 border-t border-border">
                <label className="text-sm font-medium">AR Status</label>
                <select
                  className="ml-2 text-sm border border-border rounded px-2 py-1 bg-card"
                  value={arStatus}
                  onChange={e => setArStatus(e.target.value as ARStatusType)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => docPage > 0 ? setDocPage(docPage - 1) : setStep('info')}
                className="px-4 py-1.5 text-sm border border-border rounded hover:bg-accent"
              >
                Back
              </button>
              {docPage === docPages.length - 1 ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setDocPage(docPage + 1)}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
