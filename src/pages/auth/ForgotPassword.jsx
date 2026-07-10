import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Pass the email to the verification page
      navigate('/verify-email', { state: { email } });
    }
  };

  return (
    <div className="w-full text-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-sans tracking-widest text-[#3b3a36] mb-2 uppercase">Forgot Password</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
          Follow the following instructions to successfully change your account password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
            placeholder=""
            required
          />
          <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed">
            Please enter the email you registered for the account so we can verify that you are the one who's using it.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 mt-8 bg-[#FFE053] hover:bg-[#F2D340] text-[#3b3a36] font-bold font-sans rounded-3xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Verify Email
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
