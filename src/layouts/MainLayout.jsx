import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Compass, Menu, X, User, LogOut, LayoutDashboard, CloudSun, Map, Landmark } from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
    { name: 'Spot Gallery', path: '/gallery' },
    { name: 'Explore Map', path: '/explore' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img src="/RABAS LOGO.png" alt="RABAS Travel" className="h-12 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium tracking-wide transition-colors ${
                  isActive(link.path) ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions (Auth / Profile) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
                >
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="max-w-[120px] truncate font-medium text-slate-200">{user.name}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs text-slate-500">Logged in as</p>
                      <p className="text-sm font-bold truncate text-slate-200">{user.name}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                        {user.role}
                      </span>
                    </div>

                    {user.role !== 'customer' && (
                      <Link
                        to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                        Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-cyan-400 hover:bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-400/20 transition-all font-display hover:scale-105"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white focus:outline-none p-1"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-semibold px-3 py-2 rounded-lg ${
                  isActive(link.path) ? 'bg-slate-800 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            {user ? (
              <>
                <div className="px-3">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-bold text-slate-300">{user.name}</p>
                </div>
                {user.role !== 'customer' && (
                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:bg-slate-800 rounded-lg"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded-lg text-left w-full cursor-pointer"
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
                  className="w-full text-center py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-semibold text-sm"
                >
                  Register
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
                <li>Address: Manila, Philippines</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 mt-10 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Rabas Travel and Tours. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
