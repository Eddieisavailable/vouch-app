import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy } from 'lucide-react';

export const WaitingPage: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyId = () => {
    if (auth.user?.unique_login_id) {
      navigator.clipboard.writeText(auth.user.unique_login_id);
      alert('Login ID copied!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Under Review</h2>
        <p className="text-gray-600 mb-6">
          Your registration is being reviewed by our admin team. You'll receive full access within 24-48 hours once verified.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-500 mb-1">Your Unique Login ID is:</p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl font-mono font-bold text-blue-600">{auth.user?.unique_login_id}</span>
            <button onClick={copyId} className="p-1 text-gray-400 hover:text-gray-600" title="Copy">
              <Copy size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Keep this safe! You'll need it to login later.</p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <LogOut size={16} className="mr-2" />
          Sign out
        </button>
      </div>
    </div>
  );
};
