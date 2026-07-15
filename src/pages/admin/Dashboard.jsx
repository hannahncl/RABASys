import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';
import { DollarSign, Receipt, Users, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

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
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">Overall financial summary, sales charts, and logistics statuses.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Sales</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">PHP {kpis.totalSales.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-emerald-400 block">{kpis.salesGrowth} from last month</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Expenses</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">PHP {kpis.totalExpenses.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-slate-500 block">Includes logistics and payroll</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Revenue</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">PHP {kpis.netProfit.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-emerald-400 block">+21.2% margins</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Bookings</span>
            <span className="text-2xl font-extrabold text-slate-100 font-display">{kpis.activeBookings}</span>
            <span className="text-[10px] font-bold text-cyan-400 block">{kpis.conversionRate} Conversion Rate</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns: Recent Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 font-display text-lg">Transaction Audits</h3>
            <Link to="/admin/sales" className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1">
              View sales details
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
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                          b.status === 'Confirmed' ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400' : 'bg-amber-950/40 border-amber-900/40 text-amber-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Quick Navigation links */}
        <div className="space-y-6">
          <h3 className="font-bold text-slate-200 font-display text-lg">Financial Operations</h3>
          
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
            <Link 
              to="/admin/sales" 
              className="block p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-cyan-500/20 text-slate-300 hover:text-white transition-all"
            >
              <h4 className="font-bold text-sm font-display text-cyan-400">Sales Reports</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Visualize monthly bookings turnover and overall gross income.</p>
            </Link>
            
            <Link 
              to="/admin/expenses" 
              className="block p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-rose-500/20 text-slate-300 hover:text-white transition-all"
            >
              <h4 className="font-bold text-sm font-display text-rose-400">Expense Reports</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Log vendor accommodations costs, flights and track payouts margins.</p>
            </Link>

            <Link 
              to="/admin/destinations" 
              className="block p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-purple-500/20 text-slate-300 hover:text-white transition-all"
            >
              <h4 className="font-bold text-sm font-display text-purple-400">Destination Analytics</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Compare most-visited tour routes and custom recommendations KPIs.</p>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
