import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import { bookingService } from '../services/bookingService';
import { tripUploadService } from '../services/tripUploadService';
import { CalendarCheck, FileUp, ClipboardList, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
=======
import { bookingService } from '../../services/bookingService';
import { tripUploadService } from '../../services/tripUploadService';
import { FileUp, ClipboardList, ShieldCheck, ArrowRight } from 'lucide-react';

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
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6

const Dashboard = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const allBookings = await bookingService.getAll();
      const upcoming = allBookings.filter(b => b.status === 'Confirmed');
      setPendingCount(upcoming.length);
      setRecentBookings(allBookings.slice(0, 3));

      const updates = await tripUploadService.getAll();
      setTotalUpdates(updates.length);
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Assigned Tours</span>
            <span className="text-3xl font-extrabold font-display text-slate-100">{pendingCount}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Live Field Logs Published</span>
            <span className="text-3xl font-extrabold font-display text-slate-100">{totalUpdates}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="space-y-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">My Status</span>
            <span className="text-3xl font-extrabold font-display text-slate-100">Active</span>
          </div>
        </div>
      </div>

      {/* Grid: Actions & Recent entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick actions */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-bold text-slate-200 font-display text-lg">Quick Actions</h3>
          
          <div className="space-y-4">
            <Link 
              to="/staff/bookings" 
              className="glass-card p-5 rounded-2xl flex items-center justify-between border-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors block">View My Tours</span>
                  <span className="text-[10px] text-slate-500">Check details of assigned tours</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              to="/staff/uploads" 
              className="glass-card p-5 rounded-2xl flex items-center justify-between border-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors block">Publish Logs</span>
                  <span className="text-[10px] text-slate-500">Post photos from active trips</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Bookings list */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-200 font-display text-lg">Recent Tours</h3>
          
          <div className="space-y-4">
            {recentBookings.map((b) => (
              <div key={b.id} className="glass-panel p-4 rounded-xl border-slate-900 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">{b.customerName}</span>
                    <span className="font-mono text-slate-500 text-[10px]">{b.id}</span>
                  </div>
                  <p className="text-slate-400">{b.packageName}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-slate-200 block">PHP {b.totalPrice.toLocaleString()}</span>
                  <span className={`text-[10px] uppercase font-extrabold px-3 py-1 rounded-full border inline-block ${statusPillClass(b.status)}`}>
                    {statusLabel(b.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
