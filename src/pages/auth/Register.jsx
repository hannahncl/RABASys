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
  const [contactNumber, setContactNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName || !contactNumber) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await register(firstName, lastName, email.trim(), password, contactNumber.trim());
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
      <div className="mb-8 text-center">
        <h2 className="mb-1 text-2xl font-bold uppercase tracking-widest text-[#3b3a36]">Create Account</h2>
        <p className="text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-yellow-600 transition-colors hover:text-yellow-750 hover:underline">
            Back to Log In
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-600">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none"
            placeholder=""
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none"
            minLength="8"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 capitalize transition-all focus:outline-none"
              placeholder=""
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-600">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 capitalize transition-all focus:outline-none"
              placeholder=""
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">Contact Number</label>
          <input
            type="text"
            autoComplete="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 transition-all focus:outline-none"
            placeholder=""
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-250 bg-yellow-50 py-3 font-bold text-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-yellow-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default Register;
