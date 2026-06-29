import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Calendar, 
  Clock, 
  QrCode, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  MessageSquarePlus, 
  ArrowRight,
  UserCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeQrBooking, setActiveQrBooking] = useState(null);
  const [activeFeedbackBooking, setActiveFeedbackBooking] = useState(null);
  
  // Feedback form states
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [damageReported, setDamageReported] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePhoto, setDamagePhoto] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Booking request cancelled successfully!');
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Convert uploaded photo to Base64
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDamagePhoto(reader.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', {
        bookingId: activeFeedbackBooking._id,
        rating,
        comments,
        damageReported,
        damageDescription,
        damagePhoto
      });

      toast.success('Thank you! Feedback submitted.');
      
      // Reset form states
      setRating(5);
      setComments('');
      setDamageReported(false);
      setDamageDescription('');
      setDamagePhoto('');
      setActiveFeedbackBooking(null);
      
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  // Divide bookings
  const pendingRequests = bookings.filter(b => b.status === 'Pending');
  const upcomingBookings = bookings.filter(b => b.status === 'Approved');
  const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Rejected' || b.status === 'Cancelled');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Student Dashboard" />
        
        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto animate-fade-in">
          
          {/* Welcome Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-brand-navy to-brand-orangeDark p-6 text-white shadow-lg overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-white/5 blur-2xl"></div>
            <div className="relative z-10 space-y-2">
              <h2 className="text-xl font-bold md:text-2xl">Welcome back, {user?.name}!</h2>
              <p className="text-xs text-slate-200 max-w-lg">
                View availability, reserve rehearsal times, and check into college facilities easily. Please arrive on time for your bookings.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
              <p className="mt-1 text-2xl font-bold text-slate-850 dark:text-white">{bookings.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">Upcoming Approved</span>
              <p className="mt-1 text-2xl font-bold text-green-500">{upcomingBookings.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">Pending Requests</span>
              <p className="mt-1 text-2xl font-bold text-brand-orange">{pendingRequests.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sessions Finished</span>
              <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-300">
                {bookings.filter(b => b.status === 'Completed').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left: Booking Sections */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Upcoming Approved Sessions */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-green-500" size={18} />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Upcoming Sessions</h3>
                </div>
                
                {loading ? (
                  <p className="text-xs text-slate-450 text-center py-4">Checking for bookings...</p>
                ) : upcomingBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                    No upcoming sessions scheduled. Go to "Book Room" to request slots.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((b) => (
                      <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/40">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{b.room?.name}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Calendar size={12} /> {new Date(b.date).toLocaleDateString()}
                            <Clock size={12} className="ml-1" /> {b.startTime} - {b.endTime}
                          </p>
                          <p className="text-[10px] text-slate-400">Purpose: {b.purpose}</p>
                          {b.checkedIn && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-bold bg-green-500/10 text-green-500 rounded border border-green-500/20">
                              Checked In
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveQrBooking(b)}
                            className="flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors shadow-sm"
                          >
                            <QrCode size={14} />
                            Check-In QR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Approvals */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="text-brand-orange" size={18} />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pending Requests</h3>
                </div>

                {loading ? (
                  <p className="text-xs text-slate-450 text-center py-4">Checking for bookings...</p>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                    No pending booking requests.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((b) => (
                      <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/40">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{b.room?.name}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Calendar size={12} /> {new Date(b.date).toLocaleDateString()}
                            <Clock size={12} className="ml-1" /> {b.startTime} - {b.endTime}
                          </p>
                          <p className="text-[10px] text-slate-400">Purpose: {b.purpose}</p>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(b._id)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors"
                        >
                          <XCircle size={14} />
                          Cancel Request
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Profile & Past Sessions */}
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <UserCheck size={18} className="text-brand-orange" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white font-sans">Student Profile</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-xs">
                    <GraduationCap className="text-slate-400" size={16} />
                    <div>
                      <p className="text-[10px] text-slate-400">Roll Number / Department</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {user?.rollNumber} • {user?.department}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 text-xs">
                    <Building className="text-slate-400" size={16} />
                    <div>
                      <p className="text-[10px] text-slate-400">Associated Club</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {user?.clubName || 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <Clock className="text-slate-400" size={16} />
                    <div>
                      <p className="text-[10px] text-slate-400">College Email</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Sessions & Feedback portal */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <History className="text-slate-500" size={18} />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Past Sessions</h3>
                </div>

                {loading ? (
                  <p className="text-xs text-slate-450 text-center py-4">Checking logs...</p>
                ) : pastBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                    No completed sessions yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.slice(0, 4).map((b) => (
                      <div key={b._id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950/20 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-white">{b.room?.name}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded capitalize ${
                            b.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                            b.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-450 mt-1">
                          {new Date(b.date).toLocaleDateString()} • {b.startTime} - {b.endTime}
                        </p>
                        {b.status === 'Completed' && (
                          <button
                            onClick={() => setActiveFeedbackBooking(b)}
                            className="mt-2 flex items-center gap-1 text-[9px] font-bold text-brand-orange hover:text-brand-orangeDark transition-colors"
                          >
                            <MessageSquarePlus size={12} />
                            Leave Feedback / Report Damage
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* QR MODAL */}
      {activeQrBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 text-center animate-fade-in shadow-2xl">
            <h3 className="text-md font-extrabold text-slate-800 dark:text-white">Check-in QR Pass</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Present this pass at the cultural room desk.
            </p>
            
            {activeQrBooking.qrCode ? (
              <div className="my-4 mx-auto w-48 h-48 bg-white p-2 border border-slate-100 rounded-lg shadow-inner flex items-center justify-center">
                <img src={activeQrBooking.qrCode} alt="Booking QR Code" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="my-4 p-4 border border-slate-200 rounded text-xs text-slate-400">
                Generating QR Code...
              </div>
            )}

            <div className="text-left text-xs bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 mb-4 space-y-1">
              <p><strong className="text-slate-500">Room:</strong> {activeQrBooking.room?.name}</p>
              <p><strong className="text-slate-500">Schedule:</strong> {new Date(activeQrBooking.date).toLocaleDateString()} @ {activeQrBooking.startTime}-{activeQrBooking.endTime}</p>
              <p><strong className="text-slate-500">Student:</strong> {activeQrBooking.studentName}</p>
              <p><strong className="text-slate-500">ID:</strong> {activeQrBooking._id}</p>
            </div>

            <button
              onClick={() => setActiveQrBooking(null)}
              className="w-full rounded-lg bg-brand-navy hover:bg-blue-800 py-2 text-xs font-semibold text-white shadow-md shadow-brand-navy/20"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK & DAMAGE REPORT MODAL */}
      {activeFeedbackBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 animate-fade-in shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Submit Session Feedback</h3>
            <p className="text-[10px] text-slate-500">
              Provide ratings and report any damaged equipment for booking: <strong>{activeFeedbackBooking._id}</strong>
            </p>

            <form onSubmit={submitFeedback} className="mt-4 space-y-4">
              {/* Rating selector (1-5) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-lg transition-transform hover:scale-110 ${
                        star <= rating ? 'text-yellow-500' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows="3"
                  className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 px-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  placeholder="Share your experience using the room..."
                ></textarea>
              </div>

              {/* Damage Report checkbox */}
              <div className="flex items-center gap-2 p-3 rounded-lg border border-red-100 bg-red-50/20 dark:border-red-950/40 dark:bg-red-500/5">
                <input
                  type="checkbox"
                  id="damageReported"
                  checked={damageReported}
                  onChange={(e) => setDamageReported(e.target.checked)}
                  className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="damageReported" className="text-xs font-bold text-red-650 dark:text-red-400 cursor-pointer">
                  Report Damage / Broken Equipment
                </label>
              </div>

              {/* Collapsible Damage Fields */}
              {damageReported && (
                <div className="space-y-3 p-3 border border-red-100 dark:border-red-950/40 rounded-lg animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-red-600 dark:text-red-400">Describe the Damage *</label>
                    <textarea
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      rows="2"
                      required={damageReported}
                      className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                      placeholder="Specify what is broken (e.g. Guitar string snapped, mic stand broken)..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-red-600 dark:text-red-400">Upload Photo proof</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="w-full mt-1 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-500/10 file:text-red-500 hover:file:bg-red-500/20"
                    />
                    {damagePhoto && (
                      <div className="mt-2 max-w-full h-32 rounded-lg overflow-hidden border">
                        <img src={damagePhoto} alt="Damage Upload Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedbackBooking(null);
                    setDamageReported(false);
                    setDamageDescription('');
                    setDamagePhoto('');
                  }}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-orange py-2 text-xs font-semibold text-white hover:bg-brand-orangeDark shadow-md shadow-brand-orange/20"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
