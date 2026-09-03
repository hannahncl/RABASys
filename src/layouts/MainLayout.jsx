import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Compass, Menu, X, User, LogOut, LayoutDashboard, CloudSun, Map, Landmark, CalendarDays } from 'lucide-react';
import PublicCalendarModal from '../components/ui/PublicCalendarModal';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tour Packages', path: '/packages' },
    { name: 'Car Rentals', path: '/car-rentals' },
    { name: 'Customize Trip', path: '/customize' },
    { name: 'Explore Map', path: '/explore' },
    { name: 'About Us', path: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src="/RABAS LOGO.png" alt="RABAS Travel" className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-all px-3.5 py-2 rounded-full border ${isActive(link.path)
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  : 'text-slate-600 hover:text-yellow-600 hover:bg-yellow-50/50 border-transparent'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions — Kinfolk style: thin left divider + minimal icon */}
          <div className="hidden md:flex items-center gap-5 border-l border-slate-200 pl-6">
            {/* Calendar Icon Button (Beside / Left side of Profile icon) */}
            <button
              onClick={() => setCalendarOpen(true)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all px-3 py-2 rounded-full cursor-pointer border border-slate-200/80 hover:border-slate-300"
              title="View Schedule Calendar"
            >
              <CalendarDays className="h-[18px] w-[18px] text-slate-700" />
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 transition-all px-3.5 py-2 rounded-full cursor-pointer"
                >
                  <User className="h-[18px] w-[18px]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] hidden lg:block">{user.name.split(' ')[0]}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-52 border border-slate-200 bg-white shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Logged in as</p>
                      <p className="text-sm font-bold truncate text-slate-800 mt-0.5">{user.name}</p>
                      <span className="inline-block mt-1.5 text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 bg-yellow-50 text-yellow-600 border border-yellow-200">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[11px] uppercase tracking-widest font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      My Profile
                    </Link>

                    {user.role !== 'customer' && (
                      <Link
                        to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[11px] uppercase tracking-widest font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border-b border-slate-100"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
                        Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[11px] uppercase tracking-widest font-semibold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all px-3.5 py-2 rounded-full border ${isActive('/login')
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  : 'text-slate-600 hover:text-yellow-600 hover:bg-yellow-50/50 border-transparent'
                  }`}
                title="Sign In"
              >
                <User className="h-[18px] w-[18px]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu & Calendar Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setCalendarOpen(true)}
              className="p-2 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
              title="Schedule Calendar"
            >
              <CalendarDays className="h-5 w-5 text-yellow-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-slate-900 focus:outline-none transition-colors p-1"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-1">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-2.5 rounded-xl transition-all border ${isActive(link.path)
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  : 'text-slate-600 hover:text-yellow-600 hover:bg-yellow-50/50 border-transparent'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            {user ? (
              <>
                <div className="px-3">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-slate-700">{user.name}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                {user.role !== 'customer' && (
                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 hover:bg-slate-50 rounded-lg font-semibold"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-slate-50 rounded-lg text-left w-full cursor-pointer font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-center py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all border ${isActive('/login')
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                    : 'border border-slate-200 hover:text-yellow-600 hover:bg-yellow-50/50 text-slate-700'
                    }`}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 font-display font-bold text-xl tracking-wide">
                <Compass className="h-6 w-6" />
                RABAS TRAVEL & TOURS
              </Link>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                Rabas Travel and Tours provides premium local and domestic tour packages across the Philippines. We support local guides, prioritize eco-tourism, and deliver unforgettable experiences.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-slate-400 hover:text-cyan-400 transition-colors">Home</Link></li>
                <li><Link to="/packages" className="text-slate-400 hover:text-cyan-400 transition-colors">Tour Packages</Link></li>
                <li><Link to="/customize" className="text-slate-400 hover:text-cyan-400 transition-colors">Customize Trip</Link></li>
                <li><Link to="/gallery" className="text-slate-400 hover:text-cyan-400 transition-colors">Spot Gallery</Link></li>
                <li><Link to="/explore" className="text-slate-400 hover:text-cyan-400 transition-colors">Explore Map</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Support & Contact</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Email: support@rabastravel.com</li>
                <li>Phone: +63 917 123 4567</li>
                <li>Address: Bicol, Philippines</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 mt-10 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Rabas Travel and Tours. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Public Calendar Modal */}
      <PublicCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </div>
  );
};

export default MainLayout;
