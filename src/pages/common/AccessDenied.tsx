import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export const AccessDenied: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-card text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          You do not have the necessary permissions to access this administrative portal. This area is restricted based on your role (<strong>{user?.role?.toUpperCase() || 'GUEST'}</strong>).
        </p>

        <div className="flex flex-col gap-2.5">
          <Link to={`/${user?.role || 'student'}/dashboard`}>
            <Button variant="primary" className="w-full" icon={<Home className="w-4 h-4" />}>
              Return to Your Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
              Go to Landing Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
