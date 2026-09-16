/* ============================================================
   Iron & Lime — Gym Management System
   common.js — data layer, auth, seed data, shared chrome
   All data is stored in the browser's localStorage. This is a
   front-end demo/scaffold: swap the DB.* functions for real
   API calls when wiring up a backend.
   ============================================================ */

const DB = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem('gms_' + key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  set(key, value){
    localStorage.setItem('gms_' + key, JSON.stringify(value));
    return value;
  }
};

function uid(prefix){
  const store = DB.get('counters', {});
  store[prefix] = (store[prefix] || 0) + 1;
  DB.set('counters', store);
  return prefix + '-' + String(store[prefix]).padStart(4, '0');
}

function todayISO(offsetDays = 0){
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0,10);
}

/* ---------------------------------------------------------- */
/* Seed data — only runs once, on first load                  */
/* ---------------------------------------------------------- */
function seedIfEmpty(){
  if (DB.get('seeded', false)) return;

  DB.set('users', [
    { id:'U-0001', name:'Alex Morgan',  username:'admin',       password:'admin123', role:'admin',        email:'admin@ironlime.gym',  phone:'012 345 678', photo:'' },
    { id:'U-0002', name:'Sophie Chan',  username:'reception',   password:'front123', role:'receptionist',  email:'sophie@ironlime.gym', phone:'012 345 679', photo:'' },
    { id:'U-0003', name:'Marcus Reed',  username:'trainer',     password:'train123', role:'trainer',       email:'marcus@ironlime.gym', phone:'012 345 680', photo:'', trainerId:'T-0001' },
  ]);

  const plans = [
    { id:'P-0001', name:'Day Pass',        type:'Daily',     durationDays:1,   price:8,   description:'Single-day access to the full gym floor.' },
    { id:'P-0002', name:'Weekly Starter',  type:'Weekly',     durationDays:7,   price:25,  description:'7 days unlimited access, great for trial members.' },
    { id:'P-0003', name:'Monthly Classic', type:'Monthly',    durationDays:30,  price:45,  description:'Full access, most popular plan.' },
    { id:'P-0004', name:'Quarterly Plus',  type:'Quarterly',  durationDays:90,  price:120, description:'3 months, includes 2 free classes/month.' },
    { id:'P-0005', name:'Half-Year Pro',   type:'Half-Year',  durationDays:182, price:220, description:'6 months, includes nutrition consult.' },
    { id:'P-0006', name:'Annual Elite',    type:'Annual',     durationDays:365, price:400, description:'12 months, best value, includes 1 free PT session/month.' },
  ];
  DB.set('plans', plans);

  const trainers = [
    { id:'T-0001', trainerCode:'TR-0001', name:'Marcus Reed',  phone:'012 345 680', email:'marcus@ironlime.gym', experienceYears:6, specialty:'Strength & Conditioning', certification:'NASM-CPT', salary:1400, joinDate:'2022-03-01', status:'Active', photo:'' },
    { id:'T-0002', trainerCode:'TR-0002', name:'Priya Nair',   phone:'012 345 681', email:'priya@ironlime.gym',  experienceYears:4, specialty:'Yoga & Mobility',          certification:'RYT-500',  salary:1200, joinDate:'2023-01-15', status:'Active', photo:'' },
    { id:'T-0003', trainerCode:'TR-0003', name:'Jonah Kim',    phone:'012 345 682', email:'jonah@ironlime.gym',  experienceYears:8, specialty:'CrossFit & HIIT',          certification:'CF-L2',    salary:1600, joinDate:'2021-08-20', status:'Active', photo:'' },
    { id:'T-0004', trainerCode:'TR-0004', name:'Lena Fischer', phone:'012 345 683', email:'lena@ironlime.gym',   experienceYears:3, specialty:'Weight Loss Coaching',     certification:'ACE-CPT',  salary:1100, joinDate:'2023-11-05', status:'On Leave', photo:'' },
  ];
  DB.set('trainers', trainers);

  const memberNames = [
    ['Liam Carter','Male'], ['Emma Wilson','Female'], ['Noah Bennett','Male'], ['Olivia Grant','Female'],
    ['Ethan Brooks','Male'], ['Ava Sullivan','Female'], ['Mason Reyes','Male'], ['Isabella Cruz','Female'],
    ['Lucas Ford','Male'], ['Mia Coleman','Female'], ['James Whitfield','Male'], ['Chloe Adams','Female']
  ];
  const members = memberNames.map((m,i) => ({
    id:'M-' + String(1000+i),
    memberCode:'MEM-' + String(1000+i),
    fullName:m[0],
    gender:m[1],
    dob: `199${i%9}-0${(i%9)+1}-1${i%2===0?5:8}`,
    phone:'011 22' + (30+i) + '00',
    email: m[0].toLowerCase().replace(' ','.') + '@mail.com',
    address:'No. ' + (10+i) + ', Riverside Ave',
    emergencyContact: 'Contact for ' + m[0],
    emergencyPhone:'011 99' + (10+i) + '00',
    registrationDate: todayISO(-(30*i+5)),
    photo:'',
    trainerId: trainers[i % trainers.length].id
  }));
  DB.set('members', members);

  const memberships = members.map((mem,i) => {
    const plan = plans[i % plans.length];
    const start = todayISO(-(i*10));
    const endOffset = plan.durationDays - (i*10);
    const end = todayISO(plan.durationDays - (i*10));
    let status = 'Active';
    if (endOffset < 0) status = 'Expired';
    if (i === 3) status = 'Frozen';
    if (i === 7) status = 'Cancelled';
    return {
      id: uid('MS'),
      memberId: mem.id,
      planId: plan.id,
      startDate: start,
      endDate: end,
      status,
      assignedDate: start
    };
  });
  DB.set('memberships', memberships);

  const attendance = [];
  members.slice(0,8).forEach((mem,i) => {
    for(let d=0; d<5; d++){
      if ((i+d) % 3 === 0) continue;
      attendance.push({
        id: uid('AT'),
        memberId: mem.id,
        date: todayISO(-d),
        checkIn: `0${7+(i%3)}:${10+i}0`,
        checkOut: d===0 ? '' : `0${9+(i%3)}:${15+i}0`,
        method: i % 4 === 0 ? 'QR Code' : 'Manual'
      });
    }
  });
  DB.set('attendance', attendance);

  DB.set('equipment', [
    { id:'EQ-0001', name:'Treadmill Pro X3',        category:'Cardio',      purchaseDate:'2022-01-10', status:'Available',        lastMaintenance: todayISO(-40), nextMaintenance: todayISO(20), notes:'' },
    { id:'EQ-0002', name:'Olympic Barbell Set',     category:'Strength',    purchaseDate:'2021-06-15', status:'Available',        lastMaintenance: todayISO(-90), nextMaintenance: todayISO(90), notes:'' },
    { id:'EQ-0003', name:'Cable Crossover Machine', category:'Strength',    purchaseDate:'2022-09-01', status:'Under Maintenance', lastMaintenance: todayISO(-2),  nextMaintenance: todayISO(2), notes:'Pulley cable replacement in progress.' },
    { id:'EQ-0004', name:'Rowing Machine',          category:'Cardio',      purchaseDate:'2023-02-20', status:'Available',        lastMaintenance: todayISO(-15), nextMaintenance: todayISO(45), notes:'' },
    { id:'EQ-0005', name:'Spin Bike (x6 set)',      category:'Cardio',      purchaseDate:'2022-11-11', status:'Available',        lastMaintenance: todayISO(-10), nextMaintenance: todayISO(50), notes:'' },
    { id:'EQ-0006', name:'Leg Press Machine',       category:'Strength',    purchaseDate:'2020-05-05', status:'Damaged',          lastMaintenance: todayISO(-5),  nextMaintenance: todayISO(1), notes:'Hydraulic seal leaking — awaiting part.' },
    { id:'EQ-0007', name:'Yoga Mat Set (x20)',      category:'Studio',      purchaseDate:'2023-04-18', status:'Available',        lastMaintenance: todayISO(-60), nextMaintenance: todayISO(120), notes:'' },
    { id:'EQ-0008', name:'Kettlebell Rack',         category:'Strength',    purchaseDate:'2021-12-01', status:'Available',        lastMaintenance: todayISO(-30), nextMaintenance: todayISO(60), notes:'' },
  ]);

  const payments = memberships.filter(m => m.status !== 'Cancelled').map((ms,i) => {
    const plan = plans.find(p=>p.id===ms.planId);
    const methods = ['Cash','Credit Card','Bank Transfer','Mobile Payment'];
    return {
      id: uid('PMT'),
      invoiceNo: 'INV-' + (2000+i),
      memberId: ms.memberId,
      membershipId: ms.id,
      amount: plan.price,
      discount: i % 5 === 0 ? 10 : 0,
      method: methods[i % methods.length],
      date: ms.assignedDate,
      status: i === 5 ? 'Pending' : 'Paid'
    };
  });
  DB.set('payments', payments);

  DB.set('classes', [
    { id:'CL-0001', name:'Sunrise Yoga',    category:'Yoga',     trainerId:'T-0002', day:'Mon/Wed/Fri', time:'06:30', capacity:20, enrolledMemberIds:[members[0].id, members[2].id, members[4].id] },
    { id:'CL-0002', name:'HIIT Blast',      category:'HIIT',     trainerId:'T-0003', day:'Tue/Thu',     time:'18:00', capacity:15, enrolledMemberIds:[members[1].id, members[3].id] },
    { id:'CL-0003', name:'Zumba Party',     category:'Zumba',    trainerId:'T-0002', day:'Wed/Fri',     time:'19:00', capacity:25, enrolledMemberIds:[members[5].id, members[6].id, members[7].id] },
    { id:'CL-0004', name:'Spin & Burn',     category:'Spinning', trainerId:'T-0004', day:'Mon/Thu',     time:'07:00', capacity:12, enrolledMemberIds:[members[8].id] },
    { id:'CL-0005', name:'Power Pilates',   category:'Pilates',  trainerId:'T-0002', day:'Sat',         time:'09:00', capacity:18, enrolledMemberIds:[] },
  ]);

  DB.set('workouts', [
    { id:'WK-0001', name:'Fat Burn Circuit',  category:'Weight Loss',     description:'Full-body circuit to maximize calorie burn.', exercises:[{name:'Jump Squats',sets:4,reps:'20'},{name:'Burpees',sets:4,reps:'15'},{name:'Mountain Climbers',sets:4,reps:'30s'}], assignedMemberIds:[members[1].id, members[5].id] },
    { id:'WK-0002', name:'Strength Foundations', category:'Strength Training', description:'Compound lifts for building a strength base.', exercises:[{name:'Back Squat',sets:5,reps:'5'},{name:'Bench Press',sets:5,reps:'5'},{name:'Deadlift',sets:3,reps:'5'}], assignedMemberIds:[members[0].id, members[2].id] },
    { id:'WK-0003', name:'CrossFit WOD Alpha', category:'CrossFit',       description:'High-intensity mixed-modal workout of the day.', exercises:[{name:'Wall Balls',sets:5,reps:'15'},{name:'Kettlebell Swings',sets:5,reps:'20'},{name:'Box Jumps',sets:5,reps:'12'}], assignedMemberIds:[members[6].id] },
    { id:'WK-0004', name:'Restorative Flow',  category:'Yoga',            description:'Gentle flow to improve mobility and recovery.', exercises:[{name:'Sun Salutation',sets:3,reps:'1'},{name:'Pigeon Pose',sets:2,reps:'60s'},{name:'Cat-Cow',sets:3,reps:'10'}], assignedMemberIds:[members[4].id] },
  ]);

  DB.set('nutrition', [
    { id:'NT-0001', memberId:members[0].id, name:'Lean Bulk Plan', totalCalories:2800, meals:[{name:'Breakfast',time:'07:00',calories:600,notes:'Oats, eggs, banana'},{name:'Lunch',time:'12:30',calories:900,notes:'Chicken, rice, greens'},{name:'Dinner',time:'19:00',calories:800,notes:'Salmon, sweet potato'}], notes:'Prioritize protein at every meal.' },
    { id:'NT-0002', memberId:members[1].id, name:'Fat Loss Plan',  totalCalories:1600, meals:[{name:'Breakfast',time:'07:30',calories:350,notes:'Greek yogurt, berries'},{name:'Lunch',time:'13:00',calories:550,notes:'Turkey wrap, salad'},{name:'Dinner',time:'18:30',calories:500,notes:'Tofu stir fry'}], notes:'Avoid sugary drinks; drink 2.5L water/day.' },
  ]);

  DB.set('announcements', [
    { id:'AN-0001', title:'New Year Opening Hours', body:'The gym will open from 8am–2pm on Jan 1st. Regular hours resume Jan 2nd.', category:'Holiday Notices', date: todayISO(-5), author:'Alex Morgan' },
    { id:'AN-0002', title:'HIIT Blast Time Change', body:'HIIT Blast now starts at 18:00 instead of 18:30, effective this week.', category:'Class Updates', date: todayISO(-2), author:'Jonah Kim' },
    { id:'AN-0003', title:'Leg Press Machine Down', body:'The leg press machine is temporarily out of service for repair. We apologize for the inconvenience.', category:'Maintenance Notifications', date: todayISO(-1), author:'Alex Morgan' },
    { id:'AN-0004', title:'Members Appreciation Day', body:'Join us this Saturday for free smoothies, guest classes, and giveaways!', category:'Gym Events', date: todayISO(1), author:'Sophie Chan' },
  ]);

  DB.set('settings', {
    gymName:'Iron & Lime Fitness',
    address:'88 Riverside Avenue, Siem Reap',
    phone:'+855 12 345 678',
    email:'hello@ironlime.gym',
    currency:'USD',
    taxRate:0,
    businessHours:{ weekday:'06:00 – 22:00', saturday:'07:00 – 20:00', sunday:'08:00 – 18:00' },
    paymentMethods:{ cash:true, card:true, bankTransfer:true, mobile:true },
    lastBackup: todayISO(-3)
  });

  DB.set('seeded', true);
}
seedIfEmpty();

