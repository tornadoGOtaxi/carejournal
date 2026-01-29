
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Delete, ArrowLeft } from 'lucide-react';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginView: React.FC<Props> = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (selectedUser && newPin === selectedUser.pin) {
          onLogin(selectedUser);
        } else {
          setError('Incorrect PIN');
          setTimeout(() => {
            setPin('');
            setError('');
          }, 1000);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm text-center">
          <button 
            onClick={() => { setSelectedUser(null); setPin(''); }}
            className="mb-8 flex items-center gap-2 text-blue-200 font-bold hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Change Staff
          </button>
          
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
              <UserIcon size={40} />
            </div>
            <h2 className="text-3xl font-black">{selectedUser.name}</h2>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mt-1">Enter 4-Digit PIN</p>
          </div>

          <div className="flex justify-center gap-4 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${pin.length > i ? 'bg-white scale-125' : 'bg-transparent'}`}
              />
            ))}
          </div>

          {error && <p className="text-red-300 font-black mb-4 animate-bounce">{error}</p>}

          <div className="grid grid-cols-3 gap-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handlePinClick(num)}
                className="h-20 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl text-2xl font-black transition-all border border-white/10"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinClick('0')}
              className="h-20 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl text-2xl font-black transition-all border border-white/10"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-20 flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 rounded-2xl transition-all"
            >
              <Delete size={28} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl mb-4">
            <ShieldCheck size={48} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">CareJournal</h1>
          <p className="text-blue-100 text-lg mt-2">Staff Sign-In Required</p>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="w-full bg-white hover:bg-blue-50 text-gray-800 p-6 rounded-2xl shadow-lg flex items-center justify-between transition-all transform active:scale-95 group border-2 border-transparent hover:border-blue-300"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${user.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  <UserIcon size={28} />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.role}</div>
                </div>
              </div>
              <div className="bg-gray-100 group-hover:bg-blue-600 group-hover:text-white p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
