import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { Compass, Menu, X, User, LogOut, LayoutDashboard, CloudSun, Map, Landmark, Bell, Check, Phone, Mail } from 'lucide-react';
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
              className="relative flex items-center gap-1.5 text-slate-600 hover:text-[#603524] hover:bg-[#603524]/5 transition-all px-3 py-2 rounded-full cursor-pointer"
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-[#603524] font-display font-bold text-xl tracking-wide">
                RABAS TRAVEL & TOURS SERVICES
<<<<<<< HEAD:src/layouts/MainLayout.jsx
              </span>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
=======
              </Link>
              <p className="max-w-sm text-sm leading-relaxed text-[#6b6255]">
>>>>>>> b479bc2659a36606ed7a0f47ff189cad3d0c2920:frontend/src/layouts/MainLayout.jsx
                Rabas Travel and Tours provides premium local and domestic tour packages across the Philippines. We support local guides, prioritize eco-tourism, and deliver unforgettable experiences.
              </p>
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#603524] mb-4">Follow Us</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-3">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                  </svg>
                  <span className="min-w-0 break-words">RABAS- TRAVEL &amp; TOURS SERVICES</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor">
                    <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077Z" />
                  </svg>
                  <span className="min-w-0 break-words">rabastravelandtours</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  <span className="min-w-0 break-words">Rabas-Travel &amp; Tours Services</span>
                </li>
              </ul>
            </div>

<<<<<<< HEAD:src/layouts/MainLayout.jsx
            <div className="min-w-0">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#603524] mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-3">
                  <Phone aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="break-words">0961-521-7053</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="break-all">bicolanangrabas2021@gmail.com</span>
                </li>
=======
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#60402f]">Support & Contact</h4>
              <ul className="space-y-2 text-sm text-[#6b6255]">
                <li>Email: support@rabastravel.com</li>
                <li>Phone: +63 917 123 4567</li>
                <li>Address: Bicol, Philippines</li>
>>>>>>> b479bc2659a36606ed7a0f47ff189cad3d0c2920:frontend/src/layouts/MainLayout.jsx
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
