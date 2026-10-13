import React, { useEffect, useState } from 'react';
import { bookingService } from '../../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import { CalendarCheck, ShieldCheck, XCircle, Search, Smartphone } from 'lucide-react';

const statusPillClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed') return 'bg-yellow-400/20 text-yellow-800 border-yellow-400/40 font-bold';
  if (s === 'completed') return 'bg-yellow-50 border-yellow-300 text-yellow-800 font-bold';
  if (s === 'cancelled') return 'bg-stone-100 text-stone-600 border-stone-200 font-medium';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold';
};

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Completed') return 'Completed';
  if (status === 'Pending Verification') return 'Pending';
  return status || 'Confirmed';
};

const MyTours = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Confirmed');
  const [search, setSearch] = useState('');
  const { showNotification } = useNotification();

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAll();
      setBookings(data || []);
    } catch (e) {
      showNotification('Failed to fetch bookings list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = filter === 'All' || b.status === filter;
    const matchesSearch = (b.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
                          (b.packageName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['All', 'Confirmed', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                filter === status
                  ? 'bg-yellow-400 text-slate-900 border-yellow-400 shadow-sm'
                  : 'bg-white border-[#d6cfc2] text-[#4a453b] hover:bg-[#f7f4ef]'
              }`}
            >
              {status === 'Confirmed' ? 'Booked' : status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6b6255]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or ref ID..."
            className="w-full bg-white border border-[#d6cfc2] focus:border-[#b0a68e] rounded-sm py-2 pl-9 pr-4 text-xs text-[#1a1a1a] placeholder:text-[#6b6255] focus:outline-none"
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/50 animate-pulse rounded-md border border-[#e0dbd0]" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div 
              key={b.id} 
              className="bg-white border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-md p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              
              {/* Profile Details */}
              <div className="space-y-2 max-w-md w-full">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-yellow-700 font-mono">{b.id}</span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusPillClass(b.status)}`}>
                    {statusLabel(b.status)}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-[#1a1a1a] font-display leading-snug">
                  {b.packageName}
                </h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#6b6255]">
                  <p>Client: <span className="font-semibold text-[#1a1a1a]">{b.customerName}</span></p>
                  <p>Tour Date: <span className="font-semibold text-[#1a1a1a]">{b.tourDate}</span></p>
                  <p>Guests: <span className="font-semibold text-[#1a1a1a]">{b.guestsCount || 1} guest(s)</span></p>
                  <p>Contact: <span className="font-semibold text-[#1a1a1a]">{b.customerPhone || 'N/A'}</span></p>
                </div>
              </div>

              {/* Extra Details */}
              <div className="bg-[#faf9f6] border border-[#eae5db] px-4 py-3 rounded-md text-xs space-y-2 w-full md:w-64">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Contact</span>
                  <div className="p-1 rounded-md bg-yellow-50 border border-yellow-200">
                    <Smartphone className="h-3 w-3 text-yellow-700" />
                  </div>
                </div>
                <div className="font-bold text-[#1a1a1a]">
                  <span>{b.customerPhone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center text-[#6b6255] pt-1.5 border-t border-[#eae5db]">
                  <span>Ref: <span className="font-mono text-yellow-700 font-bold">{b.paymentRef || b.id}</span></span>
                  <span className="font-extrabold text-[#1a1a1a]">PHP {Number(b.totalPrice || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                {b.status === 'Confirmed' && (
                  <span className="text-yellow-800 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold">
                    Ready for Tour
                  </span>
                )}
                {b.status === 'Completed' && (
                  <span className="text-yellow-800 bg-yellow-50 border border-yellow-300 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
                    Completed
                  </span>
                )}
                {b.status === 'Pending Verification' && (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                    Awaiting Payment
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-md border border-[#e0dbd0] space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 inline-flex items-center justify-center mx-auto mb-2">
            <CalendarCheck className="h-6 w-6 text-yellow-700" />
          </div>
          <h4 className="font-bold text-[#1a1a1a] font-display">No Bookings Found</h4>
          <p className="text-[#6b6255] text-xs max-w-xs mx-auto">There are no bookings matching the selected status filter.</p>
        </div>
      )}
    </div>
  );
};

export default MyTours;
