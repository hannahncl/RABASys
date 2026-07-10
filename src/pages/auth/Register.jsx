import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName || !address || !contactNumber) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`;
      const username = email.split('@')[0] || firstName.toLowerCase();
      const result = await register(fullName, email, username, password);
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
    <div className="w-full text-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-sans tracking-widest text-[#3b3a36] mb-1 uppercase">Create Account</h2>
        <p className="text-slate-500 text-sm font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 font-semibold hover:underline">
            Back to Log In
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
            placeholder=""
          />
        </div>

        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
            placeholder=""
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
              placeholder=""
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
            placeholder=""
          />
        </div>

        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Contact Number</label>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full bg-white border-2 border-slate-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
            placeholder=""
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-6 bg-[#FFE053] hover:bg-[#F2D340] text-[#3b3a36] font-bold font-sans rounded-3xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Sign Up'
          )}
        </button>
      </form>
    </div>
  );
};

export default Register;
