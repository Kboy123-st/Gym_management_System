import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { NutritionPlan } from '../../types';
import { Modal } from '../common/Modal';
import { Salad, Plus, Edit2, Trash2, Clock, Flame } from 'lucide-react';

export const NutritionView: React.FC = () => {
  const {
    nutrition,
    members,
    addNutrition,
    updateNutrition,
    deleteNutrition,
    memberById,
    currentUser,
  } = useGym();

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'trainer';

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    memberId: members[0]?.id || '',
    totalCalories: 2200,
    meals: [
      { name: 'Breakfast', time: '07:30', calories: 550, notes: 'Eggs, oatmeal, fruit' },
      { name: 'Lunch', time: '13:00', calories: 750, notes: 'Grilled chicken, rice, vegetables' },
      { name: 'Dinner', time: '19:00', calories: 650, notes: 'Fish, sweet potatoes, salad' },
    ],
    notes: 'Maintain steady hydration with 3L water per day.',
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      memberId: members[0]?.id || '',
      totalCalories: 2200,
      meals: [
        { name: 'Breakfast', time: '07:30', calories: 500, notes: 'Eggs, oats, fruit' },
        { name: 'Lunch', time: '12:30', calories: 700, notes: 'Lean protein, grains, greens' },
        { name: 'Dinner', time: '19:00', calories: 600, notes: 'Salmon or poultry with veggies' },
      ],
      notes: 'Prioritize whole unprocessed foods and adequate daily protein.',
    });
    setIsAddOpen(true);
  };

  const openEditModal = (n: NutritionPlan) => {
    setEditingPlan(n);
    setFormData({
      name: n.name,
      memberId: n.memberId,
      totalCalories: n.totalCalories,
      meals: n.meals.map((m) => ({ ...m })),
      notes: n.notes || '',
    });
  };

  const handleAddMeal = () => {
    setFormData((prev) => ({
      ...prev,
      meals: [
        ...prev.meals,
        { name: 'Mid-day Snack', time: '16:00', calories: 250, notes: 'Nuts or protein shake' },
      ],
    }));
  };

  const handleRemoveMeal = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== idx),
    }));
  };

  const handleMealChange = (
    idx: number,
    field: 'name' | 'time' | 'calories' | 'notes',
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.meals];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, meals: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateNutrition(editingPlan.id, formData);
      setEditingPlan(null);
    } else {
      addNutrition(formData);
      setIsAddOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#6B7C77]">
            Personalized meal plans, calorie targets, and dietary schedules tailored to member goals.
          </p>
        </div>
        {canEdit && (
          <button onClick={openAddModal} className="btn btn-accent">
            <Plus className="w-4 h-4" />
            <span>+ Create Nutrition Plan</span>
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {nutrition.map((n) => {
          const mem = memberById(n.memberId);
          return (
            <div key={n.id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-wide text-[#122420]">
                      {n.name}
                    </h3>
                    <p className="text-xs text-[#6B7C77]">
                      For {mem ? mem.fullName : 'Unassigned Member'}
                    </p>
                  </div>
                  <span className="badge badge-info flex items-center gap-1 font-mono">
                    <Flame className="w-3 h-3 text-[#D8483A]" />
                    {n.totalCalories} kcal/day
                  </span>
                </div>

                {/* Meals Table */}
                <div className="mt-4 border border-[#DCE3DF] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFBFA] border-b border-[#DCE3DF]">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-[#6B7C77]">Meal</th>
                        <th className="py-2 px-3 font-semibold text-[#6B7C77]">Time</th>
                        <th className="py-2 px-3 font-semibold text-[#6B7C77]">Target</th>
                        <th className="py-2 px-3 font-semibold text-[#6B7C77]">Food Selection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF1EF]">
                      {n.meals.map((m, i) => (
                        <tr key={i} className="hover:bg-white">
                          <td className="py-2 px-3 font-semibold text-[#122420]">{m.name}</td>
                          <td className="py-2 px-3 text-[#6B7C77]">{m.time}</td>
                          <td className="py-2 px-3 text-[#3F534E] font-medium">{m.calories} kcal</td>
                          <td className="py-2 px-3 text-[#6B7C77]">{m.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {n.notes && (
                  <p className="text-xs text-[#3F534E] mt-3 italic bg-[#F5F7F5] p-2.5 rounded border border-[#DCE3DF]">
                    Guidance: {n.notes}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="flex gap-2 mt-5 pt-3 border-t border-[#DCE3DF]">
                  <button
                    onClick={() => openEditModal(n)}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete plan "${n.name}"?`)) {
                        deleteNutrition(n.id);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Nutrition Modal */}
      <Modal
        isOpen={isAddOpen || !!editingPlan}
        onClose={() => {
          setIsAddOpen(false);
          setEditingPlan(null);
        }}
        title={editingPlan ? `Edit Nutrition Plan — ${editingPlan.name}` : 'Create Nutrition Plan'}
        subtitle="Specify daily caloric intake and macro distribution per meal"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Plan Name *</label>
              <input
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. High Protein Clean Bulk"
              />
            </div>

            <div>
              <label className="field-label">Assigned Member *</label>
              <select
                required
                className="input"
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="field-label">Target Calories / Day *</label>
              <input
                required
                type="number"
                min="500"
                className="input"
                value={formData.totalCalories}
                onChange={(e) => setFormData({ ...formData, totalCalories: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Dynamic Meals */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label !mb-0">Meal Schedule ({formData.meals.length})</label>
              <button
                type="button"
                onClick={handleAddMeal}
                className="btn btn-outline btn-sm text-xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Meal</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formData.meals.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    required
                    className="input w-36"
                    placeholder="Meal (Breakfast)"
                    value={m.name}
                    onChange={(e) => handleMealChange(idx, 'name', e.target.value)}
                  />
                  <input
                    type="time"
                    className="input w-28"
                    value={m.time}
                    onChange={(e) => handleMealChange(idx, 'time', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="input w-24"
                    placeholder="Kcal"
                    value={m.calories}
                    onChange={(e) => handleMealChange(idx, 'calories', Number(e.target.value))}
                  />
                  <input
                    className="input flex-1"
                    placeholder="Food items & notes"
                    value={m.notes}
                    onChange={(e) => handleMealChange(idx, 'notes', e.target.value)}
                  />
                  {formData.meals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal(idx)}
                      className="p-1.5 text-[#D8483A] hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">General Diet Recommendations &amp; Hydration</label>
            <textarea
              rows={2}
              className="input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Drink 3-4L water daily, minimize processed sugars..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#DCE3DF]">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setEditingPlan(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
