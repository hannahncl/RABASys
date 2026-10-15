import React, { useContext, useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { api, notificationService } from '../services/api';
import { 
  Compass, LayoutGrid, CalendarCheck, LogOut, Menu, X, Bell, Check 
} from 'lucide-react';

const StaffLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { confirm } = useConfirmation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideProfile, setGuideProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const fetchGuideProfile = async () => {
      try {
        const data = await api(`/tour-guides/${user.id}`);
        if (isMounted && data) {
          setGuideProfile(data);
        }
      } catch (err) {
        // Fall back gracefully
      }
    };
    fetchGuideProfile();
    return () => { isMounted = false; };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getAll();
        if (mounted) setNotifications(data || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(current => current.map(notification => (
        notification.notification_id === id ? { ...notification, is_read: 1 } : notification
      )));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(current => current.map(notification => ({ ...notification, is_read: 1 })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const profilePicture = guideProfile?.profilePicture || user?.profilePicture;
  const hasUnreadNotifications = notifications.some(notification => !notification.is_read);

  const handleLogout = async () => {
    if (!(await confirm('Are you sure you want to log out?'))) return;
<<<<<<< HEAD
    logout();
=======
    await logout();
>>>>>>> 262c6a2a3b3b0ecb63920f6555235615512e1ad7
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutGrid },
    { name: 'My Tours', path: '/staff/my-tours', icon: Compass },
    { name: 'Calendar', path: '/staff/calendar', icon: CalendarCheck },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-white text-stone-800 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 h-screen sticky top-0 border-r border-[#ece7de] bg-white shrink-0 shadow-[1px_0_8px_rgba(0,0,0,0.02)]">
        {/* Top Logo */}
        <div className="pt-8 pb-6 px-6 flex items-center justify-center">
          <div className="flex items-center justify-center">
            <img 
              src="/RABAS LOGO.png" 
              alt="RABAS Travel and Tours Services" 
              className="h-12 w-auto object-contain mx-auto" 
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow px-4 py-2 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#fef9ec] text-[#d97706] font-semibold border border-[#fef08a]/40 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-[#d97706]' : 'text-stone-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50/70 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-rose-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-stone-900/40 backdrop-blur-xs">
          <div className="relative w-64 bg-white p-6 flex flex-col h-full border-r border-stone-200 shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 pt-2 flex justify-center">
              <img 
                src="/RABAS LOGO.png" 
                alt="RABAS Travel and Tours Services" 
                className="h-12 w-auto object-contain mx-auto" 
              />
            </div>

            <nav className="flex-grow space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#fef9ec] text-[#d97706] font-semibold border border-[#fef08a]/40'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-[#d97706]' : 'text-stone-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors mt-auto cursor-pointer"
            >
              <LogOut className="h-5 w-5 text-rose-500" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-[#ece7de] bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-stone-500 hover:text-stone-800"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(current => !current)}
                className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-slate-800 text-white' : 'text-stone-500 hover:bg-slate-100 hover:text-stone-800'} cursor-pointer`}
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="h-5 w-5" />
                {hasUnreadNotifications && (
                  <>
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"></span>
                  </>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                    {hasUnreadNotifications && (
                      <button onClick={handleMarkAllAsRead} className="cursor-pointer text-[11px] font-medium text-cyan-400 hover:text-cyan-300">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">No new notifications.</div>
                    ) : notifications.map(notification => (
                      <div
                        key={notification.notification_id}
                        className={`group border-b border-slate-800/50 px-4 py-3 ${notification.is_read ? 'opacity-60' : ''}`}
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
                              onClick={() => handleMarkAsRead(notification.notification_id)}
                              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-700 hover:text-cyan-400 group-hover:opacity-100"
                              title="Mark as read"
                              aria-label="Mark notification as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 border-l border-stone-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-stone-800">{user?.name || 'Tour Guide'}</p>
                <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold">Tour Guide</p>
              </div>
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user?.name || 'Tour Guide'} 
                  className="h-10 w-10 rounded-xl object-cover shadow-xs" 
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-800 font-bold font-display">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
