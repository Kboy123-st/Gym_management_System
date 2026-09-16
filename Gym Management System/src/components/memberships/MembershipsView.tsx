import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { MembershipPlan, Membership } from '../../types';
import { fmtMoney, fmtDate, todayISO } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  Plus,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  ArrowUpCircle,
  XCircle,
  Search,
  CheckCircle,
} from 'lucide-react';

export const MembershipsView: React.FC = () => {
  const {
    memberships,
    plans,
    members,
    addPlan,
    updatePlan,
    deletePlan,
    assignMembership,
    renewMembership,
    upgradeMembership,
    freezeMembership,
    unfreezeMembership,
    cancelMembership,
    toggleAutoRenew,
    memberById,
    planById,
    currentUser,
  } = useGym();

  const [activeTab, setActiveTab] = useState<'assignments' | 'plans'>('assignments');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [upgradingMs, setUpgradingMs] = useState<Membership | null>(null);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState('');

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    memberId: members[0]?.id || '',
    planId: plans[0]?.id || '',
    startDate: todayISO(),
    autoRenew: true,
    paymentMethod: 'Credit Card',
  });

  // Plan Form
  const [planForm, setPlanForm] = useState({
    name: '',
    type: 'Monthly' as MembershipPlan['type'],
    durationDays: 30,
    price: 45,
    description: '',
    isRecurring: true,
    billingCycleDays: 30,
  });

  const openPlanModal = (p?: MembershipPlan) => {
    if (p) {
      setEditingPlan(p);
      setPlanForm({
        name: p.name,
        type: p.type,
        durationDays: p.durationDays,
        price: p.price,
        description: p.description,
        isRecurring: p.isRecurring,
        billingCycleDays: p.billingCycleDays || p.durationDays,
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        type: 'Monthly',
        durationDays: 30,
        price: 50,
        description: 'Standard recurring monthly membership access.',
        isRecurring: true,
        billingCycleDays: 30,
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignMembership(assignForm);
    setIsAssignOpen(false);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updatePlan(editingPlan.id, planForm);
    } else {
      addPlan(planForm);
    }
    setIsPlanModalOpen(false);
  };

  const handleUpgradeSubmit = () => {
    if (!upgradingMs || !selectedUpgradePlanId) return;
    upgradeMembership(upgradingMs.id, selectedUpgradePlanId);
    setUpgradingMs(null);
  };

  const filteredMemberships = memberships.filter((ms) => {
    const mem = memberById(ms.memberId);
    const plan = planById(ms.planId);
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      (mem && mem.fullName.toLowerCase().includes(q)) ||
      (plan && plan.name.toLowerCase().includes(q)) ||
      ms.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCE3DF]">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'assignments'
              ? 'text-[#0E2B27] border-b-2 border-[#A8D91F] -mb-[1px]'
              : 'text-[#6B7C77] hover:text-[#122420]'
          }`}
        >
          Member Subscriptions ({memberships.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'plans'
              ? 'text-[#0E2B27] border-b-2 border-[#A8D91F] -mb-[1px]'
              : 'text-[#6B7C77] hover:text-[#122420]'
          }`}
        >
          Membership Plans ({plans.length})
        </button>
      </div>

      {/* Tab 1: Member Subscriptions */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7C77]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by member name or plan…"
                className="input pl-9"
              />
            </div>
            {canEdit && (
              <button onClick={() => setIsAssignOpen(true)} className="btn btn-accent">
                <Plus className="w-4 h-4" />
                <span>+ Assign Membership</span>
              </button>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Current Plan</th>
                  <th>Start Date</th>
                  <th>Expiration Date</th>
                  <th>Auto-Renew</th>
                  <th>Status</th>
                  <th className="text-right">Subscription Controls</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.length > 0 ? (
                  filteredMemberships.map((ms) => {
                    const mem = memberById(ms.memberId);
                    const plan = planById(ms.planId);
                    const badgeClass =
                      {
                        Active: 'badge-success',
                        Expired: 'badge-danger',
                        Frozen: 'badge-info',
                        Cancelled: 'badge-muted',
                      }[ms.status] || 'badge-muted';

                    return (
                      <tr key={ms.id}>
                        <td className="font-semibold text-[#122420]">
                          {mem ? mem.fullName : 'Unknown Member'}
                          <p className="text-xs text-[#6B7C77] font-normal">{mem?.memberCode}</p>
                        </td>
                        <td>
                          <p className="font-medium text-[#122420]">{plan ? plan.name : '—'}</p>
                          <p className="text-xs text-[#6B7C77]">
                            {plan ? fmtMoney(plan.price) : ''} • {plan?.type}
                          </p>
                        </td>
                        <td>{fmtDate(ms.startDate)}</td>
                        <td>
                          <span
                            className={
                              ms.status === 'Expired'
                                ? 'text-[#D8483A] font-semibold'
                                : 'text-[#122420]'
                            }
                          >
                            {fmtDate(ms.endDate)}
                          </span>
                        </td>
                        <td>
                          {canEdit ? (
                            <button
                              onClick={() => toggleAutoRenew(ms.id)}
                              className={`badge cursor-pointer transition-all ${
                                ms.autoRenew
                                  ? 'bg-[#E4F5EA] text-[#2F9E5B] border border-[#2F9E5B]/20'
                                  : 'bg-[#EDF1EF] text-[#6B7C77]'
                              }`}
                              title="Click to toggle automated recurring renewal"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${ms.autoRenew ? 'text-[#2F9E5B]' : ''}`}
                              />
                              <span>{ms.autoRenew ? 'Auto-Billing ON' : 'Off'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#6B7C77]">
                              {ms.autoRenew ? 'Yes' : 'No'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{ms.status}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {canEdit && (
                            <div className="inline-flex items-center gap-1.5">
                              {ms.status === 'Active' && (
                                <button
                                  onClick={() => freezeMembership(ms.id)}
                                  className="btn btn-outline btn-sm text-xs"
                                  title="Freeze membership"
                                >
                                  <PauseCircle className="w-3.5 h-3.5" />
                                  <span>Freeze</span>
                                </button>
                              )}

                              {ms.status === 'Frozen' && (
                                <button
                                  onClick={() => unfreezeMembership(ms.id)}
                                  className="btn btn-outline btn-sm text-xs text-[#2F9E5B]"
                                  title="Reactivate membership"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  <span>Unfreeze</span>
                                </button>
                              )}

                              {ms.status !== 'Cancelled' && (
                                <>
                                  <button
                                    onClick={() => renewMembership(ms.id)}
                                    className="btn btn-outline btn-sm text-xs"
                                    title="Manually renew subscription"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Renew</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setUpgradingMs(ms);
                                      setSelectedUpgradePlanId(ms.planId);
                                    }}
                                    className="btn btn-outline btn-sm text-xs"
                                    title="Upgrade to another plan"
                                  >
                                    <ArrowUpCircle className="w-3.5 h-3.5" />
                                    <span>Upgrade</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm('Cancel this membership subscription?')
                                      ) {
                                        cancelMembership(ms.id);
                                      }
                                    }}
                                    className="btn btn-danger btn-sm"
                                    title="Cancel subscription"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#6B7C77]">
                      No subscriptions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#6B7C77]">
              Configure membership tiers, pricing, and recurring billing periods.
            </p>
            {canEdit && (
              <button onClick={() => openPlanModal()} className="btn btn-accent">
                <Plus className="w-4 h-4" />
                <span>+ Create Plan</span>
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.id} className="card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-info">{p.type}</span>
                        {p.isRecurring && (
                          <span className="badge badge-success">Recurring</span>
                        )}
                      </div>
                    </div>
                    <p className="stat-number text-[#0E2B27]">{fmtMoney(p.price)}</p>
                  </div>

                  <p className="text-sm text-[#6B7C77] mt-3">{p.description}</p>
                  <p className="text-xs text-[#3F534E] font-medium mt-3">
                    Duration: {p.durationDays} days • Recurring cycle: every{' '}
                    {p.billingCycleDays || p.durationDays} days
                  </p>
                </div>

                {canEdit && (
                  <div className="flex gap-2 mt-5 pt-3 border-t border-[#DCE3DF]">
                    <button
                      onClick={() => openPlanModal(p)}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Edit Plan
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete plan "${p.name}"? Existing active memberships will preserve their records.`
                          )
                        ) {
                          deletePlan(p.id);
                        }
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Membership Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Membership to Member"
        subtitle="Activate an access plan with automated recurring payment scheduling"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="field-label">Select Gym Member *</label>
            <select
              required
              className="input"
              value={assignForm.memberId}
              onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Membership Package *</label>
            <select
              required
              className="input"
              value={assignForm.planId}
              onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fmtMoney(p.price)} ({p.type} / {p.durationDays} days)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Start Date *</label>
              <input
                required
                type="date"
                className="input"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Payment Method</label>
              <select
                className="input"
                value={assignForm.paymentMethod}
                onChange={(e) => setAssignForm({ ...assignForm, paymentMethod: e.target.value })}
              >
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Mobile Payment</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 bg-[#FAFBFA] border border-[#DCE3DF] rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={assignForm.autoRenew}
              onChange={(e) => setAssignForm({ ...assignForm, autoRenew: e.target.checked })}
              className="rounded text-[#0E2B27] focus:ring-[#0E2B27]"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#122420] block">
                Enable Automated Recurring Billing
              </span>
              <span className="text-[#6B7C77]">
                Automatically renew and invoice upon expiration date.
              </span>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              Assign &amp; Activate
            </button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? `Edit Plan — ${editingPlan.name}` : 'Create Membership Plan'}
        subtitle="Define billing frequency, duration, and price tier"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Plan Name *</label>
              <input
                required
                className="input"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g. Monthly Pro"
              />
            </div>

            <div>
              <label className="field-label">Type *</label>
              <select
                className="input"
                value={planForm.type}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    type: e.target.value as MembershipPlan['type'],
                  })
                }
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Half-Year</option>
                <option>Annual</option>
              </select>
            </div>

            <div>
              <label className="field-label">Duration (Days) *</label>
              <input
                required
                type="number"
                min="1"
                className="input"
                value={planForm.durationDays}
                onChange={(e) =>
                  setPlanForm({ ...planForm, durationDays: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="field-label">Price (USD) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="field-label">Billing Cycle (Days)</label>
              <input
                type="number"
                min="1"
                className="input"
                value={planForm.billingCycleDays}
                onChange={(e) =>
                  setPlanForm({ ...planForm, billingCycleDays: Number(e.target.value) })
                }
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm text-[#122420] cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.isRecurring}
                  onChange={(e) => setPlanForm({ ...planForm, isRecurring: e.target.checked })}
                  className="rounded text-[#0E2B27] focus:ring-[#0E2B27]"
                />
                <span className="font-medium">
                  Support automated recurring subscription renewal
                </span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="field-label">Description &amp; Included Perks</label>
              <textarea
                rows={2}
                className="input"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Details on locker access, guest passes, class privileges..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Plan Modal */}
      <Modal
        isOpen={!!upgradingMs}
        onClose={() => setUpgradingMs(null)}
        title="Upgrade Member Subscription"
        subtitle={`Switch ${
          upgradingMs ? memberById(upgradingMs.memberId)?.fullName : ''
        } to a higher tier plan`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">Select Target Plan</label>
            <select
              className="input"
              value={selectedUpgradePlanId}
              onChange={(e) => setSelectedUpgradePlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fmtMoney(p.price)} ({p.type})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#6B7C77] bg-[#FAFBFA] p-3 rounded-lg border border-[#DCE3DF]">
            Upgrading resets the active subscription period from today, recalculates the expiration
            date based on the new plan's duration, and adjusts the recurring billing price.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setUpgradingMs(null)} className="btn btn-outline">
              Cancel
            </button>
            <button onClick={handleUpgradeSubmit} className="btn btn-accent">
              Confirm Upgrade
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
