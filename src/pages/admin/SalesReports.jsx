import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Landmark, CalendarRange } from 'lucide-react';

const SalesReports = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      const data = await reportService.getSalesData();
      setSalesData(data);
      setLoading(false);
    };
    loadSales();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate totals
  const totalSales = salesData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalBookings = salesData.reduce((acc, curr) => acc + curr.bookings, 0);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-slate-100">Sales Reports</h1>
        <p className="text-slate-400 text-sm">Monthly overview of gross tour package sales and transaction growth indicators.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Cumulative Sales (YTD)</span>
            <span className="text-3xl font-extrabold text-slate-100 font-display">PHP {totalSales.toLocaleString()}</span>
          </div>
          <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center rounded-xl text-cyan-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold block">Cumulative Bookings (YTD)</span>
            <span className="text-3xl font-extrabold text-slate-100 font-display">{totalBookings} Tours</span>
          </div>
          <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center rounded-xl text-emerald-400">
            <CalendarRange className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recharts Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-850 space-y-4">
          <h3 className="font-bold text-slate-200 text-base font-display">Revenue Turnovers</h3>
          
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `₱${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [`PHP ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings Count Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border-slate-850 space-y-4">
          <h3 className="font-bold text-slate-200 text-base font-display">Monthly Packages Booked</h3>
          
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [value, 'Tours Booked']}
                />
                <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesReports;
