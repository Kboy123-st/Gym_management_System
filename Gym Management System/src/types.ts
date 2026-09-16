export type Role = 'admin' | 'receptionist' | 'trainer';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  email: string;
  phone: string;
  photo?: string;
  trainerId?: string;
}

export interface Member {
  id: string;
  memberCode: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  registrationDate: string;
  photo?: string;
  trainerId?: string;
  healthNotes?: string;
}

export interface Trainer {
  id: string;
  trainerCode: string;
  name: string;
  phone: string;
  email: string;
  experienceYears: number;
  specialty: string;
  certification: string;
  salary: number;
  joinDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  photo?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  type: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Half-Year' | 'Annual';
  durationDays: number;
  price: number;
  description: string;
  isRecurring: boolean;
  billingCycleDays: number;
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Frozen' | 'Cancelled';
  assignedDate: string;
  autoRenew: boolean;
  nextBillingDate: string;
  recurringAmount: number;
  paymentMethod: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  method: 'QR Code' | 'Manual' | 'Kiosk';
  classSessionId?: string;
  sessionName?: string;
}

export interface FitnessClass {
  id: string;
  name: string;
  category: 'Yoga' | 'Zumba' | 'Aerobics' | 'HIIT' | 'Spinning' | 'Pilates';
  trainerId: string;
  day: string;
  time: string;
  capacity: number;
  enrolledMemberIds: string[];
  room?: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  category: string;
  description: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    weight?: string;
  }>;
  assignedMemberIds: string[];
}

export interface NutritionPlan {
  id: string;
  memberId: string;
  name: string;
  totalCalories: number;
  meals: Array<{
    name: string;
    time: string;
    calories: number;
    notes: string;
  }>;
  notes: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  status: 'Available' | 'Under Maintenance' | 'Damaged';
  lastMaintenance: string;
  nextMaintenance: string;
  notes: string;
}

export interface PaymentInvoice {
  id: string;
  invoiceNo: string;
  memberId: string;
  membershipId: string;
  amount: number;
  discount: number;
  netAmount: number;
  method: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Mobile Payment' | string;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  autoBilled?: boolean;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: 'Class Updates' | 'Holiday Notices' | 'Gym Events' | 'Maintenance Notifications' | 'General';
  date: string;
  author: string;
}

export interface GymSettings {
  gymName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: number;
  businessHours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  paymentMethods: {
    cash: boolean;
    card: boolean;
    bankTransfer: boolean;
    mobile: boolean;
  };
  autoBillingEnabled: boolean;
  lastBackup?: string;
}

export type ActiveNavKey =
  | 'dashboard'
  | 'members'
  | 'trainers'
  | 'memberships'
  | 'attendance'
  | 'classes'
  | 'workouts'
  | 'nutrition'
  | 'equipment'
  | 'payments'
  | 'reports'
  | 'announcements'
  | 'notifications'
  | 'schema'
  | 'settings'
  | 'profile';
