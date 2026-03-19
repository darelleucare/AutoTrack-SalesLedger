import { useState } from 'react';
import { BANK_DOCS, ACCOUNTING_DOCS, DEALER_DOCS, LTO_DOCS, DocumentChecklist, ARStatusType } from '@/types/sales';

const PAGES = [
  { title: 'Bank', docs: BANK_DOCS, key: 'bank' as const },
  { title: 'Accounting', docs: ACCOUNTING_DOCS, key: 'accounting' as const },
  { title: 'Dealer', docs: DEALER_DOCS, key: 'dealer' as const },
  { title: 'LTO', docs: LTO_DOCS, key: 'lto' as const },
];

interface DocumentChecklistViewProps {
  documents: DocumentChecklist;
  arStatus: ARStatusType;
  onUpdate: (docs: DocumentChecklist, arStatus: ARStatusType) => void;
  onClose: () => void;
}

export default function DocumentChecklistView({ documents, arStatus, onUpdate, onClose }: DocumentChecklistViewProps) {
  const [page, setPage] = useState(0);
  const [localDocs, setLocalDocs] = useState<DocumentChecklist>({ ...documents, bank: { ...documents.bank }, accounting: { ...documents.accounting }, dealer: { ...documents.dealer }, lto: { ...documents.lto } });
  const [localAr, setLocalAr] = useState(arStatus);

  const currentPage = PAGES[page];

  const toggle = (doc: string) => {
    setLocalDocs(prev => ({
      ...prev,
      [currentPage.key]: { ...prev[currentPage.key], [doc]: !prev[currentPage.key][doc] },
    }));
  };

  const isLastPage = page === PAGES.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {PAGES.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setPage(i)}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${i === page ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Table-style checklist */}
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
              const isChecked = localDocs[currentPage.key][doc] || false;
              return (
                <tr
                  key={doc}
                  className={`border-t border-border cursor-pointer transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-accent/50'} ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                  onClick={() => toggle(doc)}
                >
                  <td className="px-3 py-2">{doc}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(doc)}
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

      {isLastPage && (
        <div className="pt-2 border-t border-border">
          <label className="text-sm font-medium">AR Status</label>
          <select
            className="ml-2 text-sm border border-border rounded px-2 py-1 bg-card"
            value={localAr}
            onChange={e => setLocalAr(e.target.value as ARStatusType)}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={() => page > 0 ? setPage(page - 1) : onClose()}
          className="px-4 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
        >
          Back
        </button>
        {isLastPage ? (
          <button
            onClick={() => { onUpdate(localDocs, localAr); onClose(); }}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
