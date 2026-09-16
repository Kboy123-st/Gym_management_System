import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { FitnessClass } from '../../types';
import { Modal } from '../common/Modal';
import {
  CalendarDays,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  MapPin,
  CheckSquare,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Yoga: { bg: '#2E7DB822', text: '#2E7DB8' },
  Zumba: { bg: '#D8483A22', text: '#D8483A' },
  Aerobics: { bg: '#C9891A22', text: '#C9891A' },
  HIIT: { bg: '#0E2B2722', text: '#0E2B27' },
  Spinning: { bg: '#17544C22', text: '#17544C' },
  Pilates: { bg: '#8A5CB022', text: '#8A5CB0' },
};

export const ClassesView: React.FC = () => {
  const {
    classes,
    trainers,
    members,
    addClass,
    updateClass,
    deleteClass,
    updateClassRoster,
    trainerById,
    memberById,
    checkInMember,
    currentUser,
    showToast,
  } = useGym();

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<FitnessClass | null>(null);
  const [rosterClass, setRosterClass] = useState<FitnessClass | null>(null);
  const [tempRoster, setTempRoster] = useState<string[]>([]);
  const [sessionAttendanceClass, setSessionAttendanceClass] = useState<FitnessClass | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Yoga' as FitnessClass['category'],
    trainerId: trainers[0]?.id || '',
    day: 'Mon/Wed/Fri',
    time: '08:00',
    capacity: 15,
    room: 'Studio A (Lotus)',
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Yoga',
      trainerId: trainers[0]?.id || '',
      day: 'Mon/Wed/Fri',
      time: '08:00',
      capacity: 15,
      room: 'Studio A (Lotus)',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (c: FitnessClass) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      category: c.category,
      trainerId: c.trainerId,
      day: c.day,
      time: c.time,
      capacity: c.capacity,
      room: c.room || 'Studio A',
    });
  };

  const openRosterModal = (c: FitnessClass) => {
    setRosterClass(c);
    setTempRoster([...c.enrolledMemberIds]);
  };

  const handleRosterSave = () => {
    if (!rosterClass) return;
    if (tempRoster.length > rosterClass.capacity) {
      showToast(`That exceeds the maximum class capacity of ${rosterClass.capacity}`, 'error');
      return;
    }
    updateClassRoster(rosterClass.id, tempRoster);
    setRosterClass(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateClass(editingClass.id, formData);
      setEditingClass(null);
    } else {
      addClass(formData);
      setIsAddOpen(false);
    }
  };

  const handleMarkAttendanceForMember = (memberId: string, classNameStr: string) => {
    checkInMember(memberId, 'Manual', `Class: ${classNameStr}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#6B7C77]">
            Schedule group training sessions, monitor room capacities, and manage class enrollment rosters.
          </p>
        </div>
        {canEdit && (
          <button onClick={openAddModal} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Create Class</span>
          </button>
        )}
      </div>

      {/* Grid of Classes */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {classes.map((c) => {
          const trainer = trainerById(c.trainerId);
          const enrolledCount = c.enrolledMemberIds.length;
          const pct = Math.round((enrolledCount / (c.capacity || 1)) * 100);
          const catStyle = CATEGORY_COLORS[c.category] || { bg: '#EDF1EF', text: '#3F534E' };

          return (
            <div key={c.id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                      {c.name}
                    </h3>
                    <span
                      className="badge mt-1.5"
                      style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
                    >
                      {c.category}
                    </span>
                  </div>
                  {c.room && (
                    <span className="text-[11px] text-[#6B7C77] flex items-center gap-1 bg-[#EEF2EF] px-2 py-0.5 rounded">
                      <MapPin className="w-3 h-3" />
                      {c.room}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="text-[#6B7C77] w-20">Trainer:</span>
                    <span className="font-medium text-[#122420]">
                      {trainer ? trainer.name : 'Unassigned'}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#6B7C77] w-20">Schedule:</span>
                    <span className="text-[#122420] font-medium">
                      {c.day} • {c.time}
                    </span>
                  </p>
                </div>

                {/* Capacity Progress Meter */}
                <div className="mt-4 pt-3 border-t border-[#DCE3DF]">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#3F534E]">
                      {enrolledCount} / {c.capacity} enrolled
                    </span>
                    <span className="font-semibold text-[#122420]">{pct}% full</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF1EF] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: pct >= 100 ? '#D8483A' : pct >= 80 ? '#C9891A' : '#CFFF3D',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-5 pt-3 border-t border-[#DCE3DF]">
                <button
                  onClick={() => openRosterModal(c)}
                  className="btn btn-outline btn-sm flex-1 text-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Roster ({enrolledCount})</span>
                </button>
                <button
                  onClick={() => setSessionAttendanceClass(c)}
                  className="btn btn-outline btn-sm flex-1 text-xs text-[#17544C]"
                  title="Check-in session attendees"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Log Attendance</span>
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => openEditModal(c)}
                      className="btn btn-outline btn-sm"
                      title="Edit class"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete class "${c.name}"?`)) {
                          deleteClass(c.id);
                        }
                      }}
                      className="btn btn-danger btn-sm"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Management Modal */}
      <Modal
        isOpen={!!rosterClass}
        onClose={() => setRosterClass(null)}
        title={`${rosterClass?.name} — Class Roster`}
        subtitle={`${tempRoster.length} / ${rosterClass?.capacity} members enrolled • ${rosterClass?.day} ${rosterClass?.time}`}
        maxWidth="max-w-md"
      >
        {rosterClass && (
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto space-y-1.5 border border-[#DCE3DF] rounded-lg p-2.5 bg-[#FAFBFA]">
              {members.map((m) => {
                const isChecked = tempRoster.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white border border-transparent hover:border-[#DCE3DF] text-sm cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (tempRoster.length >= rosterClass.capacity) {
                              showToast(`Maximum capacity (${rosterClass.capacity}) reached!`, 'error');
                              return;
                            }
                            setTempRoster([...tempRoster, m.id]);
                          } else {
                            setTempRoster(tempRoster.filter((id) => id !== m.id));
                          }
                        }}
                        className="rounded text-[#0E2B27] focus:ring-[#0E2B27]"
                      />
                      <span className="font-medium text-[#122420]">{m.fullName}</span>
                    </div>
                    <span className="text-xs text-[#6B7C77]">{m.memberCode}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B7C77]">
              <span>
                {tempRoster.length} enrolled ({rosterClass.capacity - tempRoster.length} seats
                remaining)
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3DF]">
              <button onClick={() => setRosterClass(null)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleRosterSave} className="btn btn-accent">
                Save Roster
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Session Attendance Check-in Modal */}
      <Modal
        isOpen={!!sessionAttendanceClass}
        onClose={() => setSessionAttendanceClass(null)}
        title={`Log Session Attendance — ${sessionAttendanceClass?.name}`}
        subtitle="Quick one-click check-in for enrolled members attending today's session"
        maxWidth="max-w-md"
      >
        {sessionAttendanceClass && (
          <div className="space-y-4">
            <p className="text-xs text-[#6B7C77]">
              Click "Check In" next to an enrolled attendee to log their presence for today's session.
            </p>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#DCE3DF] border border-[#DCE3DF] rounded-lg p-2 bg-[#FAFBFA]">
              {sessionAttendanceClass.enrolledMemberIds.length > 0 ? (
                sessionAttendanceClass.enrolledMemberIds.map((mId) => {
                  const member = memberById(mId);
                  return (
                    <div key={mId} className="flex items-center justify-between py-2.5 px-2">
                      <div>
                        <p className="text-sm font-semibold text-[#122420]">
                          {member?.fullName || 'Member'}
                        </p>
                        <p className="text-xs text-[#6B7C77]">{member?.memberCode}</p>
                      </div>
                      <button
                        onClick={() =>
                          handleMarkAttendanceForMember(mId, sessionAttendanceClass.name)
                        }
                        className="btn btn-primary btn-sm text-xs"
                      >
                        <CheckCircle className="w-3 h-3 text-[#CFFF3D]" />
                        <span>Check In</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[#6B7C77] text-center py-6">
                  No members are currently enrolled in this class roster.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSessionAttendanceClass(null)}
                className="btn btn-outline btn-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isAddOpen || !!editingClass}
        onClose={() => {
          setIsAddOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? `Edit Class — ${editingClass.name}` : 'Create Fitness Class'}
        subtitle="Specify category, instructor, weekly recurrence, and max capacity"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Class Title *</label>
              <input
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sunrise Yoga & Breathwork"
              />
            </div>

            <div>
              <label className="field-label">Category *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as FitnessClass['category'],
                  })
                }
              >
                <option>Yoga</option>
                <option>Zumba</option>
                <option>Aerobics</option>
                <option>HIIT</option>
                <option>Spinning</option>
                <option>Pilates</option>
              </select>
            </div>

            <div>
              <label className="field-label">Assigned Instructor *</label>
              <select
                required
                className="input"
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Recurrence Days *</label>
              <input
                required
                className="input"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                placeholder="e.g. Mon/Wed/Fri"
              />
            </div>

            <div>
              <label className="field-label">Start Time *</label>
              <input
                required
                type="time"
                className="input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Max Student Capacity *</label>
              <input
                required
                type="number"
                min="1"
                className="input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="field-label">Room / Studio Facility</label>
              <input
                className="input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Studio A (Lotus)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingClass(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingClass ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
