import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Equipment } from '../../types';
import { fmtDate, daysUntil, todayISO } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Wrench, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const EquipmentView: React.FC = () => {
  const {
    equipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    logEquipmentMaintenance,
    currentUser,
  } = useGym();

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'receptionist';

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<Equipment | null>(null);
  const [loggingEquip, setLoggingEquip] = useState<Equipment | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cardio',
    status: 'Available' as Equipment['status'],
    purchaseDate: todayISO(),
    nextMaintenance: todayISO(60),
    notes: '',
  });

  const [maintNextDate, setMaintNextDate] = useState(todayISO(60));
  const [maintNotes, setMaintNotes] = useState('');

  const categories = Array.from(new Set(equipment.map((e) => e.category)));

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Cardio',
      status: 'Available',
      purchaseDate: todayISO(),
      nextMaintenance: todayISO(60),
      notes: '',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (e: Equipment) => {
    setEditingEquip(e);
    setFormData({
      name: e.name,
      category: e.category,
      status: e.status,
      purchaseDate: e.purchaseDate,
      nextMaintenance: e.nextMaintenance,
      notes: e.notes || '',
    });
  };

  const openLogModal = (e: Equipment) => {
    setLoggingEquip(e);
    setMaintNextDate(todayISO(60));
    setMaintNotes('');
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingEquip) return;
    logEquipmentMaintenance(loggingEquip.id, maintNextDate, maintNotes);
    setLoggingEquip(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquip) {
      updateEquipment(editingEquip.id, formData);
      setEditingEquip(null);
    } else {
      addEquipment({ ...formData, lastMaintenance: todayISO() });
      setIsAddOpen(false);
    }
  };

  const filtered = equipment.filter((e) => {
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchCat && matchStatus;
  });

  const statusBadge = (s: Equipment['status']) => {
    switch (s) {
      case 'Available':
        return 'badge-success';
      case 'Under Maintenance':
        return 'badge-warning';
      case 'Damaged':
        return 'badge-danger';
      default:
        return 'badge-muted';
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input max-w-[180px]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-[180px]"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>

        {canEdit && (
          <button onClick={openAddModal} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Add Equipment</span>
          </button>
        )}
      </div>

      {/* Equipment Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Category</th>
              <th>Current Status</th>
              <th>Last Serviced</th>
              <th>Next Service Due</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((e) => {
                const isOverdue = daysUntil(e.nextMaintenance) < 0;
                return (
                  <tr key={e.id}>
                    <td>
                      <p className="font-semibold text-[#122420]">{e.name}</p>
                      {e.notes && (
                        <p className="text-xs text-[#6B7C77] font-normal mt-0.5 line-clamp-1">
                          {e.notes}
                        </p>
                      )}
                    </td>
                    <td>{e.category}</td>
                    <td>
                      <span className={`badge ${statusBadge(e.status)}`}>{e.status}</span>
                    </td>
                    <td>{fmtDate(e.lastMaintenance)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span>{fmtDate(e.nextMaintenance)}</span>
                        {isOverdue && <span className="badge badge-danger">Overdue</span>}
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {canEdit && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openLogModal(e)}
                            className="btn btn-outline btn-sm text-xs"
                            title="Log maintenance"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Log Service</span>
                          </button>
                          <button
                            onClick={() => openEditModal(e)}
                            className="btn btn-outline btn-sm"
                            title="Edit equipment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove equipment "${e.name}"?`)) {
                                deleteEquipment(e.id);
                              }
                            }}
                            className="btn btn-danger btn-sm"
                            title="Delete equipment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#6B7C77]">
                  No equipment matches your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Log Maintenance Modal */}
      <Modal
        isOpen={!!loggingEquip}
        onClose={() => setLoggingEquip(null)}
        title={`Log Maintenance — ${loggingEquip?.name}`}
        subtitle="Mark as serviced, restore status to Available, and schedule next service cycle"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div>
            <label className="field-label">Next Maintenance Due Date *</label>
            <input
              required
              type="date"
              className="input"
              value={maintNextDate}
              onChange={(e) => setMaintNextDate(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Service &amp; Repair Notes</label>
            <textarea
              rows={3}
              className="input"
              value={maintNotes}
              onChange={(e) => setMaintNotes(e.target.value)}
              placeholder="What parts were replaced, lubricated, or safety inspected?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => setLoggingEquip(null)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              Save &amp; Mark Available
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Equipment Modal */}
      <Modal
        isOpen={isAddOpen || !!editingEquip}
        onClose={() => {
          setIsAddOpen(false);
          setEditingEquip(null);
        }}
        title={editingEquip ? `Edit Equipment — ${editingEquip.name}` : 'Add Gym Equipment'}
        subtitle="Register floor asset for preventive maintenance tracking"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Equipment Name *</label>
              <input
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. LifeFitness Treadmill 95T"
              />
            </div>

            <div>
              <label className="field-label">Category *</label>
              <input
                required
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Cardio / Strength / Studio"
              />
            </div>

            <div>
              <label className="field-label">Floor Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Equipment['status'] })
                }
              >
                <option value="Available">Available</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="field-label">Purchase Date</label>
              <input
                type="date"
                className="input"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Next Maintenance Target</label>
              <input
                type="date"
                className="input"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Inventory &amp; Maintenance Notes</label>
              <textarea
                rows={2}
                className="input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Serial number, warranty vendor, specific servicing instructions..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingEquip(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingEquip ? 'Save Changes' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
