import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { fmtDate, todayISO } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import {
  CheckSquare,
  QrCode,
  UserCheck,
  Calendar,
  LogOut,
  Users,
  Scan,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    attendance,
    members,
    checkInMember,
    checkOutMember,
    memberById,
    classes,
    showToast,
  } = useGym();

  const [dateFilter, setDateFilter] = useState(todayISO());
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [selectedSessionName, setSelectedSessionName] = useState('Gym Floor Access');

  // QR Modals
  const [isQrPassOpen, setIsQrPassOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanningMember, setScanningMember] = useState<string | null>(null);

  // Stats calculation for the selected date
  const filteredRecords = attendance
    .filter((a) => a.date === dateFilter)
    .sort((a, b) => (b.checkIn || '').localeCompare(a.checkIn || ''));

  const totalCheckIns = filteredRecords.length;
  const currentlyOnPremises = filteredRecords.filter((a) => !a.checkOut).length;
  const qrCheckIns = filteredRecords.filter((a) => a.method === 'QR Code').length;
  const manualCheckIns = filteredRecords.filter((a) => a.method === 'Manual' || a.method === 'Kiosk').length;

  const handleManualCheckIn = () => {
    if (!selectedMemberId) return;
    checkInMember(selectedMemberId, 'Manual', selectedSessionName);
  };

  const handleSimulateQr = () => {
    // Find a member who is not yet checked in today
    const openMemberIds = new Set(
      attendance.filter((a) => a.date === todayISO() && !a.checkOut).map((a) => a.memberId)
    );
    const candidate = members.find((m) => !openMemberIds.has(m.id));

    if (!candidate) {
      showToast('All registered members have already checked in today!', 'info');
      return;
    }

    setScanningMember(candidate.id);
    setIsScannerOpen(true);
  };

  const executeQrScan = () => {
    if (scanningMember) {
      checkInMember(scanningMember, 'QR Code', 'Floor Check-In');
      setIsScannerOpen(false);
      setScanningMember(null);
    }
  };

  const selectedMember = memberById(selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Top Section: Check-In Controls & Daily Report */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Check-In Card */}
        <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                Check in a member
              </h2>
              <span className="text-xs text-[#6B7C77]">Timestamped entry logging</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="field-label">Member *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="input"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Access / Session Category</label>
                <select
                  value={selectedSessionName}
                  onChange={(e) => setSelectedSessionName(e.target.value)}
                  className="input"
                >
                  <option>Gym Floor Access</option>
                  <option>Personal Training Session</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      Class: {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#DCE3DF]">
            <button onClick={handleManualCheckIn} className="btn btn-primary">
              <UserCheck className="w-4 h-4 text-[#CFFF3D]" />
              <span>Check In</span>
            </button>
            <button onClick={handleSimulateQr} className="btn btn-accent">
              <Scan className="w-4 h-4" />
              <span>Simulate QR Scan</span>
            </button>
            <button onClick={() => setIsQrPassOpen(true)} className="btn btn-outline">
              <QrCode className="w-4 h-4" />
              <span>Generate Member QR Pass</span>
            </button>
          </div>
        </div>

        {/* Daily Report Card */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                Daily report
              </h2>
              <Calendar className="w-4 h-4 text-[#6B7C77]" />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input mb-4 text-xs font-semibold"
            />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[#EEF1EF]">
                <span className="text-[#6B7C77]">Total Check-Ins:</span>
                <span className="font-bold text-[#122420]">{totalCheckIns}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#EEF1EF]">
                <span className="text-[#6B7C77]">Currently On Premises:</span>
                <span className="font-bold text-[#2F9E5B]">{currentlyOnPremises}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#EEF1EF]">
                <span className="text-[#6B7C77]">Via Digital QR Code:</span>
                <span className="font-semibold text-[#122420]">{qrCheckIns}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6B7C77]">Manual Front Desk:</span>
                <span className="font-semibold text-[#122420]">{manualCheckIns}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#8FA39D] mt-4 pt-2 border-t border-[#DCE3DF]">
            Data synced with session attendance schema
          </p>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="card overflow-x-auto">
        <div className="p-4 border-b border-[#DCE3DF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-[#122420]">
              Session Attendance Records
            </h3>
            <span className="badge badge-muted">{fmtDate(dateFilter)}</span>
          </div>
          <span className="text-xs text-[#6B7C77]">{filteredRecords.length} record(s)</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Date</th>
              <th>Check-In Time</th>
              <th>Check-Out Time</th>
              <th>Session / Class</th>
              <th>Verification Method</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((a) => {
                const mem = memberById(a.memberId);
                const isOnPremises = !a.checkOut;

                return (
                  <tr key={a.id}>
                    <td>
                      <p className="font-semibold text-[#122420]">{mem ? mem.fullName : 'Unknown'}</p>
                      <p className="text-xs text-[#6B7C77]">{mem?.memberCode}</p>
                    </td>
                    <td>{fmtDate(a.date)}</td>
                    <td className="font-mono text-xs font-semibold">{a.checkIn || '—'}</td>
                    <td>
                      {isOnPremises ? (
                        <span className="badge badge-info animate-pulse">On Premises</span>
                      ) : (
                        <span className="font-mono text-xs">{a.checkOut}</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs font-medium text-[#3F534E]">
                        {a.sessionName || 'Gym Floor Access'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          a.method === 'QR Code' ? 'badge-success' : 'badge-muted'
                        }`}
                      >
                        {a.method}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {isOnPremises && (
                        <button
                          onClick={() => checkOutMember(a.id)}
                          className="btn btn-outline btn-sm text-xs text-[#0E2B27]"
                          title="Record member departure"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check Out</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#6B7C77]">
                  No session attendance recorded for {fmtDate(dateFilter)}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* QR Code Pass Modal */}
      <Modal
        isOpen={isQrPassOpen}
        onClose={() => setIsQrPassOpen(false)}
        title="Member Digital Access Pass"
        subtitle="Individual barcode for turnstile kiosk and front-desk attendance"
        maxWidth="max-w-sm"
      >
        {selectedMember && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-full bg-[#0E2B27] p-4 rounded-xl text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#CFFF3D]/10 rounded-full blur-xl"></div>
              <p className="text-xs text-[#CFFF3D] font-mono tracking-widest uppercase">
                IRON &amp; LIME PASS
              </p>
              <h4 className="font-display text-2xl font-bold mt-1 tracking-wide">
                {selectedMember.fullName}
              </h4>
              <p className="text-xs text-[#AEC2BC]">{selectedMember.memberCode}</p>

              {/* Simulated Crisp QR Matrix */}
              <div className="my-4 bg-white p-3 rounded-lg flex items-center justify-center mx-auto w-40 h-40 shadow-inner">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-white">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i * 7 + 3) % 2 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-[#0E2B27]'
                          : 'bg-[#EEF2EF]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#AEC2BC] pt-2 border-t border-white/10">
                <span>Access: All Hours</span>
                <span className="text-[#CFFF3D]">Active Member</span>
              </div>
            </div>

            <p className="text-xs text-[#6B7C77]">
              Scan this pass at any reception reader or automated floor turnstile.
            </p>

            <button onClick={() => setIsQrPassOpen(false)} className="btn btn-outline btn-sm w-full">
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Simulated Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScanningMember(null);
        }}
        title="Simulating Optical QR Scan"
        subtitle="Detecting digital pass from phone camera / reader"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-56 h-56 bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-[#CFFF3D]">
            <div className="absolute inset-x-0 h-1 bg-[#CFFF3D] shadow-[0_0_12px_#CFFF3D] animate-bounce top-1/2"></div>
            <div className="w-36 h-36 border-2 border-dashed border-white/60 rounded-lg flex items-center justify-center">
              <Scan className="w-12 h-12 text-[#CFFF3D]/70 animate-pulse" />
            </div>
            <span className="absolute bottom-2 text-[10px] text-white/70 font-mono tracking-wider">
              SCANNER ENGINE READY
            </span>
          </div>

          {scanningMember && (
            <div className="text-sm">
              <p className="text-xs text-[#6B7C77]">Target detected:</p>
              <p className="font-bold text-[#122420] text-base">
                {memberById(scanningMember)?.fullName}
              </p>
              <p className="text-xs text-[#2F9E5B] flex items-center justify-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Active Subscription
              </p>
            </div>
          )}

          <div className="flex gap-2 w-full pt-2">
            <button
              onClick={() => {
                setIsScannerOpen(false);
                setScanningMember(null);
              }}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button onClick={executeQrScan} className="btn btn-accent flex-1">
              Confirm Check-In
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
