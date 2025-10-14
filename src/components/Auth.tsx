import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getUserColor } from '../utils/colors';
import { LogIn, UserPlus } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register
        if (!displayName.trim()) {
          throw new Error('Please enter a display name');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with display name
        await updateProfile(user, {
          displayName: displayName.trim()
        });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          name: displayName.trim(),
          email: email,
          color: getUserColor(user.uid),
          createdAt: Date.now(),
          online: true,
          lastSeen: Date.now()
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-100">
      {/* Canvas Background Preview */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `
            linear-gradient(#e0e0e0 1px, transparent 1px),
            linear-gradient(90deg, #e0e0e0 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}></div>
        
        {/* Sample shapes to simulate collaborative design */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Blue Rectangle */}
          <rect x="10%" y="15%" width="150" height="100" fill="#3B82F6" opacity="0.6" rx="4" />
          
          {/* Red Circle */}
          <circle cx="75%" cy="20%" r="60" fill="#EF4444" opacity="0.6" />
          
          {/* Green Rectangle */}
          <rect x="15%" y="60%" width="120" height="80" fill="#10B981" opacity="0.6" rx="4" />
          
          {/* Purple Rectangle */}
          <rect x="65%" y="65%" width="180" height="120" fill="#8B5CF6" opacity="0.6" rx="4" />
          
          {/* Orange Circle */}
          <circle cx="85%" cy="80%" r="45" fill="#F59E0B" opacity="0.6" />
          
          {/* Pink Rectangle */}
          <rect x="40%" y="35%" width="140" height="90" fill="#EC4899" opacity="0.6" rx="4" />
          
          {/* Teal Circle */}
          <circle cx="30%" cy="85%" r="55" fill="#14B8A6" opacity="0.6" />
          
          {/* Simulated Cursor 1 */}
          <g transform="translate(200, 300)">
            <circle r="5" fill="#3B82F6" />
            <rect x="10" y="-5" width="60" height="20" fill="#3B82F6" rx="4" opacity="0.9" />
            <text x="15" y="9" fill="white" fontSize="12" fontFamily="Arial">Alice</text>
          </g>
          
          {/* Simulated Cursor 2 */}
          <g transform="translate(800, 450)">
            <circle r="5" fill="#EF4444" />
            <rect x="10" y="-5" width="50" height="20" fill="#EF4444" rx="4" opacity="0.9" />
            <text x="15" y="9" fill="white" fontSize="12" fontFamily="Arial">Bob</text>
          </g>
          
          {/* Simulated Cursor 3 */}
          <g transform="translate(500, 600)">
            <circle r="5" fill="#10B981" />
            <rect x="10" y="-5" width="60" height="20" fill="#10B981" rx="4" opacity="0.9" />
            <text x="15" y="9" fill="white" fontSize="12" fontFamily="Arial">Carol</text>
          </g>
        </svg>
        
        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-transparent to-gray-900/10"></div>
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CollabCanvas</h1>
          <p className="text-gray-600">Real-time collaborative design</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLogin
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LogIn className="inline-block w-4 h-4 mr-2" />
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              !isLogin
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserPlus className="inline-block w-4 h-4 mr-2" />
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Your name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo credentials for testing:</p>
          <p className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
            test@example.com / test123
          </p>
        </div>
      </div>
    </div>
  );
};

