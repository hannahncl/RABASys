import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { emailService } from '../services/emailService';
import { useNotification } from '../../hooks/useNotification';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Receipt, Plus, ShieldAlert, FileText } from 'lucide-react';

const ExpenseReports = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // Form states
  const [category, setCategory] = useState('Accommodation Partner Pay');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    const data = await reportService.getExpenseData();
    setExpenseData(data);
    const sum = data.reduce((acc, curr) => acc + curr.value, 0);
    setTotalExpenses(sum);
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      showNotification('Please fill in amount and description.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate adding expense item
      const numAmount = Number(amount);
      
      // Update local sum & state (simulate adding to array)
      const colorMapping = {
        'Accommodation Partner Pay': '#06b6d4',
        'Transportation & Flights': '#f97316',
        'Local Tour Guides & Permits': '#10b981',
        'Marketing & Ad Campaigns': '#a855f7',
        'Staff Salaries': '#f43f5e'
      };

      setExpenseData((prev) => {
        const index = prev.findIndex(item => item.category === category);
        const updated = [...prev];
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            value: updated[index].value + numAmount
          };
        } else {
          updated.push({
            category,
            value: numAmount,
            color: colorMapping[category] || '#64748b'
          });
        }
        return updated;
      });

      setTotalExpenses((prev) => prev + numAmount);

      // Trigger Email Notification simulation
      await emailService.sendExpenseReportNotification({
        category,
        amount: numAmount,
        loggedBy: 'Rabas Coordinator',
        description
      });

      showNotification(`Expense logged successfully! Email notification dispatched to Admin inbox.`, 'success');
      
      // Clear form
      setAmount('');
      setDescription('');
    } catch (err) {
      showNotification('Failed to log expense.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-slate-100">Expense Reports</h1>
        <p className="text-slate-400 text-sm">Monitor operations expenditures, log payouts, and verify budgets allocations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Charts & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats card */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">Total Expenses (YTD)</span>
              <span className="text-3xl font-extrabold text-slate-100 font-display">PHP {totalExpenses.toLocaleString()}</span>
            </div>
            <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center rounded-xl text-rose-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>

          {/* Pie Chart Card */}
          <div className="glass-panel p-6 rounded-2xl border-slate-850 space-y-6">
            <h3 className="font-bold text-slate-200 text-base font-display">Logistics Expenditures Breakdowns</h3>
            
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    formatter={(value) => `PHP ${value.toLocaleString()}`}
                  />
                  <Legend 
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value, entry) => (
                      <span className="text-slate-400 font-medium ml-1.5">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side: Log Expense Form */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Plus className="h-4.5 w-4.5 text-rose-400" />
            <h3 className="font-bold text-slate-200 font-display">Log Operations Cost</h3>
          </div>

          <form onSubmit={handleLogExpense} className="space-y-4">
            
            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-sans">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20 rounded-xl py-3 px-4 text-slate-100 text-xs focus:outline-none"
              >
                <option value="Accommodation Partner Pay">Accommodation Partner Pay</option>
                <option value="Transportation & Flights">Transportation & Flights</option>
                <option value="Local Tour Guides & Permits">Local Tour Guides & Permits</option>
                <option value="Marketing & Ad Campaigns">Marketing & Ad Campaigns</option>
                <option value="Staff Salaries">Staff Salaries</option>
              </select>
            </div>

            {/* Expense Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Amount (PHP)</label>
              <input
                type="number"
                required
                min="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20 rounded-xl py-3 px-4 text-slate-100 text-xs focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Paid Boracay Hotel Partners for Booking Ref RBT-3210..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/20 rounded-xl py-3 px-4 text-slate-100 text-xs focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold font-display rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/10 active:scale-[0.98] transition-all text-xs"
            >
              {submitting ? 'Registering...' : 'Register Budget Expense'}
            </button>
          </form>

          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex gap-2.5 text-[10px] text-slate-400">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
            <p>Logging any expenditure automatically triggers an email report notification detailing category, amount and staff log details to the administrator inbox.</p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ExpenseReports;
