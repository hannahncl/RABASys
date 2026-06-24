import React, { useState } from 'react';
import { Compass, ShieldCheck, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const GCashModal = ({ isOpen, onClose, amount, onPaymentSuccess }) => {
  const [step, setStep] = useState(1); // 1: Mobile Num, 2: OTP, 3: MPIN, 4: Success Receipt
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [mpin, setMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!mobileNumber.match(/^(09|\+639)\d{9}$/)) {
      setError('Please enter a valid GCash mobile number (e.g., 09171234567)');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 800);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (otp !== '123456') {
      setError('Invalid OTP code. Enter the verification code: 123456');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 800);
  };

  const handleNextStep3 = (e) => {
    e.preventDefault();
    if (mpin.length !== 4) {
      setError('Please enter a valid 4-digit GCash MPIN.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 1200);
  };

  const handleFinalize = () => {
    const refNum = `GC-${Math.floor(1000000 + Math.random() * 9000000)}`;
    onPaymentSuccess(refNum, mobileNumber);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      {/* Phone container mockup */}
      <div className="relative w-full max-w-sm bg-blue-600 rounded-3xl overflow-hidden shadow-2xl border border-blue-500 flex flex-col min-h-[520px]">
        {/* GCash Top Branding */}
        <div className="bg-blue-600 px-6 py-5 flex items-center justify-between text-white border-b border-blue-500">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold tracking-tighter text-2xl">g)</span>
            <span className="font-display font-bold text-sm tracking-wide">GCash Testing Portal</span>
          </div>
          <span className="text-[9px] uppercase bg-blue-800 border border-blue-400 font-bold px-2 py-0.5 rounded-full">
            Sandbox
          </span>
        </div>

        {/* Content body */}
        <div className="flex-1 bg-slate-50 text-slate-900 p-6 flex flex-col justify-between">
          
          {/* STEP 1: MOBILE NO. */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Merchant Name</span>
                  <h4 className="font-bold text-base text-slate-800">RABAS TRAVEL AND TOURS</h4>
                  <div className="inline-block px-3 py-1 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold font-display text-sm mt-1">
                    PHP {amount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">GCash Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. 09171234567"
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                  />
                  {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Next'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Cancel Payment
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 cursor-pointer" />
                  <span className="text-xs font-semibold cursor-pointer">Go back</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">OTP Code Verification</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We sent a mock 6-digit authentication code to <span className="font-bold text-slate-700">{mobileNumber}</span>.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Enter OTP Code</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter 123456"
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-center tracking-widest font-mono font-bold text-slate-800 text-sm focus:outline-none"
                  />
                  <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl text-[10px] text-amber-800 leading-relaxed">
                    <span className="font-bold block uppercase mb-0.5">Sandbox Hint:</span>
                    Enter the code <span className="font-bold">123456</span> to simulate validation success.
                  </div>
                  {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: MPIN */}
          {step === 3 && (
            <form onSubmit={handleNextStep3} className="flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">Enter GCash MPIN</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Authenticate your identity to approve the payment of <span className="font-bold text-slate-700">PHP {amount.toLocaleString()}</span>.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={mpin}
                    onChange={(e) => {
                      setMpin(e.target.value);
                      setError('');
                    }}
                    placeholder="••••"
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-xl px-4 py-3 text-center tracking-widest font-bold text-slate-800 text-base focus:outline-none"
                  />
                  <div className="bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl text-[10px] text-amber-800">
                    Enter any 4-digit code (e.g. 1234).
                  </div>
                  {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay PHP ${amount.toLocaleString()}`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 4 && (
            <div className="flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-6 text-center">
                <div className="flex justify-center pt-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-lg">Payment Successful</h4>
                  <p className="text-xs text-slate-400">Transaction receipt copy</p>
                </div>

                {/* Receipt Board */}
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Merchant</span>
                    <span className="font-bold text-slate-800">Rabas Travel & Tours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-bold text-slate-800">PHP {amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source Mobile</span>
                    <span className="font-bold text-slate-800">{mobileNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold text-emerald-600 uppercase">Settled</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleFinalize}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Done & Confirm Booking
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GCashModal;
