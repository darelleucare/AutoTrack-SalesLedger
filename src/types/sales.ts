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
}

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

export function createEmptyDocuments(): DocumentChecklist {
  const make = (list: string[]) => Object.fromEntries(list.map(d => [d, false]));
  return {
    bank: make(BANK_DOCS),
    accounting: make(ACCOUNTING_DOCS),
    dealer: make(DEALER_DOCS),
    lto: make(LTO_DOCS),
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  dateFormat: 'us',
  dateLength: 'short',
  groupCount: 3,
  vehicleModels: ['Vios', 'Hilux', 'Fortuner', 'Innova', 'Wigo', 'Raize', 'Rush', 'Avanza'],
};

export function defaultGrp(count: number): number[] {
  return Array(count).fill(0);
}
