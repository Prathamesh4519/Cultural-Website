import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  AlertTriangle,
  FileCheck2,
  QrCode,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [stats, setStats] = useState({
    todayBookingsCount: 0,
    pendingCount: 0,
    utilizationRate: 0,
    totalFinesPending: 0,
    activeClubs: [],
    monthlyBookings: [],
    roomCounts: []
  });
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);

  // QR Check-in Simulator state
  const [checkinId, setCheckinId] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  // Rejection modal state
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Maintenance block state
  const [maintenanceRoomId, setMaintenanceRoomId] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [blockingDate, setBlockingDate] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, roomsRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/bookings'),
        api.get('/rooms')
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/bookings/${id}/approve`);
      toast.success('Booking request approved! OTP email sent to student.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason) return toast.error('Please enter rejection reason');

    try {
      await api.put(`/bookings/${rejectingBooking._id}/reject`, { reason: rejectionReason });
      toast.success('Booking request rejected.');
      setRejectingBooking(null);
      setRejectionReason('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  const handleScanCheckin = async (e) => {
    e.preventDefault();
    if (!checkinId) return toast.error('Please input a Booking ID to simulate QR scan');

    setCheckingIn(true);
    try {
      const res = await api.post('/bookings/scan-checkin', { bookingId: checkinId });
      toast.success(res.data.message || 'Student checked in successfully!');
      setCheckinId('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to check in student');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleAddMaintenanceBlock = async (e) => {
    e.preventDefault();
    if (!maintenanceRoomId || !maintenanceDate) {
      return toast.error('Please select a room and date');
    }

    setBlockingDate(true);
    try {
      const room = rooms.find(r => r._id === maintenanceRoomId);
      if (!room) return;

      const dateObj = new Date(maintenanceDate);
      const isDateDuplicate = room.unavailableDates.some(d => 
        new Date(d).toDateString() === dateObj.toDateString()
      );

      if (isDateDuplicate) {
        setBlockingDate(false);
        return toast.error('This date is already blocked for maintenance');
      }

      const updatedDates = [...room.unavailableDates, dateObj];
      await api.put(`/rooms/${maintenanceRoomId}`, { unavailableDates: updatedDates });

      toast.success('Maintenance date block saved successfully!');
      setMaintenanceRoomId('');
      setMaintenanceDate('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add maintenance block');
    } finally {
      setBlockingDate(false);
    }
  };

  const pendingRequests = bookings.filter(b => b.status === 'Pending');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Admin Dashboard" />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Toaster position="top-right" />

          {/* Stats Indicators Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Bookings</span>
              <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">{stats.todayBookingsCount}</p>
            </div>
            
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Pending Requests</span>
              <p className="mt-1 text-2xl font-bold text-brand-orange">{stats.pendingCount}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">Room Utilization %</span>
              <p className="mt-1 text-2xl font-bold text-brand-blue">{stats.utilizationRate}%</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Pending Fines</span>
              <p className="mt-1 text-2xl font-bold text-red-500">₹{stats.totalFinesPending}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left: Pending Bookings Requests */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pending Requests Approval Desk</h3>
                  <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-xs text-brand-orange font-bold">
                    {pendingRequests.length} pending
                  </span>
                </div>

                {loading ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Loading pending transactions...</p>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-12 text-center">
                    All clear! No booking requests are currently pending.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((b) => (
                      <div key={b._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-extrabold text-brand-navy dark:text-blue-400 text-sm">{b.room?.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={12} /> {new Date(b.date).toLocaleDateString()}
                              <Clock size={12} className="ml-1" /> {b.startTime} - {b.endTime}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(b._id)}
                              className="flex items-center gap-1 rounded bg-green-500 hover:bg-green-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingBooking(b)}
                              className="flex items-center gap-1 rounded bg-red-500 hover:bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 border dark:border-slate-850 p-2.5 rounded-lg">
                          <p><strong className="text-slate-400">Student:</strong> {b.studentName} ({b.rollNumber})</p>
                          <p><strong className="text-slate-400">Department:</strong> {b.department}</p>
                          {b.clubName && <p className="col-span-2"><strong className="text-slate-400">Club:</strong> {b.clubName}</p>}
                          <p className="col-span-2"><strong className="text-slate-400">Purpose:</strong> {b.purpose}</p>
                          {b.equipment && b.equipment.length > 0 && (
                            <p className="col-span-2 text-brand-orange font-semibold">
                              <strong className="text-slate-400 font-normal">Equipment:</strong>{' '}
                              {b.equipment.map((eq) => `${eq.equipmentId?.name} (Qty ${eq.quantity})`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: QR check-in & Maintenance block */}
            <div className="space-y-6">
              
              {/* QR scanner check-in simulator */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <QrCode size={18} className="text-brand-orange" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">QR Check-In Simulator</h3>
                </div>
                
                <form onSubmit={handleScanCheckin} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Scan or Input Booking ID</label>
                    <input
                      type="text"
                      value={checkinId}
                      onChange={(e) => setCheckinId(e.target.value)}
                      className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                      placeholder="e.g. 667fef295..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={checkingIn}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy hover:bg-blue-800 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    {checkingIn ? 'Checking In...' : 'Verify & Check In'}
                  </button>
                </form>
              </div>

              {/* Maintenance blocks scheduler */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <AlertTriangle size={18} className="text-brand-orange" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Maintenance Day Blocks</h3>
                </div>

                <form onSubmit={handleAddMaintenanceBlock} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Room *</label>
                    <select
                      value={maintenanceRoomId}
                      onChange={(e) => setMaintenanceRoomId(e.target.value)}
                      required
                      className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                    >
                      <option value="" className="dark:bg-slate-900">-- Choose Room --</option>
                      {rooms.map(r => (
                        <option key={r._id} value={r._id} className="dark:bg-slate-900">{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Date to Block *</label>
                    <input
                      type="date"
                      value={maintenanceDate}
                      onChange={(e) => setMaintenanceDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={blockingDate}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-650 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <Plus size={14} />
                    {blockingDate ? 'Saving Block...' : 'Block Room Date'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 animate-fade-in shadow-2xl">
            <h3 className="text-md font-bold text-slate-850 dark:text-white">Reject Booking Request</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Provide a rejection reason which will be emailed to the student.
            </p>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  required
                  className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                  placeholder="e.g. Room is booked for college events, equipment unavailable..."
                ></textarea>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingBooking(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 rounded-lg border border-slate-205 dark:border-slate-800 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white hover:bg-red-600 shadow-md shadow-red-500/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
