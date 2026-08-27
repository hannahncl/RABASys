import React, { useContext, useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { notificationService } from '../services/api';
import { 
  LayoutDashboard, BarChart3, Package, Car, Users, LogOut, Menu, X, Bell, CalendarDays, Settings, ClipboardList, Check
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let interval;
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getAll();
        setNotifications(data || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    
    fetchNotifications();
    interval = setInterval(fetchNotifications, 10000); // 10 seconds polling

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await notificationService.markAsRead(notif.notification_id);
      setNotifications(prev => prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n));
      setShowNotifications(false);
      navigate('/admin/bookings');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/admin/schedule', icon: CalendarDays },
    { name: 'Bookings', path: '/admin/bookings', icon: ClipboardList },
    { name: 'Sales Report', path: '/admin/sales', icon: BarChart3 },
    { name: 'Tour Packages', path: '/admin/tour-packages', icon: Package },
    { name: 'Car Rentals', path: '/admin/car-rentals', icon: Car },
    { name: 'Customizations', path: '/admin/customizations', icon: Settings },
    { name: 'Accounts', path: '/admin/accounts', icon: Users },
  ];

  const isActive = (path) => location.pathname === path;
  const currentPageTitle = menuItems.find((item) => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-slate-900 bg-slate-900/50 shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-900">
          <Link to="/">
            <img src="/RABAS LOGO.png" alt="RABAS Logo" className="h-12 object-contain" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-64 bg-slate-900 p-6 flex flex-col h-full border-r border-slate-850">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <Link to="/" className="mb-8">
              <img src="/RABAS LOGO.png" alt="RABAS Logo" className="h-12 object-contain" />
            </Link>

            <nav className="flex-grow space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition-colors mt-auto cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="relative z-50 h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            {!['Dashboard', 'Car Rentals', 'Tour Packages', 'Sales Report', 'Bookings'].includes(currentPageTitle) && (
              <h2 className="hidden md:block text-lg font-semibold uppercase tracking-wider text-slate-200">{currentPageTitle}</h2>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <Bell className="h-5 w-5" />
                {notifications.some(n => !n.is_read) && (
                  <>
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500"></span>
                  </>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                    {notifications.some(n => !n.is_read) && (
                      <button onClick={handleMarkAllAsRead} className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.notification_id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer ${notif.is_read ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-slate-500 mt-2">{new Date(notif.sent_at).toLocaleString()}</p>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.notification_id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-cyan-400 transition-all shrink-0 cursor-pointer"
                              title="Mark as read without navigating"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-900 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                <p className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Administrator</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-display">
                A
              </div>
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

export default AdminLayout;
