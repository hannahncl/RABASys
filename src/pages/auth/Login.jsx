import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { sanitizeInput, validateEmailOrPhone, validateRequired } from '../../utils/validation';

const Login = () => {
  const { login, verifyLoginOtp, googleLogin, user } = useContext(AuthContext);
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

  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.id) {
      setError('Google Sign-In is loading. Please try again in a moment.');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setError('Google Sign-In is not configured yet.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setLoading(true);
        setError('');
        const result = await googleLogin(response.credential);
        if (!result.success) {
          setError(result.error || 'Google sign-in failed.');
        }
        setLoading(false);
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: use the popup flow
        window.google.accounts.id.renderButton(
          document.createElement('div'),
          { type: 'standard' }
        );
        // Trigger popup manually
        window.google.accounts.oauth2?.initCodeClient?.({
          client_id: clientId,
          scope: 'email profile',
        });
      }
    });
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

            {/* ── Google Sign-In Button ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded border border-[#d6cfc2] bg-white py-3 text-xs font-semibold text-[#3c4043] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:bg-[#f8f7f4] hover:border-[#c0b8aa] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        )}
    </div>
  );
};

export default Login;
