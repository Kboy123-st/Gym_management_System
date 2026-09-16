import React from 'react';
import { useGym } from '../../context/GymContext';
import { ActiveNavKey, Role } from '../../types';
import { initials, daysUntil, todayISO } from '../../utils/formatters';
import {
  LayoutDashboard,
  Users,
  Award,
  CreditCard,
  CheckSquare,
  CalendarDays,
  Dumbbell,
  Salad,
  Wrench,
  Receipt,
  FileBarChart2,
  Megaphone,
  Bell,
  Database,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeNav?: ActiveNavKey;
  onNavigate?: (key: ActiveNavKey) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  key: ActiveNavKey;
  label: string;
  roles: Role[];
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav: propActiveNav,
  onNavigate: propOnNavigate,
  mobileOpen: propMobileOpen,
  onCloseMobile: propOnCloseMobile,
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    logout,
    memberships,
    payments,
    equipment,
    activeNav: ctxActiveNav,
    setActiveNav,
  } = useGym();
  const activeNav = propActiveNav || ctxActiveNav;
  const onNavigate = propOnNavigate || setActiveNav;
  const isMobileOpen = propMobileOpen ?? isOpen ?? false;
  const closeMobile = propOnCloseMobile || onClose || (() => {});
  const role = currentUser?.role || 'admin';

  // Calculate dynamic notification count
  const expiringCount = memberships.filter(
    (m) => m.status === 'Active' && daysUntil(m.endDate) <= 7 && daysUntil(m.endDate) >= 0
  ).length;
  const pendingPaymentsCount = payments.filter((p) => p.status === 'Pending').length;
  const maintenanceCount = equipment.filter((e) => daysUntil(e.nextMaintenance) <= 5).length;
  const totalNotifications = expiringCount + pendingPaymentsCount + maintenanceCount;

  const NAV_SECTIONS: NavSection[] = [
    {
      label: 'Overview',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          roles: ['admin', 'receptionist', 'trainer'],
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'People',
      items: [
        {
          key: 'members',
          label: 'Members',
          roles: ['admin', 'receptionist', 'trainer'],
          icon: Users,
        },
        {
          key: 'trainers',
          label: 'Trainers',
          roles: ['admin', 'receptionist'],
          icon: Award,
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          key: 'memberships',
          label: 'Memberships',
          roles: ['admin', 'receptionist'],
          icon: CreditCard,
        },
        {
          key: 'attendance',
          label: 'Attendance',
          roles: ['admin', 'receptionist', 'trainer'],
          icon: CheckSquare,
        },
        {
          key: 'classes',
          label: 'Classes',
          roles: ['admin', 'receptionist', 'trainer'],
          icon: CalendarDays,
        },
        {
          key: 'workouts',
          label: 'Workout Plans',
          roles: ['admin', 'trainer'],
          icon: Dumbbell,
        },
        {
          key: 'nutrition',
          label: 'Nutrition Plans',
          roles: ['admin', 'trainer'],
          icon: Salad,
        },
        {
          key: 'equipment',
          label: 'Equipment',
          roles: ['admin', 'receptionist'],
          icon: Wrench,
        },
      ],
    },
    {
      label: 'Business',
      items: [
        {
          key: 'payments',
          label: 'Payments & Billing',
          roles: ['admin', 'receptionist'],
          icon: Receipt,
          badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} due` : undefined,
        },
        {
          key: 'reports',
          label: 'Reports',
          roles: ['admin'],
          icon: FileBarChart2,
        },
        {
          key: 'announcements',
          label: 'Announcements',
          roles: ['admin', 'receptionist'],
          icon: Megaphone,
        },
        {
          key: 'notifications',
          label: 'Notifications',
          roles: ['admin', 'receptionist', 'trainer'],
          icon: Bell,
          badge: totalNotifications > 0 ? totalNotifications : undefined,
        },
        {
          key: 'schema',
          label: 'Database Schema',
          roles: ['admin', 'receptionist', 'trainer'],
          icon: Database,
          badge: 'Assignment',
        },
        {
          key: 'settings',
          label: 'Settings',
          roles: ['admin'],
          icon: Settings,
        },
      ],
    },
  ];

  const handleItemClick = (key: ActiveNavKey) => {
    if (typeof onNavigate === 'function') {
      onNavigate(key);
    }
    if (typeof closeMobile === 'function') {
      closeMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-64 bg-[#0E2B27] flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#CFFF3D] flex items-center justify-center font-display font-bold text-[#0B211D] text-base shadow-xs">
              IL
            </div>
            <div>
              <p className="font-display text-white text-lg font-bold leading-none tracking-wider">
                IRON &amp; LIME
              </p>
              <p className="text-[10px] text-[#8FA39D] leading-none mt-1 font-medium tracking-wide">
                Gym Management System
              </p>
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="md:hidden text-white/70 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((it) => it.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="mb-2">
                <div className="nav-group-label">{section.label}</div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleItemClick(item.key)}
                      className={`nav-link w-full text-left justify-between ${
                        isActive ? 'active' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            item.key === 'schema'
                              ? 'bg-[#2E7DB8]/20 text-[#2E7DB8] border border-[#2E7DB8]/30'
                              : 'bg-[#CFFF3D]/20 text-[#CFFF3D]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="border-t border-white/10 p-3 shrink-0">
          <button
            onClick={() => handleItemClick('profile')}
            className={`nav-link w-full ${activeNav === 'profile' ? 'active' : ''}`}
          >
            <span className="avatar w-7 h-7 text-xs">{initials(currentUser?.name)}</span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-[#8FA39D] capitalize truncate">{currentUser?.role}</p>
            </div>
          </button>
          <button
            onClick={logout}
            className="nav-link w-full mt-1 text-[#DCE3DF] hover:text-[#D8483A]"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
