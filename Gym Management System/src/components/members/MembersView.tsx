import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Member } from '../../types';
import { fmtDate, initials, todayISO } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Search, UserPlus, Eye, Edit2, Trash2, Camera, ShieldAlert } from 'lucide-react';

export const MembersView: React.FC = () => {
  const {
    members,
    addMember,
    updateMember,
    deleteMember,
    trainers,
    activeMembershipFor,
    planById,
    trainerById,
    currentUser,
  } = useGym();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Registration & Edit Form State
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    dob: '1995-01-15',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    trainerId: '',
    healthNotes: '',
    photo: '',
  });

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  const openRegisterModal = () => {
    setFormData({
      fullName: '',
      gender: 'Male',
      dob: '1995-01-15',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      trainerId: '',
      healthNotes: '',
      photo: '',
    });
    setIsRegisterOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormData({
      fullName: m.fullName,
      gender: m.gender,
      dob: m.dob,
      phone: m.phone,
      email: m.email,
      address: m.address,
      emergencyContact: m.emergencyContact,
      emergencyPhone: m.emergencyPhone,
      trainerId: m.trainerId || '',
      healthNotes: m.healthNotes || '',
      photo: m.photo || '',
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember(formData);
    setIsRegisterOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    updateMember(editingMember.id, formData);
    setEditingMember(null);
  };

  const handleDelete = (m: Member) => {
    if (window.confirm(`Are you sure you want to remove ${m.fullName}? This will archive their profile.`)) {
      deleteMember(m.id);
    }
  };

  // Filtering
  const filteredMembers = members.filter((m) => {
    const ms = activeMembershipFor(m.id);
    const q = query.toLowerCase();
    const matchesQuery =
      !query ||
      m.fullName.toLowerCase().includes(q) ||
      m.memberCode.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || (ms && ms.status === statusFilter);
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 min-w-[240px] max-w-lg gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7C77]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, phone or email…"
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-[160px]"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Frozen">Frozen</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {canEdit && (
          <button onClick={openRegisterModal} className="btn btn-accent">
            <UserPlus className="w-4 h-4" />
            <span>+ Register Member</span>
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Contact Info</th>
              <th>Assigned Trainer</th>
              <th>Current Membership</th>
              <th>Status</th>
              <th>Registered</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => {
                const ms = activeMembershipFor(m.id);
                const plan = ms ? planById(ms.planId) : null;
                const trainer = m.trainerId ? trainerById(m.trainerId) : null;
                const badgeClass =
                  {
                    Active: 'badge-success',
                    Expired: 'badge-danger',
                    Frozen: 'badge-info',
                    Cancelled: 'badge-muted',
                  }[ms?.status || ''] || 'badge-muted';

                return (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-[#DCE3DF]"
                          />
                        ) : (
                          <span className="avatar w-9 h-9 text-xs">{initials(m.fullName)}</span>
                        )}
                        <div>
                          <p className="font-semibold text-[#122420]">{m.fullName}</p>
                          <p className="text-xs text-[#6B7C77]">{m.memberCode}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-[#122420]">{m.phone}</p>
                      <p className="text-xs text-[#6B7C77]">{m.email}</p>
                    </td>
                    <td>
                      {trainer ? (
                        <span className="font-medium text-[#122420]">{trainer.name}</span>
                      ) : (
                        <span className="text-[#6B7C77] italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {plan ? (
                        <div>
                          <p className="text-sm font-medium text-[#122420]">{plan.name}</p>
                          {ms?.autoRenew && (
                            <span className="text-[10px] text-[#2F9E5B] font-semibold">
                              Auto-Billed
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#6B7C77] text-xs">No active plan</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{ms ? ms.status : 'None'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-[#6B7C77]">{fmtDate(m.registrationDate)}</span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingMember(m)}
                          className="btn btn-outline btn-sm"
                          title="View member details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditModal(m)}
                              className="btn btn-outline btn-sm"
                              title="Edit profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="btn btn-danger btn-sm"
                              title="Delete member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#6B7C77]">
                  No members found matching your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Member View Detail Modal */}
      <Modal
        isOpen={!!viewingMember}
        onClose={() => setViewingMember(null)}
        title={viewingMember?.fullName}
        subtitle={`${viewingMember?.memberCode} • Registered ${fmtDate(
          viewingMember?.registrationDate
        )}`}
        maxWidth="max-w-2xl"
      >
        {viewingMember && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-[#DCE3DF]">
              {viewingMember.photo ? (
                <img
                  src={viewingMember.photo}
                  alt={viewingMember.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#CFFF3D]"
                />
              ) : (
                <span className="avatar w-16 h-16 text-xl">{initials(viewingMember.fullName)}</span>
              )}
              <div>
                <h4 className="font-display text-2xl font-bold text-[#122420]">
                  {viewingMember.fullName}
                </h4>
                <p className="text-sm text-[#6B7C77]">
                  {viewingMember.gender} • DOB: {fmtDate(viewingMember.dob)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="field-label">Phone Number</p>
                <p className="font-medium text-[#122420]">{viewingMember.phone}</p>
              </div>
              <div>
                <p className="field-label">Email Address</p>
                <p className="font-medium text-[#122420]">{viewingMember.email}</p>
              </div>
              <div className="col-span-2">
                <p className="field-label">Address</p>
                <p className="text-[#122420]">{viewingMember.address || '—'}</p>
              </div>
              <div>
                <p className="field-label">Emergency Contact Person</p>
                <p className="font-medium text-[#122420]">{viewingMember.emergencyContact || '—'}</p>
              </div>
              <div>
                <p className="field-label">Emergency Phone</p>
                <p className="font-medium text-[#122420]">{viewingMember.emergencyPhone || '—'}</p>
              </div>
              <div>
                <p className="field-label">Assigned Personal Trainer</p>
                <p className="font-medium text-[#122420]">
                  {viewingMember.trainerId
                    ? trainerById(viewingMember.trainerId)?.name || 'Unknown'
                    : 'None Assigned'}
                </p>
              </div>
              <div>
                <p className="field-label">Current Membership</p>
                <p className="font-medium text-[#122420]">
                  {activeMembershipFor(viewingMember.id)
                    ? planById(activeMembershipFor(viewingMember.id)!.planId)?.name
                    : 'No Active Membership'}
                </p>
              </div>
              <div className="col-span-2 bg-[#F5F7F5] p-3.5 rounded-lg border border-[#DCE3DF]">
                <p className="field-label flex items-center gap-1.5 text-[#3F534E]">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#C9891A]" />
                  Medical & Health Clearance Notes
                </p>
                <p className="text-xs text-[#122420]">
                  {viewingMember.healthNotes || 'No health restrictions or chronic conditions recorded.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setViewingMember(null)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Register / Edit Member Modal */}
      <Modal
        isOpen={isRegisterOpen || !!editingMember}
        onClose={() => {
          setIsRegisterOpen(false);
          setEditingMember(null);
        }}
        title={editingMember ? `Edit Profile — ${editingMember.fullName}` : 'Register New Member'}
        subtitle="Complete the member profile for floor access and subscription assignment"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={editingMember ? handleEditSubmit : handleRegisterSubmit} className="space-y-4">
          {/* Photo Avatar Preview and Upload */}
          <div className="flex items-center gap-4 p-3 bg-[#F5F7F5] rounded-lg border border-[#DCE3DF]">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Preview"
                className="w-14 h-14 rounded-full object-cover border border-[#DCE3DF]"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#0E2B27] flex items-center justify-center text-[#CFFF3D] font-display font-bold text-lg">
                {initials(formData.fullName || 'New')}
              </div>
            )}
            <div>
              <label className="btn btn-outline btn-sm cursor-pointer flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Member Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#6B7C77] mt-1">Square JPG/PNG supported</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Full Legal Name *</label>
              <input
                required
                className="input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Liam Carter"
              />
            </div>

            <div>
              <label className="field-label">Gender</label>
              <select
                className="input"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="field-label">Date of Birth</label>
              <input
                type="date"
                className="input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Phone Number *</label>
              <input
                required
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012 345 678"
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
                placeholder="member@example.com"
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Physical Address</label>
              <input
                className="input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="No. 88 Riverside Ave"
              />
            </div>

            <div>
              <label className="field-label">Emergency Contact Name</label>
              <input
                className="input"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Spouse / Parent / Next of Kin"
              />
            </div>

            <div>
              <label className="field-label">Emergency Phone</label>
              <input
                className="input"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="011 999 000"
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Assigned Personal Trainer</label>
              <select
                className="input"
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              >
                <option value="">— Unassigned (Floor Access Only) —</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="field-label">Health, Allergy & Medical Notes</label>
              <textarea
                rows={2}
                className="input"
                value={formData.healthNotes}
                onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                placeholder="Any prior injuries, cardiac considerations, or medication..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsRegisterOpen(false);
                setEditingMember(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingMember ? 'Save Changes' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
