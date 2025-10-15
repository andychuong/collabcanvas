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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-50">
      {/* Canvas Background Preview */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}></div>
        
        {/* Traditional UI Sketches - Black & White */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Navigation Bar */}
          <rect x="5%" y="5%" width="90%" height="6%" fill="rgba(0, 0, 0, 0.05)" stroke="#000000" strokeWidth="2" />
          <rect x="7%" y="7%" width="8%" height="2.5%" fill="rgba(0, 0, 0, 0.1)" />
          <text x="8%" y="9.2%" fill="#000000" fontSize="10" fontWeight="600" fontFamily="Arial">Logo</text>
          <rect x="75%" y="7%" width="6%" height="2.5%" fill="rgba(0, 0, 0, 0.08)" />
          <rect x="82%" y="7%" width="6%" height="2.5%" fill="rgba(0, 0, 0, 0.08)" />
          <rect x="89%" y="7%" width="5%" height="2.5%" fill="rgba(0, 0, 0, 0.08)" />
          
          {/* Sidebar + Content Layout */}
          <rect x="5%" y="14%" width="18%" height="50%" fill="rgba(0, 0, 0, 0.03)" stroke="#000000" strokeWidth="2" />
          <text x="7%" y="17%" fill="#000000" fontSize="11" fontWeight="600" fontFamily="Arial">Navigation</text>
          <line x1="7%" y1="18%" x2="21%" y2="18%" stroke="#000000" strokeWidth="1" opacity="0.3" />
          
          {/* Nav items */}
          <rect x="7%" y="20%" width="14%" height="3%" fill="rgba(0, 0, 0, 0.06)" />
          <rect x="7%" y="24%" width="14%" height="3%" fill="rgba(0, 0, 0, 0.06)" />
          <rect x="7%" y="28%" width="14%" height="3%" fill="rgba(0, 0, 0, 0.06)" />
          <rect x="7%" y="32%" width="14%" height="3%" fill="rgba(0, 0, 0, 0.06)" />
          
          {/* Main Content Area with Cards */}
          <rect x="25%" y="14%" width="70%" height="22%" fill="rgba(0, 0, 0, 0.04)" stroke="#000000" strokeWidth="2" />
          <text x="27%" y="17.5%" fill="#000000" fontSize="12" fontWeight="600" fontFamily="Arial">Dashboard Overview</text>
          
          {/* Stat Cards */}
          <rect x="27%" y="20%" width="20%" height="13%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="1.5" />
          <text x="29%" y="24%" fill="#000000" fontSize="9" fontFamily="Arial">Active Users</text>
          <text x="29%" y="28%" fill="#000000" fontSize="16" fontWeight="700" fontFamily="Arial">1,234</text>
          
          <rect x="49%" y="20%" width="20%" height="13%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="1.5" />
          <text x="51%" y="24%" fill="#000000" fontSize="9" fontFamily="Arial">Projects</text>
          <text x="51%" y="28%" fill="#000000" fontSize="16" fontWeight="700" fontFamily="Arial">89</text>
          
          <rect x="71%" y="20%" width="20%" height="13%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="1.5" />
          <text x="73%" y="24%" fill="#000000" fontSize="9" fontFamily="Arial">Messages</text>
          <text x="73%" y="28%" fill="#000000" fontSize="16" fontWeight="700" fontFamily="Arial">42</text>
          
          {/* Data Table */}
          <rect x="25%" y="39%" width="48%" height="25%" fill="rgba(0, 0, 0, 0.04)" stroke="#000000" strokeWidth="2" />
          <text x="27%" y="42%" fill="#000000" fontSize="11" fontWeight="600" fontFamily="Arial">Recent Activity</text>
          
          {/* Table Header */}
          <rect x="27%" y="44%" width="44%" height="3%" fill="rgba(0, 0, 0, 0.08)" />
          <text x="28%" y="46.5%" fill="#000000" fontSize="8" fontWeight="600" fontFamily="Arial">Name</text>
          <text x="42%" y="46.5%" fill="#000000" fontSize="8" fontWeight="600" fontFamily="Arial">Status</text>
          <text x="56%" y="46.5%" fill="#000000" fontSize="8" fontWeight="600" fontFamily="Arial">Date</text>
          
          {/* Table Rows */}
          <line x1="27%" y1="49%" x2="71%" y2="49%" stroke="#000000" strokeWidth="1" opacity="0.2" />
          <line x1="27%" y1="52%" x2="71%" y2="52%" stroke="#000000" strokeWidth="1" opacity="0.2" />
          <line x1="27%" y1="55%" x2="71%" y2="55%" stroke="#000000" strokeWidth="1" opacity="0.2" />
          <line x1="27%" y1="58%" x2="71%" y2="58%" stroke="#000000" strokeWidth="1" opacity="0.2" />
          <line x1="27%" y1="61%" x2="71%" y2="61%" stroke="#000000" strokeWidth="1" opacity="0.2" />
          
          {/* Form / Settings Panel */}
          <rect x="75%" y="39%" width="20%" height="25%" fill="rgba(0, 0, 0, 0.04)" stroke="#000000" strokeWidth="2" />
          <text x="77%" y="42%" fill="#000000" fontSize="11" fontWeight="600" fontFamily="Arial">Settings</text>
          
          {/* Form inputs */}
          <rect x="77%" y="45%" width="16%" height="3%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="1" />
          <rect x="77%" y="49%" width="16%" height="3%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="1" />
          <rect x="77%" y="53%" width="16%" height="3%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="1" />
          
          {/* Button */}
          <rect x="77%" y="58%" width="16%" height="4%" fill="rgba(0, 0, 0, 0.12)" stroke="#000000" strokeWidth="1.5" />
          <text x="81%" y="60.5%" fill="#000000" fontSize="10" fontWeight="600" fontFamily="Arial">Save</text>
          
          {/* Modal / Dialog */}
          <rect x="30%" y="70%" width="28%" height="22%" fill="rgba(255, 255, 255, 0.95)" stroke="#000000" strokeWidth="2.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.15))" />
          <rect x="32%" y="72%" width="24%" height="4%" fill="rgba(0, 0, 0, 0.08)" />
          <text x="34%" y="75%" fill="#000000" fontSize="11" fontWeight="600" fontFamily="Arial">Modal Dialog</text>
          
          {/* Modal content */}
          <line x1="32%" y1="77%" x2="56%" y2="77%" stroke="#000000" strokeWidth="1" opacity="0.2" />
          <text x="34%" y="80%" fill="#000000" fontSize="9" fontFamily="Arial">Are you sure you want to</text>
          <text x="34%" y="83%" fill="#000000" fontSize="9" fontFamily="Arial">continue with this action?</text>
          
          {/* Modal buttons */}
          <rect x="34%" y="86%" width="10%" height="3.5%" fill="rgba(0, 0, 0, 0.08)" stroke="#000000" strokeWidth="1" />
          <text x="36%" y="88.5%" fill="#000000" fontSize="9" fontFamily="Arial">Cancel</text>
          <rect x="45%" y="86%" width="9%" height="3.5%" fill="rgba(0, 0, 0, 0.12)" stroke="#000000" strokeWidth="1" />
          <text x="46.5%" y="88.5%" fill="#000000" fontSize="9" fontWeight="600" fontFamily="Arial">Confirm</text>
          
          {/* Notification / Toast */}
          <rect x="65%" y="72%" width="28%" height="8%" fill="rgba(0, 0, 0, 0.06)" stroke="#000000" strokeWidth="2" />
          <text x="67%" y="75%" fill="#000000" fontSize="10" fontWeight="600" fontFamily="Arial">Notification</text>
          <text x="67%" y="78%" fill="#000000" fontSize="8" fontFamily="Arial">Changes saved successfully</text>
          
          {/* Collaborative cursors with colors */}
          {/* Right side cursors */}
          <g opacity="0.9" transform="translate(620, 250)">
            <path d="M 0 0 L 0 16 L 5 13 L 8 18 L 11 16 L 8 11 L 13 10 Z" fill="#FF6B6B" stroke="white" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
            <rect x="15" y="2" width="92" height="24" fill="#FF6B6B" rx="6" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="20" y="17" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial">Sarah Chen</text>
          </g>
          
          <g opacity="0.9" transform="translate(240, 320)">
            <path d="M 0 0 L 0 16 L 5 13 L 8 18 L 11 16 L 8 11 L 13 10 Z" fill="#4ECDC4" stroke="white" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
            <rect x="15" y="2" width="106" height="24" fill="#4ECDC4" rx="6" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="20" y="17" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial">Alex Johnson</text>
          </g>
          
          <g opacity="0.9" transform="translate(650, 480)">
            <path d="M 0 0 L 0 16 L 5 13 L 8 18 L 11 16 L 8 11 L 13 10 Z" fill="#95E1D3" stroke="white" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
            <rect x="15" y="2" width="90" height="24" fill="#95E1D3" rx="6" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="20" y="17" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial">Maya Patel</text>
          </g>
          
          <g opacity="0.9" transform="translate(750, 180)">
            <path d="M 0 0 L 0 16 L 5 13 L 8 18 L 11 16 L 8 11 L 13 10 Z" fill="#A8E6CF" stroke="white" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
            <rect x="15" y="2" width="88" height="24" fill="#A8E6CF" rx="6" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="20" y="17" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial">Jake Miller</text>
          </g>
          
          {/* Left side cursors */}
          <g opacity="0.9" transform="translate(180, 220)">
            <path d="M 0 0 L 0 16 L 5 13 L 8 18 L 11 16 L 8 11 L 13 10 Z" fill="#FFD93D" stroke="white" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
            <rect x="15" y="2" width="92" height="24" fill="#FFD93D" rx="6" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="20" y="17" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial">Emma Davis</text>
          </g>
          
          <g opacity="0.9" transform="translate(320, 420)">
            <path d="M 0 0 L 0 16 L 5 13 L 8 18 L 11 16 L 8 11 L 13 10 Z" fill="#C98FFF" stroke="white" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
            <rect x="15" y="2" width="108" height="24" fill="#C98FFF" rx="6" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="20" y="17" fill="white" fontSize="13" fontWeight="600" fontFamily="Arial">Liam Martinez</text>
          </g>
          
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#000000" opacity="0.6" />
            </marker>
          </defs>
        </svg>
        
        {/* Subtle tint overlay */}
        <div className="absolute inset-0 bg-white/15 backdrop-blur-[0.5px]"></div>
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200/5 via-transparent to-gray-300/5"></div>
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-black">
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
                ? 'bg-gray-700 text-white hover:bg-gray-800'
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
                ? 'bg-gray-700 text-white hover:bg-gray-800'
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
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
            className="w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

