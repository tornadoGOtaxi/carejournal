
import React, { useState, useMemo } from 'react';
import { User, ScheduleEntry, Message } from '../types';
import { 
  Plus, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  HandHelping, 
  AlertCircle, 
  CheckCircle, 
  Filter,
  User as UserIcon,
  ChevronRight,
  ArrowRight,
  Save,
  UserPlus
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';

interface Props {
  currentUser: User;
  users: User[];
  schedule: ScheduleEntry[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SchedulingModule: React.FC<Props> = ({ currentUser, users, schedule, setSchedule, messages, setMessages }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'open'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<ScheduleEntry>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    staffId: currentUser.id,
    startTime: '08:00',
    endTime: '16:00'
  });

  const notify = (text: string, severity: 'Info' | 'Important' | 'Critical' = 'Info') => {
    const msg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      severity,
      createdAt: new Date().toISOString(),
      acknowledgedBy: [currentUser.id]
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleAdd = () => {
    if (!newEntry.date || !newEntry.startTime || !newEntry.endTime) return;
    
    const entry: ScheduleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: newEntry.staffId || '',
      date: newEntry.date,
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      note: newEntry.note,
      coverageRequested: false
    };
    
    setSchedule(prev => [...prev, entry]);
    setShowAddModal(false);
    setNewEntry({
      date: format(new Date(), 'yyyy-MM-dd'),
      staffId: currentUser.id,
      startTime: '08:00',
      endTime: '16:00'
    });
  };

  const handleRequestCoverage = (entryId: string) => {
    const entry = schedule.find(s => s.id === entryId);
    if (!entry) return;

    setSchedule(prev => prev.map(s => 
      s.id === entryId ? { ...s, coverageRequested: true } : s
    ));

    notify(`COVERAGE REQUEST: ${currentUser.name} needs cover for ${format(parseISO(entry.date), 'MMM do')} (${entry.startTime}-${entry.endTime}).`, 'Important');
  };

  const handleExpressInterest = (entryId: string) => {
    const entry = schedule.find(s => s.id === entryId);
    if (!entry) return;

    setSchedule(prev => prev.map(s => 
      s.id === entryId ? { ...s, interestedStaffId: currentUser.id } : s
    ));

    const ownerName = entry.staffId ? users.find(u => u.id === entry.staffId)?.name : "Open Slot";
    notify(`INTEREST: ${currentUser.name} is available to cover the shift on ${format(parseISO(entry.date), 'MMM do')} (${ownerName}). Admin approval pending.`, 'Important');
  };

  const handleAssignStaff = (entryId: string, staffId: string) => {
    setSchedule(prev => prev.map(s => 
      s.id === entryId ? { ...s, staffId, coverageRequested: false, interestedStaffId: undefined } : s
    ));
  };

  const next14Days = useMemo(() => Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i)), []);

  const filteredSchedule = useMemo(() => {
    switch (activeFilter) {
      case 'mine':
        return schedule.filter(s => s.staffId === currentUser.id);
      case 'open':
        return schedule.filter(s => !s.staffId || (s.coverageRequested && !s.interestedStaffId));
      default:
        return schedule;
    }
  }, [schedule, activeFilter, currentUser.id]);

  const stats = useMemo(() => ({
    mine: schedule.filter(s => s.staffId === currentUser.id).length,
    open: schedule.filter(s => !s.staffId || s.coverageRequested).length
  }), [schedule, currentUser.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Scheduling</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage shifts and coverage</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
        >
          <Plus size={18} />
          Create Shift
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          All Shifts
        </button>
        <button 
          onClick={() => setActiveFilter('mine')}
          className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeFilter === 'mine' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          My Schedule
          {stats.mine > 0 && <span className="ml-2 bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[8px]">{stats.mine}</span>}
        </button>
        <button 
          onClick={() => setActiveFilter('open')}
          className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeFilter === 'open' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Open Slots
          {stats.open > 0 && <span className="ml-2 bg-amber-500 text-white px-1.5 py-0.5 rounded-md text-[8px]">{stats.open}</span>}
        </button>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {next14Days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayShifts = filteredSchedule.filter(s => s.date === dayStr);
          
          if (dayShifts.length === 0) return null;

          return (
            <div key={dayStr} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-none">{format(day, 'EEEE')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{format(day, 'MMMM do, yyyy')}</p>
                  </div>
                </div>
                {dayShifts.length > 1 && <span className="text-[10px] font-black text-slate-300 uppercase">{dayShifts.length} Shifts</span>}
              </div>
              
              <div className="space-y-3">
                {dayShifts.map(s => {
                  const staff = users.find(u => u.id === s.staffId);
                  const isMyShift = s.staffId === currentUser.id;
                  const someoneIsInterested = !!s.interestedStaffId;
                  const interestedStaff = users.find(u => u.id === s.interestedStaffId);
                  const isOpenSlot = !s.staffId;

                  return (
                    <div key={s.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl border transition-all ${s.coverageRequested ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center font-black text-lg ${isOpenSlot ? 'bg-amber-100 text-amber-600' : 'bg-white text-blue-600 border border-slate-100'}`}>
                          {isOpenSlot ? <AlertCircle size={24} /> : staff?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800">{staff?.name || 'Unassigned Slot'}</span>
                            {s.coverageRequested && !someoneIsInterested && (
                              <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full animate-pulse">
                                Urgent Coverage
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-slate-500 font-bold text-xs uppercase tracking-tight">
                              <Clock size={12} className="text-slate-300" />
                              {s.startTime} — {s.endTime}
                            </div>
                            {isMyShift && <span className="bg-blue-100 text-blue-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">My Shift</span>}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center gap-2">
                        {currentUser.role === 'Admin' ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                value={s.staffId || ""}
                                onChange={(e) => handleAssignStaff(s.id, e.target.value)}
                                className={`pl-10 pr-4 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all appearance-none outline-none cursor-pointer ${
                                  s.staffId 
                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                              >
                                <option value="">-- Assign Staff --</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                              </select>
                              <UserPlus size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${s.staffId ? 'text-green-600' : 'text-amber-600'}`} />
                            </div>
                          </div>
                        ) : (
                          <>
                            {isMyShift && !s.coverageRequested && (
                              <button 
                                onClick={() => handleRequestCoverage(s.id)}
                                className="flex-1 sm:flex-none bg-amber-100 text-amber-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"
                              >
                                <HandHelping size={14} /> Request Cover
                              </button>
                            )}

                            {!isMyShift && s.coverageRequested && !someoneIsInterested && (
                              <button 
                                onClick={() => handleExpressInterest(s.id)}
                                className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md transition-all active:scale-95"
                              >
                                <ArrowRight size={14} /> Claim Shift
                              </button>
                            )}
                          </>
                        )}

                        {s.coverageRequested && someoneIsInterested && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-2xl text-[10px] font-black uppercase border border-green-100">
                            <CheckCircle size={14} /> {interestedStaff?.name} coverage pending
                          </div>
                        )}

                        {(isMyShift || currentUser.role === 'Admin') && (
                          <button 
                            onClick={() => {
                              if (confirm("Permanently delete this shift from the roster?")) {
                                setSchedule(prev => prev.filter(x => x.id !== s.id));
                              }
                            }}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {filteredSchedule.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <CalendarIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No shifts found for this view</p>
          </div>
        )}
      </div>

      {/* Simplified Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Manual Shift Entry</h3>
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1">Add to the roster</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="bg-white/20 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Shift Date</label>
                <input 
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Start Time</label>
                  <input 
                    type="time"
                    value={newEntry.startTime}
                    onChange={(e) => setNewEntry({...newEntry, startTime: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">End Time</label>
                  <input 
                    type="time"
                    value={newEntry.endTime}
                    onChange={(e) => setNewEntry({...newEntry, endTime: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none"
                  />
                </div>
              </div>

              {currentUser.role === 'Admin' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Assign To</label>
                  <select 
                    value={newEntry.staffId}
                    onChange={(e) => setNewEntry({...newEntry, staffId: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none"
                  >
                    <option value="">-- Open Slot --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              <button 
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingModule;
