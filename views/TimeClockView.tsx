
import React from 'react';
import { User, Shift } from '../types';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, differenceInMinutes } from 'date-fns';
import { Clock, Send, Calendar } from 'lucide-react';

interface Props {
  currentUser: User;
  shifts: Shift[];
}

const TimeClockView: React.FC<Props> = ({ currentUser, shifts }) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const myWeeklyShifts = shifts
    .filter(s => s.staffId === currentUser.id && s.clockInTime)
    .filter(s => {
      const punchDate = parseISO(s.clockInTime!);
      return isWithinInterval(punchDate, { start: weekStart, end: weekEnd });
    })
    .sort((a, b) => b.clockInTime!.localeCompare(a.clockInTime!));

  const calculateHours = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const diff = differenceInMinutes(parseISO(end), parseISO(start));
    return diff / 60;
  };

  const totalWeeklyHours = myWeeklyShifts.reduce((acc, s) => {
    return acc + calculateHours(s.clockInTime, s.clockOutTime);
  }, 0);

  const handleSendToLaura = () => {
    const email = "laura@example.com"; // Placeholder as per user context
    const subject = `Time Sheet: ${currentUser.name} - Week of ${format(weekStart, 'MMM d')}`;
    
    let body = `Time Sheet for ${currentUser.name}\n`;
    body += `Week: ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}\n\n`;
    
    myWeeklyShifts.forEach(s => {
      const date = format(parseISO(s.clockInTime!), 'EEEE, MMM d');
      const inTime = format(parseISO(s.clockInTime!), 'h:mm a');
      const outTime = s.clockOutTime ? format(parseISO(s.clockOutTime), 'h:mm a') : 'STILL IN';
      const hours = calculateHours(s.clockInTime, s.clockOutTime).toFixed(2);
      body += `${date}: IN ${inTime} - OUT ${outTime} (${hours} hrs)\n`;
    });
    
    body += `\nTOTAL WEEKLY HOURS: ${totalWeeklyHours.toFixed(2)}`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800">My Time Clock</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Current Week: {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </p>
          </div>
          <div className="bg-blue-600 px-6 py-4 rounded-3xl text-white text-center shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Weekly Total</div>
            <div className="text-4xl font-black">{totalWeeklyHours.toFixed(2)} <span className="text-lg">hrs</span></div>
          </div>
        </div>

        <div className="space-y-4">
          {myWeeklyShifts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <Calendar className="mx-auto text-slate-200 mb-2" size={48} />
              <p className="text-slate-400 font-bold">No time punches recorded for this week.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Clock In</th>
                    <th className="px-6 py-4">Clock Out</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myWeeklyShifts.map(s => (
                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-700">
                        {format(parseISO(s.clockInTime!), 'EEE, MMM d')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                          <Clock size={14} />
                          {format(parseISO(s.clockInTime!), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.clockOutTime ? (
                          <div className="flex items-center gap-2 text-red-500 font-bold">
                            <Clock size={14} />
                            {format(parseISO(s.clockOutTime), 'h:mm a')}
                          </div>
                        ) : (
                          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Active Shift</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">
                        {calculateHours(s.clockInTime, s.clockOutTime).toFixed(2)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={handleSendToLaura}
            disabled={myWeeklyShifts.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
          >
            <Send size={24} />
            Send to Laura
          </button>
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            Sends your full weekly breakdown to payroll
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeClockView;
