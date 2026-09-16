import React from 'react';
import { useGym } from '../../context/GymContext';
import { ActiveNavKey } from '../../types';
import { fmtMoney, daysUntil, initials, todayISO } from '../../utils/formatters';
import {
  Users,
  CreditCard,
  AlertTriangle,
  Award,
  CheckCircle2,
  DollarSign,
  Wrench,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  QrCode,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate?: (key: ActiveNavKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate: propOnNavigate }) => {
  const {
    members,
    memberships,
    trainers,
    attendance,
    equipment,
    payments,
    classes,
    planById,
    memberById,
    runAutomatedBillingCycle,
    setActiveNav,
  } = useGym();
  const onNavigate = propOnNavigate || setActiveNav;

  const activeMemberships = memberships.filter((m) => m.status === 'Active').length;
  const expiredMemberships = memberships.filter((m) => m.status === 'Expired').length;
  const todayCount = attendance.filter((a) => a.date === todayISO()).length;

  const currentMonthPrefix = todayISO().slice(0, 7);
  const monthlyRevenue = payments
    .filter((p) => p.status === 'Paid' && p.date.slice(0, 7) === currentMonthPrefix)
    .reduce((sum, p) => sum + (p.netAmount ?? p.amount), 0);

  const equipAvailable = equipment.filter((e) => e.status === 'Available').length;
  const equipMaint = equipment.filter((e) => e.status === 'Under Maintenance').length;
  const equipDamaged = equipment.filter((e) => e.status === 'Damaged').length;

  // Revenue for last 6 months
  const months: { key: string; label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const rev = payments
      .filter((p) => p.status === 'Paid' && p.date.slice(0, 7) === key)
      .reduce((s, p) => s + (p.netAmount ?? p.amount), 0);
    months.push({ key, label, revenue: rev });
  }

  // Maximum revenue for chart scaling
  const maxRevenue = Math.max(...months.map((m) => m.revenue), 100);

  // Membership status distribution
  const statusCounts = {
    Active: memberships.filter((m) => m.status === 'Active').length,
    Expired: memberships.filter((m) => m.status === 'Expired').length,
    Frozen: memberships.filter((m) => m.status === 'Frozen').length,
    Cancelled: memberships.filter((m) => m.status === 'Cancelled').length,
  };
  const totalMemberships = memberships.length || 1;

  // Expiring soon (within 14 days)
  const expiringSoon = memberships
    .filter(
      (m) => m.status === 'Active' && daysUntil(m.endDate) <= 14 && daysUntil(m.endDate) >= 0
    )
    .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Quick Actions Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-[#DCE3DF] shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F9E5B] animate-pulse"></span>
          <span className="text-xs font-semibold text-[#122420]">Gym Status: Online</span>
          <span className="text-xs text-[#6B7C77]">• Automated recurring billing scheduled</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('members')}
            className="btn btn-outline btn-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Register Member</span>
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="btn btn-primary btn-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-[#CFFF3D]" />
            <span>Check In / Scan</span>
          </button>
          <button
            onClick={() => runAutomatedBillingCycle()}
            className="btn btn-accent btn-sm"
            title="Execute automated recurring billing renewals"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Process Auto-Billing</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Stat Cards matching original team design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Total Members
          </p>
          <p className="stat-number mt-1.5">{members.length}</p>
          <p className="text-xs text-[#6B7C77] mt-1">{members.length} registered profiles</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Active Memberships
          </p>
          <p className="stat-number mt-1.5" style={{ color: '#2F9E5B' }}>
            {activeMemberships}
          </p>
          <p className="text-xs text-[#6B7C77] mt-1">currently in good standing</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Expired Memberships
          </p>
          <p className="stat-number mt-1.5" style={{ color: '#D8483A' }}>
            {expiredMemberships}
          </p>
          <p className="text-xs text-[#6B7C77] mt-1">need renewal follow-up</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Total Trainers
          </p>
          <p className="stat-number mt-1.5">{trainers.length}</p>
          <p className="text-xs text-[#6B7C77] mt-1">
            {trainers.filter((t) => t.status === 'Active').length} active on roster
          </p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Today's Attendance
          </p>
          <p className="stat-number mt-1.5">{todayCount}</p>
          <p className="text-xs text-[#6B7C77] mt-1">check-ins recorded today</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Monthly Revenue
          </p>
          <p className="stat-number mt-1.5" style={{ color: '#0E2B27' }}>
            {fmtMoney(monthlyRevenue)}
          </p>
          <p className="text-xs text-[#6B7C77] mt-1">paid this calendar month</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Equipment Available
          </p>
          <p className="stat-number mt-1.5">
            {equipAvailable} / {equipment.length}
          </p>
          <p className="text-xs text-[#6B7C77] mt-1">
            {equipMaint} maintenance • {equipDamaged} damaged
          </p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-[#6B7C77] uppercase tracking-wide">
            Classes Running
          </p>
          <p className="stat-number mt-1.5">{classes.length}</p>
          <p className="text-xs text-[#6B7C77] mt-1">active weekly sessions</p>
        </div>
      </div>

      {/* Middle Row: Revenue Chart & Membership Doughnut */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue 6-Month Chart */}
        <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                Revenue, last 6 months
              </h2>
              <p className="text-xs text-[#6B7C77]">
                Monthly subscription & pass collections (USD)
              </p>
            </div>
            <span className="badge badge-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Automated Recurring Active
            </span>
          </div>

          {/* Clean High-Precision Interactive SVG Chart */}
          <div className="w-full h-56 pt-2">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const y = 170 - p * 140;
                const val = Math.round(maxRevenue * p);
                return (
                  <g key={idx}>
                    <line
                      x1="40"
                      y1={y}
                      x2="580"
                      y2={y}
                      stroke="#EEF2EF"
                      strokeDasharray={idx === 0 ? 'none' : '4,4'}
                    />
                    <text
                      x="30"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#8FA39D"
                      fontFamily="Inter"
                    >
                      ${val}
                    </text>
                  </g>
                );
              })}

              {/* Area path & line path */}
              {(() => {
                const points = months.map((m, idx) => {
                  const x = 70 + idx * 100;
                  const y = 170 - (m.revenue / (maxRevenue || 1)) * 140;
                  return { x, y, ...m };
                });

                const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
                const areaPoints = `${points[0].x},170 ${linePoints} ${points[points.length - 1].x},170`;

                return (
                  <>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#CFFF3D" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#CFFF3D" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <polygon points={areaPoints} fill="url(#revGradient)" />
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="#0E2B27"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5"
                          fill="#0E2B27"
                          stroke="#CFFF3D"
                          strokeWidth="2"
                        />
                        {/* Data point tooltip hover */}
                        <text
                          x={p.x}
                          y={p.y - 10}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="#0E2B27"
                        >
                          ${p.revenue.toFixed(0)}
                        </text>
                        <text
                          x={p.x}
                          y="190"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="500"
                          fill="#6B7C77"
                        >
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Membership Doughnut & Breakdown */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                Membership status
              </h2>
              <button
                onClick={() => onNavigate('memberships')}
                className="text-xs font-semibold text-[#17544C] hover:underline"
              >
                Manage →
              </button>
            </div>
            <p className="text-xs text-[#6B7C77] mb-4">
              Subscription distribution across all members
            </p>
          </div>

          <div className="flex items-center justify-center my-2">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  const segments = [
                    { label: 'Active', count: statusCounts.Active, color: '#2F9E5B' },
                    { label: 'Expired', count: statusCounts.Expired, color: '#D8483A' },
                    { label: 'Frozen', count: statusCounts.Frozen, color: '#2E7DB8' },
                    { label: 'Cancelled', count: statusCounts.Cancelled, color: '#9AA6A2' },
                  ];
                  let accumulatedPercent = 0;
                  const total = memberships.length || 1;

                  return segments.map((seg, i) => {
                    const pct = (seg.count / total) * 100;
                    const strokeDasharray = `${pct} ${100 - pct}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += pct;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display font-bold text-2xl text-[#122420]">
                  {memberships.length}
                </span>
                <span className="text-[10px] text-[#6B7C77] uppercase font-semibold">Total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F9E5B]"></span>
              <span className="text-[#6B7C77]">Active:</span>
              <span className="font-semibold text-[#122420]">{statusCounts.Active}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8483A]"></span>
              <span className="text-[#6B7C77]">Expired:</span>
              <span className="font-semibold text-[#122420]">{statusCounts.Expired}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7DB8]"></span>
              <span className="text-[#6B7C77]">Frozen:</span>
              <span className="font-semibold text-[#122420]">{statusCounts.Frozen}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9AA6A2]"></span>
              <span className="text-[#6B7C77]">Cancelled:</span>
              <span className="font-semibold text-[#122420]">{statusCounts.Cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Equipment Status & Expiring Soon list */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                Equipment status
              </h2>
              <p className="text-xs text-[#6B7C77]">Inventory availability & safety status</p>
            </div>
            <button
              onClick={() => onNavigate('equipment')}
              className="btn btn-outline btn-sm text-xs"
            >
              Floor Logs →
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-[#122420]">Available</span>
                <span className="text-[#6B7C77] text-xs">
                  {equipAvailable} unit(s) (
                  {Math.round((equipAvailable / (equipment.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#EEF1EF] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(equipAvailable / (equipment.length || 1)) * 100}%`,
                    backgroundColor: '#2F9E5B',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-[#122420]">Under Maintenance</span>
                <span className="text-[#6B7C77] text-xs">
                  {equipMaint} unit(s) (
                  {Math.round((equipMaint / (equipment.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#EEF1EF] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(equipMaint / (equipment.length || 1)) * 100}%`,
                    backgroundColor: '#C9891A',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-[#122420]">Damaged / Awaiting Parts</span>
                <span className="text-[#6B7C77] text-xs">
                  {equipDamaged} unit(s) (
                  {Math.round((equipDamaged / (equipment.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#EEF1EF] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(equipDamaged / (equipment.length || 1)) * 100}%`,
                    backgroundColor: '#D8483A',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                Expiring soon
              </h2>
              <p className="text-xs text-[#6B7C77]">
                Active memberships expiring in the next 14 days
              </p>
            </div>
            <button
              onClick={() => onNavigate('memberships')}
              className="text-xs font-semibold text-[#17544C] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#DCE3DF]">
            {expiringSoon.length > 0 ? (
              expiringSoon.map((m) => {
                const mem = memberById(m.memberId);
                const plan = planById(m.planId);
                const d = daysUntil(m.endDate);
                return (
                  <div key={m.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="avatar w-8 h-8 text-[11px]">
                        {initials(mem?.fullName)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#122420]">
                          {mem?.fullName || 'Unknown Member'}
                        </p>
                        <p className="text-xs text-[#6B7C77]">
                          {plan?.name || 'Standard Plan'}
                          {m.autoRenew && (
                            <span className="ml-1 text-[10px] text-[#2F9E5B] font-semibold">
                              (Auto-Renew On)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${d <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                        {d === 0 ? 'Expires today' : `${d} day${d === 1 ? '' : 's'} left`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[#6B7C77] py-6 text-center">
                Nothing expiring in the next 14 days.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
