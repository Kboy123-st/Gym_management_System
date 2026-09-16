import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Role } from '../../types';
import { initials } from '../../utils/formatters';
import {
  User,
  Shield,
  Key,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  Save,
  Lock,
  LogOut,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, switchRole, logout, showToast } = useGym();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    showToast('Staff profile updated successfully', 'success');
  };

  const ROLE_DESCRIPTIONS: Record<Role, { title: string; desc: string; permissions: string[] }> = {
    admin: {
      title: 'Administrator',
      desc: 'Full read & write authorization across all gym financial, member, inventory, and system settings.',
      permissions: [
        'Manage members, trainers, memberships, classes, workouts, nutrition',
        'Trigger automated recurring billing engine & invoice generation',
        'View financial revenue analytics & export CSV reports',
        'Database backup & restore operations',
        'Configure operating hours & gym settings',
      ],
    },
    receptionist: {
      title: 'Front Desk / Receptionist',
      desc: 'Focused on daily operational check-in flow, member registrations, and class bookings.',
      permissions: [
        'Perform turnstile & QR code member check-in/check-out',
        'Register new gym members and assign memberships',
        'Collect counter payments and issue invoices',
        'View daily attendance logs and class rosters',
      ],
    },
    trainer: {
      title: 'Fitness Trainer / Coach',
      desc: 'Allocated to managing fitness classes, assigned client members, workout routines, and nutrition regimens.',
      permissions: [
        'View allocated client member list',
        'Design workout routines and assign to members',
        'Create dietary nutrition plans with macronutrient calories',
        'View class rosters and mark session attendance',
      ],
    },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card p-6 bg-white flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-[#0E2B27] text-[#CFFF3D] font-display font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm ring-4 ring-[#CFFF3D]/20">
          {initials(currentUser?.name)}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="font-display text-2xl font-bold text-[#122420]">
              {currentUser?.name}
            </h2>
            <span className="badge badge-info text-xs capitalize font-bold">
              {currentUser?.role}
            </span>
          </div>
          <p className="text-xs text-[#6B7C77] mt-0.5 font-mono">
            Username: @{currentUser?.username} • ID: {currentUser?.id}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-[#3F534E]">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#6B7C77]" />
              {currentUser?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#6B7C77]" />
              {currentUser?.phone}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <button
            onClick={logout}
            className="btn btn-outline btn-sm text-xs text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5"
            title="End staff session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Role Switching & Permissions Preview */}
      <div className="card p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#DCE3DF]">
          <Shield className="w-5 h-5 text-[#0E2B27]" />
          <h3 className="font-bold text-sm text-[#122420]">
            System Role &amp; Access Permissions
          </h3>
        </div>
        <p className="text-xs text-[#6B7C77] mt-2 mb-4">
          Switch roles to experience the application as an Administrator, Front Desk Receptionist, or Fitness Trainer:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['admin', 'receptionist', 'trainer'] as Role[]).map((r) => {
            const isCurrent = currentUser?.role === r;
            const info = ROLE_DESCRIPTIONS[r];
            return (
              <button
                key={r}
                onClick={() => {
                  switchRole(r);
                  showToast(`Switched active role to ${info.title}`, 'info');
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-[#0E2B27] text-white border-[#0E2B27] shadow-sm ring-2 ring-[#CFFF3D]'
                    : 'bg-white hover:bg-[#F4F6F4] border-[#DCE3DF] text-[#122420]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold capitalize ${isCurrent ? 'text-[#CFFF3D]' : 'text-[#0E2B27]'}`}>
                    {info.title}
                  </span>
                  {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#CFFF3D]" />}
                </div>
                <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-white/80' : 'text-[#6B7C77]'}`}>
                  {info.desc}
                </p>
              </button>
            );
          })}
        </div>

        {currentUser?.role && (
          <div className="mt-4 p-4 rounded-xl bg-[#F4F6F4] border border-[#DCE3DF]">
            <p className="text-xs font-bold text-[#0E2B27] mb-2">
              Granted Permissions for {ROLE_DESCRIPTIONS[currentUser.role].title}:
            </p>
            <ul className="space-y-1">
              {ROLE_DESCRIPTIONS[currentUser.role].permissions.map((perm, idx) => (
                <li key={idx} className="text-xs text-[#3F534E] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2F9E5B] shrink-0" />
                  <span>{perm}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#DCE3DF]">
          <User className="w-5 h-5 text-[#0E2B27]" />
          <h3 className="font-bold text-sm text-[#122420]">Edit Account Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="label">New Password (optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button type="submit" className="btn btn-primary btn-sm text-xs">
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
