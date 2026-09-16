import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Trainer } from '../../types';
import { fmtMoney, initials } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Search, Award, UserCheck, Plus, Edit2, Trash2 } from 'lucide-react';

export const TrainersView: React.FC = () => {
  const {
    trainers,
    addTrainer,
    updateTrainer,
    deleteTrainer,
    members,
    classes,
    assignMembersToTrainer,
    currentUser,
  } = useGym();

  const [query, setQuery] = useState('');
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assigningTrainer, setAssigningTrainer] = useState<Trainer | null>(null);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    experienceYears: 3,
    salary: 1200,
    specialty: '',
    certification: '',
    status: 'Active' as Trainer['status'],
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      experienceYears: 3,
      salary: 1200,
      specialty: 'Strength & Conditioning',
      certification: 'NASM-CPT',
      status: 'Active',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (t: Trainer) => {
    setEditingTrainer(t);
    setFormData({
      name: t.name,
      phone: t.phone,
      email: t.email,
      experienceYears: t.experienceYears,
      salary: t.salary,
      specialty: t.specialty,
      certification: t.certification,
      status: t.status,
    });
  };

  const openAssignModal = (t: Trainer) => {
    setAssigningTrainer(t);
    const currentlyAssigned = members.filter((m) => m.trainerId === t.id).map((m) => m.id);
    setAssignedMemberIds(currentlyAssigned);
  };

  const handleSaveAssign = () => {
    if (!assigningTrainer) return;
    assignMembersToTrainer(assigningTrainer.id, assignedMemberIds);
    setAssigningTrainer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrainer) {
      updateTrainer(editingTrainer.id, formData);
      setEditingTrainer(null);
    } else {
      addTrainer(formData);
      setIsAddOpen(false);
    }
  };

  const filteredTrainers = trainers.filter((t) => {
    const q = query.toLowerCase();
    return (
      !query ||
      t.name.toLowerCase().includes(q) ||
      t.specialty.toLowerCase().includes(q) ||
      t.certification.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7C77]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trainers by name or specialty…"
            className="input pl-9"
          />
        </div>

        {canEdit && (
          <button onClick={openAddModal} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Add Trainer</span>
          </button>
        )}
      </div>

      {/* Grid of Trainer Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTrainers.map((t) => {
          const assignedMembers = members.filter((m) => m.trainerId === t.id);
          const trainerClasses = classes.filter((c) => c.trainerId === t.id);

          return (
            <div key={t.id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-3">
                  <span className="avatar w-12 h-12 text-sm">{initials(t.name)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-bold tracking-wide text-[#122420] truncate">
                      {t.name}
                    </h3>
                    <p className="text-xs text-[#6B7C77]">
                      {t.trainerCode} • {t.experienceYears} yrs experience
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      t.status === 'Active'
                        ? 'badge-success'
                        : t.status === 'On Leave'
                        ? 'badge-warning'
                        : 'badge-muted'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <p>
                    <span className="text-[#6B7C77]">Specialty:</span>{' '}
                    <span className="font-medium text-[#122420]">{t.specialty}</span>
                  </p>
                  <p>
                    <span className="text-[#6B7C77]">Certification:</span>{' '}
                    <span className="font-medium text-[#122420]">{t.certification}</span>
                  </p>
                  <p>
                    <span className="text-[#6B7C77]">Phone:</span>{' '}
                    <span className="text-[#122420]">{t.phone}</span>
                  </p>
                  <p>
                    <span className="text-[#6B7C77]">Email:</span>{' '}
                    <span className="text-[#122420]">{t.email}</span>
                  </p>
                  {isAdmin && (
                    <p>
                      <span className="text-[#6B7C77]">Base Salary:</span>{' '}
                      <span className="font-semibold text-[#0E2B27]">{fmtMoney(t.salary)}/mo</span>
                    </p>
                  )}
                </div>

                {/* Assigned Members and Class Schedule breakdown */}
                <div className="mt-4 pt-3 border-t border-[#DCE3DF] text-xs text-[#6B7C77] space-y-2">
                  <div>
                    <p className="font-semibold text-[#3F534E] mb-1">
                      Assigned Members ({assignedMembers.length})
                    </p>
                    <p className="line-clamp-2">
                      {assignedMembers.length > 0
                        ? assignedMembers.map((m) => m.fullName).join(', ')
                        : 'No individual clients assigned.'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#3F534E] mb-1">Weekly Class Sessions</p>
                    <p>
                      {trainerClasses.length > 0
                        ? trainerClasses.map((c) => `${c.name} (${c.day} ${c.time})`).join(' • ')
                        : 'No weekly classes currently assigned.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex gap-2 mt-5 pt-3 border-t border-[#DCE3DF]">
                {canEdit && (
                  <>
                    <button
                      onClick={() => openAssignModal(t)}
                      className="btn btn-outline btn-sm flex-1 text-xs"
                      title="Assign member clients to this trainer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Roster ({assignedMembers.length})</span>
                    </button>
                    <button
                      onClick={() => openEditModal(t)}
                      className="btn btn-outline btn-sm"
                      title="Edit trainer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${t.name} from trainers list?`)) {
                            deleteTrainer(t.id);
                          }
                        }}
                        className="btn btn-danger btn-sm"
                        title="Remove trainer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Trainer Modal */}
      <Modal
        isOpen={isAddOpen || !!editingTrainer}
        onClose={() => {
          setIsAddOpen(false);
          setEditingTrainer(null);
        }}
        title={editingTrainer ? `Edit Trainer — ${editingTrainer.name}` : 'Add New Trainer'}
        subtitle="Configure trainer credentials, specialty focus, and employment terms"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Full Name *</label>
              <input
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Marcus Reed"
              />
            </div>
            <div>
              <label className="field-label">Phone *</label>
              <input
                required
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 345 680"
              />
            </div>
            <div>
              <label className="field-label">Email Address *</label>
              <input
                required
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="trainer@ironlime.gym"
              />
            </div>
            <div>
              <label className="field-label">Experience (Years)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={formData.experienceYears}
                onChange={(e) =>
                  setFormData({ ...formData, experienceYears: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="field-label">Monthly Salary (USD)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="field-label">Training Specialty</label>
              <input
                className="input"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g. Strength & Conditioning / HIIT"
              />
            </div>
            <div>
              <label className="field-label">Certifications</label>
              <input
                className="input"
                value={formData.certification}
                onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                placeholder="NASM-CPT, CSCS, RYT-500"
              />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Trainer['status'] })
                }
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingTrainer(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingTrainer ? 'Save Changes' : 'Add Trainer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Members to Trainer Modal */}
      <Modal
        isOpen={!!assigningTrainer}
        onClose={() => setAssigningTrainer(null)}
        title={`Assign Members to ${assigningTrainer?.name}`}
        subtitle="Select which gym members are assigned for personal training supervision"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="max-h-72 overflow-y-auto space-y-1.5 border border-[#DCE3DF] rounded-lg p-2.5 bg-[#FAFBFA]">
            {members.map((m) => {
              const isChecked = assignedMemberIds.includes(m.id);
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
                          setAssignedMemberIds([...assignedMemberIds, m.id]);
                        } else {
                          setAssignedMemberIds(assignedMemberIds.filter((id) => id !== m.id));
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

          <div className="flex items-center justify-between text-xs text-[#6B7C77] px-1">
            <span>{assignedMemberIds.length} member(s) selected</span>
            <button
              type="button"
              onClick={() => setAssignedMemberIds(members.map((m) => m.id))}
              className="text-[#17544C] font-semibold hover:underline"
            >
              Select All
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3DF]">
            <button onClick={() => setAssigningTrainer(null)} className="btn btn-outline">
              Cancel
            </button>
            <button onClick={handleSaveAssign} className="btn btn-accent">
              Save Assignments
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
