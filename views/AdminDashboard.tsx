
import React, { useState, useMemo } from 'react';
import { User, Category, ScheduleEntry, Shift } from '../types';
import { 
  Calendar, 
  Database, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  Clock, 
  Repeat,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  ClipboardList,
  ArrowRight,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { format, addWeeks, addMonths, parseISO, startOfToday, isAfter, isSameDay } from 'date-fns';

interface Props {
  user: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  schedule: ScheduleEntry[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

const AdminDashboard: React.FC<Props> = ({ 
  user, users, setUsers, categories, setCategories, schedule, setSchedule, shifts, setShifts
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'schedule' | 'databank'>('schedule');
  const [databankSubTab, setDatabankSubTab] = useState<'staff' | 'notes'>('staff');

  // Recurring Schedule Builder State
  const [recurringDay, setRecurringDay] = useState('1'); // 1 = Monday
  const [recurringMonths, setRecurringMonths] = useState(3);
  const [recurringSlots, setRecurringSlots] = useState<{start: string, end: string}[]>([
    { start: '07:00', end: '09:00' },
    { start: '09:00', end: '14:00' },
    { start: '14:00', end: '18:00' }
  ]);

  // Staff Management State
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState<Partial<User>>({ name: '', username: '', role: 'Staff', pin: '', active: true });

  const handleCreateMasterPattern = () => {
    const newEntries: ScheduleEntry[] = [];
    const today = startOfToday();
    const endDate = addMonths(today, recurringMonths);
    
    let currentDate = today;
    // Find the first instance of the chosen day
    while (currentDate.getDay() !== parseInt(recurringDay)) {
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    while (!isAfter(currentDate, endDate)) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      recurringSlots.forEach(slot => {
        newEntries.push({
          id: Math.random().toString(36).substr(2, 9),
          staffId: '', // Empty slot
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          coverageRequested: false
        });
      });
      currentDate = addWeeks(currentDate, 1);
    }

    setSchedule(prev => [...prev, ...newEntries]);
    alert(`Successfully generated ${newEntries.length} new open slots.`);
  };

  const handleStaffSave = () => {
    if (!staffForm.name || !staffForm.pin) {
      alert("Name and PIN are required.");
      return;
    }
    
    if (editingStaff) {
      setUsers(prev => prev.map(u => u.id === editingStaff.id ? { ...u, ...staffForm } as User : u));
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: staffForm.name || '',
        username: staffForm.username || staffForm.name?.toLowerCase().replace(/\s/g, '') || '',
        role: staffForm.role || 'Staff',
        pin: staffForm.pin || '',
        active: true
      };
      setUsers(prev => [...prev, newUser]);
    }
    setEditingStaff(null);
    setIsAddingStaff(false);
    setStaffForm({ name: '', username: '', role: 'Staff', pin: '', active: true });
  };

  const handleApproveSwap = (entryId: string) => {
    setSchedule(prev => prev.map(s => {
      if (s.id === entryId && s.interestedStaffId) {
        return {
          ...s,
          staffId: s.interestedStaffId,
          interestedStaffId: undefined,
          coverageRequested: false
        };
      }
      return s;
    }));
  };

  const handleAssignStaff = (entryId: string, staffId: string) => {
    setSchedule(prev => prev.map(s => 
      s.id === entryId ? { ...s, staffId, coverageRequested: false, interestedStaffId: undefined } : s
    ));
  };

  const pendingApprovals = useMemo(() => schedule.filter(s => s.coverageRequested && s.interestedStaffId), [schedule]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Admin Nav Bar */}
      <div className="bg-white rounded-[2rem] p-2 shadow-xl border border-slate-100 flex gap-2">
        <button 
          onClick={() => setActiveAdminTab('schedule')}
          className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${activeAdminTab === 'schedule' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Calendar size={18} /> Master Schedule
        </button>
        <button 
          onClick={() => setActiveAdminTab('databank')}
          className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${activeAdminTab === 'databank' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Database size={18} /> Databanks
        </button>
      </div>

      {activeAdminTab === 'schedule' && (
        <div className="space-y-6">
          {/* Coverage Approvals - Prominent at Top */}
          {pendingApprovals.length > 0 && (
            <div className="bg-amber-50 rounded-[3rem] p-8 border-2 border-amber-200 shadow-xl animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-200 text-amber-700 rounded-2xl animate-pulse"><UserCheck size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-900 tracking-tight">Pending Swaps</h3>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Awaiting your approval</p>
                  </div>
                </div>
                <div className="bg-amber-200 text-amber-900 px-4 py-1.5 rounded-full text-xs font-black">{pendingApprovals.length} Actions</div>
              </div>

              <div className="grid gap-4">
                {pendingApprovals.map(s => {
                  const originalStaff = users.find(u => u.id === s.staffId);
                  const interestedStaff = users.find(u => u.id === s.interestedStaffId);
                  return (
                    <div key={s.id} className="bg-white p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm group hover:shadow-md transition-all">
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[70px] bg-slate-50 p-4 rounded-2xl">
                          <div className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{format(parseISO(s.date), 'EEE')}</div>
                          <div className="text-2xl font-black text-slate-800 leading-none">{format(parseISO(s.date), 'd')}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{s.startTime} - {s.endTime}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                             <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-400">
                              <X size={12} /> {originalStaff?.name || 'Open'}
                            </div>
                            <ArrowRight size={14} className="text-amber-400" />
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg text-xs font-black text-green-700">
                              <CheckCircle size={12} /> {interestedStaff?.name}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveSwap(s.id)}
                          className="flex-1 md:flex-none bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 shadow-lg active:scale-95 transition-all"
                        >
                          Confirm Swap
                        </button>
                        <button 
                          onClick={() => setSchedule(prev => prev.map(x => x.id === s.id ? { ...x, interestedStaffId: undefined } : x))}
                          className="p-4 rounded-2xl bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pattern Generator - Smarter controls */}
            <div className="lg:col-span-1 bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-100"><Repeat size={28} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Bulk Scheduler</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Pattern Tool</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Recurring Weekday</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                      <button 
                        key={d}
                        onClick={() => setRecurringDay(i.toString())}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all ${recurringDay === i.toString() ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Time Span (Months)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="12"
                      value={recurringMonths}
                      onChange={(e) => setRecurringMonths(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="min-w-[40px] text-lg font-black text-blue-600">{recurringMonths}m</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Shift Templates</label>
                  <div className="space-y-3">
                    {recurringSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                        <div className="flex-1 flex items-center gap-3">
                           <Clock size={16} className="text-slate-300" />
                           <div className="flex-1 grid grid-cols-2 gap-2">
                              <input type="time" value={slot.start} onChange={(e) => {
                                const next = [...recurringSlots];
                                next[idx].start = e.target.value;
                                setRecurringSlots(next);
                              }} className="bg-transparent font-black text-xs outline-none" />
                              <input type="time" value={slot.end} onChange={(e) => {
                                const next = [...recurringSlots];
                                next[idx].end = e.target.value;
                                setRecurringSlots(next);
                              }} className="bg-transparent font-black text-xs outline-none" />
                           </div>
                        </div>
                        <button onClick={() => setRecurringSlots(recurringSlots.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setRecurringSlots([...recurringSlots, { start: '09:00', end: '17:00' }])}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all"
                    >
                      + Add Shift Template
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleCreateMasterPattern}
                  className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <Save size={24} /> Generate Roster
                </button>
              </div>
            </div>

            {/* Live Master Roster View */}
            <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Roster</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign staff to generated shifts</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase">Total:</span>
                  <div className="bg-slate-100 px-4 py-2 rounded-full text-slate-700 font-black text-xs">
                    {schedule.length} Slots
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[700px] pr-4 custom-scrollbar space-y-4">
                {schedule.length === 0 ? (
                  <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <Calendar size={64} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Roster is empty</p>
                    <p className="text-slate-300 font-bold text-[10px] mt-2">Use the pattern generator to create shifts</p>
                  </div>
                ) : (
                  [...schedule].sort((a,b) => a.date.localeCompare(b.date)).map(s => {
                    const staff = users.find(u => u.id === s.staffId);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-8">
                          <div className="text-center min-w-[60px] flex flex-col items-center">
                            <div className="text-[11px] font-black uppercase text-slate-400 mb-1">{format(parseISO(s.date), 'EEE')}</div>
                            <div className="text-3xl font-black text-slate-800 leading-none">{format(parseISO(s.date), 'd')}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] mb-2">{format(parseISO(s.date), 'MMMM yyyy')}</div>
                            <div className="flex items-center gap-3 text-lg font-bold text-slate-700 tabular-nums">
                              <Clock size={16} className="text-slate-300" />
                              {s.startTime} <ArrowRight size={14} className="text-slate-200" /> {s.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative group/assign">
                            <select
                              value={s.staffId || ""}
                              onChange={(e) => handleAssignStaff(s.id, e.target.value)}
                              className={`pl-10 pr-4 py-3 rounded-2xl text-xs font-black uppercase border-2 transition-all appearance-none outline-none cursor-pointer ${
                                s.staffId 
                                  ? 'bg-green-100 border-green-200 text-green-700' 
                                  : 'bg-amber-100 border-amber-200 text-amber-700 animate-pulse'
                              }`}
                            >
                              <option value="">-- Vacant Slot --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${s.staffId ? 'text-green-700' : 'text-amber-700'}`}>
                              <UserPlus size={14} />
                            </div>
                          </div>
                          <button 
                            onClick={() => { if(confirm("Delete this shift?")) setSchedule(schedule.filter(x => x.id !== s.id)) }}
                            className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'databank' && (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
          <div className="flex bg-slate-50 border-b border-slate-100 p-3">
            <button 
              onClick={() => setDatabankSubTab('staff')}
              className={`flex-1 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${databankSubTab === 'staff' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users size={20} /> Personnel Registry
            </button>
            <button 
              onClick={() => setDatabankSubTab('notes')}
              className={`flex-1 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${databankSubTab === 'notes' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ClipboardList size={20} /> Journal Categories
            </button>
          </div>

          <div className="p-12 flex-1">
            {databankSubTab === 'staff' && (
              <div className="space-y-10 animate-in slide-in-from-left-4 duration-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Staff Databank</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage security pins and profiles</p>
                  </div>
                  <button 
                    onClick={() => { setIsAddingStaff(true); setEditingStaff(null); setStaffForm({ role: 'Staff', active: true }); }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                  >
                    <Plus size={20} /> Add New Member
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {users.map(u => (
                    <div key={u.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between hover:bg-white hover:border-blue-200 hover:shadow-2xl transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full" />
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${u.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Users size={28} />
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setEditingStaff(u); setStaffForm(u); setIsAddingStaff(true); }}
                              className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit3 size={20} />
                            </button>
                            {u.id !== user.id && (
                              <button 
                                onClick={() => { if(confirm("Remove this staff member?")) setUsers(users.filter(x => x.id !== u.id)) }}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 leading-tight">{u.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 mb-6">Staff Profile • {u.role}</p>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Entry PIN</span>
                          <span className="text-xl font-black text-slate-800 tracking-[0.4em]">{u.pin}</span>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${u.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {u.active ? 'Status: Active' : 'Status: Locked'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {databankSubTab === 'notes' && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-400">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Log Databank</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage automated notebook options</p>
                  </div>
                  <button 
                    onClick={() => {
                      const name = prompt("Enter category name:");
                      if (name) setCategories([...categories, { id: Math.random().toString(36), name }]);
                    }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl"
                  >
                    <Plus size={20} /> Define Option
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"><ChevronRight size={24} /></div>
                        <span className="text-lg font-black text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            const newName = prompt("Edit category name:", cat.name);
                            if (newName) setCategories(categories.map(c => c.id === cat.id ? {...c, name: newName} : c));
                          }}
                          className="p-3 text-slate-300 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button 
                          onClick={() => { if(confirm("Remove this log category?")) setCategories(categories.filter(c => c.id !== cat.id)) }}
                          className="p-3 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Staff Management Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-slate-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-md overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in duration-400">
            <div className="bg-blue-600 p-10 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-10 -mt-10 rounded-full" />
              <div className="relative z-10">
                <h3 className="text-3xl font-black tracking-tight">{editingStaff ? 'Edit Member' : 'Add Member'}</h3>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Personnel Security Profile</p>
              </div>
              <button onClick={() => setIsAddingStaff(false)} className="bg-white/10 p-3 rounded-full relative z-10 hover:bg-white/20 transition-colors"><X size={28} /></button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Legal Name</label>
                  <input 
                    type="text" 
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500 text-lg transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Access Level</label>
                    <select 
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({...staffForm, role: e.target.value as any})}
                      className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="Staff">Caregiver</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Security PIN</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={staffForm.pin}
                      onChange={(e) => setStaffForm({...staffForm, pin: e.target.value})}
                      placeholder="XXXX"
                      className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500 tracking-[0.5em] text-center text-lg transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleStaffSave}
                className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <ShieldCheck size={28} /> {editingStaff ? 'Commit Changes' : 'Authorize Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
