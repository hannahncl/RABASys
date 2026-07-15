import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Compass, Star, MapPin, DollarSign } from 'lucide-react';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

const Analytics = () => {
  const [destData, setDestData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDestData = async () => {
      setLoading(true);
      const data = await reportService.getMostVisitedDestinations();
      setDestData(data);
      setLoading(false);
    };
    loadDestData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  // Prep data for revenue pie
  const pieData = destData.map(item => ({
    name: item.name.split(',')[0],
    value: item.revenue
  }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-slate-100">Destination Analytics</h1>
        <p className="text-slate-400 text-sm">Review most visited destinations, popularity scores and tour packages conversion rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bar chart - Booking counts */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-slate-850 space-y-6">
          <h3 className="font-bold text-slate-200 text-base font-display">Tours Bookings by Destination</h3>
          
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} tickFormatter={(val) => val.split(',')[0]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [value, 'Total Bookings']}
                />
                <Bar dataKey="bookings" radius={[0, 4, 4, 0]}>
                  {destData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border-slate-850 space-y-6">
          <h3 className="font-bold text-slate-200 text-base font-display">Revenue Allocation Share</h3>
          
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => `PHP ${value.toLocaleString()}`}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Spreadsheet grid */}
      <div className="glass-panel rounded-2xl overflow-hidden border-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400">
                <th className="p-4 font-bold uppercase">Destination</th>
                <th className="p-4 font-bold uppercase text-center">Total Bookings</th>
                <th className="p-4 font-bold uppercase text-right">Gross Revenues</th>
                <th className="p-4 font-bold uppercase text-center">Popularity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {destData.map((item, index) => (
                <tr key={item.name} className="hover:bg-slate-900/20">
                  <td className="p-4 flex items-center gap-2 font-semibold">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    {item.name}
                  </td>
                  <td className="p-4 text-center font-bold">{item.bookings}</td>
                  <td className="p-4 text-right font-bold text-slate-200">PHP {item.revenue.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
