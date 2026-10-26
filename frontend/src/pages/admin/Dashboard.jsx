import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { 
  ArrowUpRight, DollarSign, Loader, ReceiptText, Clock3,
  CheckCircle2, Star, MessageSquare, Trash2, Car, Compass 
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

const statusPillClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed' || s === 'completed') {
    return 'bg-yellow-400/20 text-yellow-800 border-yellow-400/40 font-bold';
  }
  if (s === 'cancelled') {
    return 'bg-stone-100 text-stone-600 border-stone-200 font-medium';
  }
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold';
};

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Pending Verification' || status === 'Pending') return 'Pending';
  return status;
};

const SERVICE_PALETTE = {
  'Tour Packages': '#603524',
  'Car Rental': '#d97706',
  'Custom Packages': '#8b6f61',
};

const STATUS_PALETTE = {
  'Booked': '#603524',
  'Confirmed': '#603524',
  'Completed': '#15803d',
  'Pending': '#f59e0b',
  'Cancelled': '#94a3b8',
  'Rescheduled': '#8b6f61',
};

const MONTH_PALETTE = [
  '#603524', '#d97706', '#8b6f61', '#b6a59a', '#c2410c', '#ca8a04',
  '#4d7c0f', '#0f766e', '#0369a1', '#4338ca', '#7e22ce', '#be185d'
];

