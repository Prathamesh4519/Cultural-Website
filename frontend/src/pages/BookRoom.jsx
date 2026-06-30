import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Calendar, Clock, Users, Wrench, ShieldAlert, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BookRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data lists
  const [rooms, setRooms] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [participantsCount, setParticipantsCount] = useState(1);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Equipment selection state: key is equipmentId, value is quantity
  const [selectedEquipment, setSelectedEquipment] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, equipRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/equipment')
        ]);
        const activeRooms = roomsRes.data.filter(r => r.isActive);
        setRooms(activeRooms);
        setEquipmentList(equipRes.data);
        if (activeRooms.length === 1) {
          setSelectedRoomId(activeRooms[0]._id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load room or equipment data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEquipmentChange = (id, quantity) => {
    setSelectedEquipment(prev => {
      const updated = { ...prev };
      if (quantity <= 0) {
        delete updated[id];
      } else {
        updated[id] = quantity;
      }
      return updated;
    });
  };

  const getSelectedRoom = () => {
    return rooms.find(r => r._id === selectedRoomId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRoomId || !date || !startTime || !endTime || !purpose || !participantsCount) {
      return toast.error('Please fill in all required fields');
    }

    const room = getSelectedRoom();
    if (!room) return toast.error('Selected room is invalid');

    // Basic client checks
    const sMin = startTime.split(':').map(Number)[0] * 60 + startTime.split(':').map(Number)[1];
    const eMin = endTime.split(':').map(Number)[0] * 60 + endTime.split(':').map(Number)[1];
    
    if (sMin >= eMin) {
      return toast.error('Start time must be before end time');
    }

    const duration = (eMin - sMin) / 60;
    if (duration > room.maxDuration) {
      return toast.error(`Booking exceeds maximum duration of ${room.maxDuration} hours for this room.`);
    }

    // Format equipment for request payload
    const formattedEquipment = Object.entries(selectedEquipment).map(([equipmentId, quantity]) => ({
      equipmentId,
      quantity
    }));

    try {
      await api.post('/bookings', {
        roomId: selectedRoomId,
        purpose,
        date,
        startTime,
        endTime,
        participantsCount,
        equipment: formattedEquipment,
        additionalNotes
      });

      toast.success('Booking request submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit booking request');
    }
  };

  const activeRoom = getSelectedRoom();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Book Cultural Room" />

        <main className="p-6 max-w-4xl w-full mx-auto animate-fade-in">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cultural Room Reservation Form</h3>
                <p className="text-[10px] text-brand-orange font-semibold">Bookings are instantly auto-approved on a first-come, first-served basis if the slot is free.</p>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-10 text-center">Loading room and equipment catalogues...</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                
                {/* Section 1: Pre-filled Student Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-3">1. Student Details (Auto-filled)</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Student Name / Roll No</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name} ({user?.rollNumber})</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Department / Club</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.department} • {user?.clubName || 'N/A'}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Contact / Email</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.contactNumber} • {user?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Room Selection */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-3">2. Choose Cultural Room</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Select Room *</label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        required
                        className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2.5 px-3 text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      >
                        <option value="" className="dark:bg-slate-900">-- Select Room --</option>
                        {rooms.map(r => (
                          <option key={r._id} value={r._id} className="dark:bg-slate-900">{r.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Room Info Hint Panel */}
                    {activeRoom && (
                      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/10 dark:border-blue-900/30 dark:bg-brand-navy/5 text-xs space-y-1.5">
                        <p><strong className="text-slate-400">Timings:</strong> {activeRoom.timings.open} to {activeRoom.timings.close}</p>
                        <p><strong className="text-slate-400">Max Duration Limit:</strong> {activeRoom.maxDuration} hours</p>
                        <p><strong className="text-slate-400">Maintenance Days:</strong> {activeRoom.maintenanceDays.join(', ') || 'None'}</p>
                        <p><strong className="text-slate-400">Capacity Size:</strong> Max {activeRoom.capacity} participants</p>
                        <p><strong className="text-slate-400">Facilities:</strong> {activeRoom.facilities.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Time Slot Parameters */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-3">3. Schedule Time Slot</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-300">Date *</label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 pointer-events-none">
                          <Calendar size={14} />
                        </span>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 pl-9 pr-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-300">Start Time *</label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 pointer-events-none">
                          <Clock size={14} />
                        </span>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 pl-9 pr-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 dark:text-slate-300">End Time *</label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 pointer-events-none">
                          <Clock size={14} />
                        </span>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 pl-9 pr-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Details & Equipment */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-3">4. Purpose & Equipment Requirements</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Purpose of Booking *</label>
                      <textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        rows="2"
                        required
                        className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                        placeholder="Rehearsal / Audition / Session detail..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Number of Participants *</label>
                      <div className="relative mt-1.5">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 pointer-events-none">
                          <Users size={14} />
                        </span>
                        <input
                          type="number"
                          value={participantsCount}
                          onChange={(e) => setParticipantsCount(Number(e.target.value))}
                          min="1"
                          max={activeRoom ? activeRoom.capacity : undefined}
                          required
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2.5 pl-9 pr-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                        />
                      </div>
                      {activeRoom && participantsCount > activeRoom.capacity && (
                        <p className="mt-1 text-[10px] text-red-500 font-semibold flex items-center gap-1">
                          <ShieldAlert size={12} />
                          Exceeds room capacity limit of {activeRoom.capacity}!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Equipment Counters */}
                  {equipmentList.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-xs font-bold text-slate-650 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                        <Wrench size={14} className="text-brand-orange" />
                        Requested Equipments (Optional)
                      </label>
                      
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {equipmentList.map((eq) => {
                          const qtySelected = selectedEquipment[eq._id] || 0;
                          return (
                            <div key={eq._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs">
                              <span className="truncate pr-1">
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{eq.name}</p>
                                <p className="text-[9px] text-slate-400">Total Available: {eq.totalQuantity}</p>
                              </span>
                              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-1.5 py-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleEquipmentChange(eq._id, qtySelected - 1)}
                                  className="text-xs font-bold text-slate-500 hover:text-brand-orange"
                                >
                                  -
                                </button>
                                <span className="font-bold w-4 text-center">{qtySelected}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (qtySelected >= eq.totalQuantity) {
                                      return toast.error(`Maximum quantity available is ${eq.totalQuantity}`);
                                    }
                                    handleEquipmentChange(eq._id, qtySelected + 1);
                                  }}
                                  className="text-xs font-bold text-slate-500 hover:text-brand-orange"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Additional Notes (Optional)</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows="2"
                      className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                      placeholder="Special requirements or setup preferences..."
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-850 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-brand-orange hover:bg-brand-orangeDark py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-orange/20 transition-all"
                  >
                    Submit Booking Request
                  </button>
                </div>

              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookRoom;
