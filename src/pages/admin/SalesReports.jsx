<<<<<<< HEAD
<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { reportService } from '../services/reportService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Landmark, CalendarRange } from 'lucide-react';
=======
import { bookingService } from '../../services/bookingService';
import { TrendingUp, TrendingDown, Eye, Loader, Wallet, Receipt, Users, Ban } from 'lucide-react';
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6
=======
import React, { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../../services/bookingService';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../../services/bookingService';
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
import { ArrowUpDown, Eye, Loader, Search, DollarSign, ReceiptText, CheckCircle2, XCircle } from 'lucide-react';

const normalizeStatus = (status = '') => String(status || '').trim().toLowerCase().replace(/\s+/g, '');

const getBookingDate = (booking) => {
  const rawDate = booking.createdAt || booking.tourDate || booking.returnDate;
  if (!rawDate) return null;

  const parsedDate = new Date(rawDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();
};
<<<<<<< HEAD
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
=======
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a

const SalesReports = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
      setLoading(false);
    };
    loadBookings();
  }, []);

  const monthOptions = useMemo(() => {
    const months = bookings
      .map((booking) => getBookingDate(booking))
      .filter(Boolean)
      .map((date) => date.toLocaleString('en-US', { month: 'long' }))
      .filter((month, index, list) => list.indexOf(month) === index);

    return months.sort((a, b) => a.localeCompare(b));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return bookings.filter((booking) => {
      const bookingDate = getBookingDate(booking);
      const matchesTimeRange = (() => {
        if (timeFilter === 'all' || !bookingDate) return true;
        if (timeFilter === 'day') return isSameDay(bookingDate, startOfToday);
        if (timeFilter === 'week') return bookingDate >= startOfWeek;
        if (timeFilter === 'month') return bookingDate >= startOfMonth;
        return true;
      })();

      const matchesMonth = selectedMonth === 'all' || !bookingDate || bookingDate.toLocaleString('en-US', { month: 'long' }) === selectedMonth;
      const matchesSearch = !searchTerm || [
        booking.packageName,
        booking.customerName,
        booking.type,
        booking.status,
        booking.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesTimeRange && matchesMonth && matchesSearch;
    });
  }, [bookings, searchTerm, selectedMonth, timeFilter]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings];
    sorted.sort((left, right) => {
      let leftValue = left[sortConfig.key];
      let rightValue = right[sortConfig.key];

      if (sortConfig.key === 'date') {
        leftValue = getBookingDate(left);
        rightValue = getBookingDate(right);
      }

      if (sortConfig.key === 'guestsCount' || sortConfig.key === 'totalPrice') {
        leftValue = Number(leftValue) || 0;
        rightValue = Number(rightValue) || 0;
      }

      if (sortConfig.key === 'packageName' || sortConfig.key === 'customerName' || sortConfig.key === 'type' || sortConfig.key === 'status' || sortConfig.key === 'id') {
        leftValue = String(leftValue || '').toLowerCase();
        rightValue = String(rightValue || '').toLowerCase();
      }

      if (leftValue === rightValue) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;

      const comparison = leftValue > rightValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : comparison * -1;
    });

    return sorted;
  }, [filteredBookings, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((current) => (current.key === key && current.direction === 'asc'
      ? { key, direction: 'desc' }
      : { key, direction: 'asc' }));
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const totalEarnings = sortedBookings
    .filter((booking) => normalizeStatus(booking.status) === 'confirmed')
    .reduce((acc, booking) => acc + (Number(booking.totalPrice) || 0), 0);
  const totalBookings = sortedBookings.length;
  const confirmedCount = sortedBookings.filter((booking) => normalizeStatus(booking.status) === 'confirmed').length;
  const cancelledCount = sortedBookings.filter((booking) => normalizeStatus(booking.status) === 'cancelled').length;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md relative group transition-all hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Earnings</span><DollarSign className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <div className="text-2xl font-display font-extrabold text-[#1a1a1a]">
            PHP {totalEarnings.toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md relative group transition-all hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Bookings</span><ReceiptText className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <div className="text-2xl font-display font-extrabold text-[#1a1a1a]">
            {totalBookings}
          </div>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md relative group transition-all hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Confirmed</span><CheckCircle2 className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <div className="text-2xl font-display font-extrabold text-[#1a1a1a]">
            {confirmedCount}
          </div>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md relative group transition-all hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Cancelled</span><XCircle className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <div className="text-2xl font-display font-extrabold text-[#1a1a1a]">
            {cancelledCount}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            {['all', 'week', 'month', 'day'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2.5 py-1 rounded-md transition-colors ${timeFilter === filter ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-sm border border-[#d6cfc2] bg-white px-3 py-1.5 text-xs font-semibold text-[#4a453b]">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search"
              className="w-28 bg-transparent outline-none placeholder:text-slate-500"
            />
          </label>

          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="bg-white border border-[#d6cfc2] rounded-sm text-xs font-bold text-[#4a453b] px-3 py-1.5 focus:outline-none focus:border-[#b0a68e] cursor-pointer"
          >
            <option value="all">All Months</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('id')}>
                    Booking Code 
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('packageName')}>
                    Package / Category 
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('customerName')}>
                    Customer 
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('type')}>
                    Type 
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('date')}>
                    Date 
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('guestsCount')}>
                    Guests 
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button className="flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('status')}>
                    Status 
                  </button>
                </th>
                <th className="px-5 py-4 text-right">
                  <button className="ml-auto flex items-center gap-1 hover:text-slate-300" onClick={() => handleSort('totalPrice')}>
                    Total Amount 
                  </button>
                </th>
                <th className="px-5 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedBookings.map((booking) => {
                const initials = booking.customerName ? booking.customerName.charAt(0).toUpperCase() : '?';
                const bookingDate = getBookingDate(booking);
                return (
                  <tr key={booking.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">{booking.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-200">{booking.packageName}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-extrabold text-cyan-400 shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-300">{booking.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-semibold">{booking.type}</td>
                    <td className="px-5 py-4 text-slate-400">{bookingDate ? bookingDate.toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-slate-400">{booking.guestsCount}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${
                        normalizeStatus(booking.status) === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        normalizeStatus(booking.status) === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display font-extrabold text-[#1a1a1a]">
                        PHP {Number(booking.totalPrice).toLocaleString()}
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
          {sortedBookings.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No sales data found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
