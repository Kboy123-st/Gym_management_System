import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { PaymentInvoice } from '../../types';
import { fmtMoney, fmtDate, todayISO } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  Receipt,
  Plus,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    members,
    recordPayment,
    markPaymentPaid,
    runAutomatedBillingCycle,
    memberById,
    settings,
    memberships,
    currentUser,
  } = useGym();

  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingInvoice, setViewingInvoice] = useState<PaymentInvoice | null>(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [billingResultModal, setBillingResultModal] = useState<{
    processedCount: number;
    totalAmount: number;
    renewedMemberNames: string[];
  } | null>(null);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  // Manual payment form
  const [formData, setFormData] = useState({
    memberId: members[0]?.id || '',
    amount: 45,
    discount: 0,
    method: 'Credit Card',
    status: 'Paid' as PaymentInvoice['status'],
    date: todayISO(),
  });

  const totalCollected = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.netAmount ?? p.amount), 0);

  const thisMonthPrefix = todayISO().slice(0, 7);
  const thisMonthCollected = payments
    .filter((p) => p.status === 'Paid' && p.date.slice(0, 7) === thisMonthPrefix)
    .reduce((sum, p) => sum + (p.netAmount ?? p.amount), 0);

  const pendingCount = payments.filter((p) => p.status === 'Pending').length;
  const autoBilledMemberships = memberships.filter((m) => m.autoRenew && m.status === 'Active').length;

  const handleRunBilling = () => {
    const res = runAutomatedBillingCycle();
    setBillingResultModal(res);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPayment(formData);
    setIsRecordOpen(false);
  };

  const filteredPayments = payments
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Total Collected
          </p>
          <p className="stat-number mt-1.5 text-[#0E2B27]">{fmtMoney(totalCollected)}</p>
          <p className="text-xs text-[#6B7C77] mt-1">all-time settled invoices</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            This Month
          </p>
          <p className="stat-number mt-1.5 text-[#2F9E5B]">{fmtMoney(thisMonthCollected)}</p>
          <p className="text-xs text-[#6B7C77] mt-1">received this calendar month</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Pending Dues
          </p>
          <p className="stat-number mt-1.5 text-[#C9891A]">{pendingCount}</p>
          <p className="text-xs text-[#6B7C77] mt-1">awaiting member settlement</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Auto-Renew Subs
          </p>
          <p className="stat-number mt-1.5 text-[#2E7DB8]">{autoBilledMemberships}</p>
          <p className="text-xs text-[#6B7C77] mt-1">recurring auto-billing enabled</p>
        </div>
      </div>

      {/* Automated Recurring Billing Engine Card */}
      <div className="card p-5 bg-gradient-to-r from-white via-white to-[#F5F7F5] border-l-4 border-l-[#CFFF3D]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="badge badge-success">Automated Billing Engine Active</span>
              <span className="text-xs text-[#6B7C77]">Cron-Ready Interval Scanner</span>
            </div>
            <h3 className="font-display text-xl font-bold tracking-wide text-[#122420] mt-1.5">
              Scheduled Recurring Payments &amp; Invoicing
            </h3>
            <p className="text-xs text-[#6B7C77] mt-1 leading-relaxed">
              Subscriptions marked with <strong>Auto-Renew</strong> are checked against their expiration
              dates. When due, the engine charges the stored payment method, logs an official invoice,
              advances the subscription cycle, and updates the member's standing automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBilling}
              className="btn btn-primary shadow-sm hover:shadow-md"
              title="Execute recurring payment cycle check right now"
            >
              <RefreshCw className="w-4 h-4 text-[#CFFF3D]" />
              <span>Run Automated Billing Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-[160px]"
          >
            <option value="all">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          <span className="text-xs text-[#6B7C77]">
            Showing {filteredPayments.length} invoice(s)
          </span>
        </div>

        {canEdit && (
          <button onClick={() => setIsRecordOpen(true)} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Record Payment</span>
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Member</th>
              <th>Total Amount</th>
              <th>Payment Method</th>
              <th>Billing Date</th>
              <th>Type</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const mem = memberById(p.memberId);
                const badgeClass =
                  {
                    Paid: 'badge-success',
                    Pending: 'badge-warning',
                    Failed: 'badge-danger',
                  }[p.status] || 'badge-muted';

                return (
                  <tr key={p.id}>
                    <td className="font-mono font-semibold text-xs text-[#122420]">
                      {p.invoiceNo}
                    </td>
                    <td>
                      <p className="font-semibold text-[#122420]">{mem ? mem.fullName : 'Unknown'}</p>
                      <p className="text-xs text-[#6B7C77]">{mem?.memberCode}</p>
                    </td>
                    <td>
                      <span className="font-bold text-[#122420]">{fmtMoney(p.netAmount ?? p.amount)}</span>
                      {p.discount > 0 && (
                        <span className="text-xs text-[#6B7C77] ml-1.5">
                          ({p.discount}% discount)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm text-[#122420]">{p.method}</span>
                    </td>
                    <td>{fmtDate(p.date)}</td>
                    <td>
                      {p.autoBilled ? (
                        <span className="badge badge-success text-[10px]">Auto-Renewed</span>
                      ) : (
                        <span className="badge badge-muted text-[10px]">Manual Entry</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{p.status}</span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(p)}
                          className="btn btn-outline btn-sm text-xs"
                          title="View and print invoice receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                        {p.status === 'Pending' && canEdit && (
                          <button
                            onClick={() => markPaymentPaid(p.id)}
                            className="btn btn-outline btn-sm text-xs text-[#2F9E5B]"
                            title="Mark payment as collected"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[#6B7C77]">
                  No payment invoices found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Official Printable Invoice Modal */}
      <Modal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        title="Official Tax Invoice"
        subtitle={viewingInvoice?.invoiceNo}
        maxWidth="max-w-md"
      >
        {viewingInvoice && (
          <div className="space-y-5 text-sm" id="printable-invoice">
            {/* Invoice Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#DCE3DF]">
              <div>
                <h4 className="font-display text-2xl font-bold tracking-wider text-[#0E2B27]">
                  {settings.gymName}
                </h4>
                <p className="text-xs text-[#6B7C77] max-w-xs">{settings.address}</p>
                <p className="text-xs text-[#6B7C77]">{settings.phone} • {settings.email}</p>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-xl text-[#122420]">
                  {viewingInvoice.invoiceNo}
                </span>
                <p className="text-xs text-[#6B7C77]">Date: {fmtDate(viewingInvoice.date)}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-4 bg-[#FAFBFA] p-3.5 rounded-lg border border-[#DCE3DF]">
              <div>
                <p className="field-label">Billed To</p>
                <p className="font-semibold text-[#122420]">
                  {memberById(viewingInvoice.memberId)?.fullName || 'Gym Member'}
                </p>
                <p className="text-xs text-[#6B7C77]">
                  ID: {memberById(viewingInvoice.memberId)?.memberCode}
                </p>
              </div>
              <div>
                <p className="field-label">Payment Information</p>
                <p className="text-xs font-medium text-[#122420]">Method: {viewingInvoice.method}</p>
                <p className="text-xs mt-0.5">
                  Status:{' '}
                  <span
                    className={
                      viewingInvoice.status === 'Paid'
                        ? 'text-[#2F9E5B] font-bold'
                        : 'text-[#C9891A] font-bold'
                    }
                  >
                    {viewingInvoice.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-[#DCE3DF] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[#EEF2EF] border-b border-[#DCE3DF]">
                  <tr>
                    <th className="py-2 px-3 text-left font-semibold text-[#3F534E]">Description</th>
                    <th className="py-2 px-3 text-right font-semibold text-[#3F534E]">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-[#122420]">
                      Gym Membership Subscription Access
                      {viewingInvoice.autoBilled && (
                        <span className="text-[10px] text-[#2F9E5B] block">
                          (Automated recurring billing cycle)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#122420]">
                      {fmtMoney(viewingInvoice.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-2 text-xs border-t border-[#DCE3DF]">
              <div className="flex justify-between text-[#6B7C77]">
                <span>Gross Subtotal:</span>
                <span>{fmtMoney(viewingInvoice.amount)}</span>
              </div>
              <div className="flex justify-between text-[#6B7C77]">
                <span>Member Discount:</span>
                <span>{viewingInvoice.discount}%</span>
              </div>
              <div className="flex justify-between font-display text-2xl font-bold text-[#0E2B27] pt-2 border-t border-[#DCE3DF]">
                <span>Total Amount:</span>
                <span>{fmtMoney(viewingInvoice.netAmount ?? viewingInvoice.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE3DF]">
              <button onClick={() => window.print()} className="btn btn-outline btn-sm">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setViewingInvoice(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Automated Billing Result Feedback Modal */}
      <Modal
        isOpen={!!billingResultModal}
        onClose={() => setBillingResultModal(null)}
        title="Automated Billing Engine Run Report"
        subtitle="Live execution log of recurring subscription renewals"
        maxWidth="max-w-md"
      >
        {billingResultModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#E4F5EA] border border-[#2F9E5B]/30 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2F9E5B] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#122420]">Cycle Check Complete</h4>
                <p className="text-xs text-[#3F534E] mt-0.5">
                  {billingResultModal.processedCount > 0
                    ? `Processed ${billingResultModal.processedCount} renewals totaling ${fmtMoney(
                        billingResultModal.totalAmount
                      )}.`
                    : 'All active subscriptions are currently up-to-date. No renewals were due.'}
                </p>
              </div>
            </div>

            {billingResultModal.renewedMemberNames.length > 0 && (
              <div className="border border-[#DCE3DF] rounded-lg p-3 bg-[#FAFBFA]">
                <p className="text-xs font-semibold text-[#3F534E] mb-2">
                  Renewed &amp; Invoiced Members:
                </p>
                <ul className="text-xs text-[#122420] space-y-1">
                  {billingResultModal.renewedMemberNames.map((name, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E5B]"></span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setBillingResultModal(null)} className="btn btn-primary btn-sm">
                Acknowledge
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Manual Payment / Invoice"
        subtitle="Create an invoice for walk-ins, cash reception, or custom charges"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Member *</label>
              <select
                required
                className="input"
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Amount (USD) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="field-label">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="field-label">Payment Method *</label>
              <select
                className="input"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option>Credit Card</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Mobile Payment</option>
              </select>
            </div>

            <div>
              <label className="field-label">Initial Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as PaymentInvoice['status'],
                  })
                }
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="field-label">Transaction Date</label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              Save Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
