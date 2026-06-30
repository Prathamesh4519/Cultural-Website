import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Mail, Lock, User, Hash, GraduationCap, Phone, Club, ShieldAlert } from 'lucide-react';
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
  
  const [otp, setOtp] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, rollNumber, department, contactNumber } = formData;

    if (!name || !email || !password || !rollNumber || !department || !contactNumber) {
      return toast.error('Please fill in all required fields');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    // Validate college email domain (simple client side hint)
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const allowed = ['college.edu', 'student.college.edu', 'gmail.com'];
    if (!allowed.includes(emailDomain)) {
      toast.error('Must use college domains like @college.edu (or gmail.com for testing)');
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration initial! Verification OTP sent.');
      setShowOtpScreen(true);
    } catch (err) {
      console.error(err);
      toast.error(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the OTP');

    setLoading(true);
    try {
      await verifyOtp(formData.email, otp);
      toast.success('Registration complete! Welcome!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err || 'Verification failed');
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

        {!showOtpScreen ? (
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
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white focus:border-brand-orange focus:outline-none"
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
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
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
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Confirm Password *</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={15} />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
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
        ) : (
          /* OTP Screen */
          <form className="mt-6 space-y-4 animate-fade-in" onSubmit={handleVerifyOtp}>
            <div className="rounded-lg bg-slate-955/60 p-4 text-center border border-slate-800">
              <ShieldAlert size={28} className="mx-auto text-brand-orange animate-bounce" />
              <p className="mt-2 text-xs text-slate-300">
                A 6-digit OTP verification code has been sent to <strong>{formData.email}</strong>.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                (If running locally without SMTP, check the server console logs for the OTP code)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 text-center">
                Enter Verification OTP
              </label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-2 w-full text-center tracking-[8px] font-bold text-lg rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 text-white focus:border-brand-orange focus:outline-none"
                placeholder="000000"
                required
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowOtpScreen(false)}
                className="flex-1 rounded-lg border border-slate-800 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand-orange py-2 text-xs font-semibold text-white hover:bg-brand-orangeDark shadow-md shadow-brand-orange/20"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        {!showOtpScreen && (
          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-orange hover:text-brand-orangeDark hover:underline"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
