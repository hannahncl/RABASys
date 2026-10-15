import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { api } from '../services/api';
import { 
  Compass, LayoutGrid, CalendarCheck, LogOut, Menu, X, Bell 
} from 'lucide-react';

const StaffLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { confirm } = useConfirmation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideProfile, setGuideProfile] = useState(null);
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

  const profilePicture = guideProfile?.profilePicture || user?.profilePicture;

  const handleLogout = async () => {
    if (!(await confirm('Are you sure you want to log out?'))) return;
    logout();
    navigate('/');
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
          <Link to="/" className="flex items-center justify-center transition-transform hover:scale-[1.02]">
            <img 
              src="/RABAS LOGO.png" 
              alt="RABAS Travel and Tours Services" 
              className="h-12 w-auto object-contain mx-auto" 
            />
          </Link>
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

        {/* User Profile Summary */}
        <div className="p-3 mx-4 mb-1 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-3">
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt={user?.name || 'Tour Guide'} 
              className="h-10 w-10 rounded-lg object-cover border border-amber-300 shadow-xs shrink-0" 
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-800 font-bold font-display shrink-0 text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-stone-800 truncate">{user?.name || 'Tour Guide'}</p>
            <p className="text-[10px] text-yellow-700 font-semibold uppercase tracking-wider">Tour Guide</p>
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 pb-4">
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

            <Link to="/" className="mb-6 pt-2 flex justify-center">
              <img 
                src="/RABAS LOGO.png" 
                alt="RABAS Travel and Tours Services" 
                className="h-12 w-auto object-contain mx-auto" 
              />
            </Link>

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

            {/* Mobile User Profile Summary */}
            <div className="p-3 mb-3 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-3">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user?.name || 'Tour Guide'} 
                  className="h-10 w-10 rounded-lg object-cover border border-amber-300 shadow-xs shrink-0" 
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-800 font-bold font-display shrink-0 text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-800 truncate">{user?.name || 'Tour Guide'}</p>
                <p className="text-[10px] text-yellow-700 font-semibold uppercase tracking-wider">Tour Guide</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
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
            <button 
              className="relative p-2 rounded-full transition-colors text-stone-500 hover:text-yellow-700 hover:bg-amber-50 cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-stone-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-stone-800">{user?.name || 'Tour Guide'}</p>
                <p className="text-xs text-yellow-700 uppercase tracking-wider font-semibold">Tour Guide</p>
              </div>
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user?.name || 'Tour Guide'} 
                  className="h-10 w-10 rounded-xl object-cover border border-amber-300 shadow-xs ring-2 ring-amber-100" 
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-800 font-bold font-display">
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
