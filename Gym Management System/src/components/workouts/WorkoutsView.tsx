import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { WorkoutProgram } from '../../types';
import { Modal } from '../common/Modal';
import { Dumbbell, Plus, Trash2, Edit2, Users, Check } from 'lucide-react';

export const WorkoutsView: React.FC = () => {
  const {
    workouts,
    members,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    assignWorkoutMembers,
    memberById,
    currentUser,
  } = useGym();

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'trainer';

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutProgram | null>(null);
  const [assigningWk, setAssigningWk] = useState<WorkoutProgram | null>(null);
  const [tempAssignedIds, setTempAssignedIds] = useState<string[]>([]);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Strength Training',
    description: '',
    exercises: [
      { name: 'Barbell Squat', sets: 4, reps: '8-10 reps', weight: '60 kg' },
      { name: 'Bench Press', sets: 4, reps: '8-10 reps', weight: '50 kg' },
    ],
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Strength Training',
      description: '',
      exercises: [{ name: '', sets: 3, reps: '10-12 reps', weight: '' }],
    });
    setIsAddOpen(true);
  };

  const openEditModal = (w: WorkoutProgram) => {
    setEditingWorkout(w);
    setFormData({
      name: w.name,
      category: w.category,
      description: w.description,
      exercises: w.exercises.map((ex) => ({ ...ex })),
    });
  };

  const openAssignModal = (w: WorkoutProgram) => {
    setAssigningWk(w);
    setTempAssignedIds([...w.assignedMemberIds]);
  };

  const handleSaveAssign = () => {
    if (!assigningWk) return;
    assignWorkoutMembers(assigningWk.id, tempAssignedIds);
    setAssigningWk(null);
  };

  const handleAddExerciseRow = () => {
    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: 3, reps: '10 reps', weight: '' }],
    }));
  };

  const handleRemoveExerciseRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const handleExerciseChange = (
    index: number,
    field: 'name' | 'sets' | 'reps' | 'weight',
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.exercises];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, exercises: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validExercises = formData.exercises.filter((ex) => ex.name.trim().length > 0);
    const payload = { ...formData, exercises: validExercises };

    if (editingWorkout) {
      updateWorkout(editingWorkout.id, payload);
      setEditingWorkout(null);
    } else {
      addWorkout(payload);
      setIsAddOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#6B7C77]">
            Build structured fitness regimes with prescribed sets, rep schemes, and member allocations.
          </p>
        </div>
        {canEdit && (
          <button onClick={openAddModal} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Create Workout Program</span>
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {workouts.map((w) => (
          <div key={w.id} className="card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                    {w.name}
                  </h3>
                  <span className="badge badge-info mt-1">{w.category}</span>
                </div>
              </div>

              <p className="text-sm text-[#6B7C77] mt-2.5">{w.description}</p>

              {/* Exercises Table */}
              <div className="mt-4 border border-[#DCE3DF] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFBFA] border-b border-[#DCE3DF]">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-[#6B7C77]">Exercise</th>
                      <th className="py-2 px-3 font-semibold text-[#6B7C77]">Sets</th>
                      <th className="py-2 px-3 font-semibold text-[#6B7C77]">Reps</th>
                      <th className="py-2 px-3 font-semibold text-[#6B7C77]">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1EF]">
                    {w.exercises.map((ex, i) => (
                      <tr key={i} className="hover:bg-white">
                        <td className="py-2 px-3 font-medium text-[#122420]">{ex.name}</td>
                        <td className="py-2 px-3 text-[#3F534E]">{ex.sets}</td>
                        <td className="py-2 px-3 text-[#3F534E]">{ex.reps}</td>
                        <td className="py-2 px-3 text-[#6B7C77]">{ex.weight || 'Bodyweight'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Assigned Members */}
              <div className="mt-4 pt-3 border-t border-[#DCE3DF] text-xs text-[#6B7C77]">
                <p className="font-semibold text-[#3F534E] mb-1">
                  Assigned Members ({w.assignedMemberIds.length})
                </p>
                <p className="line-clamp-2">
                  {w.assignedMemberIds.length > 0
                    ? w.assignedMemberIds
                        .map((id) => memberById(id)?.fullName)
                        .filter(Boolean)
                        .join(', ')
                    : 'No members currently following this program.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2 mt-5 pt-3 border-t border-[#DCE3DF]">
                <button
                  onClick={() => openAssignModal(w)}
                  className="btn btn-outline btn-sm flex-1 text-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Assign Members</span>
                </button>
                <button
                  onClick={() => openEditModal(w)}
                  className="btn btn-outline btn-sm"
                  title="Edit program"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete program "${w.name}"?`)) {
                      deleteWorkout(w.id);
                    }
                  }}
                  className="btn btn-danger btn-sm"
                  title="Delete program"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Workout Modal */}
      <Modal
        isOpen={isAddOpen || !!editingWorkout}
        onClose={() => {
          setIsAddOpen(false);
          setEditingWorkout(null);
        }}
        title={editingWorkout ? `Edit Program — ${editingWorkout.name}` : 'Create Workout Program'}
        subtitle="Specify movements, set volume, repetition targets, and resistance guidance"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Program Name *</label>
              <input
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Upper Body Hypertrophy"
              />
            </div>
            <div>
              <label className="field-label">Category</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Strength Training</option>
                <option>Weight Loss</option>
                <option>Bodybuilding</option>
                <option>CrossFit</option>
                <option>Cardio Conditioning</option>
                <option>Yoga &amp; Mobility</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="field-label">Description &amp; Goals</label>
              <textarea
                rows={2}
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="High intensity compound movements with 90s rest periods..."
              />
            </div>
          </div>

          {/* Dynamic Exercise Rows */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label !mb-0">Prescribed Exercises ({formData.exercises.length})</label>
              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="btn btn-outline btn-sm text-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Movement</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formData.exercises.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    required
                    className="input flex-2"
                    placeholder="Exercise Name (e.g. Barbell Deadlift)"
                    value={ex.name}
                    onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="input w-20"
                    placeholder="Sets"
                    value={ex.sets}
                    onChange={(e) => handleExerciseChange(idx, 'sets', Number(e.target.value))}
                  />
                  <input
                    className="input w-24"
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                  />
                  <input
                    className="input w-24"
                    placeholder="Weight"
                    value={ex.weight || ''}
                    onChange={(e) => handleExerciseChange(idx, 'weight', e.target.value)}
                  />
                  {formData.exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExerciseRow(idx)}
                      className="p-1.5 text-[#D8483A] hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingWorkout(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingWorkout ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Members Modal */}
      <Modal
        isOpen={!!assigningWk}
        onClose={() => setAssigningWk(null)}
        title={`Assign Program — ${assigningWk?.name}`}
        subtitle="Select gym members to follow this workout schedule"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="max-h-72 overflow-y-auto space-y-1.5 border border-[#DCE3DF] rounded-lg p-2.5 bg-[#FAFBFA]">
            {members.map((m) => {
              const isChecked = tempAssignedIds.includes(m.id);
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
                          setTempAssignedIds([...tempAssignedIds, m.id]);
                        } else {
                          setTempAssignedIds(tempAssignedIds.filter((id) => id !== m.id));
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

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE3DF]">
            <button onClick={() => setAssigningWk(null)} className="btn btn-outline">
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
