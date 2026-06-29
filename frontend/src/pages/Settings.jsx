import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Settings as SettingsIcon, Sun, Moon, BookOpen, ShieldAlert, Award } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, theme, toggleTheme } = useAuth();

  const handleSavePreferences = (e) => {
    e.preventDefault();
    toast.success('Preferences saved successfully!');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Settings" />

        <main className="p-6 max-w-4xl w-full mx-auto space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Preferences */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <SettingsIcon size={18} className="text-brand-orange" />
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white">App Preferences</h3>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
                  {/* Theme Switcher */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Interface Theme</p>
                      <p className="text-[10px] text-slate-450">Switch between light and dark modes.</p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-navy dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun size={14} className="text-yellow-400" /> Light Mode
                        </>
                      ) : (
                        <>
                          <Moon size={14} /> Dark Mode
                        </>
                      )}
                    </button>
                  </div>

                  {/* Profile Summary */}
                  <div className="space-y-3.5 pt-3">
                    <h4 className="text-xs font-bold text-brand-orange uppercase tracking-wider">Account Information</h4>
                    
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-lg border dark:border-slate-850">
                      <p className="text-[11px]"><strong className="text-slate-450">Full Name:</strong> {user?.name}</p>
                      <p className="text-[11px]"><strong className="text-slate-450">Role Profile:</strong> <span className="capitalize">{user?.role}</span></p>
                      <p className="text-[11px]"><strong className="text-slate-455">Email:</strong> {user?.email}</p>
                      {user?.role === 'student' && (
                        <>
                          <p className="text-[11px]"><strong className="text-slate-455">Roll Number:</strong> {user?.rollNumber}</p>
                          <p className="text-[11px]"><strong className="text-slate-455">Department:</strong> {user?.department}</p>
                          <p className="text-[11px]"><strong className="text-slate-455">Club Name:</strong> {user?.clubName || 'None'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-4 rounded-lg bg-brand-orange hover:bg-brand-orangeDark px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-orange/20 transition-all"
                  >
                    Save Preferences
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side: Room Guidelines */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <BookOpen size={18} className="text-brand-orange" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Usage Guidelines</h3>
              </div>

              <div className="space-y-3.5 text-xs text-slate-500 leading-relaxed">
                <div className="flex gap-2">
                  <ShieldAlert size={16} className="text-brand-orange flex-shrink-0" />
                  <p><strong>Cleanliness:</strong> Always return room furniture and equipment to their designated storage positions.</p>
                </div>

                <div className="flex gap-2">
                  <Award size={16} className="text-brand-orange flex-shrink-0" />
                  <p><strong>Power Saving:</strong> Ensure all lights, fans, ACs, and instruments are switched off prior to checking out.</p>
                </div>

                <div className="flex gap-2">
                  <ShieldAlert size={16} className="text-brand-orange flex-shrink-0" />
                  <p><strong>Reporting Damages:</strong> Submit feedback immediately if any equipment is found broken. Unreported damages can lead to team fines.</p>
                </div>

                <div className="flex gap-2">
                  <Award size={16} className="text-brand-orange flex-shrink-0" />
                  <p><strong>Timing Limits:</strong> Respect slot bounds. Overrunning slots delays subsequent club practices.</p>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default Settings;
