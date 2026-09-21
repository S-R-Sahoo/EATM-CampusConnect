import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../supabase/auth';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { EATM_EMBLEM } from '../../constants/assets';

export const ForgotPasswordPage: React.FC = () => {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      success('Password reset instructions sent to your email.');
    } catch (err: any) {
      error(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-card">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <img src={EATM_EMBLEM} alt="EATM Logo" className="w-10 h-10 object-contain" />
            <span className="font-black text-[#0b4627] text-lg">EATM CampusConnect</span>
          </Link>
          <h2 className="text-2xl font-black text-gray-900">Reset Your Password</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enter your campus email to receive a password reset link
          </p>
        </div>

        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Check your inbox for <strong>{email}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Follow the instructions in the email to recover access to your account.
            </p>
            <Link to="/login" className="inline-block mt-4">
              <Button variant="primary" size="sm">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email"
              type="email"
              placeholder="e.g. soumya.sahoo@eatm.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              isLoading={loading}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#0b4627]">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
