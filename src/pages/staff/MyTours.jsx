import React, { useEffect, useState } from 'react';
import { bookingService } from '../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import { CalendarCheck, ShieldCheck, XCircle, Search, Smartphone } from 'lucide-react';

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
      // Only get tours assigned/confirmed, ignoring pending for guide view unless requested
      setBookings(data);
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
    const matchesSearch = b.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          b.id.toLowerCase().includes(search.toLowerCase()) ||
                          b.packageName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['All', 'Confirmed', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filter === status
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or ref ID..."
            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-2xl border-slate-900" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div key={b.id} className="glass-card rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              {/* Profile Details */}
              <div className="space-y-2 max-w-md w-full">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 font-mono">{b.id}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    b.status === 'Confirmed'
                      ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                      : b.status === 'Pending Verification'
                      ? 'bg-amber-100 border-amber-300 text-amber-700'
                      : b.status === 'Cancelled'
                      ? 'bg-rose-950/60 border-rose-800/40 text-rose-400'
                      : 'bg-amber-950/60 border-amber-800/40 text-amber-400'
                  }`}>
                    {b.status}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-200 font-display leading-snug">
                  {b.packageName}
                </h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                  <p>Client: <span className="font-semibold text-slate-300">{b.customerName}</span></p>
                  <p>Tour Date: <span className="font-semibold text-slate-300">{b.tourDate}</span></p>
                  <p>Guests: <span className="font-semibold text-slate-300">{b.guestsCount} guest(s)</span></p>
                  <p>Contact: <span className="font-semibold text-slate-300">{b.customerPhone}</span></p>
                </div>
              </div>

              {/* Extra Details */}
              <div className="bg-slate-900/60 border border-slate-850 px-4 py-3 rounded-xl text-xs space-y-1 w-full md:w-64">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Contact Number</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{b.customerPhone}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-1">
                  <span>Ref: <span className="font-mono text-cyan-400 font-semibold">{b.id}</span></span>
                  <span className="font-extrabold text-slate-200">PHP {b.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                {b.status === 'Confirmed' && (
                  <span className="text-emerald-500 text-xs italic font-medium">Ready for Tour</span>
                )}
                {b.status === 'Completed' && (
                  <span className="text-slate-500 text-xs italic font-medium">Tour Completed</span>
                )}
                {b.status === 'Pending Verification' && (
                  <span className="text-amber-500 text-xs italic font-medium">Awaiting Payment</span>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-2xl border-slate-900 space-y-3">
          <CalendarCheck className="h-10 w-10 text-slate-600 mx-auto" />
          <h4 className="font-bold text-slate-300 font-display">No Bookings Found</h4>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">There are no bookings matching the selected status filter.</p>
        </div>
      )}
    </div>
  );
};

export default MyTours;