/* ---------------------------------------------------------- */
/* Auth                                                        */
/* ---------------------------------------------------------- */
const Auth = {
  currentUser(){
    const id = sessionStorage.getItem('gms_session_uid');
    if (!id) return null;
    return DB.get('users', []).find(u => u.id === id) || null;
  },
  login(username, password){
    const user = DB.get('users', []).find(u => u.username === username && u.password === password);
    if (user){ sessionStorage.setItem('gms_session_uid', user.id); }
    return user || null;
  },
  logout(){
    sessionStorage.removeItem('gms_session_uid');
    window.location.href = 'index.html';
  },
  requireAuth(allowedRoles){
    const user = this.currentUser();
    if (!user){ window.location.href = 'index.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(user.role)){
      alert('Your role (' + user.role + ') does not have access to this page.');
      window.location.href = 'dashboard.html';
      return null;
    }
    return user;
  },
  changePassword(userId, oldPass, newPass){
    const users = DB.get('users', []);
    const u = users.find(x => x.id === userId);
    if (!u || u.password !== oldPass) return false;
    u.password = newPass;
    DB.set('users', users);
    return true;
  }
};

/* ---------------------------------------------------------- */
/* Formatting helpers                                          */
/* ---------------------------------------------------------- */
function fmtMoney(n){
  const s = DB.get('settings', {currency:'USD'});
  const symbol = s.currency === 'USD' ? '$' : (s.currency + ' ');
  return symbol + Number(n || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtDate(iso){
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
}
function daysUntil(iso){
  const d = new Date(iso + 'T00:00:00');
  const now = new Date(todayISO() + 'T00:00:00');
  return Math.round((d - now) / 86400000);
}
function initials(name){
  return (name || '?').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
}
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------------------------------------------------------- */
/* Toast + confirm                                              */
/* ---------------------------------------------------------- */
function toast(msg, type){
  let host = document.getElementById('toast-host');
  if (!host){
    host = document.createElement('div');
    host.id = 'toast-host';
    host.style.cssText = 'position:fixed;bottom:1.25rem;right:1.25rem;z-index:100;display:flex;flex-direction:column;gap:.5rem;';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  if (type === 'error') el.style.background = '#D8483A';
  if (type === 'success') el.style.background = '#0E2B27';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => { el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(), 300); }, 2400);
}

/* ---------------------------------------------------------- */
/* Modal helper                                                 */
/* ---------------------------------------------------------- */
function openModal(innerHtml, opts){
  closeModal();
  const width = (opts && opts.width) || 'max-w-lg';
  const backdrop = document.createElement('div');
  backdrop.id = 'modal-root';
  backdrop.className = 'modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4';
  backdrop.innerHTML = `<div class="modal-panel w-full ${width} max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">${innerHtml}</div>`;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.body.appendChild(backdrop);
}
function closeModal(){
  const existing = document.getElementById('modal-root');
  if (existing) existing.remove();
}

/* ---------------------------------------------------------- */
/* Navigation config (role based)                               */
/* ---------------------------------------------------------- */
const NAV_SECTIONS = [
  { label:'Overview', items:[
    { key:'dashboard', href:'dashboard.html', label:'Dashboard', roles:['admin','receptionist','trainer'], icon:'grid' },
  ]},
  { label:'People', items:[
    { key:'members', href:'members.html', label:'Members', roles:['admin','receptionist','trainer'], icon:'users' },
    { key:'trainers', href:'trainers.html', label:'Trainers', roles:['admin','receptionist'], icon:'whistle' },
  ]},
  { label:'Operations', items:[
    { key:'memberships', href:'memberships.html', label:'Memberships', roles:['admin','receptionist'], icon:'card' },
    { key:'attendance', href:'attendance.html', label:'Attendance', roles:['admin','receptionist','trainer'], icon:'check' },
    { key:'classes', href:'classes.html', label:'Classes', roles:['admin','receptionist','trainer'], icon:'calendar' },
    { key:'workouts', href:'workouts.html', label:'Workout Plans', roles:['admin','trainer'], icon:'dumbbell' },
    { key:'nutrition', href:'nutrition.html', label:'Nutrition Plans', roles:['admin','trainer'], icon:'leaf' },
    { key:'equipment', href:'equipment.html', label:'Equipment', roles:['admin','receptionist'], icon:'wrench' },
  ]},
  { label:'Business', items:[
    { key:'payments', href:'payments.html', label:'Payments', roles:['admin','receptionist'], icon:'dollar' },
    { key:'reports', href:'reports.html', label:'Reports', roles:['admin'], icon:'chart' },
    { key:'announcements', href:'announcements.html', label:'Announcements', roles:['admin','receptionist'], icon:'megaphone' },
    { key:'notifications', href:'notifications.html', label:'Notifications', roles:['admin','receptionist','trainer'], icon:'bell' },
    { key:'settings', href:'settings.html', label:'Settings', roles:['admin'], icon:'settings' },
    { key:'assignment', href:'assignment.html', label:'Teacher Rubric & PHP', roles:['admin','receptionist','trainer'], icon:'book' },
  ]},
];

const ICONS = {
  grid:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  users:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="8.5" r="2.5"/><path d="M15.8 14.2c2.9.4 5.2 2.5 5.2 5.8"/></svg>',
  whistle:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="8" cy="15" r="5"/><path d="M12 12l7-7M17 4h4v4"/><path d="M8 15h0"/></svg>',
  card:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></svg>',
  check:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2.5v4M16 2.5v4M8.5 13.5l2.3 2.3L15.5 11"/></svg>',
  calendar:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  dumbbell:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 9v6M2.5 10.5v3M20 9v6M21.5 10.5v3M7 12h10"/><rect x="4.5" y="8" width="3" height="8" rx="1"/><rect x="16.5" y="8" width="3" height="8" rx="1"/></svg>',
  leaf:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20 4C10 4 4 10 4 18c8 0 14-6 14-14z"/><path d="M6 18C10 12 14 8 20 4"/></svg>',
  wrench:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 105.6 5.6L15 17.2 6.8 9 12.1 3.7a4 4 0 002.6 2.6z"/><path d="M6.8 9L3 12.8l3 3L9.8 12"/></svg>',
  dollar:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 2.5v19M17 6.8c0-1.8-2.2-3.3-5-3.3s-5 1.3-5 3.3 2.2 2.9 5 3.3 5 1.4 5 3.3-2.2 3.3-5 3.3-5-1.5-5-3.3"/></svg>',
  chart:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20.5h19"/></svg>',
  megaphone:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 10v4h3l6 4V6L6 10H3z"/><path d="M14 9a4 4 0 010 6M18 6a8 8 0 010 12"/></svg>',
  bell:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"/><path d="M10 19a2 2 0 004 0"/></svg>',
  settings:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1h-.2a2 2 0 110-4h.1A1.7 1.7 0 004.6 8a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.6v-.2a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.6 1h.2a2 2 0 110 4h-.1a1.7 1.7 0 00-1.6 1z"/></svg>',
  logout:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  menu:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  book:'<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 01-2.5-2.5z"/><path d="M6 6h10M6 10h10"/></svg>',
};

function renderChrome(activeKey, pageTitle){
  const user = Auth.requireAuth();
  if (!user) return null;

  const shell = document.getElementById('app-shell');
  if (!shell) return null;

  const existingSidebar = document.getElementById('sidebar');
  const existingOutlet = document.getElementById('page-content');

  // If chrome already exists, just update active states and title (ZERO FLASH)
  if (existingSidebar && existingOutlet) {
    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const dataKey = link.getAttribute('data-key') || '';
      const isTarget = href === activeKey + '.html' || dataKey === activeKey;
      link.classList.toggle('active', isTarget);
    });

    // Sync mobile bottom navigation active button
    document.querySelectorAll('#mobile-bottom-nav .mobile-nav-btn').forEach(btn => {
      const href = btn.getAttribute('href') || '';
      const dataKey = btn.getAttribute('data-key') || '';
      const isTarget = href === activeKey + '.html' || dataKey === activeKey;
      btn.classList.toggle('active', isTarget);
    });

    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = pageTitle || '';

    // Re-trigger clean fade-in animation
    existingOutlet.classList.remove('view-enter');
    void existingOutlet.offsetWidth;
    existingOutlet.classList.add('view-enter');

    // Automatically close sidebar drawer on phone
    if (window.innerWidth < 768) {
      existingSidebar.classList.remove('open');
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.classList.add('hidden');
    }

    return existingOutlet;
  }

  // Initial load: build the navigation chrome
  const sections = NAV_SECTIONS.map(sec => {
    const items = sec.items.filter(it => it.roles.includes(user.role));
    if (!items.length) return '';
    return `<div class="nav-group-label">${sec.label}</div>` + items.map(it => `
      <a href="${it.href}" data-key="${it.key}" class="nav-link ${it.key === activeKey ? 'active' : ''}">
        ${ICONS[it.icon] || ''}<span>${it.label}</span>
      </a>`).join('');
  }).join('');

  shell.innerHTML = `
    <div id="sidebar" class="fixed z-50 top-0 left-0 h-full w-64 bg-[var(--teal-900)] flex flex-col transition-transform duration-200">
      <div class="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <div class="w-8 h-8 rounded-md bg-[var(--lime)] flex items-center justify-center font-display font-bold text-[var(--teal-950)]">IL</div>
        <div>
          <p class="font-display text-white text-lg leading-none tracking-wide">IRON &amp; LIME</p>
          <p class="text-[10px] text-[#8FA39D] leading-none mt-0.5">Gym Management</p>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 py-2">${sections}</nav>
      <div class="border-t border-white/10 p-3">
        <a href="profile.html" data-key="profile" class="nav-link"><span class="avatar">${initials(user.name)}</span><span class="flex-1 truncate">${user.name}</span></a>
        <button onclick="Auth.logout()" class="nav-link w-full mt-1">${ICONS.logout}<span>Log out</span></button>
      </div>
    </div>
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:!hidden"></div>

    <div class="md:pl-64 min-h-screen flex flex-col">
      <header class="h-16 bg-white border-b border-[var(--line)] flex items-center gap-3 px-4 md:px-7 sticky top-0 z-20">
        <button id="menu-toggle" type="button" aria-label="Open menu" class="md:hidden text-[var(--ink)]">${ICONS.menu}</button>
        <div class="flex-1 min-w-0">
          <h1 id="header-title" class="font-display text-xl md:text-2xl tracking-wide text-[var(--ink)] truncate">${pageTitle || ''}</h1>
        </div>
        <span class="badge badge-muted capitalize flex-shrink-0">${user.role}</span>
        <span class="text-sm text-[var(--muted)] hidden sm:inline flex-shrink-0">${fmtDate(todayISO())}</span>
      </header>
      <main class="flex-1 p-4 md:p-7 pb-24 md:pb-7 view-enter" id="page-content"></main>
    </div>

    <!-- Phone Bottom Navigation Bar -->
    <nav id="mobile-bottom-nav" class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur border-t border-[var(--line)] z-30 flex items-center justify-around px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] safe-area-bottom">
      <a href="dashboard.html" data-key="dashboard" class="mobile-nav-btn ${activeKey === 'dashboard' ? 'active' : ''}">
        ${ICONS.grid}
        <span>Dashboard</span>
      </a>
      <a href="members.html" data-key="members" class="mobile-nav-btn ${activeKey === 'members' ? 'active' : ''}">
        ${ICONS.users}
        <span>Members</span>
      </a>
      <a href="attendance.html" data-key="attendance" class="mobile-nav-btn ${activeKey === 'attendance' ? 'active' : ''}">
        ${ICONS.check}
        <span>Check-in</span>
      </a>
      <a href="classes.html" data-key="classes" class="mobile-nav-btn ${activeKey === 'classes' ? 'active' : ''}">
        ${ICONS.calendar}
        <span>Classes</span>
      </a>
      <button id="mobile-more-btn" type="button" aria-label="Open more navigation" class="mobile-nav-btn">
        ${ICONS.menu}
        <span>More</span>
      </button>
    </nav>
  `;

  const toggle = document.getElementById('menu-toggle');
  const moreBtn = document.getElementById('mobile-more-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.remove('hidden');
  };
  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
  };

  if (toggle) toggle.addEventListener('click', openSidebar);
  if (moreBtn) moreBtn.addEventListener('click', openSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Close sidebar drawer when clicking any link inside it on mobile
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  // Prefetch other sections in background for 0ms transitions
  setTimeout(prefetchNavigationPages, 120);

  return document.getElementById('page-content');
}

