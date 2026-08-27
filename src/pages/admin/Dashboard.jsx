import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';
import { DollarSign, Receipt, Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
=======
import { bookingService } from '../../services/bookingService';
import { ArrowUpRight, TrendingUp, DollarSign, Loader, ReceiptText, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CHART_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#818cf8', '#f472b6', '#a78bfa'];
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a

const statusPillClass = (status) => (
  status === 'Confirmed'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : status === 'Cancelled'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
);

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Pending Verification') return 'Pending';
  return status;
};

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [packageBreakdown, setPackageBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const allBookings = await bookingService.getAll();
        setBookings(allBookings.slice(0, 5));

        const totalBookings = allBookings.length;
        const confirmedBookings = allBookings.filter((b) => String(b.status || '').toLowerCase() === 'confirmed').length;
        const pendingBookings = allBookings.filter((b) => String(b.status || '').toLowerCase().includes('pending')).length;
        const cancelledBookings = allBookings.filter((b) => String(b.status || '').toLowerCase() === 'cancelled').length;

        // Calculate total gross revenue from all bookings in the system
        const totalRevenue = allBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        setStats({
          totalBookings,
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          totalRevenue,
        });

        // 1. Monthly Sales Trend dynamically from system bookings
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyMap = {};

        allBookings.forEach((b) => {
          const dateVal = b.createdAt || b.tourDate;
          if (!dateVal) return;
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return;
          const monthName = d.toLocaleString('en-US', { month: 'short' });
          if (!monthlyMap[monthName]) {
            monthlyMap[monthName] = { month: monthName, sales: 0, bookings: 0 };
          }
          monthlyMap[monthName].sales += Number(b.totalPrice) || 0;
          monthlyMap[monthName].bookings += 1;
        });

        const sortedMonthly = Object.values(monthlyMap).sort(
          (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
        );
        setSalesTrend(sortedMonthly.length > 0 ? sortedMonthly : [{ month: 'Current', sales: totalRevenue, bookings: totalBookings }]);

        // 2. Top Booked Packages dynamically from system bookings
        const pkgMap = {};
        allBookings.forEach((b) => {
          const name = b.packageName || 'Unspecified Service';
          if (!pkgMap[name]) {
            pkgMap[name] = { name, bookings: 0, revenue: 0 };
          }
          pkgMap[name].bookings += 1;
          pkgMap[name].revenue += Number(b.totalPrice) || 0;
        });

        const sortedPackages = Object.values(pkgMap)
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 5);

        setPackageBreakdown(sortedPackages);

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Minimal KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">
            PHP {stats.totalRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" /> System Live Gross
          </span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bookings</span>
            <ReceiptText className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.totalBookings}</p>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed</span>
            <CheckCircle2 className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.confirmedBookings}</p>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Review</span>
            <Clock3 className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.pendingBookings}</p>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cancelled</span>
            <XCircle className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.cancelledBookings}</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e0dbd0] p-6 rounded-md space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-base">Monthly Revenue Analytics</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live sales trend from system bookings</p>
            </div>
            <Link to="/admin/bookings" className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
              View Bookings <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-64 w-full text-xs pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Booked Services Chart */}
        <div className="bg-white border border-[#e0dbd0] p-6 rounded-md space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-base">Top Booked Services</h3>
              <p className="text-xs text-slate-400 mt-0.5">Most booked packages & rentals</p>
            </div>
            <Link to="/admin/tour-packages" className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
              Packages <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-64 w-full text-xs pt-2">
            {packageBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No booking records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" width={100} tickFormatter={(val) => val.length > 12 ? `${val.slice(0, 12)}...` : val} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    formatter={(value) => [value, 'System Bookings']}
                  />
                  <Bar dataKey="bookings" radius={[0, 4, 4, 0]}>
                    {packageBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Recent Bookings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-base">Recent Bookings</h3>
          <Link to="/admin/bookings" className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
            Manage all bookings <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-slate-900/30 border border-slate-850 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-850/60 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Tour / Package</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 text-slate-300">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-400">{b.id}</td>
                    <td className="p-4 font-medium text-slate-200">{b.customerName}</td>
                    <td className="p-4 font-medium">{b.packageName}</td>
                    <td className="p-4 text-right font-bold text-slate-100">PHP {Number(b.totalPrice || 0).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusPillClass(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



