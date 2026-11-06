import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { validateEmail } from '../../utils/validation';
import FeedbackNotice from '../../components/ui/FeedbackNotice';

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const nextError = validateEmail(email);
    setFieldError(nextError);
    if (nextError) {
      setError('');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      navigate('/verify-email', { state: { email: email.trim() } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full text-slate-700">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold tracking-widest text-[#3b3a36] uppercase">Forgot Password</h2>
        <p className="text-sm text-slate-500">We will email you a secure six-digit reset code.</p>
      </div>
      {error && <FeedbackNotice message={error} onDismiss={() => setError('')} />}
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-semibold text-gray-600">
          Registered email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => { setEmail(event.target.value); if (fieldError) setFieldError(''); }}
            className={`mt-2 w-full rounded-lg border px-4 py-3 text-gray-900 focus:outline-none ${fieldError ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white focus:border-yellow-500'}`}
            placeholder="you@example.com"
          />
        </label>
        {fieldError && <FeedbackNotice message={fieldError} type="warning" onDismiss={() => setFieldError('')} />}
        <button disabled={busy} className="flex w-full justify-center rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 hover:bg-yellow-100">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP code'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-yellow-700 hover:underline">Back to login</Link></p>
    </div>
  );
}
