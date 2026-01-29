import React, { useState, useEffect } from 'react';
import { User, Shift, Message, NotebookEntry, Category, ScheduleEntry } from './types';
import { db } from './db';
import LoginView from './views/LoginView';
import PlannerView from './views/PlannerView';
import AdminDashboard from './views/AdminDashboard';
import SchedulingModule from './components/SchedulingModule';
import TimeClockView from './views/TimeClockView';
import { LogOut, Bell, Calendar as CalendarIcon, Book, Settings, Clock, CheckCircle2, UserCheck, X } from 'lucide-react';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('carejournal_session');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [shifts, setShifts] = useState<Shift[]>(() => db.getShifts());
  const [messages, setMessages] = useState<Message[]>(() => db.getMessages());
  const [journalEntries, setJournalEntries] = useState<NotebookEntry[]>(() => db.getJournalEntries());
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => db.getSchedule());
  
  const [activeTab, setActiveTab] = useState<'planner' | 'admin' | 'schedule' | 'timeclock'>('planner');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: 'in' | 'out', time: Date } | null>(null);

  useEffect(() => {
    db.saveUsers(users);
    db.saveShifts(shifts);
    db.saveMessages(messages);
    db.saveJournalEntries(journalEntries);
    db.saveCategories(categories);
    db.saveSchedule(schedule);
  }, [users, shifts, messages, journalEntries, categories, schedule]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('carejournal_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carejournal_session');
  };

  const getShiftName = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Morning Shift';
    if (hour >= 12 && hour < 17) return 'Afternoon Shift';
    if (hour >= 17 && hour < 22) return 'Evening Shift';
    return 'Night Shift';
  };

  const handleClockInAction = () => {
    setShowConfirmModal({ type: 'in', time: new Date() });
  };

  const handleClockOutAction = () => {
    setShowConfirmModal({ type: 'out', time: new Date() });
  };

  const finalizeClockIn = () => {
    if (!currentUser || !showConfirmModal) return;
    const now = showConfirmModal.time;
    const dateStr = format(now, 'yyyy-MM-dd');

    const entry: NotebookEntry = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: currentUser.id,
      staffName: currentUser.name,
      date: dateStr,
      category: 'General Note',
      text: 'Arrived (Clocked In)',
      timestamp: now.toISOString(),
      shiftName: getShiftName(now),
      isCritical: false
    };
    setJournalEntries(prev => [...prev, entry]);

    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: currentUser.id,
      date: dateStr,
      startTime: format(now, 'HH:mm'),
      endTime: '',
      clockInTime: now.toISOString(),
      status: 'ClockedIn',
      coverageRequested: false,
      approvedByAdmin: false,
      acknowledgedBy: [currentUser.id]
    };
    setShifts(prev => [...prev, newShift]);

    setShowConfirmModal(null);
  };

  const finalizeClockOut = () => {
    if (!currentUser || !showConfirmModal) return;
    const now = showConfirmModal.time;
    const dateStr = format(now, 'yyyy-MM-dd');

    const entry: NotebookEntry = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: currentUser.id,
      staffName: currentUser.name,
      date: dateStr,
      category: 'General Note',
      text: 'Left (Clocked Out)',
      timestamp: now.toISOString(),
      shiftName: getShiftName(now),
      isCritical: false
    };
    setJournalEntries(prev => [...prev, entry]);

    setShifts(prev => {
      const activeIdx = prev.findLastIndex(s => s.staffId === currentUser.id && s.status === 'ClockedIn');
      if (activeIdx === -1) {
        const dummy: Shift = {
          id: Math.random().toString(36).substr(2, 9),
          staffId: currentUser.id,
          date: dateStr,
          startTime: '00:00',
          endTime: format(now, 'HH:mm'),
          clockInTime: now.toISOString(),
          clockOutTime: now.toISOString(),
          status: 'Completed',
          coverageRequested: false,
          approvedByAdmin: false,
          acknowledgedBy: [currentUser.id]
        };
        return [...prev, dummy];
      }
      const updated = [...prev];
      updated[activeIdx] = {
        ...updated[activeIdx],
        clockOutTime: now.toISOString(),
        endTime: format(now, 'HH:mm'),
        status: 'Completed'
      };
      return updated;
    });

    setShowConfirmModal(null);
  };

  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  const unreadCount = messages.filter(m => !m.acknowledgedBy.includes(currentUser.id)).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-200">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            CJ
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-gray-400 uppercase tracking-widest">Current Sign-in:</h1>
            <p className="text-blue-600 font-bold leading-tight">{currentUser.name}</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-[50%] md:max-w-none">
          <button onClick={() => setActiveTab('planner')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'planner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-400'}`}>
            <Book size={14} /> Planner
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-400'}`}>
            <CalendarIcon size={14} /> Schedule
          </button>
          <button onClick={() => setActiveTab('timeclock')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'timeclock' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-400'}`}>
            <Clock size={14} /> Time Clock
          </button>
          {currentUser.role === 'Admin' && (
            <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-400'}`}>
              <Settings size={14} /> Admin
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 mr-4">
            <button onClick={handleClockInAction} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 hover:bg-green-100 transition-colors border border-green-200">
              <Clock size={12} /> Clock In
            </button>
            <button onClick={handleClockOutAction} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 hover:bg-red-100 transition-colors border border-red-200">
              <CheckCircle2 size={12} /> Clock Out
            </button>
          </div>

          <button onClick={() => setShowNotificationCenter(true)} className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto p-2 sm:p-6 pb-24">
        {activeTab === 'planner' && <PlannerView currentUser={currentUser} users={users} journalEntries={journalEntries} setJournalEntries={setJournalEntries} schedule={schedule} categories={categories} />}
        {activeTab === 'schedule' && <SchedulingModule currentUser={currentUser} users={users} schedule={schedule} setSchedule={setSchedule} messages={messages} setMessages={setMessages} />}
        {activeTab === 'timeclock' && <TimeClockView currentUser={currentUser} shifts={shifts} />}
        {activeTab === 'admin' && currentUser.role === 'Admin' && (
          <AdminDashboard 
            user={currentUser}
            users={users}
            setUsers={setUsers}
            categories={categories}
            setCategories={setCategories}
            schedule={schedule}
            setSchedule={setSchedule}
            shifts={shifts}
            setShifts={setShifts}
          />
        )}
      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className={`p-8 text-white flex flex-col items-center gap-4 ${showConfirmModal.type === 'in' ? 'bg-green-600' : 'bg-red-600'}`}>
              <UserCheck size={48} />
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase tracking-tight">Confirm {showConfirmModal.type === 'in' ? 'Clock In' : 'Clock Out'}</h3>
                <p className="text-[10px] font-black uppercase opacity-70 mt-1">{format(showConfirmModal.time, 'EEEE, MMMM do')}</p>
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div className="text-center">
                <p className="text-4xl font-black text-slate-800 tracking-tight">{format(showConfirmModal.time, 'h:mm a')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowConfirmModal(null)} className="bg-slate-50 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100">Cancel</button>
                <button onClick={showConfirmModal.type === 'in' ? finalizeClockIn : finalizeClockOut} className={`py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg ${showConfirmModal.type === 'in' ? 'bg-green-600 shadow-green-200' : 'bg-red-600 shadow-red-200'}`}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotificationCenter && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">Notifications</h3>
              <button onClick={() => setShowNotificationCenter(false)}><Bell size={24} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.length === 0 ? <p className="text-center py-8 text-gray-400 font-bold">No notifications yet.</p> : [...messages].reverse().map(m => (
                <div key={m.id} className={`p-4 rounded-2xl border ${m.acknowledgedBy.includes(currentUser.id) ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-600">{m.senderName}</span>
                    <span className="text-[10px] font-bold text-gray-400">{format(new Date(m.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest z-40">
        CareJournal Professional • v2.3
      </div>
    </div>
  );
};

export default App;