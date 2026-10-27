import React, { useContext, useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { notificationService } from '../services/api';
import { 
  LayoutGrid, BarChart3, Package, Car, Users, LogOut, Menu, X, Bell, CalendarDays, Settings, ClipboardList, Check, MessageSquare
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { confirm } = useConfirmation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const profileMenuRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
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

  const handleLogout = async () => {
    if (!(await confirm('Are you sure you want to log out?'))) return;
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const menuGroups = [
    { name: 'Overview', items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutGrid },
    ] },
    { name: 'Operations', items: [
      { name: 'Calendar', path: '/admin/schedule', icon: CalendarDays },
      { name: 'Bookings', path: '/admin/bookings', icon: ClipboardList },
      { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
      { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
    ] },
    { name: 'Services', items: [
      { name: 'Tour Packages', path: '/admin/tour-packages', icon: Package },
      { name: 'Car Rentals', path: '/admin/car-rentals', icon: Car },
      { name: 'Customization', path: '/admin/customizations', icon: Settings },
    ] },
    { name: 'Analytics', items: [
      { name: 'Sales Reports', path: '/admin/sales', icon: BarChart3 },
    ] },
    { name: 'System Management', items: [
      { name: 'Accounts', path: '/admin/accounts', icon: Users },
    ] },
  ];

  const isActive = (path) => location.pathname === path;
  const menuItems = menuGroups.flatMap((group) => group.items);
  const currentPageTitle = menuItems.find((item) => item.path === location.pathname)?.name || 'Dashboard';

  const renderNavigationGroups = (onNavigate) => menuGroups.map((group, index) => (
    <section key={group.name} aria-labelledby={`admin-nav-${group.name.toLowerCase().replaceAll(' ', '-')}`}>
      <h2
        id={`admin-nav-${group.name.toLowerCase().replaceAll(' ', '-')}`}
        className={`px-4 ${index === 0 ? 'pt-2' : 'pt-5'} pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400`}
      >
        {group.name}
      </h2>
      <ul className="space-y-1">
        {group.items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#f7f1ed] text-[#603524] font-semibold border border-[#e0cfc4] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${active ? 'text-[#603524]' : 'text-stone-500'}`} />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  ));

  return (
    <div className="admin-theme h-screen flex overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="admin-sidebar hidden lg:flex lg:flex-col lg:w-64 h-full border-r border-[#ece7de] bg-white shrink-0 shadow-[1px_0_8px_rgba(0,0,0,0.02)]">
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
        <nav aria-label="Admin navigation" className="flex-1 px-4 py-2 overflow-y-auto">
          {renderNavigationGroups()}
        </nav>

      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-stone-900/40 backdrop-blur-xs">
          <div className="admin-sidebar relative w-64 bg-white p-6 flex flex-col h-full border-r border-stone-200 shadow-xl">
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

            <nav aria-label="Admin navigation" className="flex-grow overflow-y-auto">
              {renderNavigationGroups(() => setSidebarOpen(false))}
            </nav>

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
            {!['Dashboard', 'Car Rentals', 'Tour Packages', 'Sales Reports', 'Bookings'].includes(currentPageTitle) && (
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
                      <button onClick={handleMarkAllAsRead} className="text-[11px] text-[#c9a38d] hover:text-[#e4cdbd] font-medium cursor-pointer">
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
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-[#c9a38d] transition-all shrink-0 cursor-pointer"
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
            
            <div className="relative border-l border-slate-900 pl-4 sm:pl-6" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-label="Open admin profile menu"
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-800/60"
              >
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold text-slate-200">{user?.name || 'Rabas Admin'}</span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#603524]">Administrator</span>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e0cfc4] bg-[#f7f1ed] font-bold text-[#603524]">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </span>
              </button>

              {profileMenuOpen && (
                <div role="menu" className="absolute right-0 top-full z-[60] mt-2 w-64 border border-stone-300 bg-white text-stone-700 shadow-xl">
                  <div className="border-b border-stone-300 px-5 py-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Logged in as</p>
                    <p className="mt-1 truncate text-sm font-bold text-black">{user?.name || 'Rabas Admin'}</p>
                    <span className="mt-2 inline-block border border-[#e0cfc4] bg-[#f7f1ed] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#603524]">
                      Admin
                    </span>
                  </div>
                  <Link
                    to="/"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 border-b border-stone-300 px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#603524]"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    View Site
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-rose-500 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
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

export default AdminLayout;
