import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { EATM_EMBLEM, EATM_OFFICIAL_LOGO } from '../../constants/assets';

export const LoginPage: React.FC = () => {
  const { user, login, loginWithGoogle, loginWithGithub } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already signed in
  React.useEffect(() => {
    if (user && user.id) {
      const targetPath = user.role === 'faculty' ? '/faculty/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = emailOrRoll.trim();
    if (!cleanInput || !password) {
      error('Please enter your campus email or roll number and password.');
      return;
    }
    setLoading(true);
    try {
      await login(cleanInput, password);
      success('Welcome back to EATM CampusConnect!', 'Authentication Successful');
    } catch (err: any) {
      error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      error(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    try {
      await loginWithGithub();
    } catch (err: any) {
      error(err.message || 'GitHub sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8faf9]">
      {/* Left Column: Campus Imagery with EATM Branding Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0b4627]">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80"
          alt="EATM Campus Building"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062615] via-[#0b4627]/90 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-2xl shadow-sm shrink-0">
              <img src={EATM_EMBLEM} alt="EATM Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight leading-none">EATM</h2>
              <p className="text-xs text-emerald-300 font-semibold tracking-wider">CampusConnect</p>
            </div>
          </Link>

          <div className="my-auto max-w-md">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
              Better Connections <br />
              <span className="text-emerald-300">A Stronger Campus</span>
            </h1>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Log in to collaborate on coursework, connect with campus mentors, participate in upcoming hackathons, and discover internships.
            </p>
          </div>

          <div className="pt-6 border-t border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
            <span>Einstein Academy of Technology and Management</span>
            <span>Learn • Innovate • Lead</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full">
          {/* Mobile Brand Link */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <img src={EATM_OFFICIAL_LOGO} alt="EATM Logo" className="h-8 w-auto object-contain" />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Welcome Back!</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Sign in to your EATM digital campus account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Roll Number"
              type="text"
              placeholder="e.g. soumya.sahoo@eatm.in or EATM23CSE001"
              value={emailOrRoll}
              onChange={(e) => setEmailOrRoll(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
              <div className="flex items-center justify-between mt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0b4627] focus:ring-[#0b4627] border-gray-300"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="font-semibold text-[#0b4627] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              isLoading={loading}
            >
              Login
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-[#f8faf9] px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-sm transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.32 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-sm transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#0b4627] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
