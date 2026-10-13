import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { sanitizeInput, validateEmail, validateName, validatePassword, validatePhone } from '../../utils/validation';

const Register = () => {
  const { register, googleLogin } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedEmail = sanitizeInput(email).toLowerCase();
    const cleanedPassword = sanitizeInput(password);
    const cleanedFirstName = sanitizeInput(firstName);
    const cleanedLastName = sanitizeInput(lastName);
    const cleanedContactNumber = sanitizeInput(contactNumber);

    const nextErrors = {
      email: validateEmail(cleanedEmail),
      password: validatePassword(cleanedPassword),
      firstName: validateName(cleanedFirstName, 'First name'),
      lastName: validateName(cleanedLastName, 'Last name'),
      contactNumber: validatePhone(cleanedContactNumber),
    };
    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await register(cleanedFirstName, cleanedLastName, cleanedEmail, cleanedPassword, cleanedContactNumber);
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

  const handleGoogleSignUp = () => {
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
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Google sign-up failed.');
        }
        setLoading(false);
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        window.google.accounts.id.renderButton(
          document.createElement('div'),
          { type: 'standard' }
        );
      }
    });
  };

  return (
    <div className="w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-7 text-center">
        <img src="/RABAS LOGO.png" alt="RABAS Travel" className="h-12 w-auto mx-auto mb-3" />
        <h2 className="text-base font-bold uppercase tracking-[0.18em] text-[#1a1a1a]">Create Account</h2>
        <p className="text-xs font-medium text-[#6b6255] mt-1.5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-amber-700 transition-colors hover:text-amber-900 hover:underline">
            Back to Log In
          </Link>
        </p>
      </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' })); }}
              className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] transition-all outline-none ${fieldErrors.email ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {fieldErrors.email && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] transition-all outline-none pr-12 ${fieldErrors.password ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
                minLength="8"
                autoComplete="new-password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8f8576] hover:text-[#1a1a1a] focus:outline-none cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#8f8576]">Use at least 8 characters including uppercase, lowercase, a number, and a special character.</p>
            {fieldErrors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: '' })); }}
                className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] capitalize transition-all outline-none ${fieldErrors.firstName ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
                placeholder="First name"
              />
              {fieldErrors.firstName && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: '' })); }}
                className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] capitalize transition-all outline-none ${fieldErrors.lastName ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
                placeholder="Last name"
              />
              {fieldErrors.lastName && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Contact Number</label>
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={contactNumber}
              onChange={(e) => {
                const nextValue = e.target.value.replace(/[^0-9+\-()\s]/g, '');
                setContactNumber(nextValue);
                if (fieldErrors.contactNumber) setFieldErrors(prev => ({ ...prev, contactNumber: '' }));
              }}
              className={`w-full rounded border px-4 py-3 text-sm font-medium text-[#1a1a1a] placeholder-[#b0a68e] transition-all outline-none ${fieldErrors.contactNumber ? 'border-rose-300 bg-rose-50/50' : 'border-[#d6cfc2] bg-white focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15'}`}
              placeholder="e.g. +63"
            />
            {fieldErrors.contactNumber && <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.contactNumber}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded border border-yellow-200/80 bg-yellow-50 py-3 text-xs font-bold uppercase tracking-[0.14em] text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 hover:border-yellow-300/80 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-yellow-700" /> : 'Sign Up'}
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#e0d9ce]"></div>
            <span className="text-[11px] font-medium text-[#8f8576] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#e0d9ce]"></div>
          </div>

          {/* ── Google Sign-Up Button ── */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded border border-[#d6cfc2] bg-white py-3 text-xs font-semibold text-[#3c4043] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:bg-[#f8f7f4] hover:border-[#c0b8aa] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.03 24.03 0 0 0 0 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign up with Google
          </button>
        </form>
    </div>
  );
};

export default Register;
