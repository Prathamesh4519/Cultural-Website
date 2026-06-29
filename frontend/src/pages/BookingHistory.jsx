import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { Calendar, Clock, MessageSquarePlus, Info, Check, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const BookingHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomFilter, setRoomFilter] = useState('All');

  // Detailed Modal state
  const [detailBooking, setDetailBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getUniqueRooms = () => {
    const list = bookings.map(b => b.room?.name).filter(Boolean);
    return ['All', ...new Set(list)];
  };

  const filteredBookings = bookings.filter(b => {
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchRoom = roomFilter === 'All' || b.room?.name === roomFilter;
    return matchStatus && matchRoom;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Booking History" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Transaction Logs</h3>
              <p className="text-[10px] text-slate-450">Review history, rejection details, and check-in statuses.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-1.5 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="All" className="dark:bg-slate-900">All Statuses</option>
                  <option value="Approved" className="dark:bg-slate-900">Approved</option>
                  <option value="Pending" className="dark:bg-slate-900">Pending</option>
                  <option value="Completed" className="dark:bg-slate-900">Completed</option>
                  <option value="Rejected" className="dark:bg-slate-900">Rejected</option>
                  <option value="Cancelled" className="dark:bg-slate-900">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Room:</label>
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-1.5 px-3 text-xs text-slate-850 dark:text-white focus:outline-none"
                >
                  {getUniqueRooms().map(r => (
                    <option key={r} value={r} className="dark:bg-slate-900">{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabular List Layout */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {loading ? (
              <p className="text-xs text-slate-400 py-16 text-center">Retrieving history logs...</p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-16 text-center">No bookings match the filter criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Room Required</th>
                      <th className="p-4">Time Slot</th>
                      <th className="p-4">Purpose</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Checked-In</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-350">
                        <td className="p-4 font-semibold">{new Date(b.date).toLocaleDateString()}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-white">{b.room?.name || 'Deleted Room'}</td>
                        <td className="p-4">{b.startTime} - {b.endTime}</td>
                        <td className="p-4 max-w-[150px] truncate">{b.purpose}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                            b.status === 'Approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            b.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                            b.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            b.status === 'Completed' ? 'bg-blue-500/10 text-brand-blue border border-brand-blue/20' :
                            'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {b.checkedIn ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                              <Check size={12} /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setDetailBooking(b)}
                              className="rounded p-1 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* DETAIL VIEW MODAL */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 animate-fade-in shadow-2xl relative">
            <h3 className="text-md font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Booking Receipt Summary
            </h3>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700 dark:text-slate-350">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border dark:border-slate-850">
                <p><strong>Room:</strong> {detailBooking.room?.name || 'N/A'}</p>
                <p><strong>Status:</strong> <span className="font-bold">{detailBooking.status}</span></p>
                <p><strong>Date:</strong> {new Date(detailBooking.date).toLocaleDateString()}</p>
                <p><strong>Time Slot:</strong> {detailBooking.startTime} - {detailBooking.endTime}</p>
              </div>

              <div className="space-y-1">
                <p><strong>Student Name:</strong> {detailBooking.studentName}</p>
                <p><strong>Roll Number:</strong> {detailBooking.rollNumber}</p>
                <p><strong>Department:</strong> {detailBooking.department}</p>
                <p><strong>Club:</strong> {detailBooking.clubName || 'None'}</p>
                <p><strong>Purpose:</strong> {detailBooking.purpose}</p>
                <p><strong>Participants Count:</strong> {detailBooking.participantsCount} persons</p>
              </div>

              {detailBooking.equipment && detailBooking.equipment.length > 0 && (
                <div className="border-t dark:border-slate-800 pt-3">
                  <p className="font-bold text-slate-800 dark:text-white mb-1.5">Equipments Checked Out:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    {detailBooking.equipment.map((eq, i) => (
                      <li key={i}>
                        {eq.equipmentId?.name || 'Instrument'} (Qty: {eq.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailBooking.status === 'Rejected' && detailBooking.rejectionReason && (
                <div className="border-t border-red-100 dark:border-red-950/40 pt-3 text-red-500">
                  <p className="font-bold">Rejection Reason:</p>
                  <p className="bg-red-50/20 dark:bg-red-500/5 p-2 rounded mt-1 border border-red-100 dark:border-red-950/30">
                    {detailBooking.rejectionReason}
                  </p>
                </div>
              )}

              {detailBooking.checkedIn && (
                <div className="border-t dark:border-slate-800 pt-3 text-green-500">
                  <p className="font-semibold">Checked In successfully at:</p>
                  <p className="text-slate-400 mt-0.5">{new Date(detailBooking.checkedInAt).toLocaleString()}</p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 pt-2 border-t dark:border-slate-800">
                Booking ID: {detailBooking._id} • Created on {new Date(detailBooking.createdAt).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => setDetailBooking(null)}
              className="mt-6 w-full rounded-lg bg-brand-navy hover:bg-blue-800 py-2 text-xs font-semibold text-white shadow-md shadow-brand-navy/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
