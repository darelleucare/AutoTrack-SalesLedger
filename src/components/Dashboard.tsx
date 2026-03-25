import { useSales } from '@/store/SalesContext';
import SummaryCard from './SummaryCard';
import { StatusBadge } from './StatusBadge';
import { Sale, isCashOrCopo } from '@/types/sales';

interface DashboardProps {
  onSelectSale: (sale: Sale) => void;
}

export default function Dashboard({ onSelectSale }: DashboardProps) {
  const { sales } = useSales();

  const totalReleased = sales.filter(s => s.bankStatus === 'released' && s.accountingStatus === 'released').length;
  const totalGP = sales.reduce((sum, s) => sum + s.grp.reduce((a, b) => a + b, 0), 0);
  const bankPending = sales.filter(s => s.bankStatus === 'pending').length;
  const accPending = sales.filter(s => s.accountingStatus === 'pending').length;
  const dealerPending = sales.filter(s => s.dealerStatus === 'pending').length;
  const ltoPending = sales.filter(s => s.ltoStatus === 'pending').length;
  const orCrPending = sales.filter(s => s.orCrStatus === 'na').length;
  const arPending = sales.filter(s => s.arStatus === 'pending').length;
  const now = new Date();
  const thisMonth = sales.filter(s => {
    if (!s.dateRelease) return false;
    const d = new Date(s.dateRelease);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recent = sales.slice(0, 20);

  return (
    <section id="dashboard" className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
        <div className='grid grid-cols-3 gap-2'>
          <SummaryCard title="Units Released" value={totalReleased} colorClass="pastel-card-green" />
          <SummaryCard title="Sales This Month" value={thisMonth} colorClass="pastel-card-blue" />
          <SummaryCard title="Total GP" value={`₱${totalGP.toLocaleString()}`} colorClass="pastel-card-blue" />
        </div>
        <div className='grid grid-cols-6 gap-2'>
          <SummaryCard title="Bank Pending" value={bankPending} colorClass="pastel-card-red" />
          <SummaryCard title="Acctg. Pending" value={accPending} colorClass="pastel-card-amber" />
          <SummaryCard title="Dealer Pending" value={dealerPending} colorClass="pastel-card-purple" />
          <SummaryCard title="LTO Pending" value={ltoPending} colorClass="pastel-card-teal" />
          <SummaryCard title="OR/CR N/A" value={orCrPending} colorClass="pastel-card-orange" />
          <SummaryCard title="AR Pending" value={arPending} colorClass="pastel-card-red" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="border border-border rounded overflow-x-auto bg-card">
        <div className="px-4 py-2 border-b border-border font-semibold text-sm">Recent Transactions</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-3 py-2 font-medium">CS#</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Bank</th>
              <th className="px-3 py-2 font-medium">Accounting</th>
              <th className="px-3 py-2 font-medium">Dealer</th>
              <th className="px-3 py-2 font-medium">LTO</th>
              <th className="px-3 py-2 font-medium">OR/CR</th>
              <th className="px-3 py-2 font-medium">AR</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No records yet</td></tr>
            )}
            {recent.map(sale => (
              <tr
                key={sale.id}
                onClick={() => onSelectSale(sale)}
                className="border-t border-border hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 font-medium">{sale.cs}</td>
                <td className="px-3 py-2">{sale.clientName}</td>
                <td className="px-3 py-2">
                  {isCashOrCopo(sale.modeOfPayment) ? (
                    <span className="status-na px-1.5 py-0.5 rounded text-xs">N/A</span>
                  ) : (
                    <StatusBadge status={sale.bankStatus} />
                  )}
                </td>
                <td className="px-3 py-2"><StatusBadge status={sale.accountingStatus} /></td>
                <td className="px-3 py-2"><StatusBadge status={sale.dealerStatus} /></td>
                <td className="px-3 py-2"><StatusBadge status={sale.ltoStatus} /></td>
                <td className="px-3 py-2">
                  {sale.orCrStatus === 'na' ? (
                    <span className="status-na-orcr px-1.5 py-0.5 rounded text-xs">N/A</span>
                  ) : (
                    <span className="status-released px-1.5 py-0.5 rounded text-xs">Released</span>
                  )}
                </td>
                <td className="px-3 py-2"><StatusBadge status={sale.arStatus} type="ar" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
