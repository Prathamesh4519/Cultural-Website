import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Mail, Lock, User, Hash, GraduationCap, Phone, Club } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    department: '',
    clubName: '',
    contactNumber: ''
  });
  
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, rollNumber, department, clubName, contactNumber } = formData;

    if (!name || !email || !password || !rollNumber || !department || !clubName || !contactNumber) {
      return toast.error('Please fill in all required fields');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    // Validate college email domain (simple client side hint)
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const allowed = ['college.edu', 'student.college.edu', 'gmail.com'];
    if (!allowed.includes(emailDomain)) {
      return toast.error('Must use college domains like @college.edu (or gmail.com for testing)');
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful! Logging in...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-955 px-4 py-12 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-brand-navy/30 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-brand-orange/15 blur-3xl"></div>

      <div className="z-10 w-full max-w-lg animate-fade-in rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange text-white shadow-lg shadow-brand-orange/30">
            <Sparkles size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            CultureSpace
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Create Student Account
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Grid for Name & Roll No */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Full Name *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Roll Number *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Hash size={15} />
                </span>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="CS23B1012"
                  required
                />
              </div>
            </div>
          </div>

          {/* Grid for Dept & Club */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Department *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <GraduationCap size={15} />
                </span>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="Computer Science"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Club Name *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Club size={15} />
                </span>
                <select
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-955/80 py-2 pl-9 pr-4 text-xs text-white focus:border-brand-orange focus:outline-none"
                >
                  <option value="" className="bg-slate-900">-- Select Club --</option>
                  <option value="Crescendo" className="bg-slate-900">Crescendo</option>
                  <option value="Estoria" className="bg-slate-900">Estoria</option>
                  <option value="D-Taraxia" className="bg-slate-900">D-Taraxia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid for Email & Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">College Email *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="john@college.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Contact Number *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-955/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>
          </div>

          {/* Grid for Password & Confirm Password */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Password *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-955/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Confirm Password *</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-505">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-850 bg-slate-955/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange py-2.5 text-xs font-semibold text-white hover:bg-brand-orangeDark transition-all duration-200 shadow-md shadow-brand-orange/20"
          >
            {loading ? 'Submitting Details...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-orange hover:text-brand-orangeDark hover:underline"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
