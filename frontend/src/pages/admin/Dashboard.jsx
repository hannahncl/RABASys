import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { 
  ArrowUpRight, TrendingUp, DollarSign, Loader, ReceiptText, Clock3, 
  CheckCircle2, Star, MessageSquare, Trash2, Car, Compass 
} from 'lucide-react';
import {
  AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis
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
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <DollarSign className="h-3.5 w-3.5 text-yellow-700" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">
            PHP {stats.totalRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-yellow-700 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-yellow-600" /> System Live Gross
          </span>
        </div>

        {/* Total Bookings */}
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

        {/* Confirmed Bookings */}
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

        {/* Pending Verification */}
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-yellow-400 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
            <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
              <Clock3 className="h-3.5 w-3.5 text-yellow-700" />
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
        
        {/* Sales & Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e0dbd0] p-6 rounded-md space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-base">Monthly Revenue Analytics</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live sales trend from system bookings</p>
            </div>
            <Link to="/admin/bookings" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors">
              View Bookings <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-72 w-full text-xs pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="yellowSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#603524" stopOpacity={0.4} />
                    <stop offset="65%" stopColor="#8b6f61" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#b6a59a" stopOpacity={0.0} />
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
                  itemStyle={{ color: '#603524', fontWeight: 'bold' }}
                  formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#603524" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#yellowSalesGradient)" 
                  activeDot={{ r: 5, fill: '#603524', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Reviews Summary */}
        <div className="bg-white border border-[#e0dbd0] p-6 rounded-md space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-base">Customer Reviews</h3>
              <p className="text-xs text-slate-400 mt-0.5">Summary of customer feedback</p>
            </div>
            <Link to="/admin/reviews" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-5 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50">
                <span className="text-2xl font-extrabold text-[#1a1a1a]">
                  {reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-2.5 w-2.5 ${star <= Math.round(reviewStats.averageRating) ? 'fill-amber-400 text-amber-400' : 'fill-[#e0dbd0] text-[#d6cfc2]'}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Average customer rating</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewStats.ratingDistribution[stars] || 0;
                const percent = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-[10px]">
                    <span className="flex w-8 items-center gap-0.5 text-[#6b6255]">{stars}<Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /></span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eae5db]">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-4 text-right text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Customer Reviews & Feedback Section */}
      <div id="customer-reviews" className="bg-white border border-[#e0dbd0] p-6 rounded-md space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae5db]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-50 border border-amber-200">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
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
                  className={`h-4 w-4 ${
                    star <= Math.round(reviewStats.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-[#e0dbd0] text-[#d6cfc2]'
                  }`}
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
                    {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2 bg-[#eae5db] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
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
                            className={`h-3 w-3 ${
                              star <= (r.rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-[#e0dbd0] text-[#d6cfc2]'
                            }`}
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
