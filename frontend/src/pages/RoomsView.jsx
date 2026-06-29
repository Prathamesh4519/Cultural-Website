import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { Sparkles, Users, Clock, Compass } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const RoomsView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms');
        setRooms(res.data.filter(r => r.isActive));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load rooms catalogue');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Rooms & Facilities" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          
          {/* Header Description */}
          <div className="p-4 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cultural Room Directories</h3>
            <p className="text-[10px] text-slate-450">Browse the college activities catalog, capacity limits, and technical facilities details.</p>
          </div>

          {/* Rooms grid list */}
          {loading ? (
            <p className="text-xs text-slate-400 py-16 text-center">Loading cultural room list...</p>
          ) : rooms.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-16 text-center">No active cultural rooms found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div key={room._id} className="rounded-2xl border border-slate-205 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
                  {/* Photo frame */}
                  <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center text-slate-400">
                    {room.image ? (
                      <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <Compass size={28} className="animate-spin-slow" />
                    )}
                  </div>

                  {/* Room details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-md font-bold text-slate-850 dark:text-white">{room.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">{room.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-3 border-t dark:border-slate-800 text-[10px] text-slate-500">
                      <p className="flex items-center gap-1.5"><Users size={14} className="text-brand-orange" /> Max {room.capacity} members</p>
                      <p className="flex items-center gap-1.5"><Clock size={14} className="text-brand-orange" /> Open: {room.timings.open}-{room.timings.close}</p>
                    </div>

                    {room.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 border-t dark:border-slate-800 pt-3">
                        {room.facilities.map((fac, idx) => (
                          <span key={idx} className="rounded bg-slate-100 dark:bg-slate-800/80 text-[9px] font-semibold text-slate-600 dark:text-slate-350 px-1.5 py-0.5">
                            {fac}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default RoomsView;
