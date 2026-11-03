import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarCheck2, Check, Compass, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [finalizationStatus, setFinalizationStatus] = useState('checking');
  const [finalizationMessage, setFinalizationMessage] = useState('');
  const bookingReference = searchParams.get('booking_reference') || searchParams.get('booking_id');

  useEffect(() => {
    if (!bookingReference) {
      setFinalizationStatus('error');
      setFinalizationMessage('We could not find a payment reference to verify. Check your bookings or contact support.');
      return undefined;
    }
    let active = true;
    setFinalizationStatus('checking');
    setFinalizationMessage('');
    api('/payments/xendit/finalize', {
      method: 'POST',
      body: JSON.stringify({ booking_reference: bookingReference }),
    }).then((result) => {
      if (!active) return;
      if (result.finalized) setFinalizationStatus('confirmed');
      else {
        setFinalizationStatus('pending');
        setFinalizationMessage('Payment is received, but your booking is still syncing. Please try verification again shortly.');
      }
    }).catch((error) => {
      if (!active) return;
      setFinalizationStatus('pending');
      setFinalizationMessage(error.message || 'We could not verify the booking yet. Please try again.');
    });
    return () => { active = false; };
  }, [bookingReference]);

  useEffect(() => {
    if (finalizationStatus !== 'confirmed') return undefined;
    const countdown = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const redirect = window.setTimeout(() => navigate('/profile'), 5000);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirect);
    };
  }, [finalizationStatus, navigate]);

  const retryFinalization = () => {
    if (!bookingReference) return;
    setFinalizationStatus('checking');
    setFinalizationMessage('');
    api('/payments/xendit/finalize', {
      method: 'POST',
      body: JSON.stringify({ booking_reference: bookingReference }),
    }).then((result) => {
      if (result.finalized) setFinalizationStatus('confirmed');
      else {
        setFinalizationStatus('pending');
        setFinalizationMessage('Payment is received, but your booking is still syncing. Please try again shortly.');
      }
    }).catch((error) => {
      setFinalizationStatus('pending');
      setFinalizationMessage(error.message || 'We could not verify the booking yet. Please try again.');
    });
  };
  const isConfirmed = finalizationStatus === 'confirmed';

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f7f9fc] px-4 py-12 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/profile" className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-[#61708a] transition hover:bg-white hover:text-[#17233d]">
            <ArrowLeft className="h-4 w-4" /> Back to RABASys
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#28734b] shadow-sm ring-1 ring-[#dcefe3]">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure payment
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_80px_rgba(31,51,84,0.12)] ring-1 ring-[#e7edf5]">
          <div className="bg-gradient-to-br from-[#eef5ff] via-white to-[#f2fbf5] px-6 pb-10 pt-12 text-center sm:px-12 sm:pt-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf7ef] text-[#2d8a55] ring-8 ring-[#f2fbf5]">
              {isConfirmed ? <Check className="h-10 w-10" strokeWidth={2.25} /> : <ShieldCheck className="h-9 w-9" />}
            </div>
            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2d6cdf]">{isConfirmed ? 'Payment confirmed' : finalizationStatus === 'checking' ? 'Verifying payment' : 'Booking confirmation pending'}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#17233d] sm:text-5xl">{isConfirmed ? 'Your trip is on its way.' : 'We’re checking your booking.'}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#61708a] sm:text-base">{isConfirmed ? 'Your payment was verified and the booking is attached to your account.' : finalizationMessage || 'Please wait while we verify your payment and save the booking.'}</p>
          </div>

          <div className="px-6 pb-8 sm:px-12 sm:pb-12">
            <div className="-mt-2 grid gap-3 sm:grid-cols-3">
              {[
                [CalendarCheck2, isConfirmed ? 'Booking saved' : 'Booking verification', isConfirmed ? 'Your trip details are attached to your account.' : 'We will show the booking here once payment verification finishes.'],
                [ShieldCheck, 'Payment protected', 'Your transaction was handled securely by Xendit.'],
                [Compass, 'Next stop: adventure', 'We’ll keep you updated as your trip approaches.'],
              ].map(([Icon, title, description]) => (
                <div key={title} className="rounded-2xl border border-[#e8edf4] bg-[#fbfcfe] p-4">
                  <Icon className="h-5 w-5 text-[#2d6cdf]" />
                  <p className="mt-4 text-xs font-bold text-[#17233d]">{title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#738198]">{description}</p>
                </div>
              ))}
            </div>

            {bookingReference && (
              <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-[#e8edf4] bg-[#f8faff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold text-[#61708a]">Booking reference</span>
                <span className="font-mono text-sm font-bold text-[#17233d]">{bookingReference}</span>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/profile" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2d6cdf] px-5 py-3.5 text-xs font-bold text-white shadow-[0_10px_22px_rgba(45,108,223,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1f59c7]">
                View my booking <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/packages" className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#dce4ef] bg-white px-5 py-3.5 text-xs font-bold text-[#3b4a64] transition hover:border-[#2d6cdf] hover:text-[#2d6cdf]">
                Explore more trips
              </Link>
            </div>
            {isConfirmed ? <div className="mt-7 rounded-2xl border border-[#e8edf4] bg-[#fbfcfe] px-5 py-4 text-center">
              <div className="mx-auto mb-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-[#e6edf7]">
                <div className="h-full origin-left animate-[success-progress_5s_linear_forwards] rounded-full bg-[#2d6cdf]" />
              </div>
              <p className="text-xs font-semibold text-[#3b4a64]">Opening your profile in {secondsLeft}s</p>
              <button type="button" onClick={() => navigate('/profile')} className="mt-2 text-[11px] font-bold text-[#2d6cdf] underline hover:text-[#1f59c7]">View profile now</button>
            </div> : <div className="mt-7 rounded-2xl border border-[#e8edf4] bg-[#fbfcfe] px-5 py-4 text-center">
              <button type="button" disabled={finalizationStatus === 'checking'} onClick={retryFinalization} className="rounded-xl bg-[#2d6cdf] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{finalizationStatus === 'checking' ? 'Checking payment…' : 'Retry verification'}</button>
            </div>}
            <p className="mt-5 text-center text-[10px] text-[#8a96a8]">Keep your booking reference for support if your profile does not update after verification.</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PaymentSuccess;
