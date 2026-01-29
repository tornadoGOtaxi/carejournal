import React, { useState, useMemo } from 'react';
import { User, NotebookEntry, ScheduleEntry, Category } from '../types';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Plus, Pencil, AlertCircle, UserPlus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface Props {
  currentUser: User;
  users: User[];
  journalEntries: NotebookEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<NotebookEntry[]>>;
  schedule: ScheduleEntry[];
  categories: Category[];
}

const PlannerView: React.FC<Props> = ({ 
  currentUser, users, journalEntries, setJournalEntries, schedule, categories 
}) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editingEntry, setEditingEntry] = useState<NotebookEntry | null>(null);
  const [isAdding, setIsAdding] = useState<{ date: string } | null>(null);
  const [newNote, setNewNote] = useState({ text: '', category: 'General Note', isCritical: false });

  const weekDays = useMemo(() => 
    Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
  [weekStart]);

  const getShiftName = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Morning Shift';
    if (hour >= 12 && hour < 17) return 'Afternoon Shift';
    if (hour >= 17 && hour < 22) return 'Evening Shift';
    return 'Night Shift';
  };

  const handleSaveEntry = () => {
    if (!newNote.text.trim() || (!isAdding && !editingEntry)) return;

    const now = new Date();

    if (editingEntry) {
      setJournalEntries(prev => prev.map(e => e.id === editingEntry.id ? {
        ...e,
        text: newNote.text,
        category: newNote.category,
        isCritical: newNote.isCritical
      } : e));
    } else if (isAdding) {
      const entry: NotebookEntry = {
        id: Math.random().toString(36).substr(2, 9),
        staffId: currentUser.id,
        staffName: currentUser.name,
        date: isAdding.date,
        category: newNote.category,
        text: newNote.text,
        timestamp: now.toISOString(), // Automatically includes timestamp of creation
        shiftName: getShiftName(now),
        isCritical: newNote.isCritical
      };
      setJournalEntries(prev => [...prev, entry]);
    }

    setEditingEntry(null);
    setIsAdding(null);
    setNewNote({ text: '', category: 'General Note', isCritical: false });
  };

  const getDayStaff = (date: Date) => {
    return schedule
      .filter(s => s.date === format(date, 'yyyy-MM-dd'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(s => users.find(u => u.id === s.staffId)?.name || 'Unknown');
  };

  const hasCritical = (date: Date) => 
    journalEntries.some(e => e.date === format(date, 'yyyy-MM-dd') && e.isCritical);

  const hasOpenShift = (date: Date) => 
    schedule.some(s => s.date === format(date, 'yyyy-MM-dd') && s.coverageRequested);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Planner Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <button 
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-400">
          Week of {format(weekStart, 'MMMM d, yyyy')}
        </h2>
        <button 
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 2-Page Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-0 bg-slate-300 p-1 lg:p-4 rounded-[3rem] shadow-2xl relative">
        {/* Spiral Spine Decoration */}
        <div className="hidden lg:flex absolute left-1/2 top-10 bottom-10 w-8 -ml-4 flex-col justify-between items-center z-10 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-slate-400 border-2 border-slate-500 shadow-inner" />
          ))}
        </div>

        {weekDays.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntries = journalEntries
            .filter(e => e.date === dateStr)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp)); // Sort by timestamp for chronological order
          const staffNames = getDayStaff(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={dateStr} 
              className={`bg-[#fffef0] min-h-[400px] border-b lg:border-b-0 border-slate-200 p-6 flex flex-col 
                ${idx === 0 ? 'lg:rounded-tl-[2rem]' : ''} 
                ${idx === 3 ? 'lg:rounded-bl-[2rem] border-b-0' : ''} 
                ${idx === 4 ? 'lg:rounded-tr-[2rem]' : ''} 
                ${idx === 6 ? 'lg:rounded-br-[2rem]' : ''}
                ${idx < 4 ? 'lg:border-r' : ''}
                ${isToday ? 'ring-4 ring-blue-500 ring-inset z-20 shadow-xl' : ''}
              `}
            >
              {/* Day Header Line */}
              <div className="flex items-center justify-between border-b-2 border-red-200 pb-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-800">{format(day, 'EEE, d')}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase truncate max-w-[150px]">
                    {staffNames.length > 0 ? staffNames.join(', ') : 'No staff assigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasCritical(day) && <AlertCircle className="text-red-500" size={18} fill="currentColor" />}
                  {hasOpenShift(day) && <UserPlus className="text-green-500" size={18} />}
                  <button 
                    onClick={() => setIsAdding({ date: dateStr })}
                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Day Body (Notebook lines style) */}
              <div className="flex-1 space-y-1">
                {dayEntries.length === 0 ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No entries yet</p>
                  </div>
                ) : (
                  dayEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`group flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors relative ${entry.isCritical ? 'bg-red-50' : ''}`}
                    >
                      <div className="text-[9px] font-black text-slate-300 uppercase leading-none pt-1">
                        {format(parseISO(entry.timestamp), 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase text-blue-500 mr-2">{entry.staffName}:</span>
                        <span className={`font-handwriting text-xl leading-none ${entry.isCritical ? 'text-red-700 font-bold' : 'text-slate-800'}`}>
                          {entry.text}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingEntry(entry);
                          setNewNote({ text: entry.text, category: entry.category, isCritical: entry.isCritical });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-all"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingEntry) && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">{editingEntry ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => { setIsAdding(null); setEditingEntry(null); }}><AlertCircle size={24} className="rotate-45" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Type of Note</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewNote(prev => ({ ...prev, category: cat.name }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${newNote.category === cat.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-100'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Your Entry</label>
                <textarea
                  value={newNote.text}
                  onChange={(e) => setNewNote(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 h-32 font-handwriting text-2xl"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="critical" 
                  checked={newNote.isCritical}
                  onChange={(e) => setNewNote(prev => ({ ...prev, isCritical: e.target.checked }))}
                  className="w-5 h-5 rounded accent-red-500"
                />
                <label htmlFor="critical" className="text-sm font-black text-red-600 uppercase tracking-widest cursor-pointer">Mark as Critical</label>
              </div>

              <button 
                onClick={handleSaveEntry}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl"
              >
                Save to Planner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerView;