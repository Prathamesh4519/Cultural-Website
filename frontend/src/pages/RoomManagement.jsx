import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Settings, Upload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const RoomManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [facilities, setFacilities] = useState('');
  const [image, setImage] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [maintenanceDays, setMaintenanceDays] = useState([]);
  const [maxDuration, setMaxDuration] = useState(3);
  const [isActive, setIsActive] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    setName('');
    setDescription('');
    setCapacity(10);
    setFacilities('');
    setImage('');
    setOpenTime('08:00');
    setCloseTime('21:00');
    setMaintenanceDays(['Sunday']);
    setMaxDuration(3);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setName(room.name);
    setDescription(room.description);
    setCapacity(room.capacity);
    setFacilities(room.facilities.join(', '));
    setImage(room.image || '');
    setOpenTime(room.timings?.open || '08:00');
    setCloseTime(room.timings?.close || '21:00');
    setMaintenanceDays(room.maintenanceDays || []);
    setMaxDuration(room.maxDuration || 3);
    setIsActive(room.isActive);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room? This action is permanent.')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted successfully!');
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete room');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Base64 data URI
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaintenanceDayCheckbox = (day) => {
    setMaintenanceDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !capacity || !openTime || !closeTime) {
      return toast.error('Please enter all required fields');
    }

    const payload = {
      name,
      description,
      capacity: Number(capacity),
      facilities: facilities.split(',').map(f => f.trim()).filter(Boolean),
      image,
      timings: { open: openTime, close: closeTime },
      maintenanceDays,
      maxDuration: Number(maxDuration),
      isActive
    };

    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, payload);
        toast.success('Room details updated!');
      } else {
        await api.post('/rooms', payload);
        toast.success('New room created successfully!');
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleActive = async (room) => {
    try {
      await api.put(`/rooms/${room._id}`, { isActive: !room.isActive });
      toast.success(`Room status updated to ${!room.isActive ? 'Active' : 'Inactive'}`);
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle room status');
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Room Asset Manager" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cultural Room Assets</h3>
              <p className="text-[10px] text-slate-450">Add, configure, or mark rooms unavailable.</p>
            </div>
            
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange hover:bg-brand-orangeDark px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Plus size={15} />
              Add Cultural Room
            </button>
          </div>

          {/* Rooms Grid Cards */}
          {loading ? (
            <p className="text-xs text-slate-400 py-16 text-center">Loading rooms list...</p>
          ) : rooms.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-16 text-center">No rooms configured yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div key={room._id} className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
                  {/* Image container */}
                  <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center text-slate-400">
                    {room.image ? (
                      <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400 flex flex-col items-center gap-1.5">
                        <Upload size={24} /> No Image Provided
                      </span>
                    )}

                    {/* Status Badge overlay */}
                    <button
                      onClick={() => handleToggleActive(room)}
                      className={`absolute top-3 right-3 px-2 py-0.5 text-[8px] font-bold rounded shadow border cursor-pointer uppercase ${
                        room.isActive 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {room.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Room Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-md font-bold text-slate-800 dark:text-white">{room.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{room.description || 'No description added yet.'}</p>
                    </div>

                    <div className="text-xs space-y-1.5 border-t dark:border-slate-800 pt-3">
                      <p><strong className="text-slate-400">Capacity size:</strong> Max {room.capacity} members</p>
                      <p><strong className="text-slate-400">Timings:</strong> {room.timings?.open || '08:00'} to {room.timings?.close || '21:00'}</p>
                      <p><strong className="text-slate-400">Maintenance:</strong> {room.maintenanceDays.join(', ') || 'None'}</p>
                      <p><strong className="text-slate-400">Max Duration:</strong> {room.maxDuration} hours</p>
                    </div>

                    {room.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {room.facilities.map((fac, idx) => (
                          <span key={idx} className="rounded bg-slate-100 dark:bg-slate-800/80 text-[9px] font-semibold text-slate-600 dark:text-slate-350 px-1.5 py-0.5">
                            {fac}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-3 border-t dark:border-slate-800">
                      <button
                        onClick={() => openEditModal(room)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-205 dark:border-slate-800 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/30 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* ADD/EDIT ROOM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 animate-fade-in shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-md font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              {editingRoom ? 'Modify Cultural Room' : 'Add New Cultural Room'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-300">Room Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. Music Room"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-300">Capacity Size *</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    required
                    className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300">Room Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                  placeholder="Facilities descriptions, rules..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-300">Open Timings *</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-300">Close Timings *</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-650 dark:text-slate-300">Max Duration (Hours) *</label>
                  <input
                    type="number"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    required
                    className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. 3"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300">Facilities (Comma Separated)</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-800 dark:text-white focus:outline-none"
                  placeholder="e.g. Soundproof, Speakers, AC, Mirrors"
                />
              </div>

              {/* Maintenance Days checklists */}
              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300 mb-1">Standard Maintenance Days</label>
                <div className="flex flex-wrap gap-2.5 mt-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border dark:border-slate-850">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center gap-1 cursor-pointer font-medium text-slate-600 dark:text-slate-350">
                      <input
                        type="checkbox"
                        checked={maintenanceDays.includes(day)}
                        onChange={() => handleMaintenanceDayCheckbox(day)}
                        className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                      />
                      {day.substring(0, 3)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Base64 Photo Upload */}
              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300">Room Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full mt-1.5 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-orange/10 file:text-brand-orange hover:file:bg-brand-orange/20"
                />
                {image && (
                  <div className="mt-2 max-w-full h-28 rounded-lg overflow-hidden border">
                    <img src={image} alt="Upload Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="isActive" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark Room Active & Bookable
                </label>
              </div>

              <div className="flex gap-2.5 mt-6 border-t dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-205 dark:border-slate-800 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-orange py-2.5 text-xs font-semibold text-white hover:bg-brand-orangeDark shadow-md shadow-brand-orange/20"
                >
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomManagement;
