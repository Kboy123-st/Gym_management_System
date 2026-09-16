import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { fmtMoney, fmtDate, todayISO } from '../../utils/formatters';
import {
  Database,
  Table,
  Key,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Play,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SchemaTable {
  name: string;
  category: 'Billing & Recurring Payments' | 'Session Attendance' | 'Core Entities' | 'Operations';
  description: string;
  columns: {
    name: string;
    type: string;
    constraints: string;
    description: string;
  }[];
  relationships: string[];
}

const TABLES: SchemaTable[] = [
  {
    name: 'recurring_schedules',
    category: 'Billing & Recurring Payments',
    description: 'Tracks automated recurrence contracts, frequency intervals, next charge cycles, and payment token states.',
    columns: [
      { name: 'id', type: 'VARCHAR(36)', constraints: 'PRIMARY KEY', description: 'Unique UUID identifier' },
      { name: 'membership_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES memberships(id) ON DELETE CASCADE', description: 'Associated member contract' },
      { name: 'billing_cycle_days', type: 'INT', constraints: 'NOT NULL DEFAULT 30', description: 'Billing frequency (e.g. 30 for monthly, 365 for annual)' },
      { name: 'next_billing_date', type: 'DATE', constraints: 'NOT NULL, INDEXED', description: 'Date automated billing worker processes renewal' },
      { name: 'auto_renew', type: 'BOOLEAN', constraints: 'NOT NULL DEFAULT TRUE', description: 'Whether recurring auto-debit is active' },
      { name: 'retry_count', type: 'INT', constraints: 'DEFAULT 0', description: 'Failed attempt counter for dunning process' },
      { name: 'payment_token', type: 'VARCHAR(255)', constraints: 'NULLABLE', description: 'Vaulted gateway token for automated processing' },
      { name: 'last_billing_date', type: 'DATE', constraints: 'NULLABLE', description: 'Timestamp of last successful charge cycle' },
    ],
    relationships: [
      'Belongs to memberships (1:1 relationship)',
      'Triggers generation of payment_invoices on renewal cycle',
    ],
  },
  {
    name: 'payment_invoices',
    category: 'Billing & Recurring Payments',
    description: 'Immutable transaction ledger records capturing recurring dues, manual counter sales, payment gateways, and invoice status.',
    columns: [
      { name: 'id', type: 'VARCHAR(36)', constraints: 'PRIMARY KEY', description: 'Unique payment record ID' },
      { name: 'invoice_number', type: 'VARCHAR(32)', constraints: 'UNIQUE NOT NULL, INDEXED', description: 'Human-readable receipt identifier (INV-XXXX)' },
      { name: 'member_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES members(id)', description: 'Payer member identifier' },
      { name: 'membership_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES memberships(id) NULLABLE', description: 'Linked subscription if applicable' },
      { name: 'billing_type', type: 'ENUM', constraints: "'automated_recurring' | 'initial_signup' | 'counter_manual'", description: 'Origin of payment transaction' },
      { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL CHECK (amount >= 0)', description: 'Gross invoice total' },
      { name: 'discount', type: 'DECIMAL(10,2)', constraints: 'DEFAULT 0.00', description: 'Applied discount or promo reduction' },
      { name: 'net_amount', type: 'DECIMAL(10,2)', constraints: 'GENERATED ALWAYS AS (amount - discount)', description: 'Net amount collected' },
      { name: 'status', type: 'ENUM', constraints: "'Paid' | 'Pending' | 'Failed' | 'Refunded'", description: 'State of transaction' },
      { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Card, Cash, Bank Transfer, Apple Pay' },
      { name: 'transaction_date', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP, INDEXED', description: 'Execution timestamp' },
    ],
    relationships: [
      'Belongs to members (N:1)',
      'Optionally references memberships (N:1)',
    ],
  },
  {
    name: 'session_attendance',
    category: 'Session Attendance',
    description: 'Floor and class access log capturing physical check-ins, turnstile triggers, QR code verifications, and session durations.',
    columns: [
      { name: 'id', type: 'VARCHAR(36)', constraints: 'PRIMARY KEY', description: 'Unique attendance log record ID' },
      { name: 'member_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES members(id) ON DELETE CASCADE, INDEXED', description: 'Checking-in member' },
      { name: 'session_date', type: 'DATE', constraints: 'NOT NULL, INDEXED', description: 'Calendar date of attendance' },
      { name: 'check_in_time', type: 'TIME', constraints: 'NOT NULL', description: 'Timestamp when turnstile/scan verified access' },
      { name: 'check_out_time', type: 'TIME', constraints: 'NULLABLE', description: 'Timestamp when member departed facility' },
      { name: 'method', type: 'ENUM', constraints: "'QR Code' | 'Manual' | 'Kiosk' | 'Biometric'", description: 'Verification device source' },
      { name: 'session_type', type: 'ENUM', constraints: "'general_gym' | 'fitness_class' | 'personal_training'", description: 'Activity context' },
      { name: 'class_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES fitness_classes(id) NULLABLE', description: 'Class session if registered' },
      { name: 'verified_by_user_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES users(id) NULLABLE', description: 'Staff member verifying entry' },
    ],
    relationships: [
      'Belongs to members (N:1)',
      'Optionally belongs to fitness_classes (N:1)',
      'Audited by staff users (N:1)',
    ],
  },
  {
    name: 'memberships',
    category: 'Core Entities',
    description: 'Active, expired, or frozen contract assignments binding members to plans with automated expiry calculations.',
    columns: [
      { name: 'id', type: 'VARCHAR(36)', constraints: 'PRIMARY KEY', description: 'Unique contract ID' },
      { name: 'member_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES members(id), INDEXED', description: 'Target gym member' },
      { name: 'plan_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES membership_plans(id)', description: 'Assigned plan pricing & duration' },
      { name: 'start_date', type: 'DATE', constraints: 'NOT NULL', description: 'Effective start date' },
      { name: 'end_date', type: 'DATE', constraints: 'NOT NULL, INDEXED', description: 'Expiration date for access evaluation' },
      { name: 'status', type: 'ENUM', constraints: "'Active' | 'Expired' | 'Frozen' | 'Cancelled'", description: 'Current authorization status' },
      { name: 'auto_renew', type: 'BOOLEAN', constraints: 'DEFAULT TRUE', description: 'Eligible for recurring automated billing' },
      { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'DEFAULT \'Credit Card\'', description: 'Preferred recurring billing method' },
    ],
    relationships: [
      'References members (N:1)',
      'References membership_plans (N:1)',
      'Has one recurring_schedules (1:1)',
      'Has many payment_invoices (1:N)',
    ],
  },
  {
    name: 'fitness_classes',
    category: 'Session Attendance',
    description: 'Weekly scheduled group fitness sessions, capacity thresholds, trainer allocations, and enrolled member rosters.',
    columns: [
      { name: 'id', type: 'VARCHAR(36)', constraints: 'PRIMARY KEY', description: 'Unique class ID' },
      { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Class title (e.g. HIIT Blast, Power Yoga)' },
      { name: 'trainer_id', type: 'VARCHAR(36)', constraints: 'FOREIGN KEY REFERENCES trainers(id)', description: 'Lead instructor' },
      { name: 'day_of_week', type: 'ENUM', constraints: "'Monday'...'Sunday'", description: 'Weekly recurrence day' },
      { name: 'start_time', type: 'TIME', constraints: 'NOT NULL', description: 'Scheduled start' },
      { name: 'duration_min', type: 'INT', constraints: 'NOT NULL CHECK (duration_min > 0)', description: 'Session duration in minutes' },
      { name: 'max_capacity', type: 'INT', constraints: 'NOT NULL', description: 'Room headcount cap' },
      { name: 'room', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Studio A, Yoga Hall, Main Floor' },
    ],
    relationships: [
      'Instructor assigned via trainers (N:1)',
      'Attendance verified through session_attendance (1:N)',
    ],
  },
];

const SQL_DDL = `-- ============================================================================
-- IRON & LIME GYM MANAGEMENT SYSTEM - RELATIONAL SCHEMA
-- Production DDL for Recurring Payments & Session Attendance Tracking
-- ============================================================================

-- 1. Members Core Table
CREATE TABLE members (
    id VARCHAR(36) PRIMARY KEY,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    dob DATE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(30),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trainer_id VARCHAR(36),
    health_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_members_code ON members(member_code);
CREATE INDEX idx_members_email ON members(email);

-- 2. Membership Plans Catalog
CREATE TABLE membership_plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    type VARCHAR(30) NOT NULL, -- Daily, Monthly, Annual
    duration_days INT NOT NULL CHECK (duration_days > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    billing_cycle_days INT NOT NULL DEFAULT 30
);

-- 3. Active Memberships & Recurring Status
CREATE TABLE memberships (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id VARCHAR(36) NOT NULL REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Expired, Frozen, Cancelled
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    payment_method VARCHAR(50) DEFAULT 'Credit Card',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);
CREATE INDEX idx_memberships_member ON memberships(member_id);
CREATE INDEX idx_memberships_expiry ON memberships(end_date, status);
CREATE INDEX idx_memberships_autorenew ON memberships(auto_renew, status);

-- 4. Recurring Billing Schedules & Automation Worker
CREATE TABLE recurring_schedules (
    id VARCHAR(36) PRIMARY KEY,
    membership_id VARCHAR(36) NOT NULL UNIQUE REFERENCES memberships(id) ON DELETE CASCADE,
    next_billing_date DATE NOT NULL,
    billing_cycle_days INT NOT NULL DEFAULT 30,
    retry_count INT DEFAULT 0,
    payment_token VARCHAR(255),
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    last_billing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_recurring_next_bill ON recurring_schedules(next_billing_date, auto_renew);

-- 5. Payment Invoices & Audit Ledger
CREATE TABLE payment_invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(32) NOT NULL UNIQUE,
    member_id VARCHAR(36) NOT NULL REFERENCES members(id),
    membership_id VARCHAR(36) REFERENCES memberships(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    discount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - discount) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'Paid', -- Paid, Pending, Failed, Refunded
    payment_method VARCHAR(50) NOT NULL,
    billing_type VARCHAR(30) NOT NULL, -- automated_recurring, initial_signup, manual
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_invoices_member ON payment_invoices(member_id);
CREATE INDEX idx_invoices_status ON payment_invoices(status);
CREATE INDEX idx_invoices_date ON payment_invoices(transaction_date);

-- 6. Session Attendance Tracking & QR Access
CREATE TABLE session_attendance (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    check_in_time TIME NOT NULL,
    check_out_time TIME,
    method VARCHAR(30) NOT NULL DEFAULT 'QR Code', -- QR Code, Manual, Kiosk
    session_type VARCHAR(40) NOT NULL DEFAULT 'general_gym', -- general_gym, class_session
    class_id VARCHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'Completed'
);
CREATE INDEX idx_attendance_member_date ON session_attendance(member_id, session_date);
CREATE INDEX idx_attendance_date ON session_attendance(session_date);`;

export const DatabaseSchemaView: React.FC = () => {
  const { memberships, payments, attendance, members, runAutomatedBillingCycle, showToast } = useGym();
  const [selectedTable, setSelectedTable] = useState<string>('recurring_schedules');
  const [activeTab, setActiveTab] = useState<'tables' | 'ddl' | 'queries'>('tables');
  const [queryResult, setQueryResult] = useState<string | null>(null);

  const activeRecurringCount = memberships.filter((m) => m.autoRenew && m.status === 'Active').length;
  const todayAttendanceCount = attendance.filter((a) => a.date === todayISO()).length;
  const totalPaidRevenue = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.netAmount ?? p.amount), 0);

  const handleTestRecurringBilling = () => {
    const result = runAutomatedBillingCycle();
    setQueryResult(
      `-- AUTOMATED BILLING WORKER EXECUTION OUTPUT:\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Status: SUCCESS\n` +
      `Evaluated Contracts: ${memberships.length}\n` +
      `Processed Renewals: ${result.processedCount}\n` +
      `Total Revenue Captured: ${fmtMoney(result.totalAmount)}\n` +
      `Renewed Members: ${result.renewedMemberNames.length > 0 ? result.renewedMemberNames.join(', ') : 'None due today'}\n` +
      `Audit Log: payment_invoices record appended, membership.endDate incremented.`
    );
  };

  const handleTestAttendanceQuery = () => {
    const todaySessions = attendance.filter((a) => a.date === todayISO());
    setQueryResult(
      `-- SESSION ATTENDANCE QUERY RESULT:\n` +
      `SELECT a.id, m.full_name, a.check_in_time, a.check_out_time, a.method, a.session_name\n` +
      `FROM session_attendance a\n` +
      `JOIN members m ON a.member_id = m.id\n` +
      `WHERE a.session_date = CURRENT_DATE\n` +
      `ORDER BY a.check_in_time DESC;\n\n` +
      `-- Returned ${todaySessions.length} rows for ${todayISO()}:\n` +
      JSON.stringify(
        todaySessions.map((s) => ({
          member: members.find((m) => m.id === s.memberId)?.fullName || s.memberId,
          checkIn: s.checkInTime,
          checkOut: s.checkOutTime || 'Active Floor',
          method: s.method,
          type: s.sessionName,
        })),
        null,
        2
      )
    );
  };

  const currentTable = TABLES.find((t) => t.name === selectedTable) || TABLES[0];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="card p-6 bg-gradient-to-r from-[#0E2B27] to-[#16403A] text-white border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-[#CFFF3D] text-[#0B211D] font-bold text-xs uppercase tracking-wider">
                System Architecture
              </span>
              <span className="badge bg-white/20 text-white text-xs">
                PostgreSQL / MySQL Schema
              </span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-wide text-white">
              Database Schema &amp; Data Models
            </h2>
            <p className="text-white/80 text-sm mt-1 max-w-2xl">
              Relational architecture designed specifically to handle recurring automated billing cycles,
              dunning retry schedules, session attendance check-ins, and floor access logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-white/70">Auto-Renew Members</p>
              <p className="font-display text-2xl font-bold text-[#CFFF3D]">{activeRecurringCount}</p>
            </div>
            <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-white/70">Today Check-Ins</p>
              <p className="font-display text-2xl font-bold text-white">{todayAttendanceCount}</p>
            </div>
            <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/10 text-center">
              <p className="text-[10px] uppercase font-bold text-white/70">Captured Revenue</p>
              <p className="font-display text-2xl font-bold text-[#CFFF3D]">{fmtMoney(totalPaidRevenue)}</p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('tables')}
            className={`btn btn-sm ${
              activeTab === 'tables'
                ? 'bg-[#CFFF3D] text-[#0B211D] font-bold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Interactive Table Explorer</span>
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`btn btn-sm ${
              activeTab === 'ddl'
                ? 'bg-[#CFFF3D] text-[#0B211D] font-bold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SQL DDL Schema</span>
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`btn btn-sm ${
              activeTab === 'queries'
                ? 'bg-[#CFFF3D] text-[#0B211D] font-bold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Live Query Simulator</span>
          </button>
        </div>
      </div>

      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7C77] px-1">
              Schema Tables ({TABLES.length})
            </h3>
            <div className="space-y-1.5">
              {TABLES.map((tbl) => {
                const isSelected = tbl.name === selectedTable;
                return (
                  <button
                    key={tbl.name}
                    onClick={() => setSelectedTable(tbl.name)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-white border-[#0E2B27] shadow-sm ring-1 ring-[#0E2B27]'
                        : 'bg-white/70 hover:bg-white border-[#DCE3DF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#122420]">{tbl.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          tbl.category.includes('Billing')
                            ? 'bg-emerald-100 text-emerald-800'
                            : tbl.category.includes('Attendance')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tbl.columns.length} cols
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7C77] mt-1 line-clamp-2 leading-relaxed">
                      {tbl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Details */}
          <div className="lg:col-span-8 card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DCE3DF]">
              <div>
                <span className="badge badge-info text-xs">{currentTable.category}</span>
                <h3 className="font-mono text-xl font-bold text-[#122420] mt-1">
                  {currentTable.name}
                </h3>
                <p className="text-xs text-[#6B7C77] mt-0.5">{currentTable.description}</p>
              </div>
            </div>

            {/* Columns Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3DF] bg-[#F4F6F4] text-[#3F534E]">
                    <th className="p-2.5 font-bold">Column Name</th>
                    <th className="p-2.5 font-bold">Type</th>
                    <th className="p-2.5 font-bold">Constraints</th>
                    <th className="p-2.5 font-bold">Role / Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3DF]">
                  {currentTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-[#F9FAF9]">
                      <td className="p-2.5 font-mono font-bold text-[#0E2B27] whitespace-nowrap flex items-center gap-1.5">
                        {col.constraints.includes('PRIMARY KEY') && (
                          <Key className="w-3 h-3 text-amber-600 shrink-0" />
                        )}
                        {col.constraints.includes('FOREIGN KEY') && (
                          <Layers className="w-3 h-3 text-blue-600 shrink-0" />
                        )}
                        <span>{col.name}</span>
                      </td>
                      <td className="p-2.5 font-mono text-[#2E7DB8] whitespace-nowrap">{col.type}</td>
                      <td className="p-2.5 font-mono text-[11px] text-[#6B7C77]">{col.constraints}</td>
                      <td className="p-2.5 text-[#3F534E]">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Relationships */}
            <div className="mt-6 pt-4 border-t border-[#DCE3DF]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7C77] mb-2">
                Relational Foreign Keys &amp; Triggers
              </h4>
              <ul className="space-y-1">
                {currentTable.relationships.map((rel, idx) => (
                  <li key={idx} className="text-xs text-[#3F534E] flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-[#2F9E5B] shrink-0" />
                    <span>{rel}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ddl' && (
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCE3DF]">
            <div>
              <h3 className="font-display text-lg font-bold text-[#122420]">
                Standard SQL DDL Migration
              </h3>
              <p className="text-xs text-[#6B7C77]">
                Ready to execute in PostgreSQL, MySQL, or Cloud SQL databases.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SQL_DDL);
                showToast('SQL DDL copied to clipboard', 'success');
              }}
              className="btn btn-outline btn-sm text-xs"
            >
              Copy SQL
            </button>
          </div>
          <pre className="mt-4 p-4 rounded-xl bg-[#0E2B27] text-[#CFFF3D] font-mono text-xs overflow-x-auto leading-relaxed max-h-[600px] select-all">
            {SQL_DDL}
          </pre>
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#0E2B27]">
                <CreditCard className="w-5 h-5 text-[#2F9E5B]" />
                <h4 className="font-bold text-sm">Recurring Payments Worker Query</h4>
              </div>
              <p className="text-xs text-[#6B7C77]">
                Simulates cron execution: scans memberships where <code>auto_renew = TRUE</code>, checks
                due dates, updates billing cycles, and logs immutable invoices.
              </p>
              <button
                onClick={handleTestRecurringBilling}
                className="btn btn-primary btn-sm text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Automated Billing Cycle</span>
              </button>
            </div>

            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#0E2B27]">
                <CalendarCheck className="w-5 h-5 text-[#2E7DB8]" />
                <h4 className="font-bold text-sm">Session Attendance Log Query</h4>
              </div>
              <p className="text-xs text-[#6B7C77]">
                Queries today's turnstile &amp; QR scan records, joins members table, and evaluates current
                active occupants on the gym floor.
              </p>
              <button
                onClick={handleTestAttendanceQuery}
                className="btn btn-outline btn-sm text-xs"
              >
                <Play className="w-3.5 h-3.5 text-[#2E7DB8]" />
                <span>Execute Attendance Query</span>
              </button>
            </div>
          </div>

          {queryResult && (
            <div className="card p-5 bg-[#0E2B27] text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-mono text-xs text-[#CFFF3D] font-bold">Query Execution Output</span>
                <button
                  onClick={() => setQueryResult(null)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <pre className="mt-3 font-mono text-xs text-emerald-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {queryResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
