import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { FileSpreadsheet, FileText, BarChart3, TrendingUp, Users, Compass } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const COLORS = ['#1e3a8a', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#6b7280'];

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todayBookingsCount: 0,
    pendingCount: 0,
    utilizationRate: 0,
    activeClubs: [],
    peakHours: [],
    monthlyBookings: [],
    roomCounts: []
  });

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/stats');
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = async (type) => {
    const loadingToast = toast.loading(`Generating and downloading ${type === 'excel' ? 'Excel Sheet' : 'PDF Report'}...`);
    try {
      const token = localStorage.getItem('culturespace_token');
      const response = await fetch(`http://localhost:5000/api/analytics/export/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate export file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CultureSpace_Booking_Report.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.dismiss(loadingToast);
      toast.success(`${type === 'excel' ? 'Excel Spreadsheet' : 'PDF Document'} exported successfully!`);
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error(`Failed to export booking data to ${type}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Booking Analytics" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          
          {/* Header & Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white">System Reports</h3>
              <p className="text-[10px] text-slate-450">Review utilization trends, club usage rankings, and download spreadsheet logs.</p>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              >
                <FileSpreadsheet size={15} className="text-green-600" />
                Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-1.5 rounded-lg bg-brand-navy hover:bg-blue-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                <FileText size={15} className="text-red-400" />
                Export PDF
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-20 text-center">Loading charts and distributions analytics...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Monthly booking distribution */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-brand-orange" />
                  Monthly Approved Bookings
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyBookings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Room occupancy distribution */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                  <Compass size={16} className="text-brand-orange" />
                  Room Booking Utilization Share
                </h4>
                <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
                  {data.roomCounts.length === 0 ? (
                    <p className="text-xs text-slate-400">No rooms utilization data available</p>
                  ) : (
                    <>
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.roomCounts}
                              dataKey="count"
                              nameKey="room"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              fill="#8884d8"
                              labelLine={false}
                            >
                              {data.roomCounts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Pie chart legends */}
                      <div className="space-y-1.5 text-[10px] font-semibold text-slate-500">
                        {data.roomCounts.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                            <span>{entry.room}: {entry.count} bookings</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Chart 3: Active club statistics */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                  <Users size={16} className="text-brand-orange" />
                  Most Active Booking Clubs
                </h4>
                <div className="h-64">
                  {data.activeClubs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-20 text-center">No club bookings recorded yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.activeClubs} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={70} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1e3a8a" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 4: Peak booking hours */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-brand-orange" />
                  Peak Booking Hours
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Analytics;
