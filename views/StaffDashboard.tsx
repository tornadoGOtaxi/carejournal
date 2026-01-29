
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Shift, NotebookEntry, Message, Category } from '../types';
import { Clock, Plus, Save, X, ArrowLeft, ArrowRight, ClipboardCheck, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../db';

interface Props {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  journalEntries: NotebookEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<NotebookEntry[]>>;
  categories: Category[];
}

const StaffDashboard: React.FC<Props> = ({ 
  user, shifts, setShifts, messages, setMessages, journalEntries, setJournalEntries, categories
}) => {
  const [showHandoff, setShowHandoff] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [showNotificationInput, setShowNotificationInput] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Custom');
  const [newNoteText, setNewNoteText] = useState('');
  const [pendingAcknowledgedMessages, setPendingAcknowledgedMessages] = useState<Message[]>([]);
  
  const notebookEndRef = useRef<HTMLDivElement>(null);

  const activeShift = useMemo(() => 
    shifts.find(s => s.staffId === user.id && s.status === 'ClockedIn'),
  [shifts, user.id]);

  useEffect(() => {
    const unread = messages.filter(m => !m.acknowledgedBy.includes(user.id));
    if (unread.length > 0) {
      setPendingAcknowledgedMessages(unread);
    }
  }, [messages, user.id]);

  const allEntries = useMemo(() => [...journalEntries].sort((a,b) => a.timestamp.localeCompare(b.timestamp)), [journalEntries]);

  useEffect(() => {
    if (notebookEndRef.current) {
      notebookEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allEntries, activeShift, isAddingNote]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getShiftName = (timeStr?: string) => {
    const date = timeStr ? new Date(timeStr) : new Date();
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Morning Shift';
    if (hour >= 12 && hour < 17) return 'Afternoon Shift';
    if (hour >= 17 && hour < 22) return 'Evening Shift';
    return 'Night Shift';
  };

  const handleClockIn = (reviewStatus: 'Yes' | 'No' | 'Some') => {
    if (reviewStatus === 'No') {
      alert("Please review the previous shift notes before clocking in.");
      return;
    }

    const now = new Date().toISOString();
    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: user.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: now,
      endTime: '',
      clockInTime: now,
      status: 'ClockedIn',
      coverageRequested: false,
      approvedByAdmin: false,
      acknowledgedBy: [user.id] 
    };

    const updatedShifts = shifts.map(s => {
      if (s.status === 'Completed' && !s.acknowledgedBy.includes(user.id)) {
        return { ...s, acknowledgedBy: [...s.acknowledgedBy, user.id] };
      }
      return s;
    });

    setShifts([...updatedShifts, newShift]);
    setShowHandoff(false);
  };

  const finalizeClockOut = (withNotification: boolean) => {
    if (!activeShift) return;
    const now = new Date().toISOString();

    if (withNotification && notificationText.trim()) {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: user.id,
        senderName: user.name,
        text: notificationText,
        severity: 'Important',
        createdAt: now,
        acknowledgedBy: [user.id]
      };
      setMessages([...messages, newMessage]);
    }

    setShifts(prev => prev.map(s => s.id === activeShift.id ? {
      ...s,
      status: 'Completed',
      clockOutTime: now,
      endTime: now
    } : s));
    
    setShowClockOutModal(false);
    setShowNotificationInput(false);
    setNotificationText('');
  };

  const handleSaveEntry = () => {
    if (!activeShift || !newNoteText.trim()) return;
    // Fix: Added missing required 'date' property and ensured 'shiftName' is accepted via the updated interface
    const entry: NotebookEntry = {
      id: Math.random().toString(36).substr(2, 9),
      shiftId: activeShift.id,
      staffId: user.id,
      staffName: user.name,
      date: activeShift.date,
      shiftName: getShiftName(activeShift.clockInTime),
      category: selectedCategory,
      text: newNoteText,
      timestamp: new Date().toISOString(),
      isCritical: selectedCategory === 'Safety Alert'
    };
    setJournalEntries(prev => [...prev, entry]);
    setNewNoteText('');
    setIsAddingNote(false);
    setSelectedCategory('Custom');
  };

  const acknowledgeMessage = (msgId: string) => {
    const updated = messages.map(m => m.id === msgId ? { ...m, acknowledgedBy: [...m.acknowledgedBy, user.id] } : m);
    setMessages(updated);
    setPendingAcknowledgedMessages(prev => prev.filter(p => p.id !== msgId));
  };

  const isShiftUnacknowledgedByAll = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return false;
    const staffCount = db.getUsers().filter(u => u.role === 'Staff').length;
    return shift.acknowledgedBy.length < staffCount;
  };

  if (pendingAcknowledgedMessages.length > 0) {
    const msg = pendingAcknowledgedMessages[0];
    return (
      <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[300] p-4 backdrop-blur-md">
        <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="bg-orange-500 p-6 text-white text-center">
            <MessageSquare size={40} className="mx-auto mb-2" />
            <h2 className="text-xl font-black uppercase tracking-widest">New Alert</h2>
          </div>
          <div className="p-8">
            <div className="mb-6">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{msg.senderName} sent an update:</span>
              <p className="text-lg font-bold text-gray-800 mt-1 italic">"{msg.text}"</p>
              <span className="text-[10px] text-gray-400 mt-2 block">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
            </div>
            <button 
              onClick={() => acknowledgeMessage(msg.id)}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all"
            >
              I've Read This
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showHandoff) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
        <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="bg-blue-600 p-8 text-white text-center">
            <ClipboardCheck size={48} className="mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-black mb-2">Review Confirmation</h2>
            <p className="text-blue-100 font-medium">Have you reviewed all notes from the previous shift?</p>
          </div>
          <div className="p-8 space-y-3">
            <button onClick={() => handleClockIn('Yes')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">
              Yes, Ready to Start
            </button>
            <button onClick={() => handleClockIn('Some')} className="w-full bg-blue-100 text-blue-700 p-4 rounded-2xl font-black text-lg shadow-sm active:scale-95 transition-all">
              Some (Catching Up)
            </button>
            <button onClick={() => handleClockIn('No')} className="w-full bg-slate-100 text-slate-500 p-4 rounded-2xl font-black text-lg active:scale-95 transition-all">
              No (Need to Read)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {!activeShift ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-dashed border-blue-200 text-center animate-in fade-in slide-in-from-top-4">
          <h2 className="text-2xl font-black text-gray-900 mb-1">{getShiftName()}</h2>
          <p className="text-slate-400 font-bold mb-8">Tap below to open the care journal.</p>
          <button 
            onClick={() => setShowHandoff(true)}
            className="w-full bg-blue-600 text-white py-6 rounded-3xl text-3xl font-black shadow-[0_8px_0_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-4"
          >
            <Clock size={40} />
            Clock In
          </button>
        </div>
      ) : (
        <div className="bg-blue-600 p-6 rounded-3xl shadow-lg text-white flex items-center justify-between sticky top-16 z-30">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Active: {getShiftName(activeShift.clockInTime)}</div>
            <h2 className="text-3xl font-black tracking-tight tabular-nums">{format(new Date(activeShift.clockInTime!), 'h:mm a')}</h2>
          </div>
          <button 
            onClick={() => setShowClockOutModal(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform"
          >
            End Shift
          </button>
        </div>
      )}

      <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 group">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-100 flex flex-col justify-start py-6 border-r border-slate-200 z-10 shadow-inner">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="spiral-ring" />
          ))}
        </div>

        <div className="notebook-paper custom-scrollbar overflow-y-auto max-h-[70vh] pb-12">
          <div className="notebook-line border-b border-blue-100 mb-4 h-16 !items-end pb-2">
            <h3 className="font-handwriting text-3xl text-blue-800 opacity-60 ml-4">Care Log: {format(new Date(), 'MMM d, yyyy')}</h3>
          </div>

          {allEntries.map((entry) => {
            const isUnseenHighlight = isShiftUnacknowledgedByAll(entry.shiftId) && entry.shiftId !== activeShift?.id;
            return (
              <div key={entry.id} className={`notebook-line group transition-colors ${isUnseenHighlight ? 'bg-blue-50/80' : ''}`}>
                <div className="notebook-meta">
                  {format(new Date(entry.timestamp), 'MM/dd')} {getInitials(entry.staffName)} {format(new Date(entry.timestamp), 'h:mm a')}
                </div>
                <div className={`font-handwriting text-2xl leading-none flex items-center gap-2 truncate ${entry.isCritical ? 'text-red-600 font-bold underline decoration-red-200 underline-offset-4' : 'text-slate-800'}`}>
                  {entry.category !== 'Custom' && (
                    <span className="font-sans font-black text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded leading-none flex-shrink-0">
                      {entry.category}
                    </span>
                  )}
                  <span className="truncate">{entry.text}</span>
                </div>
              </div>
            );
          })}

          {activeShift && !isAddingNote && (
            <div className="notebook-line relative group">
              <div className="notebook-meta opacity-30 italic">New Entry</div>
              <div className="flex-1 border-b border-transparent group-hover:border-blue-100 h-full flex items-center">
                <button 
                  onClick={() => setIsAddingNote(true)}
                  className="absolute right-6 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:scale-125 active:scale-90 transition-all z-20 group-hover:rotate-90"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}

          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`spacer-${i}`} className="notebook-line opacity-5" />
          ))}

          <div ref={notebookEndRef} />
        </div>

        <div className="absolute bottom-4 right-8 flex gap-2 z-20 opacity-40 hover:opacity-100 transition-opacity">
          <button className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200"><ArrowLeft size={16} /></button>
          <button className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200"><ArrowRight size={16} /></button>
        </div>
      </div>

      {isAddingNote && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-[110] p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight">Add to Journal</h3>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{format(new Date(), 'h:mm a')} • {getInitials(user.name)}</p>
              </div>
              <button onClick={() => setIsAddingNote(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`py-2 px-4 rounded-xl text-sm font-bold border-2 transition-all ${selectedCategory === cat.name ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-200'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Your Entry</label>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={selectedCategory === 'Custom' ? "Type your note here..." : `Details about ${selectedCategory.toLowerCase()}...`}
                  className="w-full p-6 rounded-3xl border-2 border-slate-100 h-40 text-xl font-medium focus:border-blue-500 focus:outline-none bg-slate-50 font-handwriting"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleSaveEntry}
                  disabled={!newNoteText.trim()}
                  className="w-full bg-blue-600 disabled:bg-slate-200 text-white py-6 rounded-3xl font-black text-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 active:shadow-none transition-all"
                >
                  <Save size={28} />
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClockOutModal && (
        <div className="fixed inset-0 bg-slate-900/70 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h3 className="text-xl font-black tracking-tight">Finish Shift</h3>
              <p className="text-xs font-bold opacity-70">How would you like to clock out?</p>
            </div>
            <div className="p-6 space-y-3">
              {!showNotificationInput ? (
                <>
                  <button 
                    onClick={() => setShowNotificationInput(true)}
                    className="w-full bg-blue-50 text-blue-600 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-100 transition-colors"
                  >
                    <MessageSquare size={24} />
                    Notify Next Shift
                  </button>
                  <button 
                    onClick={() => finalizeClockOut(false)}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Just End Shift
                  </button>
                  <button onClick={() => setShowClockOutModal(false)} className="w-full text-slate-400 font-bold py-2 mt-2">Cancel</button>
                </>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Important Message for Staff</label>
                  <textarea 
                    autoFocus
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    placeholder="Type details for the next shift..."
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 h-32 font-medium"
                  />
                  <button 
                    onClick={() => finalizeClockOut(true)}
                    disabled={!notificationText.trim()}
                    className="w-full bg-blue-600 disabled:bg-slate-200 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg"
                  >
                    <Send size={20} />
                    Send & End Shift
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;