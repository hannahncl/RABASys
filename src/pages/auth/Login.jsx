import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { sanitizeInput, validateEmailOrPhone, validateRequired } from '../../utils/validation';

const Login = () => {
<<<<<<< HEAD
  const { login, verifyLoginOtp, user } = useContext(AuthContext);
=======
  const { login, verifyLoginOtp, googleLogin, user } = useContext(AuthContext);
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
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
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const from = location.state?.from?.pathname || '/';
    const normalizedRole = normalizeFrontendRole(user?.role);
    if (normalizedRole === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (normalizedRole === 'staff') navigate('/staff/dashboard', { replace: true });
    else navigate(from, { replace: true });
  }, [user, navigate, location]);

  // Initialize Google Sign-In button
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setLoading(true);
          setError('');
          const result = await googleLogin(response.credential);
          if (result.requiresTwoFactor) {
            setTwoFactorRequired(true);
            setTwoFactorEmail(result.email || '');
            setError(result.message || 'A verification code was sent to your email.');
            setLoading(false);
            return;
          }
          if (!result.success) {
            setError(result.error || 'Google sign-in failed.');
          }
          setLoading(false);
        },
      });

      const btnWidth = Math.min(Math.max(googleBtnRef.current?.offsetWidth || 360, 200), 400);
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: btnWidth,
      });
    };

    // GSI script may still be loading
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [twoFactorRequired]);

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
<<<<<<< HEAD
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
=======
    <div className="w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center mb-7">
        <img src="/RABAS LOGO.png" alt="RABAS Travel" className="h-12 w-auto mx-auto mb-3" />
        <h2 className="text-base font-bold uppercase tracking-[0.18em] text-[#1a1a1a]">RABAS Travel &amp; Tours</h2>
        <p className="text-xs font-medium text-[#6b6255] mt-1.5">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-amber-700 transition-colors hover:text-amber-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {twoFactorRequired ? (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="rounded border border-yellow-200/70 bg-yellow-50/60 p-3.5 text-xs text-yellow-800 font-medium leading-relaxed">
              Enter the 6-digit code sent to <span className="font-semibold text-yellow-900">{twoFactorEmail}</span>.
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded border border-[#d6cfc2] bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition-all focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15 outline-none tracking-widest text-center"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-yellow-200/80 bg-yellow-50 py-3 text-xs font-bold uppercase tracking-[0.14em] text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 hover:border-yellow-300/80 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-yellow-700" /> : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={() => { setTwoFactorRequired(false); setOtp(''); setError(''); }}
              className="w-full text-xs font-semibold text-amber-700 transition-colors hover:text-amber-900 hover:underline cursor-pointer"
            >
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Email or Phone</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); if (fieldErrors.identifier) setFieldErrors(prev => ({ ...prev, identifier: '' })); }}
                className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] transition-all outline-none ${fieldErrors.identifier ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
                placeholder="Enter your email or phone"
                autoComplete="username"
              />
              {fieldErrors.identifier && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.identifier}</p>}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                  className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] transition-all outline-none pr-12 ${fieldErrors.password ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8f8576] hover:text-[#1a1a1a] focus:outline-none cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                state={{ email: sanitizeInput(identifier) }}
                className="text-xs font-semibold text-amber-700 transition-colors hover:text-amber-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-yellow-200/80 bg-yellow-50 py-3 text-xs font-bold uppercase tracking-[0.14em] text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 hover:border-yellow-300/80 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-yellow-700" /> : 'Log In'}
            </button>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[#e0d9ce]"></div>
              <span className="text-[11px] font-medium text-[#8f8576] uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#e0d9ce]"></div>
            </div>

            {/* ── Google Sign-In Button (rendered by Google GSI) ── */}
            <div ref={googleBtnRef} className="w-full flex justify-center" />
          </form>
        )}
>>>>>>> 6904a87239dc0282a971fe7c8f11fb00325a7798
    </div>
  );
};

export default Login;
