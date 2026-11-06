import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import FeedbackNotice from '../../components/ui/FeedbackNotice';

export default function EmailVerification() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refs = useRef([]);

  if (!email) {
    return <div className="text-center text-slate-600">Start with <Link to="/forgot-password" className="text-yellow-700 underline">Forgot password</Link>.</div>;
  }

  const change = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    const otp = code.join('');
    if (otp.length !== 6) { setError('Enter the six-digit code from your email.'); return; }
    setError('');
    setBusy(true);
    try {
      const { resetToken } = await api('/auth/verify-reset-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
      navigate('/change-password', { state: { resetToken } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full text-slate-700">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold tracking-widest text-[#3b3a36] uppercase">Check your email</h2>
        <p className="text-sm text-slate-500">Enter the code sent to <strong>{email}</strong>.</p>
      </div>
      {error && <FeedbackNotice message={error} onDismiss={() => setError('')} />}
      <form onSubmit={submit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input key={index} ref={el => { refs.current[index] = el; }} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength="1" value={digit} onChange={event => change(index, event.target.value)} onKeyDown={event => event.key === 'Backspace' && !digit && index > 0 && refs.current[index - 1]?.focus()} className="h-14 w-11 rounded-xl border border-slate-200 text-center text-xl font-bold focus:border-yellow-500 focus:outline-none" />
          ))}
        </div>
        <button disabled={busy} className="flex w-full justify-center rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 hover:bg-yellow-100">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify code'}
        </button>
      </form>
    </div>
  );
}
