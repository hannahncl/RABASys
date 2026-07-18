import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { reportService } from '../services/reportService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Landmark, CalendarRange } from 'lucide-react';
=======
import { bookingService } from '../../services/bookingService';
import { TrendingUp, TrendingDown, Eye, Loader, Wallet, Receipt, Users, Ban } from 'lucide-react';
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6

const SalesReports = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
      setLoading(false);
    };
    loadBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Derived metrics
  const totalEarnings = bookings.filter(b => b.status === 'Confirmed').reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards (Top Section) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 relative group transition-all hover:border-cyan-500/40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Earnings</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-100">
            PHP {totalEarnings.toLocaleString()}
          </div>
        </div>

        {/* Total Bookings */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 relative group transition-all hover:border-cyan-500/40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Bookings</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-100">
            {totalBookings}
          </div>
        </div>

        {/* Confirmed Tours */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 relative group transition-all hover:border-cyan-500/40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Completed / Booked</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-100">
            {confirmedCount}
          </div>
        </div>

        {/* Cancelled Bookings */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 relative group transition-all hover:border-cyan-500/40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Cancelled Bookings</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-slate-100">
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* Middle Section (Title & Filters) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2">
        <h2 className="text-lg font-extrabold text-slate-100 font-display">
          Sales Report <span className="text-slate-500 font-medium px-1">/</span> Total Earnings <span className="text-slate-500 font-medium px-1">/</span> <span className="text-cyan-400">All Time</span>
        </h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-bold">
            <button className="text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-pointer">All</button>
            <button className="text-slate-500 hover:text-slate-300 transition-colors pb-1 cursor-pointer">Week</button>
            <button className="text-slate-500 hover:text-slate-300 transition-colors pb-1 cursor-pointer">Day</button>
            <button className="text-slate-500 hover:text-slate-300 transition-colors pb-1 cursor-pointer">Time</button>
          </div>
          <select className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer">
            <option>All Months</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Booking Code</th>
                <th className="px-5 py-4">Package / Category</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Guests</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Total Amount</th>
                <th className="px-5 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map(b => {
                const initials = b.customerName ? b.customerName.charAt(0).toUpperCase() : '?';
                return (
                  <tr key={b.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">{b.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-200">{b.packageName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-extrabold text-cyan-400 shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-300">{b.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-semibold">{b.type}</td>
                    <td className="px-5 py-4 text-slate-400">{new Date(b.tourDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-slate-400">{b.guestsCount}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${
                        b.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        b.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display font-extrabold text-slate-100">
                        PHP {Number(b.totalPrice).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button className="px-3 py-1.5 bg-slate-900 text-cyan-400 font-bold rounded-lg border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No sales data found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