/* ---------------------------------------------------------- */
/* Flash-Free Instant SPA Engine                              */
/* ---------------------------------------------------------- */
const PageCache = new Map();

function prefetchNavigationPages(){
  if (typeof window === 'undefined') return;
  const links = document.querySelectorAll('#sidebar a[href$=".html"]');
  links.forEach(a => {
    const href = a.getAttribute('href');
    if (href && !PageCache.has(href) && !href.startsWith('http')) {
      fetch(href).then(r => r.text()).then(html => {
        PageCache.set(href, html);
      }).catch(() => {});
    }
  });
}

async function spaNavigate(url, pushState = true){
  try{
    const targetUrl = new URL(url, window.location.href);
    const pathname = targetUrl.pathname.split('/').pop() || 'dashboard.html';

    if (pathname === 'index.html'){
      window.location.href = url;
      return;
    }

    let html = PageCache.get(pathname) || PageCache.get(targetUrl.href) || PageCache.get(url);
    if (!html){
      const resp = await fetch(url);
      if (!resp.ok){ window.location.href = url; return; }
      html = await resp.text();
      PageCache.set(pathname, html);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Update title
    if (doc.title) document.title = doc.title;

    // 2. Import templates
    doc.querySelectorAll('template').forEach(tpl => {
      const existing = document.getElementById(tpl.id);
      if (existing) existing.remove();
      document.body.appendChild(document.importNode(tpl, true));
    });

    // 3. Ensure Chart.js is loaded if required
    if (doc.querySelector('script[src*="chart.js"]') && !window.Chart){
      await new Promise(res => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        s.onload = res;
        s.onerror = res;
        document.head.appendChild(s);
      });
    }

    // 4. Update browser URL & search params
    if (pushState){
      history.pushState({ url }, doc.title, url);
    }

    // 5. Clean up any open modal
    closeModal();

    // 6. Find and execute inline page script
    const scripts = doc.querySelectorAll('script:not([src])');
    for (const sc of scripts){
      let code = sc.textContent || '';
      if (!code.trim()) continue;

      // Expose declared top-level functions so inline onclick="..." works without issues
      code = code.replace(/function\s+([a-zA-Z0-9_]+)\s*\(/g, 'window.$1 = function $1(');

      // Execute safely in its own function context to prevent const/let re-declaration errors
      try{
        new Function(code)();
      }catch(err){
        console.error('Page script error in ' + pathname, err);
      }
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');

  }catch(err){
    console.error('SPA navigation error, falling back to standard load', err);
    window.location.href = url;
  }
}

// Global click interceptor for seamless navigation
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a || !a.href) return;
  if (a.target === '_blank' || a.hasAttribute('download') || a.getAttribute('rel') === 'external') return;

  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return;

  const filename = url.pathname.split('/').pop();
  if (filename && filename.endsWith('.html') && filename !== 'index.html'){
    e.preventDefault();
    spaNavigate(a.href);
  }
});

// Handle browser back and forward navigation
window.addEventListener('popstate', () => {
  const filename = window.location.pathname.split('/').pop();
  if (filename && filename.endsWith('.html') && filename !== 'index.html'){
    spaNavigate(window.location.href, false);
  }
});

/* ---------------------------------------------------------- */
/* Cross-entity helpers                                         */
/* ---------------------------------------------------------- */
function memberById(id){ return DB.get('members', []).find(m => m.id === id); }
function trainerById(id){ return DB.get('trainers', []).find(t => t.id === id); }
function planById(id){ return DB.get('plans', []).find(p => p.id === id); }

function activeMembershipFor(memberId){
  const list = DB.get('memberships', []).filter(m => m.memberId === memberId);
  return list.sort((a,b) => b.startDate.localeCompare(a.startDate))[0] || null;
}

function refreshMembershipStatuses(){
  const list = DB.get('memberships', []);
  let changed = false;
  list.forEach(m => {
    if (m.status === 'Active' && daysUntil(m.endDate) < 0){ m.status = 'Expired'; changed = true; }
  });
  if (changed) DB.set('memberships', list);
  return list;
}
