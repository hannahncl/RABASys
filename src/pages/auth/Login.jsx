import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { sanitizeInput, validateEmailOrPhone, validateRequired } from '../../utils/validation';

const Login = () => {
  const { login, verifyLoginOtp, user } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');

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

    const cleanedIdentifier = sanitizeInput(identifier);
    const cleanedPassword = sanitizeInput(password);

    const nextErrors = {
      identifier: validateEmailOrPhone(cleanedIdentifier),
      password: validateRequired(cleanedPassword, 'Password'),
    };
    setFieldErrors(nextErrors);

    if (nextErrors.identifier || nextErrors.password) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(cleanedIdentifier, cleanedPassword);
      if (!result.success) {
        setError(result.error || 'Unable to sign in right now.');
        return;
      }
      if (result.requiresTwoFactor) {
        setTwoFactorRequired(true);
        setTwoFactorEmail(result.email || cleanedIdentifier);
        setError(result.message || 'A verification code was sent to your email.');
        return;
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await verifyLoginOtp(twoFactorEmail, otp);
      if (!result.success) {
        setError(result.error || 'Unable to verify the code.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
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

      {twoFactorRequired ? (
        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Enter the 6-digit code sent to <span className="font-semibold">{twoFactorEmail}</span>.
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none"
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
          </button>
          <button
            type="button"
            onClick={() => { setTwoFactorRequired(false); setOtp(''); setError(''); }}
            className="w-full text-sm font-semibold text-yellow-700 transition-colors hover:text-yellow-800 hover:underline"
          >
            Back to login
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Email or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); if (fieldErrors.identifier) setFieldErrors(prev => ({ ...prev, identifier: '' })); }}
              className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none ${fieldErrors.identifier ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
              placeholder="Enter your email"
              autoComplete="username"
            />
            {fieldErrors.identifier && <p className="mt-2 text-sm text-rose-600">{fieldErrors.identifier}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none pr-12 ${fieldErrors.password ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-2 text-sm text-rose-600">{fieldErrors.password}</p>}
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              state={{ email: sanitizeInput(identifier) }}
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
      )}
      </div>
    </div>
  );
};

export default Login;
