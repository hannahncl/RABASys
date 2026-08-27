import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin, X } from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
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
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 bg-white p-6 rounded-md border border-[#e0dbd0] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#3d3a34]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-sm bg-white border border-[#d6cfc2] text-[#4a453b] hover:bg-[#f7f4ef] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-sm bg-white border border-[#d6cfc2] text-[#4a453b] hover:bg-[#f7f4ef] transition-colors">
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
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-[#6b6255]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} className="h-24 md:h-32 rounded-sm bg-[#fdfcf9] border border-[#f0ede6]"></div>
              ))}
              
              {[...Array(daysInMonth)].map((_, i) => {
                const dateNum = i + 1;
                const dayBookings = getBookingsForDate(dateNum);
                const isToday = new Date().getDate() === dateNum && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                
                return (
                  <div key={dateNum} className={`h-24 md:h-32 rounded-sm p-2 border flex flex-col gap-1 overflow-y-auto ${isToday ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-[#f0ede6] hover:bg-[#faf9f6] transition-colors'}`}>
                    <span className={`text-xs font-bold block ${isToday ? 'text-yellow-700' : 'text-[#4a453b]'}`}>{dateNum}</span>
                    {dayBookings.map((b, idx) => (
                      <div key={idx} onClick={(event) => { event.stopPropagation(); setSelectedBooking(b); }} className="bg-yellow-50 border border-yellow-100 rounded-sm p-1.5 text-[10px] space-y-1 cursor-pointer hover:bg-yellow-100">
                        <p className="font-semibold text-[#4a453b] truncate">{b.packageName}</p>
                        <div className="flex items-center gap-1 text-[#6b6255]">
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
      <aside className="bg-white rounded-md border border-[#e0dbd0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] lg:sticky lg:top-6">
        <div className="p-5 border-b border-[#eae5db] flex items-start justify-between">
          <div><p className="text-[10px] text-[#6b6255] font-mono font-bold">{selectedBooking?.id || 'BOOKING DETAILS'}</p><h3 className="font-semibold text-[#3d3a34] mt-1">{selectedBooking?.packageName || 'Select a booking'}</h3></div>
          {selectedBooking && <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-sm hover:bg-[#f7f4ef]"><X className="h-4 w-4 text-[#6b6255]" /></button>}
        </div>
        {selectedBooking ? <div className="p-5 space-y-4 text-xs text-[#4a453b]">
          <span className="inline-flex px-2.5 py-1 rounded-full border bg-emerald-100 border-emerald-200 text-emerald-700 font-bold uppercase">{selectedBooking.status}</span>
          <div className="space-y-2"><p><strong>Client:</strong> {selectedBooking.customerName}</p><p><strong>Contact:</strong> {selectedBooking.customerPhone || 'Not set'}</p><p><strong>Tour date:</strong> {selectedBooking.tourDate}</p><p><strong>Guests:</strong> {selectedBooking.guestsCount}</p><p><strong>Reference:</strong> <span className="font-mono text-yellow-700">{selectedBooking.paymentRef || selectedBooking.id}</span></p></div>
          <div className="border-t border-[#eae5db] pt-3 flex justify-between"><span>Total Paid</span><strong>PHP {Number(selectedBooking.totalPrice || 0).toLocaleString()}</strong></div>
        </div> : <p className="p-8 text-center text-sm text-[#6b6255]">Click a booking on the calendar to view its details.</p>}
      </aside>
      </div>
    </div>
  );
};

export default Calendar;
