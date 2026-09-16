import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { fmtMoney, fmtDate, todayISO } from '../../utils/formatters';
import { FileBarChart2, Printer, Download, FileSpreadsheet } from 'lucide-react';

type ReportKey =
  | 'members'
  | 'memberships'
  | 'expired'
  | 'attendance'
  | 'trainers'
  | 'revenue'
  | 'payments'
  | 'equipment'
  | 'classes';

export const ReportsView: React.FC = () => {
  const {
    members,
    memberships,
    trainers,
    attendance,
    equipment,
    payments,
    classes,
    memberById,
    planById,
    trainerById,
    showToast,
  } = useGym();

  const [currentReport, setCurrentReport] = useState<ReportKey>('members');

  const REPORTS: Record<
    ReportKey,
    {
      label: string;
      cols: string[];
      rows: () => (string | number)[][];
    }
  > = {
    members: {
      label: 'Member Registry Report',
      cols: ['Member ID', 'Full Name', 'Gender', 'Phone', 'Email', 'Registered'],
      rows: () =>
        members.map((m) => [
          m.memberCode,
          m.fullName,
          m.gender,
          m.phone,
          m.email,
          fmtDate(m.registrationDate),
        ]),
    },
    memberships: {
      label: 'Membership Subscriptions Report',
      cols: ['Member', 'Plan', 'Start Date', 'Expiration Date', 'Auto-Renew', 'Status'],
      rows: () =>
        memberships.map((m) => [
          memberById(m.memberId)?.fullName || '—',
          planById(m.planId)?.name || '—',
          fmtDate(m.startDate),
          fmtDate(m.endDate),
          m.autoRenew ? 'Enabled' : 'Off',
          m.status,
        ]),
    },
    expired: {
      label: 'Expired Memberships Audit Report',
      cols: ['Member', 'Plan', 'Expired Date', 'Phone Number'],
      rows: () =>
        memberships
          .filter((m) => m.status === 'Expired')
          .map((m) => {
            const mem = memberById(m.memberId);
            return [
              mem?.fullName || '—',
              planById(m.planId)?.name || '—',
              fmtDate(m.endDate),
              mem?.phone || '—',
            ];
          }),
    },
    attendance: {
      label: 'Facility Attendance & Session Log Report',
      cols: ['Member', 'Date', 'Check-In', 'Check-Out', 'Session Name', 'Method'],
      rows: () =>
        attendance.map((a) => [
          memberById(a.memberId)?.fullName || '—',
          fmtDate(a.date),
          a.checkIn || '—',
          a.checkOut || 'On Premises',
          a.sessionName || 'Gym Floor Access',
          a.method,
        ]),
    },
    trainers: {
      label: 'Trainer Staff Roster Report',
      cols: ['Trainer ID', 'Name', 'Specialty', 'Experience (Yrs)', 'Monthly Salary', 'Status'],
      rows: () =>
        trainers.map((t) => [
          t.trainerCode,
          t.name,
          t.specialty,
          t.experienceYears,
          fmtMoney(t.salary),
          t.status,
        ]),
    },
    revenue: {
      label: 'Monthly Revenue Aggregation Report',
      cols: ['Month Period', 'Total Revenue Collected', 'Paid Invoices Count'],
      rows: () => {
        const paid = payments.filter((x) => x.status === 'Paid');
        const map: Record<string, { total: number; count: number }> = {};
        paid.forEach((x) => {
          const k = x.date.slice(0, 7);
          const current = map[k] || { total: 0, count: 0 };
          current.total += x.netAmount ?? x.amount;
          current.count += 1;
          map[k] = current;
        });
        return Object.entries(map)
          .sort()
          .reverse()
          .map(([k, v]) => [k, fmtMoney(v.total), v.count]);
      },
    },
    payments: {
      label: 'Payment Invoices & Transactions Report',
      cols: ['Invoice #', 'Member', 'Amount', 'Method', 'Date', 'Billing Type', 'Status'],
      rows: () =>
        payments.map((p) => [
          p.invoiceNo,
          memberById(p.memberId)?.fullName || '—',
          fmtMoney(p.netAmount ?? p.amount),
          p.method,
          fmtDate(p.date),
          p.autoBilled ? 'Recurring Auto-Billing' : 'Manual Receipt',
          p.status,
        ]),
    },
    equipment: {
      label: 'Equipment Inventory & Preventive Maintenance Report',
      cols: ['Asset Name', 'Category', 'Status', 'Last Serviced', 'Next Service Due'],
      rows: () =>
        equipment.map((e) => [
          e.name,
          e.category,
          e.status,
          fmtDate(e.lastMaintenance),
          fmtDate(e.nextMaintenance),
        ]),
    },
    classes: {
      label: 'Class Participation & Capacity Report',
      cols: ['Class Name', 'Instructor', 'Schedule', 'Enrolled', 'Capacity', 'Occupancy Rate'],
      rows: () =>
        classes.map((c) => {
          const occ = Math.round((c.enrolledMemberIds.length / (c.capacity || 1)) * 100);
          return [
            c.name,
            trainerById(c.trainerId)?.name || '—',
            `${c.day} ${c.time}`,
            c.enrolledMemberIds.length,
            c.capacity,
            `${occ}%`,
          ];
        }),
    },
  };

  const currentDef = REPORTS[currentReport];
  const tableRows = currentDef.rows();

  const handleExportCsv = () => {
    const csvContent = [
      currentDef.cols.join(','),
      ...tableRows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentReport}-report-${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Report Selector & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <select
          value={currentReport}
          onChange={(e) => setCurrentReport(e.target.value as ReportKey)}
          className="input max-w-sm font-medium"
        >
          {Object.entries(REPORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn btn-outline">
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button onClick={handleExportCsv} className="btn btn-accent">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="card overflow-x-auto">
        <div className="p-5 border-b border-[#DCE3DF]">
          <h2 className="font-display text-2xl font-bold tracking-wide text-[#122420]">
            {currentDef.label}
          </h2>
          <p className="text-xs text-[#6B7C77] mt-1">
            Generated {fmtDate(todayISO())} • System database source: Iron &amp; Lime Fitness
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              {currentDef.cols.map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length > 0 ? (
              tableRows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className={cellIdx === 0 ? 'font-semibold text-[#122420]' : ''}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={currentDef.cols.length} className="text-center py-12 text-[#6B7C77]">
                  No records found for this report criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
