import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Compass, AlertCircle, Loader2, KeyRound, User } from 'lucide-react';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'staff') navigate('/staff/dashboard', { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill helper for test grading
  const handleQuickFill = (roleName) => {
    setUsername(roleName);
    setPassword('123');
    setError('');
  };

  return (
    <div className="w-full text-slate-700">
      <h2 className="text-3xl font-bold font-sans tracking-wide text-black mb-2 uppercase">Welcome Back!</h2>
      <p className="text-slate-500 text-sm mb-8">
        Don't have a account,{' '}
        <Link to="/register" className="text-yellow-400 font-semibold hover:underline">
          Sign up
        </Link>
      </p>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Email</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border-2 border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
              placeholder=""
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold tracking-wide text-slate-600 mb-2">Password</label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-2 border-slate-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none"
              placeholder=""
            />
            <button type="button" className="absolute right-4 top-3.5 text-yellow-400 hover:text-yellow-500 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5 mr-3 border-2 border-yellow-400 rounded-full group-hover:bg-yellow-50 transition-colors">
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
            </div>
            <span className="text-xs font-semibold text-slate-500">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-xs font-bold text-slate-700 hover:text-yellow-500 transition-colors">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-4 bg-[#3b3a36] hover:bg-[#2c2b28] text-white font-bold font-sans rounded-3xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Log In'
          )}
        </button>
      </form>

      {/* Quick Access Demo Credentials */}
      <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
          Quick Access Demo Roles (Password: 123)
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin')}
            className="py-2.5 px-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 hover:border-cyan-300 text-cyan-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('staff')}
            className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 text-purple-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('tourist')}
            className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-800 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            Tourist
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <div className="h-px bg-slate-200 flex-1"></div>
        <span className="text-xs font-semibold text-slate-400">or continue with</span>
        <div className="h-px bg-slate-200 flex-1"></div>
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button type="button" className="w-14 h-12 flex items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
        </button>
        <button type="button" className="w-14 h-12 flex items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48"><path fill="#3F51B5" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"></path><path fill="#FFF" d="M34.368,25H31v13h-5V25h-3v-4h3v-2.41c0.002-3.508,1.459-5.59,5.592-5.59H35v4h-2.287C31.104,17,31,17.6,31,18.723V21h4L34.368,25z"></path></svg>
        </button>
        <button type="button" className="w-14 h-12 flex items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="24px" height="24px"><path d="M 44.527344 34.75 C 43.449219 37.144531 42.929688 38.214844 41.542969 40.328125 C 39.601563 43.28125 37.757813 46.203125 34.695313 46.25 C 31.515625 46.300781 30.367188 44.265625 26.6875 44.265625 C 23.054688 44.265625 21.75 46.25 18.792969 46.25 C 15.835938 46.25 14.15625 43.492188 12.1875 40.515625 C 9.058594 35.75 6.015625 26.15625 9.175781 19.34375 C 10.730469 15.984375 14.070313 13.847656 17.585938 13.800781 C 20.640625 13.75 23.511719 15.933594 25.378906 15.933594 C 27.246094 15.933594 30.6875 13.382813 34.28125 13.5625 C 35.75 13.621094 39.84375 14.167969 42.464844 17.996094 C 42.246094 18.136719 37.601563 20.832031 37.648438 26.332031 C 37.703125 32.859375 43.25 35.105469 43.308594 35.152344 C 43.25 35.265625 44.027344 33.5625 44.527344 34.75 Z M 32.578125 8.972656 C 34.238281 6.960938 35.34375 4.21875 35.039063 1.4375 C 32.65625 2.390625 29.742188 3.882813 28.027344 5.925781 C 26.488281 7.742188 25.152344 10.550781 25.511719 13.265625 C 28.167969 13.46875 30.851563 11.054688 32.578125 8.972656 Z"/></svg>
        </button>
      </div>

    </div>
  );
};

export default Login;
