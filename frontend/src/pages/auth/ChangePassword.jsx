import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { validatePassword } from '../../utils/validation';
import FeedbackNotice from '../../components/ui/FeedbackNotice';

export default function ChangePassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!state?.resetToken) {
    return <div className="text-center text-slate-600">Verify your code first from <Link to="/forgot-password" className="text-yellow-700 underline">Forgot password</Link>.</div>;
  }

  const submit = async (event) => {
    event.preventDefault();
    const passwordError = validatePassword(password);
    if (passwordError) { setFieldError(passwordError); return; }
    if (password !== confirm) { setFieldError('Passwords do not match.'); return; }
    setError('');
    setFieldError('');
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken: state.resetToken, newPassword: password }) });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full text-slate-700">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold tracking-widest text-[#3b3a36] uppercase">Set new password</h2>
        <p className="text-sm text-slate-500">Choose a new password for your account.</p>
      </div>
      {error && <FeedbackNotice message={error} onDismiss={() => setError('')} />}
      <form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-semibold text-gray-600">
          New password
          <input required minLength="8" autoComplete="new-password" type="password" value={password} onChange={event => { setPassword(event.target.value); if (fieldError) setFieldError(''); }} className={`mt-2 w-full rounded-lg border px-4 py-3 focus:outline-none ${fieldError ? 'border-rose-400 bg-rose-50' : 'border-gray-200 focus:border-yellow-500'}`} />
        </label>
        <p className="mt-2 text-xs text-slate-500">Use at least 8 character including uppercase, lowercase, a number, and a special character.</p>
        <label className="block text-sm font-semibold text-gray-600">
          Confirm new password
          <input required minLength="8" autoComplete="new-password" type="password" value={confirm} onChange={event => { setConfirm(event.target.value); if (fieldError) setFieldError(''); }} className={`mt-2 w-full rounded-lg border px-4 py-3 focus:outline-none ${fieldError ? 'border-rose-400 bg-rose-50' : 'border-gray-200 focus:border-yellow-500'}`} />
        </label>
        {fieldError && <FeedbackNotice message={fieldError} type="warning" onDismiss={() => setFieldError('')} />}
        <button disabled={busy} className="flex w-full justify-center rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 hover:bg-yellow-100">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Change password'}
        </button>
      </form>
    </div>
  );
}
