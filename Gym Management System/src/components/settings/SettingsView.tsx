import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Settings as SettingsIcon, Save, Database, RefreshCcw, Download } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDatabase,
    members,
    memberships,
    plans,
    trainers,
    classes,
    payments,
    attendance,
    equipment,
    workouts,
    nutrition,
    announcements,
    showToast,
  } = useGym();

  const [form, setForm] = useState({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  const handleExportJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings: form,
      members,
      memberships,
      plans,
      trainers,
      classes,
      payments,
      attendance,
      equipment,
      workouts,
      nutrition,
      announcements,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `iron-lime-gym-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Complete gym database backup exported', 'success');
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all data back to the clean initial demo database?'
      )
    ) {
      resetDatabase();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Facility Information */}
        <div className="card p-5 space-y-4">
          <div className="border-b border-[#DCE3DF] pb-3">
            <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
              Facility &amp; Business Profile
            </h3>
            <p className="text-xs text-[#6B7C77]">
              Company details displayed on invoices, contracts, and attendance passes
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Gym Facility Name *</label>
              <input
                required
                className="input"
                value={form.gymName}
                onChange={(e) => setForm({ ...form, gymName: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Currency Symbol *</label>
              <input
                required
                className="input"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Official Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Contact Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Physical Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Operating Hours</label>
              <input
                className="input"
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Automated Billing Configuration */}
        <div className="card p-5 space-y-4">
          <div className="border-b border-[#DCE3DF] pb-3">
            <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
              Automated Recurring Billing Engine Settings
            </h3>
            <p className="text-xs text-[#6B7C77]">
              Configure payment automation triggers and grace periods
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Billing Grace Period (Days)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.autoBillingGraceDays}
                onChange={(e) =>
                  setForm({ ...form, autoBillingGraceDays: Number(e.target.value) })
                }
              />
              <p className="text-[11px] text-[#6B7C77] mt-1">
                Days before an unpaid renewed subscription is flagged as Expired.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 text-sm text-[#122420] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableAutoBilling}
                  onChange={(e) => setForm({ ...form, enableAutoBilling: e.target.checked })}
                  className="rounded text-[#0E2B27] focus:ring-[#0E2B27]"
                />
                <span className="font-semibold">Enable Automated Recurring Engine</span>
              </label>
              <p className="text-[11px] text-[#6B7C77] mt-1 ml-6">
                When active, the system triggers subscription renewals for all auto-renew members.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button type="submit" className="btn btn-accent px-6 py-2.5">
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Reset Operations */}
      <div className="card p-5 space-y-4 border-t-4 border-t-[#0E2B27]">
        <div className="border-b border-[#DCE3DF] pb-3">
          <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
            Database &amp; Data Governance
          </h3>
          <p className="text-xs text-[#6B7C77]">
            Full JSON data export, system restore, and data backup utility
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={handleExportJson} className="btn btn-outline">
            <Download className="w-4 h-4" />
            <span>Export Full JSON Database</span>
          </button>
          <button onClick={handleReset} className="btn btn-danger">
            <RefreshCcw className="w-4 h-4" />
            <span>Reset to Initial Seed Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
