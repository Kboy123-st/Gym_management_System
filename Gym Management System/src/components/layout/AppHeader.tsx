import React from 'react';
import { useGym } from '../../context/GymContext';
import { ActiveNavKey, Role } from '../../types';
import { fmtDate, todayISO, initials } from '../../utils/formatters';
import { Menu, Zap, Database, RefreshCw, LogOut } from 'lucide-react';

interface AppHeaderProps {
  activeNav?: ActiveNavKey;
  onNavigate?: (key: ActiveNavKey) => void;
  onOpenMobileMenu?: () => void;
  onToggleSidebar?: () => void;
}

const PAGE_TITLES: Record<ActiveNavKey, { title: string; desc: string }> = {
  dashboard: { title: 'Dashboard', desc: 'Real-time overview of gym floor, memberships, and revenue' },
  members: { title: 'Members Directory', desc: 'Manage member records, profiles, and assigned trainers' },
  trainers: { title: 'Trainer Roster', desc: 'Staff trainers, certifications, salaries, and client allocations' },
  memberships: { title: 'Memberships & Subscriptions', desc: 'Membership packages, recurring renewals, and status controls' },
  attendance: { title: 'Attendance & Access', desc: 'Live floor check-in, simulated QR code scanning, and daily logs' },
  classes: { title: 'Fitness Classes', desc: 'Weekly schedule, trainer assignments, rosters, and capacity meters' },
  workouts: { title: 'Workout Programs', desc: 'Custom routines, exercise sets & reps, and client assignments' },
  nutrition: { title: 'Nutrition Plans', desc: 'Daily dietary schedules, macro calories, and meal breakdowns' },
  equipment: { title: 'Equipment Management', desc: 'Floor asset inventory, service logs, and maintenance alerts' },
  payments: { title: 'Billing & Payments', desc: 'Invoices, automated recurring billing engine, and payment receipts' },
  reports: { title: 'System Reports', desc: 'Analytical summaries with instant CSV and printable export' },
  announcements: { title: 'Announcements', desc: 'Publish broadcast notices and news for staff and members' },
  notifications: { title: 'Alerts & Reminders', desc: 'Automated triggers: expirations, pending dues, birthdays, maintenance' },
  schema: { title: 'Database Schema & Architecture', desc: 'Relational schema for recurring payments and session attendance tracking' },
  settings: { title: 'Gym Settings', desc: 'Facility details, operating hours, currency, and database backup/restore' },
  profile: { title: 'Staff Profile', desc: 'Current user credentials, contact information, and security' },
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeNav: propActiveNav,
  onNavigate: propOnNavigate,
  onOpenMobileMenu,
  onToggleSidebar,
}) => {
  const {
    currentUser,
    switchRole,
    logout,
    runAutomatedBillingCycle,
    activeNav: ctxActiveNav,
    setActiveNav,
  } = useGym();
  const activeNav = propActiveNav || ctxActiveNav;
  const onNavigate = propOnNavigate || setActiveNav;
  const toggleMobile = onOpenMobileMenu || onToggleSidebar || (() => {});
  const pageMeta = PAGE_TITLES[activeNav] || { title: 'Iron & Lime', desc: '' };

  const handleNavigate = (key: ActiveNavKey) => {
    if (typeof onNavigate === 'function') {
      onNavigate(key);
    }
  };

  const handleRunBilling = () => {
    runAutomatedBillingCycle();
  };

  return (
    <header className="h-16 bg-white border-b border-[#DCE3DF] flex items-center justify-between gap-3 px-4 md:px-7 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 rounded-lg text-[#122420] hover:bg-[#EEF2EF] transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-wide text-[#122420] truncate">
              {pageMeta.title}
            </h1>
            {activeNav === 'payments' && (
              <span className="badge badge-success hidden sm:inline-flex">
                Auto-Billing Active
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Database Schema Button */}
        <button
          onClick={() => handleNavigate('schema')}
          className={`btn btn-sm hidden lg:inline-flex items-center gap-1.5 ${
            activeNav === 'schema' ? 'btn-primary' : 'btn-outline text-xs'
          }`}
          title="Inspect relational database schema for recurring payments and attendance"
        >
          <Database className="w-3.5 h-3.5 text-[#2E7DB8]" />
          <span>DB Schema</span>
        </button>

        {/* Trigger Automated Billing Simulation */}
        <button
          onClick={handleRunBilling}
          className="btn btn-outline btn-sm hidden sm:inline-flex items-center gap-1 text-xs text-[#0E2B27]"
          title="Simulate automated recurring billing engine check"
        >
          <RefreshCw className="w-3 h-3 text-[#2F9E5B]" />
          <span>Run Auto-Billing</span>
        </button>

        {/* Demo Role Switcher */}
        <div className="flex items-center gap-1 bg-[#EEF2EF] p-1 rounded-lg border border-[#DCE3DF]">
          <span className="text-[11px] font-semibold text-[#6B7C77] px-1.5 hidden sm:inline">Role:</span>
          {(['admin', 'receptionist', 'trainer'] as Role[]).map((r) => {
            const isActive = currentUser?.role === r;
            return (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`text-xs px-2 py-0.5 rounded capitalize font-medium transition-all ${
                  isActive
                    ? 'bg-[#0E2B27] text-[#CFFF3D] shadow-xs'
                    : 'text-[#3F534E] hover:text-[#122420] hover:bg-white/60'
                }`}
              >
                {r === 'receptionist' ? 'Reception' : r}
              </button>
            );
          })}
        </div>

        {/* Date */}
        <span className="text-xs text-[#6B7C77] font-medium hidden xl:inline">
          {fmtDate(todayISO())}
        </span>

        {/* User avatar */}
        <button
          onClick={() => handleNavigate('profile')}
          className="avatar text-xs cursor-pointer ring-2 ring-transparent hover:ring-[#CFFF3D] transition-all"
          title={`${currentUser?.name} (${currentUser?.role}) - Click for profile`}
        >
          {initials(currentUser?.name)}
        </button>

        {/* Quick Logout Button */}
        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-[#6B7C77] hover:text-[#D8483A] hover:bg-red-50 transition-colors ml-0.5"
          title="Log out of session"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
