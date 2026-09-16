import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Member,
  Trainer,
  MembershipPlan,
  Membership,
  AttendanceRecord,
  FitnessClass,
  WorkoutProgram,
  NutritionPlan,
  Equipment,
  PaymentInvoice,
  Announcement,
  GymSettings,
  ActiveNavKey,
} from '../types';
import {
  initialUsers,
  initialPlans,
  initialTrainers,
  initialMembers,
  initialMemberships,
  initialAttendance,
  initialClasses,
  initialWorkouts,
  initialNutrition,
  initialEquipment,
  initialPayments,
  initialAnnouncements,
  initialSettings,
} from '../data/initialData';
import { todayISO, uid, daysUntil } from '../utils/formatters';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface BillingBatchResult {
  processedCount: number;
  totalAmount: number;
  renewedMemberNames: string[];
}

interface GymContextType {
  activeNav: ActiveNavKey;
  setActiveNav: (nav: ActiveNavKey) => void;
  currentUser: User | null;
  login: (username: string, pass: string) => boolean;
  switchRole: (role: User['role']) => void;
  logout: () => void;
  toasts: ToastInfo[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Members
  members: Member[];
  addMember: (m: Omit<Member, 'id' | 'memberCode' | 'registrationDate'>) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  // Trainers
  trainers: Trainer[];
  addTrainer: (t: Omit<Trainer, 'id' | 'trainerCode' | 'joinDate'>) => Trainer;
  updateTrainer: (id: string, updates: Partial<Trainer>) => void;
  deleteTrainer: (id: string) => void;
  assignMembersToTrainer: (trainerId: string, memberIds: string[]) => void;

  // Plans & Memberships
  plans: MembershipPlan[];
  addPlan: (p: Omit<MembershipPlan, 'id'>) => MembershipPlan;
  updatePlan: (id: string, updates: Partial<MembershipPlan>) => void;
  deletePlan: (id: string) => void;

  memberships: Membership[];
  assignMembership: (data: { memberId: string; planId: string; startDate: string; autoRenew?: boolean; paymentMethod?: string }) => void;
  renewMembership: (id: string) => void;
  upgradeMembership: (id: string, newPlanId: string) => void;
  freezeMembership: (id: string) => void;
  unfreezeMembership: (id: string) => void;
  cancelMembership: (id: string) => void;
  toggleAutoRenew: (id: string) => void;

  // Attendance
  attendance: AttendanceRecord[];
  checkInMember: (memberId: string, method?: 'QR Code' | 'Manual' | 'Kiosk', sessionName?: string) => boolean;
  checkOutMember: (id: string) => void;

  // Classes
  classes: FitnessClass[];
  addClass: (c: Omit<FitnessClass, 'id' | 'enrolledMemberIds'>) => void;
  updateClass: (id: string, updates: Partial<FitnessClass>) => void;
  deleteClass: (id: string) => void;
  updateClassRoster: (classId: string, memberIds: string[]) => void;

  // Workouts
  workouts: WorkoutProgram[];
  addWorkout: (w: Omit<WorkoutProgram, 'id' | 'assignedMemberIds'>) => void;
  updateWorkout: (id: string, updates: Partial<WorkoutProgram>) => void;
  deleteWorkout: (id: string) => void;
  assignWorkoutMembers: (workoutId: string, memberIds: string[]) => void;

  // Nutrition
  nutrition: NutritionPlan[];
  addNutrition: (n: Omit<NutritionPlan, 'id'>) => void;
  updateNutrition: (id: string, updates: Partial<NutritionPlan>) => void;
  deleteNutrition: (id: string) => void;

  // Equipment
  equipment: Equipment[];
  addEquipment: (e: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  logEquipmentMaintenance: (id: string, nextDate: string, notes: string) => void;

  // Payments & Automated Billing
  payments: PaymentInvoice[];
  recordPayment: (p: { memberId: string; amount: number; discount: number; method: string; status: 'Paid' | 'Pending' | 'Failed'; date?: string }) => void;
  markPaymentPaid: (id: string) => void;
  runAutomatedBillingCycle: () => BillingBatchResult;

  // Announcements
  announcements: Announcement[];
  addAnnouncement: (a: Omit<Announcement, 'id' | 'date' | 'author'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;

  // Settings
  settings: GymSettings;
  updateSettings: (s: Partial<GymSettings>) => void;
  backupData: () => string;
  restoreData: (jsonStr: string) => boolean;
  resetToDefaults: () => void;

  // Helpers
  memberById: (id: string) => Member | undefined;
  trainerById: (id: string) => Trainer | undefined;
  planById: (id: string) => MembershipPlan | undefined;
  activeMembershipFor: (memberId: string) => Membership | undefined;
  classById: (id: string) => FitnessClass | undefined;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`gms_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`gms_${key}`, JSON.stringify(value));
  } catch {}
}

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNav, setActiveNav] = useState<ActiveNavKey>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUid = sessionStorage.getItem('gms_session_uid');
    const users = loadStorage<User[]>('users', initialUsers);
    if (storedUid) {
      const found = users.find((u) => u.id === storedUid);
      if (found) return found;
    }
    return null;
  });

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = uid('TST');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State slices initialized from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => loadStorage('users', initialUsers));
  const [members, setMembers] = useState<Member[]>(() => loadStorage('members', initialMembers));
  const [trainers, setTrainers] = useState<Trainer[]>(() => loadStorage('trainers', initialTrainers));
  const [plans, setPlans] = useState<MembershipPlan[]>(() => loadStorage('plans', initialPlans));
  const [memberships, setMemberships] = useState<Membership[]>(() => {
    const ms = loadStorage<Membership[]>('memberships', initialMemberships);
    // Refresh expired statuses
    return ms.map((m) => {
      if (m.status === 'Active' && daysUntil(m.endDate) < 0) {
        return { ...m, status: 'Expired' };
      }
      return m;
    });
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadStorage('attendance', initialAttendance));
  const [classes, setClasses] = useState<FitnessClass[]>(() => loadStorage('classes', initialClasses));
  const [workouts, setWorkouts] = useState<WorkoutProgram[]>(() => loadStorage('workouts', initialWorkouts));
  const [nutrition, setNutrition] = useState<NutritionPlan[]>(() => loadStorage('nutrition', initialNutrition));
  const [equipment, setEquipment] = useState<Equipment[]>(() => loadStorage('equipment', initialEquipment));
  const [payments, setPayments] = useState<PaymentInvoice[]>(() => loadStorage('payments', initialPayments));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadStorage('announcements', initialAnnouncements));
  const [settings, setSettings] = useState<GymSettings>(() => loadStorage('settings', initialSettings));

  // Sync state to storage
  useEffect(() => saveStorage('users', users), [users]);
  useEffect(() => saveStorage('members', members), [members]);
  useEffect(() => saveStorage('trainers', trainers), [trainers]);
  useEffect(() => saveStorage('plans', plans), [plans]);
  useEffect(() => saveStorage('memberships', memberships), [memberships]);
  useEffect(() => saveStorage('attendance', attendance), [attendance]);
  useEffect(() => saveStorage('classes', classes), [classes]);
  useEffect(() => saveStorage('workouts', workouts), [workouts]);
  useEffect(() => saveStorage('nutrition', nutrition), [nutrition]);
  useEffect(() => saveStorage('equipment', equipment), [equipment]);
  useEffect(() => saveStorage('payments', payments), [payments]);
  useEffect(() => saveStorage('announcements', announcements), [announcements]);
  useEffect(() => saveStorage('settings', settings), [settings]);

  // Auth
  const login = (username: string, pass: string): boolean => {
    const user = users.find((u) => u.username === username && u.password === pass);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('gms_session_uid', user.id);
      showToast(`Welcome back, ${user.name}!`, 'success');
      return true;
    }
    showToast('Invalid credentials. Check demo accounts below.', 'error');
    return false;
  };

  const switchRole = (role: User['role']) => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('gms_session_uid', user.id);
      showToast(`Switched active view to ${role.toUpperCase()}`, 'info');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('gms_session_uid');
    setCurrentUser(null);
    setActiveNav('dashboard');
    showToast('Logged out of session', 'info');
  };

  // Helper getters
  const memberById = (id: string) => members.find((m) => m.id === id);
  const trainerById = (id: string) => trainers.find((t) => t.id === id);
  const planById = (id: string) => plans.find((p) => p.id === id);
  const classById = (id: string) => classes.find((c) => c.id === id);
  const activeMembershipFor = (memberId: string) => {
    const list = memberships.filter((m) => m.memberId === memberId);
    return list.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  };

  // Members
  const addMember = (data: Omit<Member, 'id' | 'memberCode' | 'registrationDate'>) => {
    const newMember: Member = {
      ...data,
      id: uid('M'),
      memberCode: uid('MEM'),
      registrationDate: todayISO(),
    };
    setMembers((prev) => [newMember, ...prev]);
    showToast(`Member registered: ${newMember.fullName}`, 'success');
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    showToast('Member profile updated', 'success');
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast('Member removed from registry', 'info');
  };

  // Trainers
  const addTrainer = (data: Omit<Trainer, 'id' | 'trainerCode' | 'joinDate'>) => {
    const newTrainer: Trainer = {
      ...data,
      id: uid('T'),
      trainerCode: uid('TR'),
      joinDate: todayISO(),
    };
    setTrainers((prev) => [...prev, newTrainer]);
    showToast(`Trainer added: ${newTrainer.name}`, 'success');
    return newTrainer;
  };

  const updateTrainer = (id: string, updates: Partial<Trainer>) => {
    setTrainers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    showToast('Trainer profile updated', 'success');
  };

  const deleteTrainer = (id: string) => {
    setTrainers((prev) => prev.filter((t) => t.id !== id));
    setMembers((prev) => prev.map((m) => (m.trainerId === id ? { ...m, trainerId: '' } : m)));
    showToast('Trainer removed', 'info');
  };

  const assignMembersToTrainer = (trainerId: string, memberIds: string[]) => {
    const targetSet = new Set(memberIds);
    setMembers((prev) =>
      prev.map((m) => {
        if (targetSet.has(m.id)) return { ...m, trainerId };
        if (m.trainerId === trainerId) return { ...m, trainerId: '' };
        return m;
      })
    );
    showToast('Trainer roster updated', 'success');
  };

  // Plans
  const addPlan = (data: Omit<MembershipPlan, 'id'>) => {
    const newPlan: MembershipPlan = { ...data, id: uid('P') };
    setPlans((prev) => [...prev, newPlan]);
    showToast(`Membership plan created: ${newPlan.name}`, 'success');
    return newPlan;
  };

  const updatePlan = (id: string, updates: Partial<MembershipPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Membership plan updated', 'success');
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    showToast('Membership plan removed', 'info');
  };

  // Memberships & Subscriptions
  const assignMembership = (data: {
    memberId: string;
    planId: string;
    startDate: string;
    autoRenew?: boolean;
    paymentMethod?: string;
  }) => {
    const plan = planById(data.planId);
    if (!plan) return;
    const end = new Date(data.startDate);
    end.setDate(end.getDate() + plan.durationDays);
    const endDateStr = end.toISOString().slice(0, 10);

    const newMs: Membership = {
      id: uid('MS'),
      memberId: data.memberId,
      planId: data.planId,
      startDate: data.startDate,
      endDate: endDateStr,
      status: 'Active',
      assignedDate: todayISO(),
      autoRenew: data.autoRenew ?? plan.isRecurring,
      nextBillingDate: endDateStr,
      recurringAmount: plan.price,
      paymentMethod: data.paymentMethod || 'Credit Card',
    };

    setMemberships((prev) => [newMs, ...prev]);

    // Also automatically log initial invoice
    const newInvoice: PaymentInvoice = {
      id: uid('PMT'),
      invoiceNo: `INV-${2100 + payments.length}`,
      memberId: data.memberId,
      membershipId: newMs.id,
      amount: plan.price,
      discount: 0,
      netAmount: plan.price,
      method: newMs.paymentMethod,
      date: todayISO(),
      status: 'Paid',
      autoBilled: false,
      billingPeriodStart: data.startDate,
      billingPeriodEnd: endDateStr,
    };
    setPayments((prev) => [newInvoice, ...prev]);

    showToast(`Membership assigned to ${memberById(data.memberId)?.fullName}`, 'success');
  };

  const renewMembership = (id: string) => {
    setMemberships((prev) =>
      prev.map((ms) => {
        if (ms.id !== id) return ms;
        const plan = planById(ms.planId);
        const duration = plan?.durationDays || 30;
        const base = new Date(ms.status === 'Expired' ? todayISO() : ms.endDate);
        base.setDate(base.getDate() + duration);
        const newEnd = base.toISOString().slice(0, 10);

        // Record renewal invoice
        const inv: PaymentInvoice = {
          id: uid('PMT'),
          invoiceNo: `INV-${2100 + payments.length}`,
          memberId: ms.memberId,
          membershipId: ms.id,
          amount: plan?.price || ms.recurringAmount,
          discount: 0,
          netAmount: plan?.price || ms.recurringAmount,
          method: ms.paymentMethod || 'Credit Card',
          date: todayISO(),
          status: 'Paid',
          autoBilled: false,
          billingPeriodStart: todayISO(),
          billingPeriodEnd: newEnd,
        };
        setPayments((p) => [inv, ...p]);

        return {
          ...ms,
          endDate: newEnd,
          nextBillingDate: newEnd,
          status: 'Active',
        };
      })
    );
    showToast('Membership renewed successfully', 'success');
  };

  const upgradeMembership = (id: string, newPlanId: string) => {
    const plan = planById(newPlanId);
    if (!plan) return;
    setMemberships((prev) =>
      prev.map((ms) => {
        if (ms.id !== id) return ms;
        const start = todayISO();
        const end = new Date(start);
        end.setDate(end.getDate() + plan.durationDays);
        const endDateStr = end.toISOString().slice(0, 10);

        return {
          ...ms,
          planId: newPlanId,
          startDate: start,
          endDate: endDateStr,
          nextBillingDate: endDateStr,
          recurringAmount: plan.price,
          status: 'Active',
        };
      })
    );
    showToast(`Upgraded to ${plan.name}`, 'success');
  };

  const freezeMembership = (id: string) => {
    setMemberships((prev) => prev.map((ms) => (ms.id === id ? { ...ms, status: 'Frozen' } : ms)));
    showToast('Membership paused/frozen', 'info');
  };

  const unfreezeMembership = (id: string) => {
    setMemberships((prev) =>
      prev.map((ms) => {
        if (ms.id !== id) return ms;
        return {
          ...ms,
          status: daysUntil(ms.endDate) < 0 ? 'Expired' : 'Active',
        };
      })
    );
    showToast('Membership reactivated', 'success');
  };

  const cancelMembership = (id: string) => {
    setMemberships((prev) =>
      prev.map((ms) => (ms.id === id ? { ...ms, status: 'Cancelled', autoRenew: false } : ms))
    );
    showToast('Membership cancelled', 'info');
  };

  const toggleAutoRenew = (id: string) => {
    setMemberships((prev) =>
      prev.map((ms) => {
        if (ms.id !== id) return ms;
        const nextVal = !ms.autoRenew;
        showToast(nextVal ? 'Automated recurring billing enabled' : 'Auto-renew disabled', 'info');
        return { ...ms, autoRenew: nextVal };
      })
    );
  };

  // Attendance
  const checkInMember = (memberId: string, method: 'QR Code' | 'Manual' | 'Kiosk' = 'Manual', sessionName?: string): boolean => {
    const today = todayISO();
    const existingOpen = attendance.find((a) => a.memberId === memberId && a.date === today && !a.checkOut);
    if (existingOpen) {
      showToast('This member is already checked in and on the premises.', 'error');
      return false;
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const newRecord: AttendanceRecord = {
      id: uid('AT'),
      memberId,
      date: today,
      checkIn: timeStr,
      checkOut: '',
      method,
      sessionName: sessionName || 'Gym Floor Access',
    };

    setAttendance((prev) => [newRecord, ...prev]);
    const mem = memberById(memberId);
    showToast(`Checked in: ${mem?.fullName || 'Member'} (${method})`, 'success');
    return true;
  };

  const checkOutMember = (id: string) => {
    const timeStr = new Date().toTimeString().slice(0, 5);
    setAttendance((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checkOut: timeStr } : a))
    );
    showToast('Member checked out', 'info');
  };

  // Classes
  const addClass = (data: Omit<FitnessClass, 'id' | 'enrolledMemberIds'>) => {
    const newClass: FitnessClass = {
      ...data,
      id: uid('CL'),
      enrolledMemberIds: [],
    };
    setClasses((prev) => [...prev, newClass]);
    showToast(`Class created: ${newClass.name}`, 'success');
  };

  const updateClass = (id: string, updates: Partial<FitnessClass>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Class schedule updated', 'success');
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    showToast('Class removed', 'info');
  };

  const updateClassRoster = (classId: string, memberIds: string[]) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, enrolledMemberIds: memberIds } : c))
    );
    showToast('Class roster saved', 'success');
  };

  // Workouts
  const addWorkout = (data: Omit<WorkoutProgram, 'id' | 'assignedMemberIds'>) => {
    const newWk: WorkoutProgram = {
      ...data,
      id: uid('WK'),
      assignedMemberIds: [],
    };
    setWorkouts((prev) => [...prev, newWk]);
    showToast(`Workout program created: ${newWk.name}`, 'success');
  };

  const updateWorkout = (id: string, updates: Partial<WorkoutProgram>) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    showToast('Workout program updated', 'success');
  };

  const deleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    showToast('Workout program deleted', 'info');
  };

  const assignWorkoutMembers = (workoutId: string, memberIds: string[]) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === workoutId ? { ...w, assignedMemberIds: memberIds } : w))
    );
    showToast('Workout assignments updated', 'success');
  };

  // Nutrition
  const addNutrition = (data: Omit<NutritionPlan, 'id'>) => {
    const newN: NutritionPlan = { ...data, id: uid('NT') };
    setNutrition((prev) => [...prev, newN]);
    showToast(`Nutrition plan created: ${newN.name}`, 'success');
  };

  const updateNutrition = (id: string, updates: Partial<NutritionPlan>) => {
    setNutrition((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    showToast('Nutrition plan updated', 'success');
  };

  const deleteNutrition = (id: string) => {
    setNutrition((prev) => prev.filter((n) => n.id !== id));
    showToast('Nutrition plan removed', 'info');
  };

  // Equipment
  const addEquipment = (data: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...data, id: uid('EQ') };
    setEquipment((prev) => [...prev, newEq]);
    showToast(`Equipment item added: ${newEq.name}`, 'success');
  };

  const updateEquipment = (id: string, updates: Partial<Equipment>) => {
    setEquipment((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    showToast('Equipment record updated', 'success');
  };

  const deleteEquipment = (id: string) => {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    showToast('Equipment item removed', 'info');
  };

  const logEquipmentMaintenance = (id: string, nextDate: string, notes: string) => {
    setEquipment((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              lastMaintenance: todayISO(),
              nextMaintenance: nextDate,
              status: 'Available',
              notes,
            }
          : e
      )
    );
    showToast('Maintenance logged — equipment marked Available', 'success');
  };

  // Payments & Automated Billing
  const recordPayment = (data: {
    memberId: string;
    amount: number;
    discount: number;
    method: string;
    status: 'Paid' | 'Pending' | 'Failed';
    date?: string;
  }) => {
    const ms = activeMembershipFor(data.memberId);
    const net = data.amount - (data.amount * (data.discount || 0)) / 100;
    const newInv: PaymentInvoice = {
      id: uid('PMT'),
      invoiceNo: `INV-${2100 + payments.length}`,
      memberId: data.memberId,
      membershipId: ms?.id || '',
      amount: data.amount,
      discount: data.discount,
      netAmount: net,
      method: data.method,
      date: data.date || todayISO(),
      status: data.status,
      autoBilled: false,
    };
    setPayments((prev) => [newInv, ...prev]);
    showToast(`Payment invoice ${newInv.invoiceNo} recorded`, 'success');
  };

  const markPaymentPaid = (id: string) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'Paid' } : p)));
    showToast('Invoice marked as Paid', 'success');
  };

  // Recurring Billing Engine
  const runAutomatedBillingCycle = (): BillingBatchResult => {
    let count = 0;
    let total = 0;
    const names: string[] = [];
    const newInvoices: PaymentInvoice[] = [];

    setMemberships((prev) =>
      prev.map((ms) => {
        // Condition: autoRenew is enabled, active or expiring soon (within 3 days or already past due)
        const dueDays = daysUntil(ms.nextBillingDate || ms.endDate);
        if (ms.autoRenew && ms.status !== 'Cancelled' && dueDays <= 3) {
          const plan = planById(ms.planId);
          const duration = plan?.durationDays || 30;
          const price = plan?.price || ms.recurringAmount || 45;

          const base = new Date(ms.status === 'Expired' ? todayISO() : ms.endDate);
          base.setDate(base.getDate() + duration);
          const newEnd = base.toISOString().slice(0, 10);

          const member = memberById(ms.memberId);
          names.push(member?.fullName || `Member ${ms.memberId}`);
          count++;
          total += price;

          newInvoices.push({
            id: uid('PMT'),
            invoiceNo: `INV-${2100 + payments.length + count}`,
            memberId: ms.memberId,
            membershipId: ms.id,
            amount: price,
            discount: 0,
            netAmount: price,
            method: ms.paymentMethod || 'Credit Card',
            date: todayISO(),
            status: 'Paid',
            autoBilled: true,
            billingPeriodStart: todayISO(),
            billingPeriodEnd: newEnd,
          });

          return {
            ...ms,
            endDate: newEnd,
            nextBillingDate: newEnd,
            status: 'Active',
          };
        }
        return ms;
      })
    );

    if (newInvoices.length > 0) {
      setPayments((prev) => [...newInvoices, ...prev]);
      showToast(
        `Automated Recurring Billing Run: ${count} subscriptions renewed ($${total.toFixed(2)})`,
        'success'
      );
    } else {
      showToast('Automated Billing Check: All subscriptions are up-to-date! No cycles due today.', 'info');
    }

    return {
      processedCount: count,
      totalAmount: total,
      renewedMemberNames: names,
    };
  };

  // Announcements
  const addAnnouncement = (data: Omit<Announcement, 'id' | 'date' | 'author'>) => {
    const newAnn: Announcement = {
      ...data,
      id: uid('AN'),
      date: todayISO(),
      author: currentUser?.name || 'Staff',
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    showToast('Announcement published', 'success');
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    showToast('Announcement updated', 'success');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('Announcement deleted', 'info');
  };

  // Settings
  const updateSettings = (updates: Partial<GymSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Gym settings saved', 'success');
  };

  const backupData = (): string => {
    const dump = {
      users,
      members,
      trainers,
      plans,
      memberships,
      attendance,
      classes,
      workouts,
      nutrition,
      equipment,
      payments,
      announcements,
      settings: { ...settings, lastBackup: todayISO() },
    };
    const json = JSON.stringify(dump, null, 2);
    setSettings((s) => ({ ...s, lastBackup: todayISO() }));
    showToast('Database backup exported', 'success');
    return json;
  };

  const restoreData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.users) setUsers(data.users);
      if (data.members) setMembers(data.members);
      if (data.trainers) setTrainers(data.trainers);
      if (data.plans) setPlans(data.plans);
      if (data.memberships) setMemberships(data.memberships);
      if (data.attendance) setAttendance(data.attendance);
      if (data.classes) setClasses(data.classes);
      if (data.workouts) setWorkouts(data.workouts);
      if (data.nutrition) setNutrition(data.nutrition);
      if (data.equipment) setEquipment(data.equipment);
      if (data.payments) setPayments(data.payments);
      if (data.announcements) setAnnouncements(data.announcements);
      if (data.settings) setSettings(data.settings);
      showToast('Database restored successfully', 'success');
      return true;
    } catch {
      showToast('Failed to parse backup JSON', 'error');
      return false;
    }
  };

  const resetToDefaults = () => {
    setUsers(initialUsers);
    setMembers(initialMembers);
    setTrainers(initialTrainers);
    setPlans(initialPlans);
    setMemberships(initialMemberships);
    setAttendance(initialAttendance);
    setClasses(initialClasses);
    setWorkouts(initialWorkouts);
    setNutrition(initialNutrition);
    setEquipment(initialEquipment);
    setPayments(initialPayments);
    setAnnouncements(initialAnnouncements);
    setSettings(initialSettings);
    showToast('Reset system to team default data', 'info');
  };

  return (
    <GymContext.Provider
      value={{
        activeNav,
        setActiveNav,
        currentUser,
        login,
        switchRole,
        logout,
        toasts,
        showToast,
        removeToast,
        members,
        addMember,
        updateMember,
        deleteMember,
        trainers,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        assignMembersToTrainer,
        plans,
        addPlan,
        updatePlan,
        deletePlan,
        memberships,
        assignMembership,
        renewMembership,
        upgradeMembership,
        freezeMembership,
        unfreezeMembership,
        cancelMembership,
        toggleAutoRenew,
        attendance,
        checkInMember,
        checkOutMember,
        classes,
        addClass,
        updateClass,
        deleteClass,
        updateClassRoster,
        workouts,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        assignWorkoutMembers,
        nutrition,
        addNutrition,
        updateNutrition,
        deleteNutrition,
        equipment,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        logEquipmentMaintenance,
        payments,
        recordPayment,
        markPaymentPaid,
        runAutomatedBillingCycle,
        announcements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        settings,
        updateSettings,
        backupData,
        restoreData,
        resetToDefaults,
        memberById,
        trainerById,
        planById,
        activeMembershipFor,
        classById,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error('useGym must be used within a GymProvider');
  return ctx;
};
