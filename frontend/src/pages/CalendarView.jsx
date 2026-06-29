import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Calendar, Clock, Info, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CalendarView = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  // Filters
  const [rooms, setRooms] = useState([]);
  const [selectedRoomName, setSelectedRoomName] = useState('All');
  
  const [loading, setLoading] = useState(true);

  // Selected event modal states
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchCalendarData = async () => {
    try {
      const [eventsRes, roomsRes] = await Promise.all([
        api.get('/bookings/calendar'),
        api.get('/rooms')
      ]);
      setEvents(eventsRes.data);
      setFilteredEvents(eventsRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Filter events when selectedRoomName changes
  useEffect(() => {
    if (selectedRoomName === 'All') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((ev) => ev.title.includes(selectedRoomName) || ev.extendedProps.roomName === selectedRoomName)
      );
    }
  }, [selectedRoomName, events]);

  const handleEventClick = (info) => {
    const props = info.event.extendedProps;
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      roomName: props.roomName || 'Cultural Room',
      studentName: props.studentName || 'System Block',
      rollNumber: props.rollNumber || 'N/A',
      clubName: props.clubName || 'N/A',
      purpose: props.purpose || 'Maintenance block',
      status: props.status || 'Maintenance',
      participantsCount: props.participantsCount || 0,
      date: props.date,
      startTime: props.startTime,
      endTime: props.endTime
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Schedules Calendar" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 animate-fade-in flex-1 flex flex-col">
          
          {/* Calendar Controls & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cultural Room Schedules</h3>
              <p className="text-[10px] text-slate-450">Select rooms to filter the schedule layouts.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Filter Room:</label>
              <select
                value={selectedRoomName}
                onChange={(e) => setSelectedRoomName(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-1.5 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
              >
                <option value="All" className="dark:bg-slate-900">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r.name} className="dark:bg-slate-900">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendar Widget Container */}
          <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden min-h-[500px]">
            {loading ? (
              <p className="text-xs text-slate-400 py-20 text-center">Loading interactive calendar schedules...</p>
            ) : (
              <div className="h-full">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={filteredEvents}
                  eventClick={handleEventClick}
                  height="100%"
                  expandRows={true}
                  selectable={false}
                  dayMaxEvents={true}
                />
              </div>
            )}
          </div>

          {/* Color Key Guide */}
          <div className="flex flex-wrap gap-4 justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#22c55e]"></span>Approved</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#eab308]"></span>Pending</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#ef4444]"></span>Rejected</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#6b7280]"></span>Maintenance</span>
          </div>

        </main>
      </div>

      {/* EVENT DETAIL POPUP MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 animate-fade-in shadow-2xl relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 text-slate-450 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Info size={18} className="text-brand-orange" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Booking Details</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border dark:border-slate-850">
                <span>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedEvent.roomName}</p>
                  <p className="text-[10px] text-slate-400">Activity Room</p>
                </span>
                <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded ${
                  selectedEvent.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                  selectedEvent.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                  selectedEvent.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                  'bg-slate-500/10 text-slate-500'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2"><Calendar size={13} className="text-slate-400" /> <span className="font-semibold text-slate-700 dark:text-slate-300">Date:</span> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                <p className="flex items-center gap-2"><Clock size={13} className="text-slate-400" /> <span className="font-semibold text-slate-700 dark:text-slate-300">Time Slot:</span> {selectedEvent.startTime} - {selectedEvent.endTime}</p>
                <p className="flex items-center gap-2"><HelpCircle size={13} className="text-slate-400" /> <span className="font-semibold text-slate-700 dark:text-slate-300">Organized By:</span> {selectedEvent.studentName} ({selectedEvent.rollNumber})</p>
                {selectedEvent.clubName && selectedEvent.clubName !== 'N/A' && (
                  <p className="flex items-center gap-2"><HelpCircle size={13} className="text-slate-400" /> <span className="font-semibold text-slate-700 dark:text-slate-300">Club:</span> {selectedEvent.clubName}</p>
                )}
                {selectedEvent.participantsCount > 0 && (
                  <p className="flex items-center gap-2"><HelpCircle size={13} className="text-slate-400" /> <span className="font-semibold text-slate-700 dark:text-slate-300">Participants:</span> {selectedEvent.participantsCount} members</p>
                )}
                <p className="border-t dark:border-slate-800 pt-2 text-[11px] text-slate-500 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-300">Purpose:</strong> {selectedEvent.purpose}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-6 w-full rounded-lg bg-brand-navy hover:bg-blue-800 py-2 text-xs font-semibold text-white shadow-md shadow-brand-navy/20"
            >
              Back to Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
