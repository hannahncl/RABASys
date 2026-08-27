import React, { useEffect, useState } from 'react';
import { bookingService } from '../services/bookingService';
import { ChevronLeft, ChevronRight, Users, MapPin, CalendarDays } from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Schedule = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
      setLoading(false);
    };
    load();
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Build a map of date string -> bookings[]
  const bookingsByDate = {};
  bookings.forEach((b) => {
    const dateKey = b.tourDate; // "2026-07-15"
    if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
    bookingsByDate[dateKey].push(b);
  });

  // Create the calendar grid cells
  const calendarCells = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateStr,
      bookings: bookingsByDate[dateStr] || [],
      isToday: today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day,
    });
  }

  const selectedDateStr = selectedDate;
  const selectedBookings = selectedDateStr ? (bookingsByDate[selectedDateStr] || []) : [];

  // Status color helper
  const statusColor = (status) => {
    if (status === 'Confirmed') return 'bg-emerald-500';
    if (status === 'Cancelled') return 'bg-rose-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-8 text-[#4a453b]" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Calendar — Left 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0dbd0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#eae5db]">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 rounded-xl bg-white border border-[#e0dbd0] hover:border-[#b0a68e] text-[#4a453b] transition-all cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-bold font-display text-[#3d3a34]">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-xl bg-white border border-[#e0dbd0] hover:border-[#b0a68e] text-[#4a453b] transition-all cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-xs font-semibold bg-white border border-[#e0dbd0] hover:border-[#b0a68e] text-[#4a453b] rounded-xl transition-all cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Day labels row */}
          <div className="grid grid-cols-7 bg-[#faf9f6] border-b border-[#eae5db]">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-3 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#6b6255]">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="min-h-24 border-b border-r border-[#f0ede6] bg-[#fdfcf9]" />;
                }

                const hasBookings = cell.bookings.length > 0;
                const isSelected = selectedDate === cell.dateStr;
                const confirmedCount = cell.bookings.filter(b => b.status === 'Confirmed').length;
                const pendingCount = cell.bookings.filter(b => b.status === 'Pending Verification').length;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(isSelected ? null : cell.dateStr)}
                    className={`min-h-24 p-2 border-b border-r border-slate-900/60 cursor-pointer transition-all relative group ${
                      isSelected
                        ? 'bg-yellow-50 ring-1 ring-yellow-200 ring-inset'
                        : hasBookings
                        ? 'bg-[#faf9f6] hover:bg-yellow-50/40'
                        : 'hover:bg-[#faf9f6]'
                    }`}
                  >
                    {/* Day number */}
                    <span className={`text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                      cell.isToday
                        ? 'bg-yellow-400 text-slate-900'
                        : isSelected
                        ? 'text-yellow-700'
                        : 'text-[#4a453b]'
                    }`}>
                      {cell.day}
                    </span>

                    {/* Booking indicators */}
                    {hasBookings && (
                      <div className="mt-1.5 space-y-1">
                        {cell.bookings.slice(0, 2).map((b) => (
                          <div
                            key={b.id}
                            className={`text-[8px] leading-tight font-bold px-1.5 py-0.5 rounded-md truncate ${
                              b.status === 'Confirmed'
                                ? 'bg-white text-emerald-400 border border-emerald-100'
                                : b.status === 'Cancelled'
                                ? 'bg-white text-rose-400 border border-rose-100'
                                : 'bg-white text-amber-400 border border-amber-100'
                            }`}
                          >
                            {b.customerName.split(' ')[0]}
                          </div>
                        ))}
                        {cell.bookings.length > 2 && (
                          <span className="text-[8px] text-slate-500 font-semibold block">
                            +{cell.bookings.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar — Booking Details Panel */}
        <div className="space-y-6">
          {/* Summary counters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#e0dbd0] text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-2xl font-extrabold font-display text-[#3d3a34] block">{bookings.length}</span>
              <span className="text-[10px] text-[#6b6255] uppercase font-bold tracking-wider">Total Bookings</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e0dbd0] text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <span className="text-2xl font-extrabold font-display text-emerald-400 block">
                {bookings.filter(b => b.status === 'Confirmed').length}
              </span>
              <span className="text-[10px] text-[#6b6255] uppercase font-bold tracking-wider">Confirmed</span>
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="bg-white rounded-2xl border border-[#e0dbd0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="px-5 py-4 border-b border-[#eae5db] flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-yellow-500" />
              <h3 className="font-bold text-[#3d3a34] text-sm font-display">
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Select a Date'}
              </h3>
            </div>

            <div className="p-4">
              {!selectedDate ? (
                <p className="text-slate-500 text-xs text-center py-6 leading-relaxed">
                  Click on a calendar date to view<br />scheduled bookings for that day.
                </p>
              ) : selectedBookings.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">
                  No tour bookings scheduled for this date.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {selectedBookings.map((b) => (
                  <div key={b.id} className="bg-white border border-[#f0ede6] rounded-xl p-4 space-y-3">
                      {/* Status badge + ID */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#6b6255] font-bold">{b.id}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                            : b.status === 'Cancelled'
                            ? 'bg-rose-100 border-rose-200 text-rose-600'
                            : 'bg-amber-100 border-amber-200 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      {/* Tour name */}
                      <h4 className="font-bold text-sm text-[#3d3a34] font-display leading-snug">{b.packageName}</h4>

                      {/* Client info */}
                      <div className="grid grid-cols-1 gap-1.5 text-[11px] text-[#4a453b]">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-yellow-500 shrink-0" />
                          <span>{b.customerName} — {b.guestsCount} guest(s)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-yellow-500 shrink-0" />
                          <span>GCash Ref: <span className="font-mono text-yellow-600 font-bold">{b.paymentRef}</span></span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center border-t border-[#eae5db] pt-2 text-xs">
                        <span className="text-[#6b6255]">Total Paid</span>
                        <span className="font-extrabold text-[#4a453b] font-display">PHP {b.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
