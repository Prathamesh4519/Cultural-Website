import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../utils/api.js';
import { Plus, Edit2, Trash2, Boxes, Hammer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const EquipmentManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEquip, setEditingEquip] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipmentList(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load equipment list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const openAddModal = () => {
    setEditingEquip(null);
    setName('');
    setDescription('');
    setTotalQuantity(1);
    setShowModal(true);
  };

  const openEditModal = (equip) => {
    setEditingEquip(equip);
    setName(equip.name);
    setDescription(equip.description);
    setTotalQuantity(equip.totalQuantity);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment item? This will remove it from all scheduling listings.')) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success('Equipment removed successfully');
      fetchEquipment();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete equipment item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !totalQuantity) {
      return toast.error('Please enter all required fields');
    }

    const payload = {
      name,
      description,
      totalQuantity: Number(totalQuantity)
    };

    try {
      if (editingEquip) {
        await api.put(`/equipment/${editingEquip._id}`, payload);
        toast.success('Equipment details updated!');
      } else {
        await api.post('/equipment', payload);
        toast.success('New equipment added to inventory!');
      }
      setShowModal(false);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
      <Toaster position="top-right" />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Equipment Inventory" />

        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          
          {/* Header Control */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-sans">Equipment Assets</h3>
              <p className="text-[10px] text-slate-450">Manage items requested alongside room bookings.</p>
            </div>
            
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange hover:bg-brand-orangeDark px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Plus size={15} />
              Add Equipment Item
            </button>
          </div>

          {/* Table List Layout */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {loading ? (
              <p className="text-xs text-slate-450 py-16 text-center">Loading inventory sheets...</p>
            ) : equipmentList.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-16 text-center">No equipment in stock. Click "Add Equipment Item" to register.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Equipment Name</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Total Stock Quantity</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {equipmentList.map((eq) => (
                      <tr key={eq._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-350">
                        <td className="p-4 font-bold text-slate-850 dark:text-white flex items-center gap-2">
                          <Boxes size={16} className="text-brand-orange" />
                          {eq.name}
                        </td>
                        <td className="p-4">{eq.description || 'N/A'}</td>
                        <td className="p-4 font-semibold text-brand-blue">{eq.totalQuantity} units</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEditModal(eq)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
                              title="Edit Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(eq._id)}
                              className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
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

      {/* ADD/EDIT EQUIPMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900 border dark:border-slate-800 animate-fade-in shadow-2xl">
            <h3 className="text-md font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              {editingEquip ? 'Modify Equipment Item' : 'Register Equipment Item'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300">Equipment Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="e.g. Speakers, Acoustic Guitar"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300">Total Quantity in Stock *</label>
                <input
                  type="number"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(Number(e.target.value))}
                  required
                  min="1"
                  className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-650 dark:text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-transparent py-2 px-3 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="Specifications, connectors, serials..."
                ></textarea>
              </div>

              <div className="flex gap-2.5 mt-6 border-t dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-205 dark:border-slate-800 py-2 text-xs font-semibold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-orange py-2 text-xs font-semibold text-white hover:bg-brand-orangeDark shadow-md shadow-brand-orange/20"
                >
                  {editingEquip ? 'Save Changes' : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipmentManagement;
