import React, { useState } from 'react';
import { Draft } from '../types';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, ExternalLink, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  drafts: Draft[];
  onDraftClick: (draft: Draft) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarView: React.FC<CalendarViewProps> = ({ drafts, onDraftClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const getDraftsForDay = (day: number | null) => {
    if (day === null) return [];
    return drafts.filter(d => {
      const date = d.scheduled_for ? new Date(d.scheduled_for) : (d.published_at ? new Date(d.published_at) : null);
      if (!date) return false;
      return date.getDate() === day && 
             date.getMonth() === currentDate.getMonth() && 
             date.getFullYear() === currentDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const selectedDayDrafts = getDraftsForDay(selectedDay);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDay(now.getDate());
            }} className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50">
              Today
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-50 last:border-0">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {days.map((day, index) => {
            const dayDrafts = day ? getDraftsForDay(day) : [];
            const isSelected = selectedDay === day;
            
            return (
              <div 
                key={index} 
                onClick={() => day && setSelectedDay(day)}
                className={`min-h-[90px] lg:min-h-[110px] border-r border-b border-slate-100 p-1 lg:p-2 last:border-r-0 flex flex-col gap-1 transition-all cursor-pointer
                  ${day === null ? 'bg-slate-50/30' : 'bg-white hover:bg-blue-50/30'}
                  ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 z-10' : ''}
                  ${day && isToday(day) && !isSelected ? 'bg-blue-50/10' : ''}`}
              >
                {day && (
                  <span className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors
                    ${isSelected ? 'bg-blue-600 text-white' : isToday(day) ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}>
                    {day}
                  </span>
                )}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-24 scrollbar-hide">
                  {dayDrafts.slice(0, 3).map(d => (
                    <div
                      key={d.id}
                      className={`text-[9px] p-1 rounded border truncate
                        ${d.status === 'scheduled' ? 'bg-purple-50 border-purple-100 text-purple-700' : 
                          d.status === 'published' ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                          'bg-slate-50 border-slate-100 text-slate-700'}`}
                    >
                      {d.content.substring(0, 20)}...
                    </div>
                  ))}
                  {dayDrafts.length > 3 && (
                    <div className="text-[9px] text-slate-400 font-bold px-1">
                      + {dayDrafts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Sidebar */}
      <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col animate-in slide-in-from-right-4 duration-500">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-bold text-slate-900 text-sm">
            {selectedDay ? `${MONTH_NAMES[currentDate.getMonth()]} ${selectedDay}` : 'Select a date'}
          </h4>
          {selectedDay && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              {selectedDayDrafts.length} posts
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedDay ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <CalendarIcon className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">Click a date to view posts for that day</p>
            </div>
          ) : selectedDayDrafts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Clock className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">No posts scheduled or published on this day</p>
            </div>
          ) : (
            selectedDayDrafts.map(d => (
              <div 
                key={d.id} 
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group cursor-pointer"
                onClick={() => onDraftClick(d)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${d.status === 'scheduled' ? 'bg-purple-100 text-purple-700' : 
                      d.status === 'published' ? 'bg-blue-100 text-blue-700' : 
                      'bg-slate-200 text-slate-700'}`}>
                    {d.status === 'published' ? <Send className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                    {d.status}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {d.scheduled_for ? new Date(d.scheduled_for).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                     d.published_at ? new Date(d.published_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {d.content}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                     View Details <ExternalLink className="w-2.5 h-2.5" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;