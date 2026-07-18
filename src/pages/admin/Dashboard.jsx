import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';
import { DollarSign, Receipt, Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

const statusPillClass = (status) => (
  status === 'Confirmed'
    ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
    : 'bg-amber-100 border-amber-200 text-amber-700'
);

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Pending Verification') return 'Pending';
  return status;
};

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const kpiData = await reportService.getKPIs();
      setKpis(kpiData);

      const allBookings = await bookingService.getAll();
      setBookings(allBookings.slice(0, 4));
      setLoading(false);
    };
    loadDashboard();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Sales</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">PHP {kpis.totalSales.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Revenue</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">PHP {kpis.netProfit.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Bookings</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">{kpis.activeBookings}</span>
          </div>
        </div>
      </div>

      {/* Details layout */}
      <div className="space-y-6">

        {/* Recent Bookings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 font-display text-lg">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1">
              View all bookings
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Booking ID</th>
                    <th className="p-4 font-bold uppercase">Client</th>
                    <th className="p-4 font-bold uppercase">Tour Package</th>
                    <th className="p-4 font-bold uppercase text-right">Price</th>
                    <th className="p-4 font-bold uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-900/20">
                      <td className="p-4 font-mono font-bold text-slate-400">{b.id}</td>
                      <td className="p-4 font-medium">{b.customerName}</td>
                      <td className="p-4">{b.packageName}</td>
                      <td className="p-4 text-right font-bold text-slate-200">PHP {b.totalPrice.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusPillClass(b.status)}`}>
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
    </div>
  );
};

export default Dashboard;
