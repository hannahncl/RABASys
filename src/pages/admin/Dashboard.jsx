import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';
import { DollarSign, Receipt, Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
=======
=======
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
import { bookingService } from '../../services/bookingService';
import { ArrowUpRight, TrendingUp, DollarSign, Loader, ReceiptText, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CHART_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#818cf8', '#f472b6', '#a78bfa'];
<<<<<<< HEAD
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
=======
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a

const statusPillClass = (status) => (
  status === 'Confirmed'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : status === 'Cancelled'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
);
=======
import { bookingService } from '../../services/bookingService';
import { ArrowUpRight, TrendingUp, DollarSign, Loader, ReceiptText, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, CartesianGrid, XAxis, YAxis
} from 'recharts';

// Refined monochromatic yellow / amber palette
const YELLOW_CHART_COLORS = [
  '#ca8a04', // Deep warm gold
  '#eab308', // Rich golden yellow
  '#facc15', // Vibrant sunflower yellow
  '#a16207', // Amber bronze
  '#fde047', // Soft butter yellow
  '#854d0e', // Deep ochre
];

const statusPillClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed') {
    return 'bg-yellow-400/20 text-yellow-800 border-yellow-400/40 font-bold';
  }
  if (s === 'cancelled') {
    return 'bg-stone-100 text-stone-600 border-stone-200 font-medium';
  }
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold';
};
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798

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
<<<<<<< HEAD
        <Loader className="h-6 w-6 animate-spin text-slate-400" />
=======
        <Loader className="h-6 w-6 animate-spin text-yellow-600" />
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
<<<<<<< HEAD
      {/* Minimal KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="h-4 w-4 text-[#1a1a1a]" />
=======
      {/* Minimal KPIs Grid with Warm Yellow Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <DollarSign className="h-3.5 w-3.5 text-yellow-700" />
            </div>
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">
            PHP {stats.totalRevenue.toLocaleString()}
          </p>
<<<<<<< HEAD
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
=======
          <span className="text-[10px] text-yellow-700 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-yellow-600" /> System Live Gross
          </span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bookings</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <ReceiptText className="h-3.5 w-3.5 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.totalBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">All recorded entries</span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.confirmedBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Verified & completed</span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Review</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <Clock3 className="h-3.5 w-3.5 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.pendingBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting confirmation</span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cancelled</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <XCircle className="h-3.5 w-3.5 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.cancelledBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Inactive bookings</span>
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
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
<<<<<<< HEAD
            <Link to="/admin/bookings" className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
=======
            <Link to="/admin/bookings" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors">
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
              View Bookings <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

<<<<<<< HEAD
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
=======
          <div className="h-72 w-full text-xs pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="yellowSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.4} />
                    <stop offset="65%" stopColor="#facc15" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#fde047" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#a0988a" 
                  tick={{ fill: '#78716c', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e0d8' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#a0988a" 
                  tick={{ fill: '#78716c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e0dbd0', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#ca8a04', fontWeight: 'bold' }}
                  formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#ca8a04" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#yellowSalesGradient)" 
                  activeDot={{ r: 5, fill: '#eab308', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Booked Services Donut Chart */}
        <div className="bg-white border border-[#e0dbd0] p-6 rounded-md space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-base">Top Booked Services</h3>
              <p className="text-xs text-slate-400 mt-0.5">Most booked packages & rentals</p>
            </div>
            <Link to="/admin/tour-packages" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors">
              Packages <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-between pt-2">
            {packageBreakdown.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs italic">
                No booking records found.
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e0dbd0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                          fontSize: '11px',
                          padding: '6px 10px',
                          color: '#1a1a1a',
                        }}
                        itemStyle={{ color: '#ca8a04', fontWeight: 'bold' }}
                        formatter={(value) => [`${value} bookings`, 'Bookings']}
                      />
                      <Pie 
                        data={packageBreakdown} 
                        dataKey="bookings" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={46} 
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {packageBreakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={YELLOW_CHART_COLORS[index % YELLOW_CHART_COLORS.length]} 
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Minimalist Yellow Breakdown List */}
                <div className="space-y-1.5 pt-3 border-t border-[#eae5db]">
                  {packageBreakdown.slice(0, 4).map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: YELLOW_CHART_COLORS[idx % YELLOW_CHART_COLORS.length] }}
                        />
                        <span className="truncate text-[#4a453b] font-medium text-[11px]">{item.name}</span>
                      </div>
                      <span className="font-bold text-[#1a1a1a] text-[11px] shrink-0">{item.bookings}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Recent Bookings Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1a1a1a] text-base">Recent Bookings</h3>
          <Link to="/admin/bookings" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors">
            Manage all bookings <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eae5db] bg-[#faf9f6] text-[10px] uppercase tracking-[0.15em] text-[#6b6255] font-bold">
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Tour / Package</th>
                  <th className="px-5 py-3.5 text-right">Price</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">No recent bookings recorded.</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#faf9f6]/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-yellow-700">{b.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#1a1a1a]">{b.customerName}</td>
                      <td className="px-5 py-3.5 font-medium text-[#4a453b]">{b.packageName}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">PHP {Number(b.totalPrice || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${statusPillClass(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
      </div>
    </div>
  );
};

export default Dashboard;



