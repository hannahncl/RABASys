import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) }); navigate('/verify-email', { state: { email: email.trim() } }); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <div className="w-full text-slate-700"><div className="text-center mb-8"><h2 className="text-2xl font-bold tracking-widest text-[#3b3a36] mb-2 uppercase">Forgot Password</h2><p className="text-slate-500 text-sm">We will email you a secure six-digit reset code.</p></div>{error && <div className="mb-5 flex gap-2 p-3 rounded-xl bg-rose-50 text-rose-600 text-sm"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}<form onSubmit={submit} className="space-y-5"><label className="block text-sm font-semibold text-gray-600">Registered email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:border-yellow-500" placeholder="you@example.com" /></label><button disabled={busy} className="w-full py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold rounded-xl flex justify-center">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP code'}</button></form><p className="mt-6 text-center text-sm"><Link to="/login" className="text-yellow-700 font-semibold hover:underline">Back to login</Link></p></div>;
}