const CircleTooltip = ({ active, payload, isCurrency = false, total = 0 }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const val = Number(item.value) || 0;
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-[#e0dbd0] shadow-lg rounded-lg p-3 text-xs z-50">
        <div className="flex items-center gap-2 font-semibold text-[#1a1a1a]">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.payload?.color || item.color || '#603524' }}
          />
          <span>{item.name}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4 text-stone-600">
          <span className="font-bold text-[#603524]">
            {isCurrency ? `PHP ${val.toLocaleString()}` : `${val} ${val === 1 ? 'booking' : 'bookings'}`}
          </span>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70">
            {pct}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [serviceRevenue, setServiceRevenue] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [statusBookings, setStatusBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [revenueViewMode, setRevenueViewMode] = useState('service');
  const [bookingViewMode, setBookingViewMode] = useState('status');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('All');
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    tourReviewsCount: 0,
    carReviewsCount: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [allBookings, allReviews] = await Promise.all([
        bookingService.getAll(),
        api('/reviews').catch(() => [])
      ]);

      setBookings(allBookings.slice(0, 5));

      const totalBookings = allBookings.length;
      const confirmedBookings = allBookings.filter((b) => ['confirmed', 'completed'].includes(String(b.status || '').toLowerCase())).length;
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
      const serviceRevMap = { 'Tour Packages': 0, 'Car Rental': 0, 'Custom Packages': 0 };
      const serviceBookMap = { 'Tour Packages': 0, 'Car Rental': 0, 'Custom Packages': 0 };
      const statusBookMap = {};

      allBookings.forEach((b) => {
        const price = Number(b.totalPrice) || 0;

        // Month grouping
        const dateVal = b.createdAt || b.tourDate;
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            const monthName = d.toLocaleString('en-US', { month: 'short' });
            if (!monthlyMap[monthName]) {
              monthlyMap[monthName] = { month: monthName, sales: 0, bookings: 0 };
            }
            monthlyMap[monthName].sales += price;
            monthlyMap[monthName].bookings += 1;
          }
        }

        // Service Category
        let sKey = 'Tour Packages';
        if (b.type === 'Car Rental') {
          sKey = 'Car Rental';
        } else if (b.type === 'Customization' || b.package_type === 'custom' || b.package_type === 'customization') {
          sKey = 'Custom Packages';
        }
        if (serviceRevMap[sKey] === undefined) {
          serviceRevMap[sKey] = 0;
          serviceBookMap[sKey] = 0;
        }
        serviceRevMap[sKey] += price;
        serviceBookMap[sKey] += 1;

        // Status grouping
        const sLabel = statusLabel(b.status || 'Pending');
        statusBookMap[sLabel] = (statusBookMap[sLabel] || 0) + 1;
      });

      const sortedMonthly = Object.values(monthlyMap).sort(
        (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      );
      setSalesTrend(sortedMonthly.length > 0 ? sortedMonthly : [{ month: 'Current', sales: totalRevenue, bookings: totalBookings }]);

      const sRevList = Object.entries(serviceRevMap)
        .map(([name, val]) => ({ name, value: val, color: SERVICE_PALETTE[name] || '#8b6f61' }))
        .filter((item) => item.value > 0);

      const sBookList = Object.entries(serviceBookMap)
        .map(([name, val]) => ({ name, value: val, color: SERVICE_PALETTE[name] || '#8b6f61' }))
        .filter((item) => item.value > 0);

      const stList = Object.entries(statusBookMap)
        .map(([name, val]) => ({ name, value: val, color: STATUS_PALETTE[name] || '#8b6f61' }))
        .filter((item) => item.value > 0);

      const mRevList = sortedMonthly.map((item, idx) => ({
        name: item.month,
        value: item.sales,
        count: item.bookings,
        color: MONTH_PALETTE[idx % MONTH_PALETTE.length]
      }));

      setServiceRevenue(sRevList);
      setServiceBookings(sBookList);
      setStatusBookings(stList);
      setMonthlyRevenue(mRevList);

      // Customer Reviews Stats
      processReviews(allReviews);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processReviews = (revList) => {
    const validReviews = Array.isArray(revList) ? revList : [];
    setReviews(validReviews);

    const totalReviews = validReviews.length;
    const avg = totalReviews > 0
      ? validReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let tourCount = 0;
    let carCount = 0;

    validReviews.forEach((r) => {
      const rate = Math.min(Math.max(Math.round(r.rating || 5), 1), 5);
      distribution[rate] = (distribution[rate] || 0) + 1;
      if (r.service_type === 'Car Rental') carCount++;
      else tourCount++;
    });

    setReviewStats({
      totalReviews,
      averageRating: Number(avg.toFixed(1)),
      tourReviewsCount: tourCount,
      carReviewsCount: carCount,
      ratingDistribution: distribution,
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteReview = async (reviewId) => {
    if (!(await confirm('Are you sure you want to delete this review?'))) return;
    setDeletingReviewId(reviewId);
    try {
      await api(`/reviews/${reviewId}`, { method: 'DELETE' });
      showNotification('Review deleted successfully', 'success');
      const updated = reviews.filter((r) => r.review_id !== reviewId);
      processReviews(updated);
    } catch (err) {
      showNotification(err.message || 'Failed to delete review', 'error');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'Tour Package') return r.service_type !== 'Car Rental';
    if (reviewFilter === 'Car Rental') return r.service_type === 'Car Rental';
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-yellow-600" />
      </div>
    );
  }

  return (
    <div className="dashboard-theme space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Minimal KPIs Grid with Warm Yellow Accents */}
      <div className="dashboard-kpis grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-[#d9c1ad] p-5 rounded-md transition-colors hover:border-[#8b5e48] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-slate-500 font-semibold uppercase tracking-[0.12em]">Total Sales</span>
            <div className="p-1.5 rounded-md bg-[#f6e9df] border border-[#d9c1ad]">
              <DollarSign className="h-3.5 w-3.5 text-[#8b5e48]" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">
            PHP {stats.totalRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-[#8b5e48] font-semibold block mt-1">System Live Gross</span>
        </div>

        {/* Total Bookings */}
        <div className="bg-white border border-[#cbd8e0] p-5 rounded-md transition-colors hover:border-[#607d91] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-slate-500 font-semibold uppercase tracking-[0.12em]">Total Bookings</span>
            <div className="p-1.5 rounded-md bg-[#e6eef2] border border-[#cbd8e0]">
              <ReceiptText className="h-3.5 w-3.5 text-[#385467]" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.totalBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">All recorded entries</span>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-white border border-[#c7d8c7] p-5 rounded-md transition-colors hover:border-[#6f8f72] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-slate-500 font-semibold uppercase tracking-[0.12em]">Confirmed</span>
            <div className="p-1.5 rounded-md bg-[#e3eee6] border border-[#c7d8c7]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#426348]" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.confirmedBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Verified & completed</span>
        </div>

        {/* Pending Verification */}
        <div className="bg-white border border-[#ead7b4] p-5 rounded-md transition-colors hover:border-[#d97706] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-slate-500 font-semibold uppercase tracking-[0.12em]">Pending</span>
            <div className="p-1.5 rounded-md bg-[#fff3d6] border border-[#f3d391]">
              <Clock3 className="h-3.5 w-3.5 text-[#b45309]" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{stats.pendingBookings}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting confirmation</span>
        </div>

        {false && (
        <div>
        {/* Customer Reviews KPI */}
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Rating</span>
            <div className="p-1.5 rounded-md bg-amber-50 border border-amber-200">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2 flex items-baseline gap-1">
            {reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '—'}
            <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </p>
          <span className="text-[10px] text-amber-700 font-semibold block mt-1">
            {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'Review' : 'Reviews'} recorded
          </span>
        </div>
        </div>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Revenue Circle / Donut Chart */}
        <div className="bg-white border border-[#e0dbd0] p-6 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[#1a1a1a] text-lg">Monthly Revenue Analytics</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {revenueViewMode === 'service' ? 'Live sales share across services' : 'Monthly gross sales distribution'}
                </p>
              </div>
              <Link to="/admin/bookings" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors shrink-0">
                Bookings <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Toggle buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-[#f5f2eb] rounded-md border border-[#e0dbd0]/60 text-xs w-fit">
              <button
                type="button"
                onClick={() => setRevenueViewMode('service')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  revenueViewMode === 'service'
                    ? 'bg-white text-[#603524] shadow-sm font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Service
              </button>
              <button
                type="button"
                onClick={() => setRevenueViewMode('month')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  revenueViewMode === 'month'
                    ? 'bg-white text-[#603524] shadow-sm font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Month
              </button>
            </div>
          </div>

          {/* Donut Chart */}
          {(() => {
            const activeRevData = revenueViewMode === 'service' ? serviceRevenue : monthlyRevenue;
            const hasData = activeRevData && activeRevData.length > 0 && stats.totalRevenue > 0;
            const chartData = hasData ? activeRevData : [{ name: 'No Data', value: 1, color: '#e5e0d8' }];

            return (
              <>
                <div className="relative h-48 w-full my-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={86}
                        paddingAngle={hasData && chartData.length > 1 ? 3 : 0}
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`rev-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {hasData && (
                        <Tooltip content={<CircleTooltip isCurrency={true} total={stats.totalRevenue} />} />
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Revenue</span>
                    <span className="text-2xl font-bold font-display text-[#1a1a1a] leading-tight">
                      ₱{stats.totalRevenue >= 1000000 ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` : stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(0)}k` : stats.totalRevenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      {hasData ? `${activeRevData.length} ${revenueViewMode === 'service' ? 'categories' : 'months'}` : 'Live Gross'}
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-1.5 pt-3 border-t border-[#f0ece4]">
                  {!hasData ? (
                    <p className="text-center text-xs text-slate-400 italic py-1">No sales recorded yet</p>
                  ) : (
                    activeRevData.map((item) => {
                      const pct = stats.totalRevenue > 0 ? ((item.value / stats.totalRevenue) * 100).toFixed(1) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-[#3e3830] font-medium truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-[#1a1a1a]">PHP {Number(item.value).toLocaleString()}</span>
                            <span className="text-[10px] font-semibold text-stone-600 bg-[#f5f2eb] px-1.5 py-0.5 rounded border border-[#e0dbd0]/50">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Booking Volume Circle / Donut Chart */}
        <div className="bg-white border border-[#e0dbd0] p-6 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[#1a1a1a] text-lg">Booking Volume Analytics</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {bookingViewMode === 'status' ? 'Reservations breakdown by status' : 'Reservations across service types'}
                </p>
              </div>
              <Link to="/admin/bookings" className="text-xs font-semibold text-[#8b6f61] hover:text-[#603524] flex items-center gap-1 transition-colors shrink-0">
                Details <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Toggle buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-[#f5f2eb] rounded-md border border-[#e0dbd0]/60 text-xs w-fit">
              <button
                type="button"
                onClick={() => setBookingViewMode('status')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  bookingViewMode === 'status'
                    ? 'bg-white text-[#603524] shadow-sm font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Status
              </button>
              <button
                type="button"
                onClick={() => setBookingViewMode('service')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  bookingViewMode === 'service'
                    ? 'bg-white text-[#603524] shadow-sm font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                By Service
              </button>
            </div>
          </div>

          {/* Donut Chart */}
          {(() => {
            const activeBookData = bookingViewMode === 'status' ? statusBookings : serviceBookings;
            const hasData = activeBookData && activeBookData.length > 0 && stats.totalBookings > 0;
            const chartData = hasData ? activeBookData : [{ name: 'No Data', value: 1, color: '#e5e0d8' }];

            return (
              <>
                <div className="relative h-48 w-full my-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={86}
                        paddingAngle={hasData && chartData.length > 1 ? 3 : 0}
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`book-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {hasData && (
                        <Tooltip content={<CircleTooltip isCurrency={false} total={stats.totalBookings} />} />
                      )}
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Bookings</span>
                    <span className="text-2xl font-bold font-display text-[#1a1a1a] leading-tight">
                      {stats.totalBookings}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      All Records
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-1.5 pt-3 border-t border-[#f0ece4]">
                  {!hasData ? (
                    <p className="text-center text-xs text-slate-400 italic py-1">No bookings recorded yet</p>
                  ) : (
                    activeBookData.map((item) => {
                      const pct = stats.totalBookings > 0 ? ((item.value / stats.totalBookings) * 100).toFixed(1) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-[#3e3830] font-medium truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-[#1a1a1a]">{item.value} {item.value === 1 ? 'booking' : 'bookings'}</span>
                            <span className="text-[10px] font-semibold text-stone-600 bg-[#f5f2eb] px-1.5 py-0.5 rounded border border-[#e0dbd0]/50">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Customer Reviews Summary */}
        <div className="bg-white border border-[#e0dbd0] p-6 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[#1a1a1a] text-base">Customer Reviews</h3>
                <p className="text-xs text-slate-400 mt-0.5">Summary of customer feedback</p>
              </div>
              <Link to="/admin/reviews" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors shrink-0">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Score Showcase Banner */}
            <div className="bg-gradient-to-br from-[#fffdfa] to-[#faf5ed] border border-[#ebdcc9] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center bg-white border border-[#ebdcc9] shadow-sm rounded-lg px-3 py-1.5 shrink-0">
                  <span className="text-2xl font-black font-display text-[#1a1a1a] leading-none">
                    {reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-2 w-2"
                        style={{
                          fill: star <= Math.round(reviewStats.averageRating) ? '#f59e0b' : '#e0dbd0',
                          color: star <= Math.round(reviewStats.averageRating) ? '#f59e0b' : '#d6cfc2'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1a1a1a]">
                      {reviewStats.averageRating >= 4.5 ? 'Exceptional' : reviewStats.averageRating >= 4.0 ? 'Very Good' : reviewStats.averageRating > 0 ? 'Good' : 'No ratings yet'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100/80 text-amber-900 border border-amber-300/60">
                      ★ 5.0 scale
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6b6255] mt-0.5">
                    Based on <strong className="text-[#1a1a1a]">{reviewStats.totalReviews}</strong> {reviewStats.totalReviews === 1 ? 'verified review' : 'verified reviews'}
                  </p>
                </div>
              </div>
            </div>

            {/* Star Distribution Rows */}
            <div className="space-y-1.5 pt-0.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewStats.ratingDistribution[stars] || 0;
                const percent = reviewStats.totalReviews > 0 ? Math.round((count / reviewStats.totalReviews) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs py-0.5">
                    <div className="flex items-center gap-1 w-6 shrink-0 text-[#6b6255] font-semibold text-[11px]">
                      <span>{stars}</span>
                      <Star className="h-2.5 w-2.5 shrink-0" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    </div>
                    <div className="h-2 flex-1 rounded-full bg-[#f0ece4] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: '#f59e0b',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 justify-end w-12">
                      <span className="text-xs font-bold text-[#1a1a1a]">{count}</span>
                      <span className="text-[10px] font-medium text-stone-400 w-7 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Highlight / Recent Feedback or Service Summary */}
          <div className="pt-2 border-t border-[#f0ece4] mt-1">
            {reviews.length > 0 && reviews[0].comment ? (
              <div className="bg-[#faf8f4] border border-[#ebdcc9]/70 rounded-lg p-2.5 flex items-start gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#3e3830] italic line-clamp-2 leading-relaxed">
                    "{reviews[0].comment}"
                  </p>
                  <p className="text-[10px] text-[#8a8275] font-medium mt-1 truncate">
                    — {reviews[0].customer_name || 'Customer'} · {reviews[0].service_type}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-[#6b6255]">
                <span>Tours: <strong className="text-[#1a1a1a]">{reviewStats.tourReviewsCount}</strong></span>
                <span>•</span>
                <span>Rentals: <strong className="text-[#1a1a1a]">{reviewStats.carReviewsCount}</strong></span>
                <span>•</span>
                <Link to="/admin/reviews" className="text-yellow-700 font-semibold hover:underline">
                  Manage Reviews
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Customer Reviews & Feedback Section */}
      <div id="customer-reviews" className="bg-white border border-[#e0dbd0] p-6 rounded-md space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae5db]">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-md border"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)'
                }}
              >
                <Star className="h-4 w-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
              </div>
              <h3 className="font-semibold text-[#1a1a1a] text-base">Customer Reviews & Ratings</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Live customer feedback from tour package trips and car rentals</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#faf9f6] p-1 rounded-lg border border-[#eae5db] self-start sm:self-auto">
            {['All', 'Tour Package', 'Car Rental'].map((f) => (
              <button
                key={f}
                onClick={() => setReviewFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  reviewFilter === f
                    ? 'bg-yellow-400 text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                {f === 'All' ? `All (${reviewStats.totalReviews})` : f === 'Tour Package' ? `Tours (${reviewStats.tourReviewsCount})` : `Car Rentals (${reviewStats.carReviewsCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Overview Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#faf9f6] p-5 rounded-lg border border-[#eae5db]">
          {/* Average Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#eae5db] pb-4 md:pb-0 pr-0 md:pr-6">
            <span className="text-4xl font-extrabold text-[#1a1a1a]">
              {reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
            </span>
            <div className="flex gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-4 w-4"
                  style={{
                    fill: star <= Math.round(reviewStats.averageRating) ? '#f59e0b' : '#e0dbd0',
                    color: star <= Math.round(reviewStats.averageRating) ? '#f59e0b' : '#d6cfc2'
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Based on {reviewStats.totalReviews} total customer reviews
            </span>
          </div>

          {/* Star Distribution Bars */}
          <div className="md:col-span-8 space-y-1.5 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewStats.ratingDistribution[stars] || 0;
              const percent = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-[#6b6255] font-semibold flex items-center gap-1">
                    {stars} <Star className="h-3 w-3 inline" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  </span>
                  <div className="flex-1 h-2 bg-[#eae5db] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: '#f59e0b' }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews Cards List */}
        <div className="space-y-3">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#e0dbd0] rounded-lg bg-white">
              <MessageSquare className="h-8 w-8 mx-auto text-[#c4b99a] mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#1a1a1a]">No reviews found in this category.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Reviews submitted by customers will reflect here automatically.</p>
            </div>
          ) : (
            filteredReviews.map((r) => {
              const isRental = r.service_type === 'Car Rental';
              return (
                <div
                  key={r.review_id}
                  className="p-4 rounded-lg border border-[#eae5db] bg-white hover:border-yellow-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Service Category Badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isRental
                          ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                          : 'bg-yellow-100 text-yellow-900 border border-yellow-300/60'
                      }`}>
                        {isRental ? <Car className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
                        {r.service_type}
                      </span>

                      {/* Service Name */}
                      <span className="text-xs font-semibold text-[#1a1a1a] truncate max-w-[280px]">
                        {r.service_name || (isRental ? r.vehicle_name : r.package_name) || 'Service'}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        #{isRental ? `CR-${r.rental_booking_id || r.review_id}` : `BK-${r.booking_id || r.review_id}`}
                      </span>
                    </div>

                    {/* Customer Comment */}
                    {r.comment ? (
                      <p className="text-xs text-[#4a453b] italic leading-relaxed pt-1">
                        "{r.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic pt-1">No written comment provided.</p>
                    )}

                    {/* Customer Meta */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">
                        {r.customer_name || 'Anonymous Customer'}
                      </span>
                      {r.customer_email && (
                        <span className="text-slate-400">({r.customer_email})</span>
                      )}
                      <span>•</span>
                      <span>
                        {r.created_at && new Date(r.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-[#faf9f6] px-2.5 py-1 rounded-md border border-[#eae5db]">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-3 w-3"
                            style={{
                              fill: star <= (r.rating || 0) ? '#f59e0b' : '#e0dbd0',
                              color: star <= (r.rating || 0) ? '#f59e0b' : '#d6cfc2'
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#1a1a1a] ml-1">{r.rating}/5</span>
                    </div>

                    <button
                      onClick={() => handleDeleteReview(r.review_id)}
                      disabled={deletingReviewId === r.review_id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Delete review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
      </div>
    </div>
  );
};

export default Dashboard;
