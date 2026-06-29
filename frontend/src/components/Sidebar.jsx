import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  History,
  DoorOpen,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  X,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Book Room', path: '/book-room', icon: CalendarPlus },
    { name: 'Calendar Schedule', path: '/calendar', icon: CalendarDays },
    { name: 'Booking History', path: '/history', icon: History },
    { name: 'Rooms & facilities', path: '/rooms', icon: DoorOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Admin Console', path: '/admin', icon: LayoutDashboard },
    { name: 'Interactive Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Room Assets', path: '/admin/rooms', icon: DoorOpen },
    { name: 'Equipment Inventory', path: '/admin/equipment', icon: Boxes },
    { name: 'Booking Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const links = user?.role === 'student' ? studentLinks : adminLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-dark text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange text-white">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Culture<span className="text-brand-orange">Space</span>
            </span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-orange text-white font-semibold shadow-md shadow-brand-orange/20 scale-[1.02]'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-lg bg-slate-900/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy font-bold text-white text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
