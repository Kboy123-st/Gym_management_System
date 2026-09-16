import React, { useState } from 'react';
import { GymProvider, useGym } from './context/GymContext';
import { Sidebar } from './components/layout/Sidebar';
import { AppHeader } from './components/layout/AppHeader';
import { ToastContainer } from './components/common/ToastContainer';

import { DashboardView } from './components/dashboard/DashboardView';
import { MembersView } from './components/members/MembersView';
import { MembershipsView } from './components/memberships/MembershipsView';
import { ClassesView } from './components/classes/ClassesView';
import { TrainersView } from './components/trainers/TrainersView';
import { WorkoutsView } from './components/workouts/WorkoutsView';
import { NutritionView } from './components/nutrition/NutritionView';
import { EquipmentView } from './components/equipment/EquipmentView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { PaymentsView } from './components/payments/PaymentsView';
import { ReportsView } from './components/reports/ReportsView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { SettingsView } from './components/settings/SettingsView';
import { DatabaseSchemaView } from './components/schema/DatabaseSchemaView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';
import { LoginView } from './components/auth/LoginView';

const GymAppContent: React.FC = () => {
  const { currentUser, activeNav, setActiveNav } = useGym();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If no staff user is logged in, show the Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0E2B27]">
        <LoginView />
        <ToastContainer />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveNav} />;
      case 'members':
        return <MembersView />;
      case 'memberships':
        return <MembershipsView />;
      case 'classes':
        return <ClassesView />;
      case 'trainers':
        return <TrainersView />;
      case 'workouts':
        return <WorkoutsView />;
      case 'nutrition':
        return <NutritionView />;
      case 'equipment':
        return <EquipmentView />;
      case 'attendance':
        return <AttendanceView />;
      case 'payments':
        return <PaymentsView />;
      case 'reports':
        return <ReportsView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'schema':
        return <DatabaseSchemaView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView onNavigate={setActiveNav} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F4] text-[#122420]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={setActiveNav}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Area - md:pl-64 accommodates the 256px fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        {/* Top Header */}
        <AppHeader
          activeNav={activeNav}
          onNavigate={setActiveNav}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onToggleSidebar={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">{renderActiveView()}</div>
        </main>
      </div>

      {/* Floating System Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <GymProvider>
      <GymAppContent />
    </GymProvider>
  );
}
