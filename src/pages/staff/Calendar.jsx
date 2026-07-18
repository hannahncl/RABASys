import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const data = await bookingService.getAll();
        // Assuming data is bookings assigned to this staff
        setBookings(data);
      } catch (error) {
        showNotification('Failed to fetch bookings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [showNotification]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getBookingsForDate = (dateNum) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
    return bookings.filter(b => b.tourDate === dateStr);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border-slate-900">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-200">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-4">
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} className="h-24 md:h-32 rounded-xl bg-slate-900/20 border border-transparent"></div>
              ))}
              
              {[...Array(daysInMonth)].map((_, i) => {
                const dateNum = i + 1;
                const dayBookings = getBookingsForDate(dateNum);
                const isToday = new Date().getDate() === dateNum && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                
                return (
                  <div key={dateNum} className={`h-24 md:h-32 rounded-xl p-2 border flex flex-col gap-1 overflow-y-auto ${isToday ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-slate-900/40 border-slate-850 hover:border-slate-700 transition-colors'}`}>
                    <span className={`text-xs font-bold block ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>{dateNum}</span>
                    {dayBookings.map((b, idx) => (
                      <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5 text-[10px] space-y-1">
                        <p className="font-bold text-emerald-400 truncate">{b.packageName}</p>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Users className="w-3 h-3" /> {b.guestsCount}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
