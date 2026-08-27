import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { sanitizeInput, validateEmail, validateName, validatePassword, validatePhone } from '../../utils/validation';

const Register = () => {
  const { register } = useContext(AuthContext);
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

  return (
    <div className="w-full">
      <div className="rounded-3xl bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
        <div className="mb-8 text-center">
          <h2 className="mb-1 text-2xl font-bold uppercase tracking-widest text-[#3b3a36]">Create Account</h2>
          <p className="text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-yellow-600 transition-colors hover:text-yellow-750 hover:underline">
            Back to Log In
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-600">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' })); }}
            className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none ${fieldErrors.email ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
              className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none pr-12 ${fieldErrors.password ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
              minLength="8"
              autoComplete="new-password"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Use at least 8 character including uppercase, lowercase, a number, and a special character.</p>
          {fieldErrors.password && <p className="mt-2 text-sm text-rose-600">{fieldErrors.password}</p>}  
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: '' })); }}
              className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 capitalize transition-all focus:outline-none ${fieldErrors.firstName ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
              placeholder="First name"
            />
            {fieldErrors.firstName && <p className="mt-2 text-sm text-rose-600">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: '' })); }}
              className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 capitalize transition-all focus:outline-none ${fieldErrors.lastName ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
              placeholder="Last name"
            />
            {fieldErrors.lastName && <p className="mt-2 text-sm text-rose-600">{fieldErrors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Contact Number</label>
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
            className={`w-full rounded-lg border px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none ${fieldErrors.contactNumber ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
            placeholder="e.g. +63"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign Up'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default Register;
