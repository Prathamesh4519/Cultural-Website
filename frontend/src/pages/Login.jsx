import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter all fields');
    }

    setLoading(true);
    try {
      if (isAdmin) {
        await loginAdmin(email, password);
        toast.success('Admin login successful!');
        navigate('/admin');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error(err || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Decorative Gradient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-brand-navy/30 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-brand-orange/15 blur-3xl"></div>

      {/* Main glassmorphic login card */}
      <div className="z-10 w-full max-w-md animate-fade-in rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange text-white shadow-lg shadow-brand-orange/30">
            <Sparkles size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            CultureSpace
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            College Cultural Room Booking Portal
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="mt-6 flex rounded-lg bg-slate-950 p-1">
          <button
            onClick={() => {
              setIsAdmin(false);
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all duration-200 ${
              !isAdmin ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Login
          </button>
          <button
            onClick={() => {
              setIsAdmin(true);
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all duration-200 ${
              isAdmin ? 'bg-brand-navy text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Console
          </button>
        </div>

        {/* Form Fields */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-955/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-505 focus:border-brand-orange focus:outline-none"
                placeholder={isAdmin ? "admin@culturespace.edu" : "student@college.edu"}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Password
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-955/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-505 focus:border-brand-orange focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-md ${
              isAdmin 
                ? 'bg-brand-navy hover:bg-blue-800 shadow-brand-navy/20' 
                : 'bg-brand-orange hover:bg-brand-orangeDark shadow-brand-orange/20'
            }`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Register Redirect links */}
        {!isAdmin && (
          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-orange hover:text-brand-orangeDark hover:underline"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
