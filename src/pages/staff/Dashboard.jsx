import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { tripUploadService } from '../../services/tripUploadService';
import { api } from '../../services/api';
import { FileUp, ClipboardList, ShieldCheck, ArrowRight } from 'lucide-react';

const statusPillClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed') {
    return 'bg-yellow-400/20 text-yellow-800 border-yellow-400/40 font-bold';
  }
  if (s === 'completed') {
    return 'bg-yellow-50 border-yellow-300 text-yellow-800 font-bold';
  }
  if (s === 'cancelled') {
    return 'bg-stone-100 text-stone-600 border-stone-200 font-medium';
  }
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold';
};

const statusLabel = (status) => {
  if (status === 'Confirmed') return 'Booked';
  if (status === 'Completed') return 'Completed';
  if (status === 'Pending Verification') return 'Pending';
  return status || 'Confirmed';
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [guideProfile, setGuideProfile] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const allBookings = await bookingService.getAll();
      const upcoming = allBookings.filter(b => b.status === 'Confirmed');
      setPendingCount(upcoming.length);
      setCompletedCount(allBookings.filter(b => b.status === 'Completed').length);
      setRecentBookings(allBookings.slice(0, 3));

      const updates = await tripUploadService.getAll();
      setTotalUpdates(updates.length);
    };
    loadStats();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const fetchGuide = async () => {
      try {
        const data = await api(`/tour-guides/${user.id}`);
        if (isMounted && data) setGuideProfile(data);
      } catch (e) {
        // Fall back gracefully
      }
    };
    fetchGuide();
    return () => { isMounted = false; };
  }, [user?.id]);

  const profilePicture = guideProfile?.profilePicture || user?.profilePicture;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Tour Guide Welcome Banner */}
      <div className="bg-white p-5 rounded-md border border-[#e0dbd0] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center gap-5">
        <div className="relative shrink-0">
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt={user?.name || 'Tour Guide'} 
              className="h-16 w-16 rounded-xl object-cover border-2 border-yellow-400 shadow-xs" 
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-800 text-2xl font-bold font-display">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" title="Active Guide"></span>
        </div>
        <div className="text-center sm:text-left flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-semibold text-[#1a1a1a]">
            Welcome back, {user?.firstName || user?.name || 'Tour Guide'}!
          </h2>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-md border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Tours</span>
              <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
                <ClipboardList className="h-3.5 w-3.5 text-yellow-700" />
              </div>
            </div>
            <span className="text-2xl font-bold font-display text-[#1a1a1a] block mt-1">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 block">Scheduled itineraries</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-md border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Tours</span>
              <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
                <ShieldCheck className="h-3.5 w-3.5 text-yellow-700" />
              </div>
            </div>
            <span className="text-2xl font-bold font-display text-[#1a1a1a] block mt-1">{completedCount}</span>
            <span className="text-[10px] text-slate-400 block">Concluded trips</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-md border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Live Field Logs</span>
              <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
                <FileUp className="h-3.5 w-3.5 text-yellow-700" />
              </div>
            </div>
            <span className="text-2xl font-bold font-display text-[#1a1a1a] block mt-1">{totalUpdates}</span>
            <span className="text-[10px] text-slate-400 block">Published field updates</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-md border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">My Status</span>
              <div className="p-1.5 rounded-md bg-yellow-50 border border-yellow-200">
                <ShieldCheck className="h-3.5 w-3.5 text-yellow-700" />
              </div>
            </div>
            <span className={`text-2xl font-bold font-display block mt-1 ${guideProfile?.availability === 'Unavailable' ? 'text-amber-600' : 'text-emerald-600'}`}>
              {guideProfile?.availability || 'Active'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {guideProfile?.employmentStatus || 'Active'} status &bull; Ready for departure
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Actions & Recent entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick actions */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-stone-800 font-display text-base">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link 
              to="/staff/my-tours" 
              className="bg-white p-5 rounded-md flex items-center justify-between border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#1a1a1a] group-hover:text-yellow-700 transition-colors block">View My Tours</span>
                  <span className="text-[10px] text-[#6b6255]">Check details of assigned tours</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-yellow-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              to="/staff/calendar" 
              className="bg-white p-5 rounded-md flex items-center justify-between border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-center justify-center">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#1a1a1a] group-hover:text-yellow-700 transition-colors block">Tour Calendar</span>
                  <span className="text-[10px] text-[#6b6255]">Check scheduled departures</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-yellow-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Bookings list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-stone-800 font-display text-base">Recent Tours</h3>
          
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-md border border-[#e0dbd0] hover:border-yellow-400 transition-colors shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1a1a1a]">{b.customerName}</span>
                    <span className="font-mono text-yellow-700 font-bold text-[10px]">{b.id}</span>
                  </div>
                  <p className="text-[#6b6255]">{b.packageName}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-[#1a1a1a] block">PHP {Number(b.totalPrice || 0).toLocaleString()}</span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border inline-block ${statusPillClass(b.status)}`}>
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
