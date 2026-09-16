import React from 'react';
import { useGym } from '../../context/GymContext';
import { daysUntil, fmtDate, fmtMoney, todayISO } from '../../utils/formatters';
import {
  Bell,
  AlertTriangle,
  CreditCard,
  Wrench,
  Cake,
  Calendar,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Clock,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    memberships,
    members,
    payments,
    equipment,
    plans,
    renewMembership,
    markPaymentPaid,
    showToast,
    setActiveNav,
  } = useGym();

  // 1. Expiring memberships within 7 days or already expired
  const expiringMemberships = memberships
    .filter((m) => m.status === 'Active' && daysUntil(m.endDate) <= 7 && daysUntil(m.endDate) >= -30)
    .map((m) => {
      const member = members.find((mb) => mb.id === m.memberId);
      const plan = plans.find((p) => p.id === m.planId);
      const days = daysUntil(m.endDate);
      return {
        id: m.id,
        member,
        plan,
        endDate: m.endDate,
        days,
        autoRenew: m.autoRenew,
      };
    });

  // 2. Pending or overdue payments
  const pendingPayments = payments
    .filter((p) => p.status === 'Pending')
    .map((p) => {
      const member = members.find((mb) => mb.id === p.memberId);
      return {
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        member,
        amount: p.netAmount ?? p.amount,
        date: p.date,
      };
    });

  // 3. Equipment requiring maintenance soon (within 7 days or overdue)
  const maintenanceDue = equipment
    .filter((e) => daysUntil(e.nextMaintenance) <= 7)
    .map((e) => ({
      id: e.id,
      name: e.name,
      model: e.model,
      location: e.location,
      days: daysUntil(e.nextMaintenance),
      nextMaintenance: e.nextMaintenance,
    }));

  // 4. Member birthdays this month
  const currentMonthStr = `-${todayISO().slice(5, 7)}-`;
  const upcomingBirthdays = members
    .filter((m) => m.dob && m.dob.includes(currentMonthStr))
    .map((m) => ({
      id: m.id,
      name: m.fullName,
      phone: m.phone,
      email: m.email,
      dob: m.dob,
    }));

  const totalAlerts =
    expiringMemberships.length + pendingPayments.length + maintenanceDue.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card p-6 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-warning text-xs font-bold">Action Required</span>
            <span className="text-xs text-[#6B7C77]">Real-time operational alerts</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#122420]">
            System Alerts &amp; Notifications ({totalAlerts})
          </h2>
          <p className="text-xs text-[#6B7C77] mt-0.5">
            Automated alerts tracking membership expirations, overdue invoices, equipment maintenance, and celebrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveNav('payments')}
            className="btn btn-outline btn-sm text-xs"
          >
            Go to Billing
          </button>
          <button
            onClick={() => setActiveNav('memberships')}
            className="btn btn-primary btn-sm text-xs"
          >
            Review Memberships
          </button>
        </div>
      </div>

      {/* 1. Membership Expirations */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE3DF]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-[#122420]">
              Memberships Expiring Soon ({expiringMemberships.length})
            </h3>
          </div>
          <span className="text-xs text-[#6B7C77]">Within 7 days or overdue</span>
        </div>

        {expiringMemberships.length === 0 ? (
          <p className="text-xs text-[#6B7C77] py-4 text-center">
            No memberships currently expiring within 7 days.
          </p>
        ) : (
          <div className="divide-y divide-[#DCE3DF] mt-2">
            {expiringMemberships.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-xs text-[#122420]">
                    {item.member?.fullName || 'Unknown Member'}{' '}
                    <span className="font-normal text-[#6B7C77]">({item.member?.memberCode})</span>
                  </p>
                  <p className="text-[11px] text-[#6B7C77] mt-0.5">
                    Plan: <span className="font-semibold text-[#122420]">{item.plan?.name}</span> •
                    Expires: <span className="font-semibold text-red-600">{fmtDate(item.endDate)}</span>{' '}
                    ({item.days < 0 ? `${Math.abs(item.days)}d overdue` : item.days === 0 ? 'Expires today' : `in ${item.days} days`})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      renewMembership(item.id);
                      showToast(`Renewed membership for ${item.member?.fullName}`, 'success');
                    }}
                    className="btn btn-primary btn-sm text-xs py-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Renew Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Pending Invoices */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE3DF]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2F9E5B]" />
            <h3 className="font-bold text-sm text-[#122420]">
              Pending Payment Invoices ({pendingPayments.length})
            </h3>
          </div>
          <span className="text-xs text-[#6B7C77]">Awaiting payment verification</span>
        </div>

        {pendingPayments.length === 0 ? (
          <p className="text-xs text-[#6B7C77] py-4 text-center">
            No pending invoices. All customer accounts are up to date!
          </p>
        ) : (
          <div className="divide-y divide-[#DCE3DF] mt-2">
            {pendingPayments.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0E2B27]">
                      {item.invoiceNumber}
                    </span>
                    <span className="badge badge-warning text-[10px]">Pending</span>
                  </div>
                  <p className="text-xs text-[#122420] font-medium mt-0.5">
                    {item.member?.fullName} • {fmtMoney(item.amount)}
                  </p>
                  <p className="text-[11px] text-[#6B7C77]">Billed on: {fmtDate(item.date)}</p>
                </div>

                <button
                  onClick={() => {
                    markPaymentPaid(item.id);
                    showToast(`Marked ${item.invoiceNumber} as Paid`, 'success');
                  }}
                  className="btn btn-outline btn-sm text-xs py-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#2F9E5B]" />
                  <span>Mark as Paid</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Equipment Service Alerts & Birthdays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipment Maintenance */}
        <div className="card p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE3DF]">
            <Wrench className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-[#122420]">
              Equipment Service Due ({maintenanceDue.length})
            </h3>
          </div>

          {maintenanceDue.length === 0 ? (
            <p className="text-xs text-[#6B7C77] py-4 text-center">
              All gym machines are within their standard inspection window.
            </p>
          ) : (
            <div className="divide-y divide-[#DCE3DF] mt-2">
              {maintenanceDue.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#122420]">{item.name}</p>
                    <p className="text-[11px] text-[#6B7C77]">
                      {item.location} • Service date: {fmtDate(item.nextMaintenance)}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.days < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.days < 0 ? `${Math.abs(item.days)}d past due` : `in ${item.days}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Birthdays */}
        <div className="card p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCE3DF]">
            <Cake className="w-5 h-5 text-[#2E7DB8]" />
            <h3 className="font-bold text-sm text-[#122420]">
              Member Birthdays This Month ({upcomingBirthdays.length})
            </h3>
          </div>

          {upcomingBirthdays.length === 0 ? (
            <p className="text-xs text-[#6B7C77] py-4 text-center">
              No birthdays logged for this month.
            </p>
          ) : (
            <div className="divide-y divide-[#DCE3DF] mt-2">
              {upcomingBirthdays.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#122420]">{item.name}</p>
                    <p className="text-[11px] text-[#6B7C77]">
                      {item.phone} • {item.email}
                    </p>
                  </div>
                  <span className="badge badge-info text-xs">{fmtDate(item.dob)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
