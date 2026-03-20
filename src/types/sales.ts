export type StatusType = 'pending' | 'released';
export type ARStatusType = 'pending' | 'paid';
export type PaymentMode = 'cash' | 'fin' | 'copo' | 'bank_po';

export interface DocumentChecklist {
  bank: Record<string, boolean>;
  accounting: Record<string, boolean>;
  dealer: Record<string, boolean>;
  lto: Record<string, boolean>;
}

export interface Sale {
  id: string;
  cs: string;
  engineNo: string;
  chassisNo: string;
  brand: string;
  model: string;
  rate: number;
  cost: number;
  orCr: string;
  dateRelease: string;
  branch: string;
  bank: string;
  clientName: string;
  contact: string;
  address: string;
  grp: number[];
  bankStatus: StatusType;
  accountingStatus: StatusType;
  dealerStatus: StatusType;
  ltoStatus: StatusType;
  arStatus: ARStatusType;
  modeOfPayment: PaymentMode;
  groupNumber: number;
  documents: DocumentChecklist;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  dateFormat: 'us' | 'eur' | 'jpn';
  dateLength: 'short' | 'long';
  groupCount: number;
  vehicleModels: string[];
  accountingDocs: string[];
  dealerDocs: string[];
  ltoDocs: string[];
  bankChecklists: Record<string, string[]>;
}

// Legacy constants (kept for reference / backward compat)
export const BANK_DOCS = [
  'Credit Advise', 'VSI', 'LTO Undertaking', 'Standard Insurance',
  'LTO Certification', 'Personal Preferences', 'CFUSCA',
  'Onion Skins w/ Motor/chassis#', 'PPSR', 'Amortization Schedule',
  'VRF', 'Credit advice Requirements', 'Auto Loan Form',
  'Authorization to Debit Account', 'Deed of Assignment',
];

export const ACCOUNTING_DOCS = [
  'Gate pass', 'Collection Receipt', 'SIA VSA / VSI',
  'Credit Application', 'Transmittal (Received by Bank)',
  'Tracker (Transmitted)', 'GP', 'Stencils', 'Accessories',
  "ID's", 'Insurance',
];

export const DEALER_DOCS = [
  'VSA', 'Computation Sheet', 'Transmittal Slip', 'VSI',
  'GPA /w OR', 'Credit Advise Report', 'Agreement LTO Registration',
  'Affidavits', 'Customer Profile sheet', 'Charge Invoice',
  'MVIR', 'Onion skin',
];

export const LTO_DOCS = [
  'VSI', 'Buyers Information Sheet', 'Valid ID', "Buyer's Portal",
  '2 CSR', 'COC LTO Copy', 'Authentication', 'MVIR', 'Onion skin',
];

export const DEFAULT_BANK_CHECKLIST = [
  'Credit Advice',
  'Vehicle Sales Invoice No',
  'LTO Undertaking',
  'Insurance',
  'LTO Certification to Used Xerox LTO Form',
  '3 Onion Skin with Motor & 2 Chassis no.',
  '3 Personal References',
  'Screenshot Printout of Loan Principal Borrower PPSR',
  'Authorization To Debit Account',
  'Amortization Schedule',
  'CFUSCA with Complete Information of Borrower',
  'Promissory Note with Chattel Mortgage',
];

export const CASH_COPO_EXCLUDED_DEALER_DOCS = ['Credit Advise Report'];

export function isCashOrCopo(mode: PaymentMode): boolean {
  return mode === 'cash' || mode === 'copo';
}

export function createEmptyDocuments(
  bankDocs: string[],
  accountingDocs: string[],
  dealerDocs: string[],
  ltoDocs: string[]
): DocumentChecklist {
  const make = (list: string[]) => Object.fromEntries(list.map(d => [d, false]));
  return {
    bank: make(bankDocs),
    accounting: make(accountingDocs),
    dealer: make(dealerDocs),
    lto: make(ltoDocs),
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  dateFormat: 'us',
  dateLength: 'short',
  groupCount: 3,
  vehicleModels: ['Vios', 'Hilux', 'Fortuner', 'Innova', 'Wigo', 'Raize', 'Rush', 'Avanza'],
  accountingDocs: [...ACCOUNTING_DOCS],
  dealerDocs: [...DEALER_DOCS],
  ltoDocs: [...LTO_DOCS],
  bankChecklists: {},
};

export function defaultGrp(count: number): number[] {
  return Array(count).fill(0);
}

export function formatDateBySettings(dateStr: string, settings: AppSettings): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (settings.dateLength === 'long') {
    const monthStr = monthNames[month];
    if (settings.dateFormat === 'us') return `${monthStr} ${pad(day)}, ${year}`;
    if (settings.dateFormat === 'eur') return `${pad(day)} ${monthStr} ${year}`;
    return `${year} ${monthStr} ${pad(day)}`;
  }

  if (settings.dateFormat === 'us') return `${pad(month + 1)}/${pad(day)}/${year}`;
  if (settings.dateFormat === 'eur') return `${pad(day)}/${pad(month + 1)}/${year}`;
  return `${year}/${pad(month + 1)}/${pad(day)}`;
}
