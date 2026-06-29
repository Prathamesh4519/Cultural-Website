import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, Moon, Sun, Menu, CheckCircle2, AlertCircle } from 'lucide-react';

const Navbar = ({ toggleSidebar, title }) => {
  const {
    user,
    theme,
    toggleTheme,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead
  } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-[#0f172a] transition-colors duration-200">
      {/* Left side: Hamburger menu & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white md:text-xl capitalize">
            {title || 'CultureSpace'}
          </h1>
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
            College Cultural Room Booking Portal
          </p>
        </div>
      </div>

      {/* Right side: Dark Mode & Notifications Dropdown */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors duration-150"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors duration-150"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#0f172a]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 origin-top-right rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 transition-all duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-2 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[10px] font-semibold text-brand-orange hover:text-brand-orangeDark hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-64 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markNotificationRead(n._id)}
                      className={`flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-150 ${
                        !n.isRead ? 'bg-slate-50/60 dark:bg-slate-800/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 text-brand-orange">
                        {n.title.toLowerCase().includes('approve') ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-brand-orange" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold truncate ${n.isRead ? 'text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <span className="h-6 w-px bg-slate-200 dark:bg-slate-800"></span>

        {/* Profile indicator */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange font-bold text-white text-xs shadow-sm shadow-brand-orange/20">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[100px]">
              {user?.name}
            </p>
            <p className="text-[9px] font-semibold text-slate-400 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
