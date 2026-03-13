import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
  const [selectedDate, setSelectedDate] = useState(new Date()); // For selection
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    if (isOpen) {
      // Reset to current time/date when opening
      const now = new Date();
      setCurrentDate(now);
      setSelectedDate(now);
      
      // Default to next hour
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0);
      
      const hours = String(nextHour.getHours()).padStart(2, '0');
      const minutes = String(nextHour.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const handleConfirm = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const finalDate = new Date(selectedDate);
    finalDate.setHours(hours);
    finalDate.setMinutes(minutes);
    onSchedule(finalDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Schedule Post
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-900 text-sm">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-5">
            {DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase tracking-wide">
                {day}
              </div>
            ))}
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null ? (
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`w-full h-full rounded-md text-sm flex items-center justify-center transition-all duration-200
                      ${isSelected(day) 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold transform scale-105' 
                        : isToday(day)
                          ? 'bg-blue-50 text-blue-600 font-medium border border-blue-100'
                          : 'hover:bg-slate-50 text-slate-700 hover:scale-105'
                      }
                    `}
                  >
                    {day}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {/* Time Selection */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group">
            <Clock className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 block mb-1 uppercase tracking-wide">Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 text-sm hover:shadow-md hover:translate-y-[-1px]"
            >
              Confirm Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;