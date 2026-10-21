import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { Compass, Menu, X, User, LogOut, LayoutDashboard, CloudSun, Map, Landmark, Bell, Check } from 'lucide-react';
import { notificationService } from '../services/api';
import FaqChatbot from '../components/ui/FaqChatbot';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { confirm } = useConfirmation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (!(await confirm('Are you sure you want to log out?'))) return;
    await logout();
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    let mounted = true;
    const loadNotifications = async () => {
      try {
        const data = await notificationService.getAll();
        if (mounted) setNotifications(data || []);
      } catch {
        if (mounted) setNotifications([]);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const unreadNotifications = notifications.filter(notification => !notification.is_read);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.notification_id);
        setNotifications(current => current.map(item => item.notification_id === notification.notification_id ? { ...item, is_read: 1 } : item));
      }
      setNotificationsOpen(false);
    } catch {
      // Keep the notification visible if marking it read fails.
    }
  };

  const handleMarkNotificationRead = async (event, notification) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(notification.notification_id);
      setNotifications(current => current.map(item => item.notification_id === notification.notification_id ? { ...item, is_read: 1 } : item));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(current => current.map(item => ({ ...item, is_read: 1 })));
    } catch {
      // Keep the unread state if the request fails.
    }
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
      <header className="sticky top-0 z-40 w-full bg-white shadow-none">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="-ml-4 flex shrink-0 items-center">
            <img src="/rabas-logo.png" alt="RABAS Travel and Tours Services" className="h-11 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-all px-3.5 py-2 rounded-full border ${isActive(link.path)
                  ? 'bg-[#603524]/10 text-[#603524] border-[#603524]/25 shadow-[0_1px_2px_rgba(96,53,36,0.08)]'
                  : 'text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 border-transparent'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions — Kinfolk style: thin left divider + minimal icon */}
          <div className="hidden md:flex items-center gap-5 border-l border-slate-200 pl-6">
            {/* User Notifications */}
            <button
              onClick={() => setNotificationsOpen(current => !current)}
<<<<<<< HEAD:src/layouts/MainLayout.jsx
              className="relative flex items-center gap-1.5 text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 transition-all px-3 py-2 rounded-full cursor-pointer"
=======
              className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-slate-600 transition-all hover:bg-[#603524]/5 hover:text-[#603524]"
>>>>>>> b42806ed5361c3bed35e9817f1f08af956de8e5e:frontend/src/layouts/MainLayout.jsx
              title="View notifications"
            >
              <Bell className="h-[18px] w-[18px] text-[#603524]" />
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 text-slate-700 hover:text-[#603524] hover:bg-[#603524]/5 transition-all px-3.5 py-2 rounded-full cursor-pointer"
                >
                  <User className="h-[18px] w-[18px] text-[#603524]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] hidden lg:block">{user.name.split(' ')[0]}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-52 border border-slate-200 bg-white shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Logged in as</p>
                      <p className="text-sm font-bold truncate text-black mt-0.5">{user.name}</p>
                      <span className="inline-block mt-1.5 text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 bg-[#603524]/10 text-[#603524] border border-[#603524]/20">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[11px] uppercase tracking-widest font-semibold text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 transition-colors border-b border-slate-100"
                    >
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      My Profile
                    </Link>

                    {user.role !== 'customer' && (
                      <Link
                        to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-[11px] uppercase tracking-widest font-semibold text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 transition-colors border-b border-slate-100"
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
                  ? 'bg-[#603524] text-white border-[#603524] shadow-[0_1px_2px_rgba(96,53,36,0.2)]'
                  : 'text-[#603524] hover:bg-[#603524]/10 border-[#603524]/30'
                  }`}
                title="Sign In"
              >
                <User className="h-[18px] w-[18px]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu & Notifications Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setNotificationsOpen(current => !current)}
              className="relative p-2 text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 rounded-full transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-[#603524]" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-[#603524] focus:outline-none transition-colors p-1"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {notificationsOpen && (
        <div className="fixed right-4 top-16 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
            {unreadNotifications.length > 0 && (
              <button onClick={handleMarkAllNotificationsRead} className="cursor-pointer text-[11px] font-medium text-cyan-400 hover:text-cyan-300">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {!user ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Sign in to receive booking and trip updates.</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No new notifications.</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.notification_id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group cursor-pointer border-b border-slate-800/50 px-4 py-3 transition-colors hover:bg-slate-800/30 ${notification.is_read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{notification.message}</p>
                      <p className="mt-2 text-[10px] text-slate-500">{notification.sent_at ? new Date(notification.sent_at).toLocaleString() : ''}</p>
                    </div>
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={event => handleMarkNotificationRead(event, notification)}
                        className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-700 hover:text-cyan-400 group-hover:opacity-100"
                        title="Mark as read without navigating"
                        aria-label="Mark notification as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
                  ? 'bg-[#603524]/10 text-[#603524] border-[#603524]/20 shadow-[0_1px_2px_rgba(96,53,36,0.04)]'
                  : 'text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 border-transparent'
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
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-[#603524] hover:bg-slate-50 rounded-lg font-semibold"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                {user.role !== 'customer' && (
                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#603524] hover:bg-slate-50 rounded-lg font-semibold"
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
                    ? 'bg-[#603524] text-white border-[#603524] shadow-[0_1px_2px_rgba(96,53,36,0.15)]'
                    : 'border border-slate-200 hover:text-[#603524] hover:border-[#603524]/30 text-slate-700'
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
      <footer className="mt-auto border-t border-[#e8e2d8] bg-white py-12 text-[#4a453b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-4">
<<<<<<< HEAD:src/layouts/MainLayout.jsx
              <Link to="/" className="inline-flex items-center gap-2 text-[#603524] font-display font-bold text-xl tracking-wide">
=======
              <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-wide text-[#60402f]">
>>>>>>> b42806ed5361c3bed35e9817f1f08af956de8e5e:frontend/src/layouts/MainLayout.jsx
                RABAS TRAVEL & TOURS SERVICES
              </Link>
              <p className="max-w-sm text-sm leading-relaxed text-[#6b6255]">
                Rabas Travel and Tours provides premium local and domestic tour packages across the Philippines. We support local guides, prioritize eco-tourism, and deliver unforgettable experiences.
              </p>
            </div>

            <div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#60402f]">Support & Contact</h4>
              <ul className="space-y-2 text-sm text-[#6b6255]">
                <li>Email: support@rabastravel.com</li>
                <li>Phone: +63 917 123 4567</li>
                <li>Address: Bicol, Philippines</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[#eee9e1] pt-6 text-center text-xs text-[#8a7e6e]">
            © {new Date().getFullYear()} Rabas Travel and Tours. All rights reserved.
          </div>
        </div>
      </footer>

      <FaqChatbot />
    </div>
  );
};

export default MainLayout;
