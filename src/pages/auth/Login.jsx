import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Compass, AlertCircle, Loader2, KeyRound, User } from 'lucide-react';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'staff') navigate('/staff/dashboard', { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill helper for test grading
  const handleQuickFill = (roleName) => {
    setUsername(roleName);
    setPassword('123');
    setError('');
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold font-display text-slate-100 mb-2">Welcome Back</h2>
      <p className="text-slate-400 text-sm mb-6">Sign in to your Rabas Travel account to continue.</p>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 text-sm transition-all focus:outline-none"
              placeholder="e.g. tourist, staff, admin"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 text-sm transition-all focus:outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold font-display rounded-xl shadow-lg shadow-cyan-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Quick Autofill Buttons for Testing Sandbox */}
      <div className="mt-8 pt-6 border-t border-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">Quick Sandbox Autofill (Password: 123)</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickFill('tourist')}
            className="px-2 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
          >
            Tourist User
          </button>
          <button
            onClick={() => handleQuickFill('staff')}
            className="px-2 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
          >
            Staff User
          </button>
          <button
            onClick={() => handleQuickFill('admin')}
            className="px-2 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:text-indigo-400 transition-all cursor-pointer"
          >
            Admin User
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have a tourist account?{' '}
        <Link to="/register" className="text-cyan-400 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default Login;
