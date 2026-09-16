import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Announcement } from '../../types';
import { fmtDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Megaphone, Plus, Edit2, Trash2 } from 'lucide-react';

const CAT_BADGE: Record<string, string> = {
  'Class Updates': 'badge-info',
  'Holiday Notices': 'badge-warning',
  'Gym Events': 'badge-success',
  'Maintenance Notifications': 'badge-danger',
  General: 'badge-muted',
};

export const AnnouncementsView: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    currentUser,
  } = useGym();

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // Form
  const [formData, setFormData] = useState({
    title: '',
    category: 'General' as Announcement['category'],
    body: '',
  });

  const openAddModal = () => {
    setFormData({
      title: '',
      category: 'General',
      body: '',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (a: Announcement) => {
    setEditingAnn(a);
    setFormData({
      title: a.title,
      category: a.category,
      body: a.body,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnn) {
      updateAnnouncement(editingAnn.id, formData);
      setEditingAnn(null);
    } else {
      addAnnouncement(formData);
      setIsAddOpen(false);
    }
  };

  const sortedList = [...announcements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#6B7C77]">
            Internal gym broadcast bulletins, member notices, and schedule updates.
          </p>
        </div>
        {canEdit && (
          <button onClick={openAddModal} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Publish Announcement</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedList.length > 0 ? (
          sortedList.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                      {a.title}
                    </h3>
                    <span className={`badge ${CAT_BADGE[a.category] || 'badge-muted'}`}>
                      {a.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7C77] mt-1">
                    {fmtDate(a.date)} • Published by {a.author}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(a)}
                      className="btn btn-outline btn-sm text-xs"
                      title="Edit announcement"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this announcement?')) {
                          deleteAnnouncement(a.id);
                        }
                      }}
                      className="btn btn-danger btn-sm"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#3F534E] mt-3 leading-relaxed whitespace-pre-wrap">
                {a.body}
              </p>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center text-[#6B7C77] text-sm">
            No announcements published yet.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen || !!editingAnn}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAnn(null);
        }}
        title={editingAnn ? 'Edit Announcement' : 'Publish Announcement'}
        subtitle="Broadcast notices to gym displays, member apps, and staff dashboards"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Notice Headline *</label>
            <input
              required
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Special Holiday Class Schedule"
            />
          </div>

          <div>
            <label className="field-label">Category</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as Announcement['category'],
                })
              }
            >
              <option>Class Updates</option>
              <option>Holiday Notices</option>
              <option>Gym Events</option>
              <option>Maintenance Notifications</option>
              <option>General</option>
            </select>
          </div>

          <div>
            <label className="field-label">Announcement Content *</label>
            <textarea
              required
              rows={4}
              className="input"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Write the full message details here..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingAnn(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingAnn ? 'Save Changes' : 'Publish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
