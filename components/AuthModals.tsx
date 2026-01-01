
import React, { useState } from 'react';

interface AuthModalsProps {
  activeModal: 'login' | 'register' | 'forgot' | null;
  onClose: () => void;
  onSwitch: (type: 'login' | 'register' | 'forgot') => void;
  onAuthAction: (type: 'login' | 'register' | 'google', data: any) => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({ activeModal, onClose, onSwitch, onAuthAction }) => {
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleSelect, setShowGoogleSelect] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const googleAccounts = [
    { name: 'Rafsan Jamil', email: 'rafsan.jamil@gmail.com', img: 'https://ui-avatars.com/api/?name=R+J&background=random' },
    { name: 'Player One', email: 'pro.player2024@gmail.com', img: 'https://ui-avatars.com/api/?name=P+1&background=random' },
    { name: 'SkyHigh User', email: 'skyhigh.bets@gmail.com', img: 'https://ui-avatars.com/api/?name=S+H&background=random' },
  ];

  if (!activeModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    
    if (activeModal === 'login') {
      onAuthAction('login', { email, password });
    } else if (activeModal === 'register') {
      onAuthAction('register', { email, password, fullname, promoCode });
    }
  };

  const handleGoogleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setShowGoogleSelect(true);
    }, 500);
  };

  const selectGoogleAccount = (acc: { name: string, email: string }) => {
     setShowGoogleSelect(false);
     setIsLoading(true);
     setTimeout(() => {
        setIsLoading(false);
        onAuthAction('google', { email: acc.email, name: acc.name });
     }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background with no transition to ensure visibility */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />
      
      {/* Modal Container - REMOVED ALL ANIMATION CLASSES (scale, opacity, transform) to fix black screen issue */}
      <div className="relative w-full max-w-md bg-[#001529] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        
        {showGoogleSelect ? (
            <div className="bg-white text-gray-800 p-0 h-[500px] flex flex-col">
                 <div className="p-4 flex items-center gap-3 border-b">
                     <button onClick={() => setShowGoogleSelect(false)} className="material-symbols-outlined text-gray-600">arrow_back</button>
                     <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                     <span className="font-medium text-lg text-gray-600">Sign in with Google</span>
                 </div>
                 <div className="p-6 flex-grow">
                     <h3 className="text-xl font-normal text-center mb-2">Choose an account</h3>
                     <p className="text-center text-sm text-gray-500 mb-6">to continue to Sky High Aviator</p>
                     
                     <div className="space-y-1">
                         {googleAccounts.map((acc, idx) => (
                             <button 
                                key={idx} 
                                onClick={() => selectGoogleAccount(acc)}
                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                             >
                                 <img src={acc.img} className="w-10 h-10 rounded-full" alt="avatar" />
                                 <div>
                                     <p className="font-medium text-gray-800 text-sm">{acc.name}</p>
                                     <p className="text-xs text-gray-500">{acc.email}</p>
                                 </div>
                             </button>
                         ))}
                         <button className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left border-t mt-2">
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600">
                                 <span className="material-symbols-outlined">person_add</span>
                             </div>
                             <p className="font-medium text-gray-800 text-sm">Add another account</p>
                         </button>
                     </div>
                 </div>
                 <div className="p-4 border-t text-center text-xs text-gray-500">
                     To continue, Google will share your name, email address, and profile picture with Sky High.
                 </div>
            </div>
        ) : (
        <>
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">
                    {activeModal === 'login' ? 'account_circle' : activeModal === 'register' ? 'person_add' : 'lock_reset'}
                </span>
                {activeModal === 'login' ? 'Site Entrance' : activeModal === 'register' ? 'Register' : 'Recovery'}
                </h2>
                <button 
                onClick={onClose} 
                disabled={isLoading}
                className="text-gray-400 hover:text-white p-1"
                >
                <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {(activeModal === 'login' || activeModal === 'register') && (
                <div className="mb-6">
                <button 
                    onClick={handleGoogleClick}
                    disabled={isLoading}
                    className="w-full bg-white text-gray-800 font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors shadow-lg active:scale-95"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>{activeModal === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </button>
                <div className="relative mt-5">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#001529] text-gray-500 uppercase font-bold">Or continue with</span>
                    </div>
                </div>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                {activeModal === 'register' && (
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-xl">person</span>
                    <input 
                    type="text" 
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    disabled={isLoading}
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    />
                </div>
                )}

                <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-xl">
                    {activeModal === 'register' ? 'alternate_email' : 'person'}
                </span>
                <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder={activeModal === 'register' ? "Email Address" : "Email"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                />
                </div>

                {activeModal !== 'forgot' && (
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-xl">lock</span>
                    <input 
                    type={showPass ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                    />
                    <button 
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                    <span className="material-symbols-outlined">{showPass ? 'visibility' : 'visibility_off'}</span>
                    </button>
                </div>
                )}
                
                {activeModal === 'register' && (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-xl">sell</span>
                        <input 
                        type="text" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={isLoading}
                        placeholder="Promo Code (Optional)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors uppercase tracking-widest"
                        />
                    </div>
                )}

                {activeModal === 'login' && (
                <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                    <input type="checkbox" disabled={isLoading} className="rounded bg-white/10 border-white/10 text-blue-500 focus:ring-0" />
                    Remember me
                    </label>
                    <button 
                    type="button"
                    disabled={isLoading}
                    onClick={() => onSwitch('forgot')} 
                    className="text-blue-500 hover:text-blue-400 font-medium"
                    >
                    Forgot password?
                    </button>
                </div>
                )}

                <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-black tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
                    activeModal === 'register' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                >
                {isLoading ? (
                    <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>PROCESSING...</span>
                    </>
                ) : (
                    activeModal === 'login' ? 'LOGIN' : activeModal === 'register' ? 'START GAME' : 'PROCEED'
                )}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-gray-400 text-sm mb-4">
                {activeModal === 'login' ? "Not registered yet?" : "Already have an account?"}
                </p>
                <button 
                onClick={() => onSwitch(activeModal === 'login' ? 'register' : 'login')}
                disabled={isLoading}
                className="px-8 py-3 rounded-full border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                >
                {activeModal === 'login' ? 'REGISTER' : 'LOGIN'}
                </button>
            </div>
            </div>
        </>
        )}
      </div>
    </div>
  );
};

export default AuthModals;
