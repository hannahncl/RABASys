import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      // Simulate password change logic
      alert('Password successfully changed! Please login with your new password.');
      navigate('/login');
    } else {
      alert('Passwords do not match or are empty.');
    }
  };

  return (
    <div className="w-full text-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-sans tracking-widest text-[#3b3a36] mb-2 uppercase">Change Password</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
          Follow the following instructions to successfully change your account password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Enter New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-yellow-350 focus:ring-2 focus:ring-yellow-100/50 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none shadow-sm"
            placeholder=""
            required
          />
          <p className="text-xs text-slate-550 mt-2 font-medium leading-relaxed">
            Your new password must contain <span className="font-bold">at least 8-12 characters including letters, symbols, and numbers.</span>
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Re-enter New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-yellow-350 focus:ring-2 focus:ring-yellow-100/50 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none shadow-sm"
            placeholder=""
            required
          />
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
            Make sure that you remember the new password you entered.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-6 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
