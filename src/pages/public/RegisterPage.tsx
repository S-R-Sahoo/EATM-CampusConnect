import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { UserRole } from '../../types';
import { User, Mail, Lock, Phone, IdCard, GraduationCap, Building, Eye, EyeOff } from 'lucide-react';
import { EATM_EMBLEM } from '../../constants/assets';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('1st Year');
  const [semester, setSemester] = useState('1st');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const departments = [
    { label: 'Computer Science & Engineering (CSE)', value: 'CSE' },
    { label: 'CSE - Data Science (CSE-DS)', value: 'CSE-DS' },
    { label: 'Electronics & Communication Engineering (ECE)', value: 'ECE' },
    { label: 'Electrical & Electronics Engineering (EEE)', value: 'EEE' },
    { label: 'Mechanical Engineering (ME)', value: 'Mechanical' },
    { label: 'Civil Engineering (CE)', value: 'Civil' },
  ];

  const years = [
    { label: '1st Year', value: '1st Year' },
    { label: '2nd Year', value: '2nd Year' },
    { label: '3rd Year', value: '3rd Year' },
    { label: '4th Year', value: '4th Year' },
  ];

  const semesters = [
    { label: '1st Semester', value: '1st' },
    { label: '2nd Semester', value: '2nd' },
    { label: '3rd Semester', value: '3rd' },
    { label: '4th Semester', value: '4th' },
    { label: '5th Semester', value: '5th' },
    { label: '6th Semester', value: '6th' },
    { label: '7th Semester', value: '7th' },
    { label: '8th Semester', value: '8th' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      error('Please complete all required fields.');
      return;
    }

    if (!email.includes('@')) {
      error('Please provide a valid institutional or personal email.');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    if (role === 'student' && !rollNumber) {
      error('Please enter your University Roll Number.');
      return;
    }

    if (role === 'faculty' && !employeeId) {
      error('Please enter your Official Employee ID.');
      return;
    }

    setLoading(true);
    try {
      await register({
        displayName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        department,
        year: role === 'student' ? year : undefined,
        semester: role === 'student' ? semester : undefined,
        rollNumber: role === 'student' ? rollNumber.trim().toUpperCase() : undefined,
        employeeId: role === 'faculty' ? employeeId.trim().toUpperCase() : undefined,
        designation: role === 'faculty' ? designation : undefined,
        phone: phone ? phone.trim() : undefined
      });

      success('Account created successfully! Welcome to EATM CampusConnect.', 'Registration Complete');
      navigate(role === 'student' ? '/student/dashboard' : '/faculty/dashboard');
    } catch (err: any) {
      error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8faf9]">
      {/* Left Column Visual */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-[#0b4627]">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80"
          alt="EATM Students"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
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

          <div className="my-auto max-w-sm">
            <h1 className="text-3xl font-black leading-tight mb-4">
              Join The Campus Community
            </h1>
            <p className="text-sm text-emerald-100 leading-relaxed mb-6">
              Connect with over 2,000+ peers, access departmental lecture notes, collaborate in technical societies, and receive placement notices.
            </p>
            <div className="space-y-2 text-xs text-emerald-200">
              <p className="flex items-center gap-2">✓ Verified Student & Faculty Network</p>
              <p className="flex items-center gap-2">✓ Instant Hackathon & Club Access</p>
              <p className="flex items-center gap-2">✓ Real-time Faculty Announcements</p>
            </div>
          </div>

          <div className="text-xs text-emerald-300">
            Einstein Academy of Technology and Management
          </div>
        </div>
      </div>

      {/* Right Column Registration Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="max-w-xl w-full">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Create Your Account</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Join the official EATM campus network
            </p>
          </div>

          {/* Role Selector Tabs (Student / Faculty) */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'student'
                  ? 'bg-[#0b4627] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('faculty')}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'faculty'
                  ? 'bg-[#0b4627] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Faculty</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="e.g. Soumyaranjan Sahoo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label={role === 'student' ? 'Email Address' : 'Official Institutional Email'}
                type="email"
                placeholder={role === 'student' ? 'name@eatm.in' : 'faculty@eatm.in'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {role === 'student' ? (
                <Input
                  label="Roll Number"
                  type="text"
                  placeholder="e.g. EATM23CSE001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  leftIcon={<IdCard className="w-4 h-4" />}
                  required
                />
              ) : (
                <Input
                  label="Employee ID"
                  type="text"
                  placeholder="e.g. EATM-FAC-105"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  leftIcon={<IdCard className="w-4 h-4" />}
                  required
                />
              )}

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <Select
              label="Department"
              options={departments}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            {role === 'student' ? (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Year"
                  options={years}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
                <Select
                  label="Semester"
                  options={semesters}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>
            ) : (
              <Input
                label="Designation"
                type="text"
                placeholder="e.g. Assistant Professor, HOD"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password (6+ chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 shadow-md"
              isLoading={loading}
            >
              Register as {role === 'student' ? 'Student' : 'Faculty'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#0b4627] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
