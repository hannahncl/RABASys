import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, User, Mail, UserCheck, KeyRound } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await register(name, email, username, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold font-display text-slate-100 mb-2">Create Tourist Profile</h2>
      <p className="text-slate-400 text-sm mb-6 font-medium">Join Rabas Travel to book local adventures.</p>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 text-sm transition-all focus:outline-none"
              placeholder="e.g. Juan Dela Cruz"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 text-sm transition-all focus:outline-none"
              placeholder="e.g. juan@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
          <div className="relative">
            <UserCheck className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 text-sm transition-all focus:outline-none"
              placeholder="Pick a unique username"
              required
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
              placeholder="Create a strong password"
              required
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
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-400 hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
};

export default Register;
