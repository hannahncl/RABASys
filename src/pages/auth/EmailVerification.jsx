import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const EmailVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (index, value) => {
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      // Logic for actual verification goes here
      // For now we'll just redirect to change password on success
      navigate('/change-password');
    }
  };

  return (
    <div className="w-full text-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-sans tracking-widest text-[#3b3a36] mb-2 uppercase">Email Verification</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
          Follow the following instructions to successfully change your account password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-center gap-2 sm:gap-3 mb-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-white border border-slate-200 focus:border-yellow-350 focus:ring-2 focus:ring-yellow-100/50 rounded-xl text-slate-800 transition-all focus:outline-none shadow-sm"
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4 font-medium leading-relaxed">
            Please enter the 6-digit code that we've sent to your email address for verification and to continue changing your password.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-6 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Verify Code
        </button>
      </form>
    </div>
  );
};

export default EmailVerification;
