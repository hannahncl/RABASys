import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    const from = location.state?.from?.pathname || '/';
    const normalizedRole = normalizeFrontendRole(user?.role);
    if (normalizedRole === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (normalizedRole === 'staff') navigate('/staff/dashboard', { replace: true });
    else navigate(from, { replace: true });
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Unable to sign in right now.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-slate-700">
      <h2 className="mb-2 text-3xl font-bold uppercase tracking-wide text-black">Welcome Back!</h2>
      <p className="mb-8 text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-yellow-600 transition-colors hover:text-yellow-750 hover:underline">
          Sign up
        </Link>
      </p>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-600">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            state={{ email: email.trim() }}
            className="text-sm font-semibold text-yellow-700 transition-colors hover:text-yellow-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Log In'}
        </button>
      </form>
    </div>
  );
};

export default Login;
