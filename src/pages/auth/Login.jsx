import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext, normalizeFrontendRole } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { sanitizeInput, validateEmailOrPhone, validateRequired } from '../../utils/validation';

const Login = () => {
  const { login, googleLogin, user } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedIdentifier = sanitizeInput(identifier);
    // Passwords must be sent exactly as entered. Sanitizing them can change a
    // valid password that contains characters such as < or >.
    const cleanedPassword = password;

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
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
        {/* Title */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b0a68e] mb-1.5">Sign In</p>
          <h1 className="text-2xl font-bold tracking-[0.02em] text-[#1a1a1a]">Welcome Back</h1>
          <p className="mt-1 text-xs font-medium text-[#6b6255]">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
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
                // Keep this as a text input with visual masking so Chrome's
                // password-manager verification overlay cannot block typing.
                type="text"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] transition-all outline-none pr-12 ${fieldErrors.password ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
                style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>}
          </div>

          <div className="flex items-center justify-end text-xs">
            <Link
              to="/forgot-password"
              className="font-medium text-[#6b6255] hover:text-[#2d2a24] transition-colors"
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

          <p className="pt-2 text-center text-xs text-[#6b6255]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-[#a36d17] hover:text-[#2d2a24] transition-colors">
              Sign up
            </Link>
          </p>
        </form>
    </div>
  );
};

export default Login;
